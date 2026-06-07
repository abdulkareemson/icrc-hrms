// app/api/complaints/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createComplaintSchema } from "@/lib/validators/complaint.schema";
import { hasPermission } from "@/lib/rbac";
import { generateComplaintReceivedEmail } from "@/lib/email/templates/complaint-received";
import { sendEmail } from "@/lib/email/sender";
import type { Prisma } from "@prisma/client";

/**
 * Generate complaint reference: CMP-{YEAR}-{SEQUENCE}
 */
async function generateComplaintRef(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;

  const latest = await prisma.complaint.findFirst({
    where: {
      referenceNumber: { startsWith: prefix },
    },
    orderBy: { referenceNumber: "desc" },
    select: { referenceNumber: true },
  });

  let nextSequence = 1;

  if (latest) {
    const parts = latest.referenceNumber.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  return `${prefix}${nextSequence.toString().padStart(4, "0")}`;
}

/**
 * GET /api/complaints
 * HR/Admin: all complaints (confidential identities masked for HR)
 * Employee: own complaints only
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)),
    );
    const status = url.searchParams.get("status") ?? "";
    const category = url.searchParams.get("category") ?? "";
    const search = url.searchParams.get("search")?.trim() ?? "";

    const where: Prisma.ComplaintWhereInput = {
      deletedAt: null,
    };

    // Role-based filtering
    if (session.user.role === "EMPLOYEE") {
      if (!session.user.employeeId) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }
      where.employeeId = session.user.employeeId;
    }

    if (status) {
      where.status = status as Prisma.EnumComplaintStatusFilter;
    }

    if (category) {
      where.category = category as Prisma.EnumComplaintCategoryFilter;
    }

    if (search && hasPermission(session.user.role, "complaints:read_all")) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    } else if (search && session.user.role === "EMPLOYEE") {
      where.AND = [
        { employeeId: session.user.employeeId },
        {
          OR: [
            { referenceNumber: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
      delete where.employeeId;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              staffId: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true, code: true } },
            },
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";

    const formatted = complaints.map((complaint) => {
      const isConfidentialHidden =
        complaint.isConfidential &&
        !isSuperAdmin &&
        session.user.role !== "EMPLOYEE";

      return {
        id: complaint.id,
        referenceNumber: complaint.referenceNumber,
        category: complaint.category,
        title: complaint.title,
        description: complaint.description,
        isConfidential: complaint.isConfidential,
        status: complaint.status,

        // Identity masking — critical security
        employeeId: isConfidentialHidden ? null : complaint.employeeId,
        employeeName: isConfidentialHidden
          ? "Anonymous Employee"
          : `${complaint.employee.firstName} ${complaint.employee.lastName}`,
        staffId: isConfidentialHidden ? null : complaint.employee.staffId,
        department: isConfidentialHidden
          ? null
          : complaint.employee.department.name,
        departmentCode: isConfidentialHidden
          ? null
          : complaint.employee.department.code,

        assignedToId: complaint.assignedToId,
        assignedToEmail: complaint.assignedTo?.email ?? null,
        assignedAt: complaint.assignedAt?.toISOString() ?? null,
        hrNotes: session.user.role === "EMPLOYEE" ? null : complaint.hrNotes,
        resolutionNote: complaint.resolutionNote,
        resolvedAt: complaint.resolvedAt?.toISOString() ?? null,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/complaints error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaints" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/complaints
 * Any authenticated employee can submit
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "complaints:create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (!session.user.employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = createComplaintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const data = parsed.data;
    const referenceNumber = await generateComplaintRef();

    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      select: {
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found" },
        { status: 404 },
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        referenceNumber,
        employeeId: session.user.employeeId,
        category: data.category,
        title: data.title,
        description: data.description,
        isConfidential: data.isConfidential,
        status: "SUBMITTED",
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "Complaint",
      entityId: complaint.id,
      description: `Complaint ${referenceNumber} submitted — ${data.category}${data.isConfidential ? " (CONFIDENTIAL)" : ""}`,
      metadata: {
        referenceNumber,
        category: data.category,
        isConfidential: data.isConfidential,
      },
      ipAddress,
      userAgent,
    });

    // Send confirmation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const categoryLabels: Record<string, string> = {
      HARASSMENT: "Harassment",
      PAYROLL: "Payroll Issue",
      WORKPLACE_SAFETY: "Workplace Safety",
      LEAVE_DISPUTE: "Leave Dispute",
      DISCRIMINATION: "Discrimination",
      MISCONDUCT: "Misconduct",
      OTHER: "Other",
    };

    void sendEmail({
      to: employee.user.email,
      ...generateComplaintReceivedEmail({
        employeeFirstName: employee.firstName,
        referenceNumber,
        category: categoryLabels[data.category] ?? data.category,
        title: data.title,
        isConfidential: data.isConfidential,
        loginUrl: `${appUrl}/complaints`,
      }),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: complaint.id,
          referenceNumber,
        },
        message: `Complaint submitted successfully. Reference: ${referenceNumber}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/complaints error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit complaint" },
      { status: 500 },
    );
  }
}
