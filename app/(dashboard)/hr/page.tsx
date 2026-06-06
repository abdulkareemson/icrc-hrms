// app/(dashboard)/hr/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HR Dashboard",
};

export default async function HRDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Placeholder — will be fully built in Phase 10
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          HR Dashboard
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage employees, leave, attendance, payroll, and more.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">
            Total Employees
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">Active staff</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Pending Leave</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">Awaiting approval</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">
            Open Complaints
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">Unresolved</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Payroll Status</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">This month</p>
        </div>
      </div>
    </div>
  );
}
