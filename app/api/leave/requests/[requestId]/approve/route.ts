// app/api/leave/requests/[requestId]/approve/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { leaveApprovalSchema } from "@/lib/validators/leave.schema";
import { generateLeaveApprovedEmail } from "@/lib/email/templates/leave-approved";
import { generateLeaveRejectedEmail } from "@/lib/email/templates/leave-rejected";
import { sendEmail } from "@/lib/email/sender";
import { hasPermission } from "@/lib/rbac";

/**
 * Formats a Date to "12 Jun 2026"
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Creates AttendanceLog entries for each working day of approved leave
 * This is the Phase 3 → Phase 4 cross-module integration
 */
async function createAttendanceLogsForLeave(
  employeeId: string,
  startDate: Date,
  endDate: Date,
): Promise<void> {
  const logs: Array<{
    employeeId: string;
    date: Date;
    status: "ON_LEAVE";
    isLate: boolean;
  }> = [];

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const day = current.getDay();
    // Only working days (Mon–Fri)
    if (day !== 0 && day !== 6) {
      logs.push({
        employeeId,
        date: new Date(current),
        status: "ON_LEAVE",
        isLate: false,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  // Use upsert to avoid conflicts with existing logs
  for (const log of logs) {
    await prisma.attendanceLog.upsert({
      where: {
        employeeId_date: {
          employeeId: log.employeeId,
          date: log.date,
        },
      },
      update: {
        status: "ON_LEAVE",
      },
      create: {
        employeeId: log.employeeId,
        date: log.date,
        status: "ON_LEAVE",
        isLate: false,
      },
    });
  }
}

/**
 * POST /api/leave/requests/[requestId]/approve
 * Manager: first-tier approval (own direct reports only)
 * HR/Admin: final approval (any request in PENDING_HR)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { requestId } = await params;
    const body = await request.json();

    const parsed = leaveApprovalSchema.safeParse(body);
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

    const { action, comment } = parsed.data;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            lineManagerId: true,
            user: { select: { email: true } },
          },
        },
        leaveType: {
          select: { name: true },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const employeeEmail = leaveRequest.employee.user.email;
    const employeeFirstName = leaveRequest.employee.firstName;
    const leaveTypeName = leaveRequest.leaveType.name;
    const startDateFormatted = formatDate(leaveRequest.startDate);
    const endDateFormatted = formatDate(leaveRequest.endDate);

    // ── MANAGER APPROVAL (first tier) ──
    if (
      session.user.role === "EMPLOYEE" &&
      session.user.isManager &&
      leaveRequest.status === "PENDING_MANAGER"
    ) {
      // Manager can only approve own direct reports
      if (leaveRequest.employee.lineManagerId !== session.user.employeeId) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only approve your direct reports' requests",
          },
          { status: 403 },
        );
      }

      if (action === "approve") {
        await prisma.leaveRequest.update({
          where: { id: requestId },
          data: {
            status: "PENDING_HR",
            managerId: session.user.employeeId,
            managerComment: comment || null,
            managerApprovedAt: new Date(),
          },
        });

        await createAuditLog({
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "UPDATE",
          entityType: "LeaveRequest",
          entityId: requestId,
          description: `Manager approved ${leaveTypeName} request for ${employeeFirstName} ${leaveRequest.employee.lastName} — forwarded to HR`,
          ...(await getRequestMeta(request)),
        });

        return NextResponse.json({
          success: true,
          message:
            "Leave request approved. Forwarded to HR for final approval.",
          data: { status: "PENDING_HR" },
        });
      }

      // Manager rejects
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          managerId: session.user.employeeId,
          managerComment: comment || null,
          managerApprovedAt: new Date(),
        },
      });

      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "UPDATE",
        entityType: "LeaveRequest",
        entityId: requestId,
        description: `Manager rejected ${leaveTypeName} request for ${employeeFirstName} ${leaveRequest.employee.lastName}`,
        ...(await getRequestMeta(request)),
      });

      // Send rejection email
      void sendEmail({
        to: employeeEmail,
        ...generateLeaveRejectedEmail({
          employeeFirstName,
          leaveType: leaveTypeName,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          totalDays: leaveRequest.totalDays,
          rejectedByName: session.user.fullName ?? session.user.email,
          rejectionReason: comment ?? "No reason provided",
          loginUrl: `${appUrl}/leave`,
        }),
      });

      return NextResponse.json({
        success: true,
        message: "Leave request rejected.",
        data: { status: "REJECTED" },
      });
    }

    // ── HR / ADMIN FINAL APPROVAL ──
    if (
      hasPermission(session.user.role, "leave:approve") &&
      session.user.role !== "EMPLOYEE"
    ) {
      if (
        leaveRequest.status !== "PENDING_HR" &&
        leaveRequest.status !== "PENDING_MANAGER"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot action a request with status: ${leaveRequest.status}`,
          },
          { status: 409 },
        );
      }

      if (action === "approve") {
        const currentYear = new Date().getFullYear();

        // Deduct leave balance + update status in transaction
        await prisma.$transaction(async (tx) => {
          await tx.leaveRequest.update({
            where: { id: requestId },
            data: {
              status: "APPROVED",
              hrAdminId: session.user.id,
              hrComment: comment || null,
              hrApprovedAt: new Date(),
            },
          });

          // Deduct from balance
          await tx.leaveBalance.updateMany({
            where: {
              employeeId: leaveRequest.employeeId,
              leaveTypeId: leaveRequest.leaveTypeId,
              year: currentYear,
            },
            data: {
              usedDays: { increment: leaveRequest.totalDays },
            },
          });
        });

        // Create attendance logs for the approved leave period
        await createAttendanceLogsForLeave(
          leaveRequest.employeeId,
          leaveRequest.startDate,
          leaveRequest.endDate,
        );

        await createAuditLog({
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "UPDATE",
          entityType: "LeaveRequest",
          entityId: requestId,
          description: `HR approved ${leaveTypeName} for ${employeeFirstName} ${leaveRequest.employee.lastName} (${leaveRequest.totalDays} days deducted)`,
          metadata: { daysDeducted: leaveRequest.totalDays },
          ...(await getRequestMeta(request)),
        });

        // Send approval email
        void sendEmail({
          to: employeeEmail,
          ...generateLeaveApprovedEmail({
            employeeFirstName,
            leaveType: leaveTypeName,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            totalDays: leaveRequest.totalDays,
            approvedByName: session.user.fullName ?? session.user.email,
            loginUrl: `${appUrl}/leave`,
          }),
        });

        return NextResponse.json({
          success: true,
          message: "Leave request approved. Balance updated.",
          data: { status: "APPROVED" },
        });
      }

      // HR rejects
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          hrAdminId: session.user.id,
          hrComment: comment || null,
          hrApprovedAt: new Date(),
        },
      });

      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "UPDATE",
        entityType: "LeaveRequest",
        entityId: requestId,
        description: `HR rejected ${leaveTypeName} for ${employeeFirstName} ${leaveRequest.employee.lastName}`,
        ...(await getRequestMeta(request)),
      });

      void sendEmail({
        to: employeeEmail,
        ...generateLeaveRejectedEmail({
          employeeFirstName,
          leaveType: leaveTypeName,
          startDate: startDateFormatted,
          endDate: endDateFormatted,
          totalDays: leaveRequest.totalDays,
          rejectedByName: session.user.fullName ?? session.user.email,
          rejectionReason: comment ?? "No reason provided",
          loginUrl: `${appUrl}/leave`,
        }),
      });

      return NextResponse.json({
        success: true,
        message: "Leave request rejected.",
        data: { status: "REJECTED" },
      });
    }

    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  } catch (error) {
    console.error("POST /api/leave/requests/[requestId]/approve error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process leave approval" },
      { status: 500 },
    );
  }
}
