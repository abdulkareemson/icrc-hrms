// app/(dashboard)/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // SUPER_ADMIN and HR_ADMIN get redirected to their dashboards
  if (session.user.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (session.user.role === "HR_ADMIN") {
    redirect("/hr");
  }

  // EMPLOYEE dashboard — placeholder until Phase 10
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Welcome back, {session.user.firstName ?? "Employee"}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Here&apos;s an overview of your HR information.
        </p>
      </div>

      {/* Placeholder cards — will be replaced with real data in Phase 10 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Leave Balance</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">Days remaining</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Attendance</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">This month</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">
            Pending Requests
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">Awaiting action</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-neutral-500">Notifications</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">—</p>
          <p className="mt-1 text-xs text-neutral-400">Unread</p>
        </div>
      </div>
    </div>
  );
}
