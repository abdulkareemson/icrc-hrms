// app/(public)/careers/[vacancyId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicApplicationForm } from "@/components/forms/recruitment/PublicApplicationForm";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatJobType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ vacancyId: string }>;
}) {
  const { vacancyId } = await params;

  const vacancy = await prisma.jobVacancy.findFirst({
    where: {
      id: vacancyId,
      deletedAt: null,
      isPublished: true,
    },
    include: {
      department: { select: { name: true, code: true } },
    },
  });

  if (!vacancy) notFound();

  const isPastDeadline = vacancy.deadline < new Date();

  return (
    <div className="space-y-8">
      <Link
        href="/careers"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all positions
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              {vacancy.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-neutral-400" />
                <span>{vacancy.department.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-neutral-400" />
                <span>{formatJobType(vacancy.jobType)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-neutral-400" />
                <span>{vacancy.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-neutral-400" />
                <span
                  className={isPastDeadline ? "text-error font-medium" : ""}
                >
                  {isPastDeadline ? "Deadline passed: " : "Deadline: "}
                  {formatDate(vacancy.deadline)}
                </span>
              </div>
            </div>

            {vacancy.salaryRange && (
              <p className="mt-3 text-sm font-medium text-primary-700">
                Salary: {vacancy.salaryRange}
              </p>
            )}
          </div>

          {isPastDeadline && (
            <div className="shrink-0 rounded-xl bg-error/10 border border-error/20 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-error">
                Applications Closed
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                The deadline for this position has passed
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        {/* Job Details */}
        <div className="space-y-6">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {vacancy.description}
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {vacancy.requirements}
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {vacancy.responsibilities}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <div>
          {isPastDeadline ? (
            <Card className="border-neutral-200 shadow-sm">
              <CardContent className="p-8 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-700">
                  Applications Closed
                </h3>
                <p className="mt-2 text-sm text-neutral-500">
                  The deadline for this position was{" "}
                  {formatDate(vacancy.deadline)}.
                </p>
                <Link
                  href="/careers"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  View other positions
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="sticky top-8">
              <div className="mb-4 rounded-xl bg-primary-50 border border-primary-100 px-4 py-3">
                <p className="text-sm font-semibold text-primary-800">
                  Apply for this position
                </p>
                <p className="text-xs text-primary-600 mt-0.5">
                  Upload your CV (PDF) and fill in your details below.
                </p>
              </div>

              <PublicApplicationForm
                vacancyId={vacancy.id}
                vacancyTitle={vacancy.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
