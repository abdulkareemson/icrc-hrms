// app/api/payroll/run/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  runPayrollSchema,
  getPayPeriodLabel,
} from "@/lib/validators/payroll.schema";
import { calculatePayroll } from "@/lib/payroll/engine";

// ─────────────────────────────────────────────────────────────
// POST /api/payroll/run
// HR_ADMIN + SUPER_ADMIN only
// Creates PayrollRecord for all active employees for a month
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "payroll:run")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You do not have permission to run payroll",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = runPayrollSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 422 },
      );
    }

    const { payMonth, payYear } = parsed.data;
    const periodLabel = getPayPeriodLabel(payMonth, payYear);

    // ── Check for existing payroll run for this month/year ──
    const existingCount = await prisma.payrollRecord.count({
      where: { payMonth, payYear },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Payroll has already been run for ${periodLabel}. ${existingCount} record(s) exist.`,
        },
        { status: 409 },
      );
    }

    // ── Get all active employees with their grade levels ──
    const employees = await prisma.employee.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffId: true,
        gradeLevelId: true,
        gradeLevel: {
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
          },
        },
        user: {
          select: { email: true },
        },
      },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active employees found to process" },
        { status: 404 },
      );
    }

    // ── Calculate payroll for each employee and create records ──
    const payrollData = employees.map((emp) => {
      const calc = calculatePayroll({
        basicSalary: emp.gradeLevel.basicSalary,
        housingAllowance: emp.gradeLevel.housingAllowance,
        transportAllowance: emp.gradeLevel.transportAllowance,
        medicalAllowance: emp.gradeLevel.medicalAllowance,
        leaveAllowance: emp.gradeLevel.leaveAllowance,
        utilityAllowance: emp.gradeLevel.utilityAllowance,
      });

      return {
        employee: emp,
        calculation: calc,
      };
    });

    // ── Bulk create PayrollRecords in a transaction ──
    const createdRecords = await prisma.$transaction(
      payrollData.map(({ employee, calculation }) =>
        prisma.payrollRecord.create({
          data: {
            employeeId: employee.id,
            gradeLevelId: employee.gradeLevelId,
            payMonth,
            payYear,

            // Snapshot — earnings (monthly kobo)
            basicSalary: calculation.basicSalary,
            housingAllowance: calculation.housingAllowance,
            transportAllowance: calculation.transportAllowance,
            medicalAllowance: calculation.medicalAllowance,
            leaveAllowance: calculation.leaveAllowance,
            utilityAllowance: calculation.utilityAllowance,
            otherAllowances: calculation.otherAllowances,
            grossPay: calculation.grossPay,

            // Snapshot — deductions (monthly kobo)
            payeTax: calculation.payeTax,
            employeePension: calculation.employeePension,
            employerPension: calculation.employerPension,
            nhfDeduction: calculation.nhfDeduction,
            otherDeductions: calculation.otherDeductions,
            totalDeductions: calculation.totalDeductions,
            netPay: calculation.netPay,

            // Status
            status: "DRAFT",
            processedByHRId: session.user.id,
            processedAt: new Date(),
          },
        }),
      ),
    );

    // ── Audit log ──
    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "PayrollRecord",
      entityId: "bulk",
      description: `Payroll run for ${periodLabel} — ${createdRecords.length} employees processed`,
      metadata: {
        payMonth,
        payYear,
        employeeCount: createdRecords.length,
        totalGross: payrollData.reduce(
          (sum, p) => sum + p.calculation.grossPay,
          0,
        ),
        totalNet: payrollData.reduce((sum, p) => sum + p.calculation.netPay, 0),
      },
      ipAddress,
      userAgent,
    });

    // ── Summary stats for response ──
    const totalGross = payrollData.reduce(
      (sum, p) => sum + p.calculation.grossPay,
      0,
    );
    const totalDeductions = payrollData.reduce(
      (sum, p) => sum + p.calculation.totalDeductions,
      0,
    );
    const totalNet = payrollData.reduce(
      (sum, p) => sum + p.calculation.netPay,
      0,
    );

    return NextResponse.json(
      {
        success: true,
        message: `Payroll processed for ${periodLabel} — ${createdRecords.length} employees`,
        data: {
          period: periodLabel,
          payMonth,
          payYear,
          employeeCount: createdRecords.length,
          totalGross,
          totalDeductions,
          totalNet,
          status: "DRAFT",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/payroll/run error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run payroll" },
      { status: 500 },
    );
  }
}
