// app/api/attendance/clock-out/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";

/**
 * Gets today's date as date-only in WAT
 */
function getTodayWAT(): Date {
  const now = new Date();
  const watMs = now.getTime() + 60 * 60 * 1000;
  const wat = new Date(watMs);
  return new Date(
    Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate()),
  );
}

/**
 * POST /api/attendance/clock-out
 * Employee clocks out — hours worked calculated
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

    if (!hasPermission(session.user.role, "attendance:clock")) {
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

    const now = new Date();
    const todayDate = getTodayWAT();

    // Find today's log
    const existing = await prisma.attendanceLog.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.user.employeeId,
          date: todayDate,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "You haven't clocked in today" },
        { status: 409 },
      );
    }

    if (!existing.clockInTime) {
      return NextResponse.json(
        { success: false, error: "You haven't clocked in today" },
        { status: 409 },
      );
    }

    if (existing.clockOutTime) {
      return NextResponse.json(
        { success: false, error: "You have already clocked out today" },
        { status: 409 },
      );
    }

    // Calculate hours worked
    const clockInMs = existing.clockInTime.getTime();
    const clockOutMs = now.getTime();
    const hoursWorked = parseFloat(
      ((clockOutMs - clockInMs) / (1000 * 60 * 60)).toFixed(2),
    );

    await prisma.attendanceLog.update({
      where: { id: existing.id },
      data: {
        clockOutTime: now,
        hoursWorked,
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "AttendanceLog",
      entityId: existing.id,
      description: `Clocked out — ${hoursWorked} hours worked`,
      metadata: {
        clockInUTC: existing.clockInTime.toISOString(),
        clockOutUTC: now.toISOString(),
        hoursWorked,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        clockOutTime: now.toISOString(),
        hoursWorked,
      },
      message: `Clocked out successfully. ${hoursWorked} hours worked today.`,
    });
  } catch (error) {
    console.error("POST /api/attendance/clock-out error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clock out" },
      { status: 500 },
    );
  }
}
