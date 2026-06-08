// app/(dashboard)/recruitment/applications/[applicationId]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Briefcase, FileText, User } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPLICATION_STATUS_CONFIG } from "@/lib/validators/recruitment.schema";
import { cn } from "@/lib/utils";

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
function formatDateTime(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "recruitment:read"))
    redirect("/dashboard");

  const { applicationId } = await params;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      vacancy: {
        select: {
          id: true,
          title: true,
          jobType: true,
          location: true,
          deadline: true,
          department: { select: { name: true, code: true } },
        },
      },
      reviewedByHR: { select: { email: true } },
    },
  });

  if (!application) notFound();

  const statusConfig =
    APPLICATION_STATUS_CONFIG[
      application.status as keyof typeof APPLICATION_STATUS_CONFIG
    ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Recruitment</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {application.applicationRef}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Applied on {formatDate(application.createdAt)}
          </p>
        </div>
        <Link
          href={`/recruitment/vacancies/${application.vacancyId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vacancy
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold",
            statusConfig?.className ?? "bg-neutral-100 text-neutral-600",
          )}
        >
          {statusConfig?.label ?? application.status}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4.5 w-4.5 text-primary-700" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Full Name" value={application.applicantName} />
            <InfoItem label="Email" value={application.applicantEmail} />
            <InfoItem label="Phone" value={application.applicantPhone} />
            <InfoItem label="Reference" value={application.applicationRef} />
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4.5 w-4.5 text-primary-700" />
              Position Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Position" value={application.vacancy.title} />
            <InfoItem
              label="Department"
              value={application.vacancy.department.name}
            />
            <InfoItem
              label="Job Type"
              value={application.vacancy.jobType.replace("_", " ")}
            />
            <InfoItem label="Location" value={application.vacancy.location} />
          </CardContent>
        </Card>

        {application.interviewDate && (
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                label="Date & Time"
                value={formatDateTime(application.interviewDate)}
              />
              <InfoItem
                label="Mode"
                value={application.interviewMode ?? "Not specified"}
              />
              <InfoItem
                label="Venue"
                value={application.interviewVenue ?? "Not specified"}
              />
            </CardContent>
          </Card>
        )}

        {application.additionalInfo && (
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                {application.additionalInfo}
              </p>
            </CardContent>
          </Card>
        )}

        {application.hrNotes && (
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-800">
                HR Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-700">{application.hrNotes}</p>
              {application.reviewedByHR && (
                <p className="mt-2 text-xs text-neutral-500">
                  Reviewed by: {application.reviewedByHR.email}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
        <FileText className="h-4 w-4 text-neutral-500" />
        <span className="text-sm text-neutral-600">
          CV File Key:{" "}
          <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
            {application.cvKey}
          </code>
        </span>
      </div>
    </div>
  );
}
