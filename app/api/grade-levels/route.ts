// app/api/grade-levels/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/grade-levels — list all grade levels
 * Accessible by all authenticated users
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const gradeLevels = await prisma.gradeLevel.findMany({
      orderBy: [{ level: "asc" }, { step: "asc" }],
      select: {
        id: true,
        level: true,
        step: true,
        basicSalary: true,
        housingAllowance: true,
        transportAllowance: true,
        medicalAllowance: true,
        leaveAllowance: true,
        utilityAllowance: true,
        _count: {
          select: {
            employees: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
      },
    });

    const formatted = gradeLevels.map((gl) => {
      const grossAnnual =
        gl.basicSalary +
        gl.housingAllowance +
        gl.transportAllowance +
        gl.medicalAllowance +
        gl.leaveAllowance +
        gl.utilityAllowance;

      return {
        id: gl.id,
        level: gl.level,
        step: gl.step,
        label: `GL ${String(gl.level).padStart(2, "0")} / Step ${gl.step}`,
        basicSalary: gl.basicSalary,
        housingAllowance: gl.housingAllowance,
        transportAllowance: gl.transportAllowance,
        medicalAllowance: gl.medicalAllowance,
        leaveAllowance: gl.leaveAllowance,
        utilityAllowance: gl.utilityAllowance,
        grossAnnual,
        grossMonthly: Math.round(grossAnnual / 12),
        employeeCount: gl._count.employees,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/grade-levels error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch grade levels" },
      { status: 500 },
    );
  }
}
