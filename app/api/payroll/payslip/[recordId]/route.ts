// app/api/payroll/payslip/[recordId]/route.ts
// PDF generation — Node.js runtime only (no Edge)
// @react-pdf/renderer v4.5.1 — uses pdf().toBuffer() for correct typing

export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { getPayPeriodLabel } from "@/lib/validators/payroll.schema";
import { PayslipDocument } from "@/components/pdf/PayslipDocument";

// ─────────────────────────────────────────────────────────────
// GET /api/payroll/payslip/[recordId]
// Streams PDF payslip to browser
// HR: any record | Employee: own records only
// ─────────────────────────────────────────────────────────────

export async function GET(
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

    const { recordId } = await params;

    // ── Fetch record with all required relations ──
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
            department: {
              select: { name: true, code: true },
            },
          },
        },
        gradeLevel: {
          select: { level: true, step: true },
        },
        processedByHR: {
          select: { email: true },
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
            error: "Forbidden: You can only download your own payslips",
          },
          { status: 403 },
        );
      }
    }

    // ── Build props for PDF component ──
    const payPeriod = getPayPeriodLabel(record.payMonth, record.payYear);
    const gradeLevelLabel = `GL ${String(record.gradeLevel.level).padStart(2, "0")} / Step ${record.gradeLevel.step}`;

    const docProps = {
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      staffId: record.employee.staffId,
      jobTitle: record.employee.jobTitle,
      department: record.employee.department.name,
      departmentCode: record.employee.department.code,
      gradeLevelLabel,
      payPeriod,
      payMonth: record.payMonth,
      payYear: record.payYear,

      basicSalary: record.basicSalary,
      housingAllowance: record.housingAllowance,
      transportAllowance: record.transportAllowance,
      medicalAllowance: record.medicalAllowance,
      leaveAllowance: record.leaveAllowance,
      utilityAllowance: record.utilityAllowance,
      otherAllowances: record.otherAllowances,
      grossPay: record.grossPay,

      payeTax: record.payeTax,
      employeePension: record.employeePension,
      employerPension: record.employerPension,
      nhfDeduction: record.nhfDeduction,
      otherDeductions: record.otherDeductions,
      totalDeductions: record.totalDeductions,

      netPay: record.netPay,

      status: record.status,
      processedAt: record.processedAt?.toISOString() ?? null,
      paidAt: record.paidAt?.toISOString() ?? null,
      processedBy: record.processedByHR?.email ?? null,
    };

    // ── Render PDF using pdf().toBuffer() ──
    // pdf() accepts ReactElement<any> — avoids DocumentProps mismatch
    // toBuffer() returns Promise<NodeJS.ReadableStream> per types,
    // but at runtime returns a Buffer — collect via stream reading
    const element = createElement(PayslipDocument, docProps);
    const pdfInstance = pdf(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      element as React.ReactElement<any>,
    );
    const stream = await pdfInstance.toBuffer();

    // ── Collect stream into Uint8Array for Response ──
    // Buffer<ArrayBufferLike> is not assignable to BodyInit directly in
    // TypeScript DOM types — collect chunks and pass as Uint8Array
    const chunks: Uint8Array[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        chunks.push(new Uint8Array(chunk));
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
    const pdfBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      pdfBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // ── Safe filename ──
    const safeName = `${record.employee.firstName}-${record.employee.lastName}`
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .toLowerCase();
    const filename = `payslip-${safeName}-${record.payYear}-${String(record.payMonth).padStart(2, "0")}.pdf`;

    // ── Audit log ──
    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "EXPORT",
      entityType: "PayrollRecord",
      entityId: recordId,
      description: `Payslip PDF downloaded for ${record.employee.firstName} ${record.employee.lastName} — ${payPeriod}`,
      metadata: {
        payMonth: record.payMonth,
        payYear: record.payYear,
        employeeId: record.employeeId,
        staffId: record.employee.staffId,
      },
      ipAddress,
      userAgent,
    });

    // ── Return PDF as Uint8Array — accepted by Response BodyInit ──
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.byteLength),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("GET /api/payroll/payslip/[recordId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate payslip PDF" },
      { status: 500 },
    );
  }
}