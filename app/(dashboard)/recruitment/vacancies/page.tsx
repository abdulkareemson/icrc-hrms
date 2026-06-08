// app/(dashboard)/recruitment/vacancies/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { VacancyCard } from "@/components/modules/recruitment/VacancyCard";

export default async function VacanciesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "recruitment:read")) {
    redirect("/dashboard");
  }

  const vacancies = await prisma.jobVacancy.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      department: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Recruitment</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Vacancies
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {vacancies.length} total vacancies
          </p>
        </div>

        {hasPermission(session.user.role, "recruitment:manage") && (
          <Link
            href="/recruitment/vacancies/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20"
          >
            <Plus className="h-4 w-4" />
            Create Vacancy
          </Link>
        )}
      </div>

      {vacancies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <h3 className="text-lg font-semibold text-neutral-700">
            No vacancies yet
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            Create your first vacancy to start receiving applications.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vacancies.map((v) => (
            <VacancyCard
              key={v.id}
              id={v.id}
              title={v.title}
              departmentName={v.department.name}
              jobType={v.jobType}
              location={v.location}
              deadline={v.deadline.toISOString()}
              applicationCount={v._count.applications}
            />
          ))}
        </div>
      )}
    </div>
  );
}
