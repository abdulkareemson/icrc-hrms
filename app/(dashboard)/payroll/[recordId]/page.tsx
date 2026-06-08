// app/(dashboard)/payroll/[recordId]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { getSession } from "@/lib/auth";
import { hasPermission, isHR } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getPayPeriodLabel } from "@/lib/validators/payroll.schema";
import {
  PayslipPreview,
  type PayslipData,
} from "@/components/modules/payroll/PayslipPreview";
import { PayrollStatusActions } from "@/components/modules/payroll/PayrollStatusActions";

export const metadata = {
  title: "Payslip — ICRC HRMS",
};

export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

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
          department: { select: { name: true, code: true } },
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

  if (!record) notFound();

  // ── Access check ──
  const isHRUser = isHR(session.user.role);
  if (!isHRUser) {
    if (record.employeeId !== session.user.employeeId) {
      redirect("/payroll");
    }
  }

  const payslip: PayslipData = {
    id: record.id,
    employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
    staffId: record.employee.staffId,
    jobTitle: record.employee.jobTitle,
    department: record.employee.department.name,
    departmentCode: record.employee.department.code,
    gradeLevelLabel: `GL ${String(record.gradeLevel.level).padStart(2, "0")} / Step ${record.gradeLevel.step}`,
    payPeriod: getPayPeriodLabel(record.payMonth, record.payYear),
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

  const canManage = hasPermission(session.user.role, "payroll:run");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Payroll
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Payslip — {payslip.payPeriod}
          </h1>
          <p className="text-sm text-neutral-500">
            {payslip.employeeName} · {payslip.staffId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/api/payroll/payslip/${recordId}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Link>
        </div>
      </div>

      {/* Status Actions — HR only */}
      {canManage && record.status !== "PAID" && (
        <PayrollStatusActions
          recordId={record.id}
          currentStatus={record.status}
          employeeName={payslip.employeeName}
          payPeriod={payslip.payPeriod}
        />
      )}

      {/* Payslip Preview */}
      <PayslipPreview payslip={payslip} />
    </div>
  );
}
