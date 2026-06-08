// app/api/reports/leave-utilization/route.ts
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
    const year = parseInt(
      searchParams.get("year") ?? String(new Date().getFullYear()),
      10,
    );

    const balances = await prisma.leaveBalance.findMany({
      where: { year },
      include: {
        employee: {
          select: {
            staffId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
      orderBy: [
        { employee: { department: { name: "asc" } } },
        { employee: { lastName: "asc" } },
      ],
    });

    const header =
      "Staff ID,Employee,Department,Leave Type,Year,Total Days,Used Days,Remaining Days";

    const rows = balances.map((b) => {
      const name = `${b.employee.firstName} ${b.employee.lastName}`;
      const remaining = b.totalDays - b.usedDays;
      return `"${b.employee.staffId}","${name}","${b.employee.department.name}","${b.leaveType.name}",${b.year},${b.totalDays},${b.usedDays},${remaining}`;
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leave_utilization.csv"',
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/leave-utilization]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
