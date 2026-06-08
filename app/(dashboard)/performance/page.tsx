// app/(dashboard)/performance/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission, isHR } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/PageHeader";
import { PerformanceListClient } from "@/components/modules/performance/PerformanceListClient";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export const metadata = {
  title: "Performance Reviews — ICRC HRMS",
};

export default async function PerformancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "performance:read_own")) {
    redirect("/dashboard");
  }

  const isHRUser = isHR(session.user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Management"
        description={
          isHRUser
            ? "Manage employee appraisal cycles and track performance reviews"
            : "View your performance reviews and self-assessments"
        }
        action={
          isHRUser
            ? { label: "Initiate Review", href: "/performance/new" }
            : undefined
        }
      />

      <Suspense
        fallback={<LoadingSpinner size="lg" label="Loading reviews..." />}
      >
        <PerformanceListClient
          currentEmployeeId={session.user.employeeId}
          currentUserRole={session.user.role}
          isHR={isHRUser}
        />
      </Suspense>
    </div>
  );
}
