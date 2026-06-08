// app/api/reports/employee-headcount/route.ts
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

    const employees = await prisma.employee.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        staffId: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        employmentType: true,
        gender: true,
        department: { select: { name: true, code: true } },
        gradeLevel: { select: { level: true, step: true } },
      },
      orderBy: [{ department: { name: "asc" } }, { lastName: "asc" }],
    });

    const header =
      "Staff ID,First Name,Last Name,Job Title,Department,Dept Code,Grade Level,Step,Employment Type,Gender";
    const rows = employees.map(
      (e) =>
        `"${e.staffId}","${e.firstName}","${e.lastName}","${e.jobTitle}","${e.department.name}","${e.department.code}",${e.gradeLevel.level},${e.gradeLevel.step},"${e.employmentType}","${e.gender}"`,
    );

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="employee_headcount.csv"',
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/employee-headcount]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
