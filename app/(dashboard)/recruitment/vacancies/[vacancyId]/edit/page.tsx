// app/(dashboard)/recruitment/vacancies/[vacancyId]/edit/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { VacancyForm } from "@/components/forms/recruitment/VacancyForm";

export default async function EditVacancyPage({
  params,
}: {
  params: Promise<{ vacancyId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "recruitment:manage"))
    redirect("/recruitment");

  const { vacancyId } = await params;

  const [vacancy, departments] = await Promise.all([
    prisma.jobVacancy.findFirst({ where: { id: vacancyId, deletedAt: null } }),
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  if (!vacancy) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Recruitment</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Edit Vacancy
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Update vacancy details for &quot;{vacancy.title}&quot;
          </p>
        </div>
        <Link
          href={`/recruitment/vacancies/${vacancyId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <VacancyForm
        departments={departments}
        vacancyId={vacancyId}
        mode="edit"
        defaultValues={{
          title: vacancy.title,
          departmentId: vacancy.departmentId,
          jobType: vacancy.jobType as
            | "FULL_TIME"
            | "CONTRACT"
            | "PART_TIME"
            | "INTERN",
          location: vacancy.location,
          description: vacancy.description,
          requirements: vacancy.requirements,
          responsibilities: vacancy.responsibilities,
          salaryRange: vacancy.salaryRange ?? "",
          deadline: vacancy.deadline.toISOString().split("T")[0] ?? "",
          isPublished: vacancy.isPublished,
        }}
      />
    </div>
  );
}
