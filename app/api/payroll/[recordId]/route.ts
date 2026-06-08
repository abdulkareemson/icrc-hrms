// app/api/payroll/[recordId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission, isHR } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  updatePayrollStatusSchema,
  getPayPeriodLabel,
} from "@/lib/validators/payroll.schema";
import { sendEmail } from "@/lib/email/sender";
import { generatePayslipReadyEmail } from "@/lib/email/templates/payslip-ready";
import { formatCurrency } from "@/lib/utils";
import { getMonthLabel } from "@/lib/validators/payroll.schema";

// ─────────────────────────────────────────────────────────────
// GET /api/payroll/[recordId]
// HR: any record
// Employee: own records only
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { recordId } = await params;

    const record = await prisma.payrollRecord.findUnique({
      where: { id: recordId },
      include: {
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            profilePhotoKey: true,
            departmentId: true,
            department: { select: { name: true, code: true } },
          },
        },
        gradeLevel: {
          select: { level: true, step: true },
        },
        processedByHR: {
          select: { id: true, email: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Payroll record not found" },
        { status: 404 },
      );
    }

    // ── Access check ──
    if (!isHR(session.user.role)) {
      if (record.employeeId !== session.user.employeeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: You can only view your own payslips",
          },
          { status: 403 },
        );
      }
    }

    const formatted = {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      staffId: record.employee.staffId,
      jobTitle: record.employee.jobTitle,
      department: record.employee.department.name,
      departmentCode: record.employee.department.code,
      profilePhotoKey: record.employee.profilePhotoKey,
      gradeLevelLabel: `GL ${String(record.gradeLevel.level).padStart(2, "0")} / Step ${record.gradeLevel.step}`,
      gradeLevel: record.gradeLevel.level,
      gradeLevelStep: record.gradeLevel.step,
      payMonth: record.payMonth,
      payYear: record.payYear,
      payPeriod: getPayPeriodLabel(record.payMonth, record.payYear),

      // Earnings
      basicSalary: record.basicSalary,
      housingAllowance: record.housingAllowance,
      transportAllowance: record.transportAllowance,
      medicalAllowance: record.medicalAllowance,
      leaveAllowance: record.leaveAllowance,
      utilityAllowance: record.utilityAllowance,
      otherAllowances: record.otherAllowances,
      grossPay: record.grossPay,

      // Deductions
      payeTax: record.payeTax,
      employeePension: record.employeePension,
      employerPension: record.employerPension,
      nhfDeduction: record.nhfDeduction,
      otherDeductions: record.otherDeductions,
      totalDeductions: record.totalDeductions,

      // Net
      netPay: record.netPay,

      // Status
      status: record.status,
      processedAt: record.processedAt?.toISOString() ?? null,
      paidAt: record.paidAt?.toISOString() ?? null,
      processedBy: record.processedByHR?.email ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/payroll/[recordId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payroll record" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/payroll/[recordId]
// HR only — update status (DRAFT → PROCESSED → PAID)
// When PAID → send payslip email to employee
// ─────────────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> },
) {
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
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { recordId } = await params;

    const body = await request.json();
    const parsed = updatePayrollStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 422 },
      );
    }

    const { status: newStatus } = parsed.data;

    // ── Get existing record ──
    const record = await prisma.payrollRecord.findUnique({
      where: { id: recordId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffId: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Payroll record not found" },
        { status: 404 },
      );
    }

    // ── Validate status transition ──
    const VALID_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ["PROCESSED"],
      PROCESSED: ["PAID", "DRAFT"],
      PAID: [], // terminal — cannot change
    };

    const allowed = VALID_TRANSITIONS[record.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot change status from ${record.status} to ${newStatus}. Allowed transitions: ${allowed.join(", ") || "none"}`,
        },
        { status: 422 },
      );
    }

    // ── Update ──
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === "PROCESSED") {
      updateData.processedAt = new Date();
      updateData.processedByHRId = session.user.id;
    }

    if (newStatus === "PAID") {
      updateData.paidAt = new Date();
    }

    const updated = await prisma.payrollRecord.update({
      where: { id: recordId },
      data: updateData,
    });

    // ── Audit log ──
    const { ipAddress, userAgent } = getRequestMeta(request);
    const periodLabel = getPayPeriodLabel(record.payMonth, record.payYear);

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "PayrollRecord",
      entityId: recordId,
      description: `Payroll status changed: ${record.status} → ${newStatus} for ${record.employee.firstName} ${record.employee.lastName} (${periodLabel})`,
      metadata: {
        previousStatus: record.status,
        newStatus,
        payMonth: record.payMonth,
        payYear: record.payYear,
        employeeId: record.employeeId,
        netPay: record.netPay,
      },
      ipAddress,
      userAgent,
    });

    // ── Send payslip email when status → PAID ──
    if (newStatus === "PAID") {
      const monthLabel = getMonthLabel(record.payMonth);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const payslipUrl = `${appUrl}/payroll/${recordId}`;

      const emailContent = generatePayslipReadyEmail({
        employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
        staffId: record.employee.staffId,
        payMonth: monthLabel,
        payYear: record.payYear,
        grossPay: formatCurrency(record.grossPay),
        totalDeductions: formatCurrency(record.totalDeductions),
        netPay: formatCurrency(record.netPay),
        payslipUrl,
      });

      await sendEmail({
        to: record.employee.user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Payroll status updated to ${newStatus}`,
      data: {
        id: updated.id,
        status: updated.status,
        processedAt: updated.processedAt?.toISOString() ?? null,
        paidAt: updated.paidAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("PUT /api/payroll/[recordId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payroll record" },
      { status: 500 },
    );
  }
}
