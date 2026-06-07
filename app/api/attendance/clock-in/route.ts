// app/api/attendance/clock-in/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";

/**
 * Converts a UTC Date to WAT (UTC+1) components
 */
function toWAT(utcDate: Date): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const watMs = utcDate.getTime() + 60 * 60 * 1000; // +1 hour
  const wat = new Date(watMs);
  const hours = wat.getUTCHours();
  const minutes = wat.getUTCMinutes();
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

/**
 * Gets today's date as a Date object (date only, no time)
 * in WAT timezone
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
 * POST /api/attendance/clock-in
 * Employee clocks in — late detection applied server-side
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

    // Check if already clocked in today
    const existing = await prisma.attendanceLog.findUnique({
      where: {
        employeeId_date: {
          employeeId: session.user.employeeId,
          date: todayDate,
        },
      },
    });

    if (existing) {
      if (existing.clockInTime) {
        return NextResponse.json(
          { success: false, error: "You have already clocked in today" },
          { status: 409 },
        );
      }

      // ON_LEAVE or other status already set
      if (existing.status === "ON_LEAVE") {
        return NextResponse.json(
          { success: false, error: "You are on approved leave today" },
          { status: 409 },
        );
      }

      if (existing.status === "PUBLIC_HOLIDAY") {
        return NextResponse.json(
          { success: false, error: "Today is a public holiday" },
          { status: 409 },
        );
      }
    }

    // Late detection
    const workStartConfig = await prisma.systemConfig.findUnique({
      where: { key: "WORK_START_TIME" },
    });
    const graceConfig = await prisma.systemConfig.findUnique({
      where: { key: "LATE_GRACE_PERIOD" },
    });

    const workStartTime = workStartConfig?.value ?? "08:00";
    const gracePeriod = parseInt(graceConfig?.value ?? "15", 10);

    const [startHour, startMin] = workStartTime.split(":").map(Number);
    const deadlineMinutes =
      (startHour ?? 8) * 60 + (startMin ?? 0) + gracePeriod;

    const watTime = toWAT(now);
    const isLate = watTime.totalMinutes > deadlineMinutes;
    const lateByMinutes = isLate ? watTime.totalMinutes - deadlineMinutes : 0;

    const attendanceStatus = isLate ? "LATE" : "PRESENT";

    if (existing) {
      // Update existing record (e.g., status was set but no clock-in)
      await prisma.attendanceLog.update({
        where: { id: existing.id },
        data: {
          clockInTime: now,
          status: attendanceStatus,
          isLate,
          lateByMinutes: isLate ? lateByMinutes : null,
        },
      });
    } else {
      await prisma.attendanceLog.create({
        data: {
          employeeId: session.user.employeeId,
          date: todayDate,
          clockInTime: now,
          status: attendanceStatus,
          isLate,
          lateByMinutes: isLate ? lateByMinutes : null,
        },
      });
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "AttendanceLog",
      entityId: session.user.employeeId,
      description: `Clocked in at ${watTime.hours.toString().padStart(2, "0")}:${watTime.minutes.toString().padStart(2, "0")} WAT${isLate ? ` (late by ${lateByMinutes} min)` : ""}`,
      metadata: {
        clockInUTC: now.toISOString(),
        clockInWAT: `${watTime.hours.toString().padStart(2, "0")}:${watTime.minutes.toString().padStart(2, "0")}`,
        isLate,
        lateByMinutes,
        workStart: workStartTime,
        gracePeriod,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          clockInTime: now.toISOString(),
          isLate,
          lateByMinutes,
          status: attendanceStatus,
        },
        message: isLate
          ? `Clocked in late by ${lateByMinutes} minute${lateByMinutes !== 1 ? "s" : ""}`
          : "Clocked in successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/attendance/clock-in error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clock in" },
      { status: 500 },
    );
  }
}
