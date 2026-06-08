// app/(dashboard)/documents/[documentId]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Download,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { DOCUMENT_TYPE_LABELS } from "@/lib/validators/document.schema";
import { formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PageParams = Promise<{ documentId: string }>;

function formatDateTime(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function isExpired(date: Date | null): boolean {
  if (!date) return false;
  return date < new Date();
}

function isExpiringSoon(date: Date | null): boolean {
  if (!date) return false;
  const diff = date.getTime() - Date.now();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

export default async function DocumentDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    include: {
      employee: {
        select: {
          id: true,
          staffId: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          department: { select: { name: true, code: true } },
        },
      },
      uploadedByUser: {
        select: {
          email: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!document) notFound();

  // Access control — employees can only view their own documents
  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";

  if (!isHR && document.employeeId !== session.user.employeeId) {
    notFound();
  }

  const canDelete = hasPermission(session.user.role, "documents:read_all");

  const uploaderEmployee = document.uploadedByUser.employee;
  const uploadedByName = uploaderEmployee
    ? `${uploaderEmployee.firstName} ${uploaderEmployee.lastName}`
    : document.uploadedByUser.email;

  const expired = isExpired(document.expiresAt);
  const expiringSoon = isExpiringSoon(document.expiresAt);

  const TYPE_BADGE_COLORS: Record<string, string> = {
    CONTRACT: "bg-blue-50 text-blue-700 border-blue-200",
    OFFER_LETTER: "bg-indigo-50 text-indigo-700 border-indigo-200",
    NIN: "bg-orange-50 text-orange-700 border-orange-200",
    PASSPORT: "bg-amber-50 text-amber-700 border-amber-200",
    CERTIFICATE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDICAL: "bg-pink-50 text-pink-700 border-pink-200",
    DISCIPLINARY: "bg-red-50 text-red-700 border-red-200",
    OTHER: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/documents"
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            aria-label="Back to documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-medium text-primary-700">
              {isHR ? "HR Records" : "My Documents"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
              {document.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                  TYPE_BADGE_COLORS[document.documentType] ??
                    TYPE_BADGE_COLORS.OTHER,
                )}
              >
                {DOCUMENT_TYPE_LABELS[document.documentType] ??
                  document.documentType}
              </span>
              {expired && (
                <span className="inline-flex items-center gap-1 rounded-full border border-error/30 bg-error/10 px-3 py-1 text-xs font-semibold text-error">
                  <AlertTriangle className="h-3 w-3" />
                  Expired
                </span>
              )}
              {expiringSoon && !expired && (
                <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Expiring Soon
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons — client-side download handled via document list pattern */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/documents/${document.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-primary-700/20 hover:from-primary-800 hover:to-primary-700"
          >
            <Download className="h-4 w-4" />
            Download
          </a>

          {canDelete && (
            <form
              action={`/api/documents/${document.id}`}
              method="POST"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <Link
                href={`/documents?delete=${document.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Link>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document preview / info */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50">
                <FileText className="h-10 w-10 text-primary-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-neutral-900">
                  {document.title}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {document.mimeType} · {formatFileSize(document.fileSize)}
                </p>
              </div>
              <a
                href={`/api/documents/${document.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20"
              >
                <Download className="h-4 w-4" />
                Download File
              </a>
              <p className="text-xs text-neutral-400">
                File will open in a new tab or download automatically
              </p>
            </div>
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-4">
          {/* Employee */}
          {isHR && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                Employee
              </h3>
              <Link
                href={`/employees/${document.employee.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm shrink-0">
                  {document.employee.firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 group-hover:text-primary-700 transition-colors">
                    {document.employee.firstName} {document.employee.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {document.employee.staffId}
                  </p>
                </div>
              </Link>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <User className="h-3.5 w-3.5" />
                  {document.employee.jobTitle}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Building2 className="h-3.5 w-3.5" />
                  {document.employee.department.name} (
                  {document.employee.department.code})
                </div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Uploaded</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatDateTime(document.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    expired
                      ? "bg-error/10"
                      : expiringSoon
                        ? "bg-warning/10"
                        : "bg-neutral-100",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-3.5 w-3.5",
                      expired
                        ? "text-error"
                        : expiringSoon
                          ? "text-warning"
                          : "text-neutral-500",
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Expires</p>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      expired
                        ? "text-error"
                        : expiringSoon
                          ? "text-warning"
                          : "text-neutral-900",
                    )}
                  >
                    {formatDateTime(document.expiresAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                  <User className="h-3.5 w-3.5 text-neutral-500" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Uploaded by</p>
                  <p className="text-sm font-medium text-neutral-900">
                    {uploadedByName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
