// app/api/attendance/[logId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { attendanceOverrideSchema } from "@/lib/validators/attendance.schema";
import { hasPermission } from "@/lib/rbac";

/**
 * PUT /api/attendance/[logId]
 * HR/Admin override — update status, times, notes
 * Every override is audit-logged with before/after values
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ logId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "attendance:override")) {
      return NextResponse.json(
        { success: false, error: "Forbidden — HR/Admin access required" },
        { status: 403 },
      );
    }

    const { logId } = await params;
    const body = await request.json();

    const parsed = attendanceOverrideSchema.safeParse(body);
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

    // Get existing log
    const existing = await prisma.attendanceLog.findUnique({
      where: { id: logId },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            staffId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 },
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status: data.status,
      notes: data.notes,
      editedByHRId: session.user.id,
    };

    // Handle clock-in time override
    if (data.clockInTime) {
      const clockInDate = new Date(existing.date);
      const [h, m] = data.clockInTime.split(":").map(Number);
      clockInDate.setUTCHours((h ?? 0) - 1, m ?? 0, 0, 0); // WAT to UTC
      updateData.clockInTime = clockInDate;
    }

    // Handle clock-out time override
    if (data.clockOutTime) {
      const clockOutDate = new Date(existing.date);
      const [h, m] = data.clockOutTime.split(":").map(Number);
      clockOutDate.setUTCHours((h ?? 0) - 1, m ?? 0, 0, 0); // WAT to UTC
      updateData.clockOutTime = clockOutDate;

      // Recalculate hours if both times are set
      const clockIn = (updateData.clockInTime as Date) ?? existing.clockInTime;
      if (clockIn) {
        const hoursWorked = parseFloat(
          (
            (clockOutDate.getTime() - (clockIn as Date).getTime()) /
            (1000 * 60 * 60)
          ).toFixed(2),
        );
        updateData.hoursWorked = hoursWorked > 0 ? hoursWorked : null;
      }
    }

    // Update late status based on overridden status
    if (data.status === "LATE") {
      updateData.isLate = true;
    } else if (data.status === "PRESENT") {
      updateData.isLate = false;
      updateData.lateByMinutes = null;
    }

    const updated = await prisma.attendanceLog.update({
      where: { id: logId },
      data: updateData,
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "AttendanceLog",
      entityId: logId,
      description: `HR override: ${existing.employee.firstName} ${existing.employee.lastName} (${existing.employee.staffId}) attendance on ${existing.date.toISOString().split("T")[0]} — Status: ${existing.status} → ${data.status}`,
      metadata: {
        before: {
          status: existing.status,
          clockInTime: existing.clockInTime?.toISOString() ?? null,
          clockOutTime: existing.clockOutTime?.toISOString() ?? null,
          hoursWorked: existing.hoursWorked,
          isLate: existing.isLate,
          notes: existing.notes,
        },
        after: {
          status: data.status,
          clockInTime: data.clockInTime ?? null,
          clockOutTime: data.clockOutTime ?? null,
          notes: data.notes,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, status: updated.status },
      message: "Attendance record updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/attendance/[logId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update attendance record" },
      { status: 500 },
    );
  }
}
