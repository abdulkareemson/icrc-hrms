// app/(dashboard)/recruitment/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, FileText, Plus, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { ApplicantPipeline } from "@/components/modules/recruitment/ApplicantPipeline";

export default async function RecruitmentPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "recruitment:read")) {
    redirect("/dashboard");
  }

  const [totalVacancies, publishedVacancies, totalApplications, pipelineStats] =
    await Promise.all([
      prisma.jobVacancy.count({ where: { deletedAt: null } }),
      prisma.jobVacancy.count({
        where: {
          deletedAt: null,
          isPublished: true,
          deadline: { gte: new Date() },
        },
      }),
      prisma.jobApplication.count(),
      prisma.jobApplication.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

  const stages = pipelineStats.map((s) => ({
    status: s.status,
    count: s._count.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">HR Management</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Recruitment
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Manage job vacancies, review applications, and track the hiring
            pipeline.
          </p>
        </div>

        {hasPermission(session.user.role, "recruitment:manage") && (
          <Link
            href="/recruitment/vacancies/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20"
          >
            <Plus className="h-4 w-4" />
            Create Vacancy
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Total Vacancies</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {totalVacancies}
              </p>
            </div>
            <div className="rounded-xl bg-primary-50 p-3 text-primary-700">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Published & Open</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {publishedVacancies}
              </p>
            </div>
            <div className="rounded-xl bg-success/10 p-3 text-success">
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Total Applications</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">
                {totalApplications}
              </p>
            </div>
            <div className="rounded-xl bg-warning/10 p-3 text-warning">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <ApplicantPipeline stages={stages} total={totalApplications} />

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/recruitment/vacancies"
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
        >
          <Briefcase className="h-6 w-6 text-primary-700 mb-3" />
          <h3 className="text-base font-semibold text-neutral-900">
            Manage Vacancies
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Create, edit, publish, and manage job listings.
          </p>
        </Link>

        <Link
          href="/recruitment/vacancies"
          className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
        >
          <Users className="h-6 w-6 text-primary-700 mb-3" />
          <h3 className="text-base font-semibold text-neutral-900">
            Review Applications
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Review CVs, schedule interviews, and manage the pipeline.
          </p>
        </Link>
      </div>
    </div>
  );
}
