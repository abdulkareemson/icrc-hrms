// app/(dashboard)/payroll/run/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { RunPayrollForm } from "@/components/forms/payroll/RunPayrollForm";

export const metadata = {
  title: "Run Payroll — ICRC HRMS",
};

export default async function RunPayrollPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "payroll:run")) {
    redirect("/payroll");
  }

  const activeEmployeeCount = await prisma.employee.count({
    where: { isActive: true, deletedAt: null },
  });

  return (
    <div className="space-y-6">
      {/* Header with back link */}
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
            Run Monthly Payroll
          </h1>
          <p className="text-sm text-neutral-500">
            Calculate and create payroll records for all active employees
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <RunPayrollForm activeEmployeeCount={activeEmployeeCount} />
      </div>
    </div>
  );
}
