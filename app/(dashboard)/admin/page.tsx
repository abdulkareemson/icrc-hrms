// app/(dashboard)/admin/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Placeholder — will be fully built in Phase 11
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          System Administration
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage users, system configuration, and audit logs.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">Registered accounts</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Departments</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">9</p>
          <p className="mt-1 text-xs text-neutral-400">Active departments</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Grade Levels</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">17</p>
          <p className="mt-1 text-xs text-neutral-400">GL 01 – GL 17</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Audit Entries</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">This month</p>
        </div>
      </div>
    </div>
  );
}
