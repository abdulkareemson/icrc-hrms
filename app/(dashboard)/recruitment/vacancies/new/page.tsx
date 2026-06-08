// app/(dashboard)/recruitment/vacancies/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { VacancyForm } from "@/components/forms/recruitment/VacancyForm";

export default async function NewVacancyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "recruitment:manage")) {
    redirect("/recruitment");
  }

  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Recruitment</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Create Vacancy
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Define the position details and requirements.
          </p>
        </div>
        <Link
          href="/recruitment/vacancies"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vacancies
        </Link>
      </div>

      <VacancyForm departments={departments} mode="create" />
    </div>
  );
}
