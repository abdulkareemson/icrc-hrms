// app/(dashboard)/payroll/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission, isHR } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/PageHeader";
import { PayrollTable } from "@/components/modules/payroll/PayrollTable";

export const metadata = {
  title: "Payroll — ICRC HRMS",
};

export default async function PayrollPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "payroll:read_own")) {
    redirect("/dashboard");
  }

  const isHRUser = isHR(session.user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isHRUser ? "Payroll Management" : "My Payslips"}
        description={
          isHRUser
            ? "View and manage payroll records for all employees"
            : "View your monthly payslips and salary history"
        }
        action={
          isHRUser ? { label: "Run Payroll", href: "/payroll/run" } : undefined
        }
      />

      <PayrollTable showEmployee={Boolean(isHRUser)} />
    </div>
  );
}
