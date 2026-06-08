// app/api/reports/performance-summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";
import type { PerformanceRating } from "@prisma/client";

const RATING_SCORES: Record<PerformanceRating, number> = {
  OUTSTANDING: 5,
  EXCEEDS_EXPECTATIONS: 4,
  MEETS_EXPECTATIONS: 3,
  BELOW_EXPECTATIONS: 2,
  UNSATISFACTORY: 1,
};

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

    const reviews = await prisma.performanceReview.findMany({
      where: { reviewYear: year, isFinalized: true },
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
      ],
    });

    const header =
      "Staff ID,Employee,Department,Review Period,Year,Self Rating,Manager Rating,HR Final Rating,Score";

    const rows = reviews.map((r) => {
      const name = `${r.employee.firstName} ${r.employee.lastName}`;
      const score = r.hrFinalRating ? RATING_SCORES[r.hrFinalRating] : "";
      return `"${r.employee.staffId}","${name}","${r.employee.department.name}","${r.reviewPeriod}",${r.reviewYear},"${r.employeeSelfRating ?? ""}","${r.managerRating ?? ""}","${r.hrFinalRating ?? ""}",${score}`;
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="performance_summary.csv"',
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/performance-summary]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
