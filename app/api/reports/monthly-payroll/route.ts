// app/api/reports/monthly-payroll/route.ts
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
    const month = parseInt(searchParams.get("month") ?? "", 10);
    const year = parseInt(
      searchParams.get("year") ?? String(new Date().getFullYear()),
      10,
    );

    const where: { payYear: number; payMonth?: number } = { payYear: year };
    if (month >= 1 && month <= 12) {
      where.payMonth = month;
    }

    const records = await prisma.payrollRecord.findMany({
      where,
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
      orderBy: [{ payMonth: "asc" }, { employee: { lastName: "asc" } }],
    });

    const header =
      "Staff ID,Employee,Department,Month,Year,Basic (Kobo),Gross (Kobo),PAYE (Kobo),Employee Pension (Kobo),NHF (Kobo),Total Deductions (Kobo),Net Pay (Kobo),Status";

    const rows = records.map((r) => {
      const name = `${r.employee.firstName} ${r.employee.lastName}`;
      return `"${r.employee.staffId}","${name}","${r.employee.department.name}",${r.payMonth},${r.payYear},${r.basicSalary},${r.grossPay},${r.payeTax},${r.employeePension},${r.nhfDeduction},${r.totalDeductions},${r.netPay},"${r.status}"`;
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="monthly_payroll.csv"',
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/monthly-payroll]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
