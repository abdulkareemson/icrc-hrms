// app/(public)/careers/page.tsx
import { prisma } from "@/lib/prisma";
import { Briefcase, Search } from "lucide-react";
import { VacancyCard } from "@/components/modules/recruitment/VacancyCard";

export default async function CareersPage() {
  const vacancies = await prisma.jobVacancy.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      deadline: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      department: {
        select: { name: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 px-8 py-12 text-center text-white shadow-lg">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Careers at ICRC Nigeria
          </h1>
          <p className="mt-4 text-base text-primary-100 leading-relaxed">
            Join the Infrastructure Concession Regulatory Commission and
            contribute to Nigeria&apos;s infrastructure development through
            Public-Private Partnerships.
          </p>
        </div>
      </div>

      {/* Vacancies */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Open Positions
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {vacancies.length} position{vacancies.length !== 1 ? "s" : ""}{" "}
              currently available
            </p>
          </div>
        </div>

        {vacancies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <Search className="mx-auto h-10 w-10 text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700">
              No open positions
            </h3>
            <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
              There are currently no vacancies available. Please check back
              later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.id}
                id={vacancy.id}
                title={vacancy.title}
                departmentName={vacancy.department.name}
                jobType={vacancy.jobType}
                location={vacancy.location}
                deadline={vacancy.deadline.toISOString()}
                isPublic
              />
            ))}
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900 mb-3">
          Why Join ICRC?
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-primary-700 mb-1">
              Impact
            </h3>
            <p className="text-sm text-neutral-600">
              Shape Nigeria&apos;s infrastructure landscape through PPP
              regulation and policy development.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-700 mb-1">
              Growth
            </h3>
            <p className="text-sm text-neutral-600">
              Develop your career within a federal agency that values
              professional development and competence.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-700 mb-1">
              Benefits
            </h3>
            <p className="text-sm text-neutral-600">
              Competitive FGN salary structure, comprehensive leave
              entitlements, and medical coverage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
