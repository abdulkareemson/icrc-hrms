// app/api/reports/recruitment-pipeline/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";

export async function GET(_request: Request) {
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

    const vacancies = await prisma.jobVacancy.findMany({
      where: { deletedAt: null },
      include: {
        department: { select: { name: true } },
        applications: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const header =
      "Vacancy,Department,Total Applications,Applied,Shortlisted,Interview,Offer Extended,Hired,Rejected,Conversion Rate (%)";

    const rows = vacancies.map((v) => {
      const total = v.applications.length;
      const counts: Record<string, number> = {
        APPLIED: 0,
        SHORTLISTED: 0,
        INTERVIEW_SCHEDULED: 0,
        OFFER_EXTENDED: 0,
        HIRED: 0,
        REJECTED: 0,
      };

      for (const app of v.applications) {
        counts[app.status] = (counts[app.status] ?? 0) + 1;
      }

      const conversionRate =
        total > 0 ? (((counts.HIRED ?? 0) / total) * 100).toFixed(1) : "0.0";

      return `"${v.title}","${v.department.name}",${total},${counts.APPLIED},${counts.SHORTLISTED},${counts.INTERVIEW_SCHEDULED},${counts.OFFER_EXTENDED},${counts.HIRED},${counts.REJECTED},${conversionRate}`;
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="recruitment_pipeline.csv"',
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/recruitment-pipeline]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
