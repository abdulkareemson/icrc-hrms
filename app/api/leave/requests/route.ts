// app/api/leave/requests/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createLeaveRequestSchema } from "@/lib/validators/leave.schema";
import { hasPermission } from "@/lib/rbac";
import type { Prisma } from "@prisma/client";

/**
 * Counts working days (Mon–Fri) between two dates inclusive
 */
function countWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * GET /api/leave/requests
 * HR/Admin: all requests with filters
 * Manager: own direct reports requests
 * Employee: own requests only
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
    const employeeId = url.searchParams.get("employeeId") ?? "";
    const leaveTypeId = url.searchParams.get("leaveTypeId") ?? "";

    const where: Prisma.LeaveRequestWhereInput = {};

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

      if (session.user.isManager) {
        const directReportIds = await prisma.employee.findMany({
          where: {
            lineManagerId: session.user.employeeId,
            deletedAt: null,
            isActive: true,
          },
          select: { id: true },
        });

        where.OR = [
          { employeeId: session.user.employeeId },
          { employeeId: { in: directReportIds.map((e) => e.id) } },
        ];
      } else {
        where.employeeId = session.user.employeeId;
      }
    }

    if (status) {
      where.status = status as Prisma.EnumLeaveStatusFilter;
    }

    if (
      employeeId &&
      (session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN")
    ) {
      where.employeeId = employeeId;
    }

    if (leaveTypeId) {
      where.leaveTypeId = leaveTypeId;
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
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
              jobTitle: true,
              department: {
                select: { name: true, code: true },
              },
            },
          },
          leaveType: {
            select: {
              id: true,
              name: true,
              isPaid: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const formatted = requests.map((req) => ({
      id: req.id,
      employeeId: req.employeeId,
      employeeName: `${req.employee.firstName} ${req.employee.lastName}`,
      staffId: req.employee.staffId,
      jobTitle: req.employee.jobTitle,
      department: req.employee.department.name,
      departmentCode: req.employee.department.code,
      leaveTypeId: req.leaveTypeId,
      leaveTypeName: req.leaveType.name,
      isPaid: req.leaveType.isPaid,
      startDate: req.startDate.toISOString(),
      endDate: req.endDate.toISOString(),
      totalDays: req.totalDays,
      reason: req.reason,
      status: req.status,
      documentKey: req.documentKey,
      managerId: req.managerId,
      managerName: req.manager
        ? `${req.manager.firstName} ${req.manager.lastName}`
        : null,
      managerComment: req.managerComment,
      managerApprovedAt: req.managerApprovedAt?.toISOString() ?? null,
      hrAdminId: req.hrAdminId,
      hrComment: req.hrComment,
      hrApprovedAt: req.hrApprovedAt?.toISOString() ?? null,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    }));

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
    console.error("GET /api/leave/requests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave requests" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/leave/requests
 * Any authenticated employee can apply
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

    if (!hasPermission(session.user.role, "leave:create")) {
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
    const parsed = createLeaveRequestSchema.safeParse(body);

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

    // Get employee with manager info
    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId, deletedAt: null },
      include: {
        lineManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found" },
        { status: 404 },
      );
    }

    // Get leave type
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: data.leaveTypeId },
    });

    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: "Leave type not found" },
        { status: 404 },
      );
    }

    // Document required check
    if (leaveType.requiresDocument && !data.documentKey) {
      return NextResponse.json(
        {
          success: false,
          error: `${leaveType.name} requires a supporting document`,
        },
        { status: 422 },
      );
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const totalDays = countWorkingDays(startDate, endDate);

    if (totalDays === 0) {
      return NextResponse.json(
        { success: false, error: "Leave period contains no working days" },
        { status: 422 },
      );
    }

    // Overlap check
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: session.user.employeeId,
        status: {
          in: ["PENDING_MANAGER", "PENDING_HR", "APPROVED"],
        },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have an existing leave request that overlaps with these dates",
        },
        { status: 409 },
      );
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: session.user.employeeId,
          leaveTypeId: data.leaveTypeId,
          year: currentYear,
        },
      },
    });

    const remaining = balance ? balance.totalDays - balance.usedDays : 0;

    // Determine initial status based on manager
    const hasManager = !!employee.lineManagerId;
    const initialStatus = hasManager ? "PENDING_MANAGER" : "PENDING_HR";

    // Create request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: session.user.employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate,
        endDate,
        totalDays,
        reason: data.reason,
        status: initialStatus,
        documentKey: data.documentKey || null,
        managerId: employee.lineManagerId ?? null,
      },
      include: {
        leaveType: { select: { name: true } },
        employee: {
          select: {
            firstName: true,
            lastName: true,
            staffId: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "LeaveRequest",
      entityId: leaveRequest.id,
      description: `${employee.firstName} ${employee.lastName} applied for ${leaveType.name} (${totalDays} days) — Status: ${initialStatus}`,
      metadata: {
        leaveType: leaveType.name,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
        remainingBalanceBefore: remaining,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: leaveRequest.id,
          status: initialStatus,
          totalDays,
          leaveType: leaveType.name,
        },
        message: hasManager
          ? "Leave request submitted. Awaiting manager approval."
          : "Leave request submitted. Awaiting HR approval.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/leave/requests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit leave request" },
      { status: 500 },
    );
  }
}
