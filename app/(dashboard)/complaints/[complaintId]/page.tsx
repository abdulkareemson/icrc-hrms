// app/(dashboard)/complaints/[complaintId]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  MessageSquareWarning,
  ShieldAlert,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplaintTimeline } from "@/components/modules/complaint/ComplaintTimeline";
import {
  COMPLAINT_CATEGORY_CONFIG,
  COMPLAINT_STATUS_CONFIG,
} from "@/lib/validators/complaint.schema";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { complaintId } = await params;

  const complaint = await prisma.complaint.findFirst({
    where: { id: complaintId, deletedAt: null },
    include: {
      employee: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          department: { select: { name: true, code: true } },
          user: { select: { id: true, email: true } },
        },
      },
      assignedTo: {
        select: { id: true, email: true },
      },
    },
  });

  if (!complaint) notFound();

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isOwn = complaint.employee.user.id === session.user.id;

  if (!isHR && !isOwn) {
    redirect("/complaints");
  }

  const isConfidentialHidden =
    complaint.isConfidential && !isSuperAdmin && !isOwn;

  const catConfig = COMPLAINT_CATEGORY_CONFIG[complaint.category];
  const statusConfig =
    COMPLAINT_STATUS_CONFIG[
      complaint.status as keyof typeof COMPLAINT_STATUS_CONFIG
    ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Complaints</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {complaint.referenceNumber}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Submitted on {formatDate(complaint.createdAt)}
          </p>
        </div>

        <Link
          href="/complaints"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </Link>
      </div>

      {/* Confidential banner */}
      {complaint.isConfidential && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 px-5 py-4">
          <Lock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Confidential Complaint
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">
              {isSuperAdmin
                ? "You are viewing confidential identity. This access has been logged."
                : isOwn
                  ? "Your identity is hidden from HR personnel."
                  : "The complainant's identity is protected."}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Status + Category Banner */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold",
                statusConfig?.className ?? "bg-neutral-100 text-neutral-600",
              )}
            >
              {statusConfig?.label ?? complaint.status}
            </span>
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1.5 text-xs font-medium",
                catConfig?.className ?? "bg-neutral-100 text-neutral-600",
              )}
            >
              {catConfig?.label ?? complaint.category}
            </span>
            {complaint.isConfidential && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning border border-warning/20">
                <Lock className="h-3 w-3" />
                Confidential
              </span>
            )}
          </div>

          {/* Details */}
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareWarning className="h-4.5 w-4.5 text-primary-700" />
                Complaint Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Submitted By
                </p>
                <p className="mt-1.5 text-sm font-medium text-neutral-900">
                  {isConfidentialHidden ? (
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                      Anonymous Employee
                    </span>
                  ) : (
                    `${complaint.employee.firstName} ${complaint.employee.lastName}`
                  )}
                </p>
              </div>

              {!isConfidentialHidden && (
                <>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Staff ID
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-neutral-900">
                      {complaint.employee.staffId}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Department
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-neutral-900">
                      {complaint.employee.department.name}
                    </p>
                  </div>
                </>
              )}

              <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Assigned To
                </p>
                <p className="mt-1.5 text-sm font-medium text-neutral-900">
                  {complaint.assignedTo?.email ?? "Not yet assigned"}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Subject
                </p>
                <p className="mt-1.5 text-sm font-medium text-neutral-900">
                  {complaint.title}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Description
                </p>
                <p className="mt-1.5 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              {/* HR Notes — hidden from employee */}
              {!isOwn && complaint.hrNotes && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    HR Internal Notes
                  </p>
                  <p className="mt-1.5 text-sm text-neutral-700 leading-relaxed">
                    {complaint.hrNotes}
                  </p>
                </div>
              )}

              {/* Resolution note — visible to employee */}
              {complaint.resolutionNote && (
                <div className="rounded-xl border border-success/20 bg-success/5 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-success">
                    Resolution Note
                  </p>
                  <p className="mt-1.5 text-sm text-neutral-700 leading-relaxed">
                    {complaint.resolutionNote}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="border-neutral-200 shadow-sm h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplaintTimeline
              currentStatus={complaint.status}
              createdAt={complaint.createdAt.toISOString()}
              assignedAt={complaint.assignedAt?.toISOString() ?? null}
              resolvedAt={complaint.resolvedAt?.toISOString() ?? null}
              assignedToEmail={complaint.assignedTo?.email ?? null}
              resolutionNote={complaint.resolutionNote}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
