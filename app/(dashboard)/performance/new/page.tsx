// app/(dashboard)/performance/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { InitiateReviewClient } from "@/components/modules/performance/InitiateReviewClient";

export const metadata = {
  title: "Initiate Performance Review — ICRC HRMS",
};

export default async function NewPerformancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "performance:manage")) {
    redirect("/performance");
  }

  const employees = await prisma.employee.findMany({
    where: { isActive: true, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      staffId: true,
      jobTitle: true,
      lineManagerId: true,
      department: { select: { name: true, code: true } },
    },
    orderBy: [{ department: { name: "asc" } }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      {/* Custom back link — PageHeader has no backHref prop */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/performance"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reviews
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Initiate Performance Review
          </h1>
          <p className="text-sm text-neutral-500">
            Start a new appraisal cycle for one or more employees
          </p>
        </div>
      </div>

      <InitiateReviewClient employees={employees} />
    </div>
  );
}
