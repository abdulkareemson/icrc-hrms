// app/(dashboard)/recruitment/vacancies/[vacancyId]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Briefcase, Eye, PencilLine, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import {
  ApplicationTable,
  type ApplicationRow,
} from "@/components/modules/recruitment/ApplicationTable";
import { ApplicantPipeline } from "@/components/modules/recruitment/ApplicantPipeline";
import type { Prisma } from "@prisma/client";

type PageSearchParams = Promise<{
  page?: string | string[];
  status?: string | string[];
  search?: string | string[];
}>;

function getParam(v?: string | string[]): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function VacancyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ vacancyId: string }>;
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "recruitment:read"))
    redirect("/dashboard");

  const { vacancyId } = await params;
  const resolved = await searchParams;
  const page = Math.max(1, parseInt(getParam(resolved.page) || "1", 10));
  const status = getParam(resolved.status);

  const vacancy = await prisma.jobVacancy.findFirst({
    where: { id: vacancyId, deletedAt: null },
    include: { department: { select: { name: true, code: true } } },
  });

  if (!vacancy) notFound();

  const where: Prisma.JobApplicationWhereInput = { vacancyId };
  if (status) where.status = status as Prisma.EnumApplicationStatusFilter;

  const [applications, total, pipelineStats] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      skip: (page - 1) * 10,
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        vacancy: {
          select: {
            title: true,
            department: { select: { name: true, code: true } },
          },
        },
      },
    }),
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.groupBy({
      by: ["status"],
      where: { vacancyId },
      _count: { status: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const rows: ApplicationRow[] = applications.map((a) => ({
    id: a.id,
    applicationRef: a.applicationRef,
    applicantName: a.applicantName,
    applicantEmail: a.applicantEmail,
    vacancyTitle: a.vacancy.title,
    department: a.vacancy.department.name,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  const canEdit = hasPermission(session.user.role, "recruitment:manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Recruitment</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {vacancy.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {vacancy.department.name} •{" "}
            {vacancy.isPublished ? "Published" : "Draft"} • Deadline:{" "}
            {formatDate(vacancy.deadline)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/recruitment/vacancies"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {canEdit && (
            <Link
              href={`/recruitment/vacancies/${vacancyId}/edit`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Applications</p>
                <p className="mt-2 text-3xl font-bold text-neutral-900">
                  {total}
                </p>
              </div>
              <div className="rounded-xl bg-primary-50 p-3 text-primary-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Status</p>
                <p className="mt-2 text-lg font-bold text-neutral-900">
                  {vacancy.isPublished ? "Published" : "Draft"}
                </p>
              </div>
              <div className="rounded-xl bg-success/10 p-3 text-success">
                <Eye className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Job Type</p>
                <p className="mt-2 text-lg font-bold text-neutral-900">
                  {vacancy.jobType.replace("_", " ")}
                </p>
              </div>
              <div className="rounded-xl bg-warning/10 p-3 text-warning">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ApplicantPipeline
        stages={pipelineStats.map((s) => ({
          status: s.status,
          count: s._count.status,
        }))}
        total={total}
      />

      <ApplicationTable
        applications={rows}
        pagination={{
          page,
          limit: 10,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        currentStatus={status}
      />
    </div>
  );
}
