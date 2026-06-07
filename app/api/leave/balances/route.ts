// app/api/leave/balances/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/leave/balances
 * Employee: own balances only
 * HR/Admin: can query any employee via ?employeeId=
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
    const year = parseInt(
      url.searchParams.get("year") ?? String(new Date().getFullYear()),
      10,
    );

    let employeeId: string | null = null;

    if (session.user.role === "EMPLOYEE") {
      if (!session.user.employeeId) {
        return NextResponse.json(
          { success: false, error: "Employee profile not found" },
          { status: 404 },
        );
      }
      employeeId = session.user.employeeId;
    } else {
      employeeId = url.searchParams.get("employeeId");
      if (!employeeId) {
        return NextResponse.json(
          {
            success: false,
            error: "employeeId query param required for HR/Admin",
          },
          { status: 400 },
        );
      }
    }

    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            daysAllowed: true,
            isPaid: true,
            requiresDocument: true,
          },
        },
      },
      orderBy: {
        leaveType: { name: "asc" },
      },
    });

    const formatted = balances.map((balance) => ({
      id: balance.id,
      leaveTypeId: balance.leaveTypeId,
      leaveTypeName: balance.leaveType.name,
      daysAllowed: balance.leaveType.daysAllowed,
      isPaid: balance.leaveType.isPaid,
      requiresDocument: balance.leaveType.requiresDocument,
      year: balance.year,
      totalDays: balance.totalDays,
      usedDays: balance.usedDays,
      remainingDays: balance.totalDays - balance.usedDays,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/leave/balances error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave balances" },
      { status: 500 },
    );
  }
}
