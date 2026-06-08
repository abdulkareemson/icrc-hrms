// app/api/reports/attendance-summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }
    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(
      searchParams.get("month") ?? String(now.getMonth() + 1),
      10,
    );
    const year = parseInt(
      searchParams.get("year") ?? String(now.getFullYear()),
      10,
    );

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const logs = await prisma.attendanceLog.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: {
        employee: {
          select: {
            staffId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { employee: { department: { name: "asc" } } },
        { employee: { lastName: "asc" } },
        { date: "asc" },
      ],
    });

    const header =
      "Staff ID,Employee,Department,Date,Status,Clock In,Clock Out,Late,Late By (min),Hours Worked";

    const rows = logs.map((log) => {
      const name = `${log.employee.firstName} ${log.employee.lastName}`;
      const dateStr = new Date(log.date).toISOString().split("T")[0] ?? "";
      const clockIn = log.clockInTime
        ? new Date(log.clockInTime).toISOString().slice(11, 16)
        : "";
      const clockOut = log.clockOutTime
        ? new Date(log.clockOutTime).toISOString().slice(11, 16)
        : "";
      return `"${log.employee.staffId}","${name}","${log.employee.department.name}","${dateStr}","${log.status}","${clockIn}","${clockOut}",${log.isLate ? "Yes" : "No"},${log.lateByMinutes ?? 0},${log.hoursWorked?.toFixed(1) ?? ""}`;
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="attendance_summary.csv"',
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/attendance-summary]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
