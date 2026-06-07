// app/api/complaints/[complaintId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { updateComplaintSchema } from "@/lib/validators/complaint.schema";
import { hasPermission } from "@/lib/rbac";
import type { Prisma } from "@prisma/client"
import { generateComplaintStatusUpdateEmail } from "@/lib/email/templates/complaint-status-update";
import { sendEmail } from "@/lib/email/sender";

/**
 * GET /api/complaints/[complaintId]
 * Confidential identity masked for HR, visible for SUPER_ADMIN only
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ complaintId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { complaintId } = await params;

    const complaint = await prisma.complaint.findFirst({
      where: { id: complaintId, deletedAt: null },
      include: {
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: { select: { name: true, code: true } },
            user: { select: { id: true, email: true } },
          },
        },
        assignedTo: {
          select: { id: true, email: true },
        },
      },
    });

    if (!complaint) {
      return NextResponse.json(
        { success: false, error: "Complaint not found" },
        { status: 404 },
      );
    }

    // Access check — employee can only see own
    if (
      session.user.role === "EMPLOYEE" &&
      complaint.employee.user.id !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const isOwnComplaint = complaint.employee.user.id === session.user.id;
    const isConfidentialHidden =
      complaint.isConfidential && !isSuperAdmin && !isOwnComplaint;

    // Log SUPER_ADMIN viewing confidential identity
    if (complaint.isConfidential && isSuperAdmin && !isOwnComplaint) {
      const { ipAddress, userAgent } = getRequestMeta(_request);
      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "VIEW_CONFIDENTIAL",
        entityType: "Complaint",
        entityId: complaintId,
        description: `SUPER_ADMIN viewed confidential complaint ${complaint.referenceNumber} — identity of ${complaint.employee.firstName} ${complaint.employee.lastName} revealed`,
        metadata: {
          referenceNumber: complaint.referenceNumber,
          employeeStaffId: complaint.employee.staffId,
        },
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: complaint.id,
        referenceNumber: complaint.referenceNumber,
        category: complaint.category,
        title: complaint.title,
        description: complaint.description,
        isConfidential: complaint.isConfidential,
        status: complaint.status,

        employeeId: isConfidentialHidden ? null : complaint.employeeId,
        employeeName: isConfidentialHidden
          ? "Anonymous Employee"
          : `${complaint.employee.firstName} ${complaint.employee.lastName}`,
        staffId: isConfidentialHidden ? null : complaint.employee.staffId,
        jobTitle: isConfidentialHidden ? null : complaint.employee.jobTitle,
        department: isConfidentialHidden
          ? null
          : complaint.employee.department.name,
        departmentCode: isConfidentialHidden
          ? null
          : complaint.employee.department.code,

        assignedToId: complaint.assignedToId,
        assignedToEmail: complaint.assignedTo?.email ?? null,
        assignedAt: complaint.assignedAt?.toISOString() ?? null,
        hrNotes: isOwnComplaint ? null : complaint.hrNotes,
        resolutionNote: complaint.resolutionNote,
        resolvedAt: complaint.resolvedAt?.toISOString() ?? null,
        createdAt: complaint.createdAt.toISOString(),
        updatedAt: complaint.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/complaints/[complaintId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch complaint" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/complaints/[complaintId]
 * HR/Admin: update status, assign, add notes
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ complaintId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "complaints:manage")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { complaintId } = await params;
    const body = await request.json();

    const parsed = updateComplaintSchema.safeParse(body);
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

    const existing = await prisma.complaint.findFirst({
      where: { id: complaintId, deletedAt: null },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Complaint not found" },
        { status: 404 },
      );
    }

    const oldStatus = existing.status;

    const updateData: Prisma.ComplaintUpdateInput = {
      status: data.status,
      hrNotes: data.hrNotes || existing.hrNotes,
    };

    if (data.assignedToId) {
      updateData.assignedTo = { connect: { id: data.assignedToId } };
      updateData.assignedAt = new Date();
    }

    if (data.status === "RESOLVED") {
      updateData.resolutionNote = data.resolutionNote || null;
      updateData.resolvedAt = new Date();
    }

    await prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "Complaint",
      entityId: complaintId,
      description: `Complaint ${existing.referenceNumber} status: ${oldStatus} → ${data.status}`,
      metadata: {
        referenceNumber: existing.referenceNumber,
        oldStatus,
        newStatus: data.status,
      },
      ipAddress,
      userAgent,
    });

    // Send status update email to employee
    if (oldStatus !== data.status) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      void sendEmail({
        to: existing.employee.user.email,
        ...generateComplaintStatusUpdateEmail({
          employeeFirstName: existing.employee.firstName,
          referenceNumber: existing.referenceNumber,
          title: existing.title,
          oldStatus,
          newStatus: data.status,
          resolutionNote: data.resolutionNote,
          loginUrl: `${appUrl}/complaints/${complaintId}`,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Complaint updated — status: ${data.status}`,
      data: { id: complaintId, status: data.status },
    });
  } catch (error) {
    console.error("PUT /api/complaints/[complaintId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update complaint" },
      { status: 500 },
    );
  }
}
