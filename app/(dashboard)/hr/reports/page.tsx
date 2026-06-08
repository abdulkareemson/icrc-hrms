// app/(dashboard)/hr/reports/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";
import { ReportsPageClient } from "@/components/modules/dashboard/ReportsPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HR Reports — ICRC HRMS",
};

export default async function HRReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isHR(session.user.role)) redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">HR Operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          Reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Generate and download CSV reports for workforce analytics and
          compliance.
        </p>
      </div>

      <ReportsPageClient
        userId={session.user.id}
        userEmail={session.user.email}
      />
    </div>
  );
}
