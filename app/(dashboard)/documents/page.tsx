// app/(dashboard)/documents/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  FileText,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import {
  DocumentTable,
  type DocumentRow,
} from "@/components/modules/document/DocumentTable";
import type { Prisma } from "@prisma/client";

type PageSearchParams = Promise<{
  page?: string | string[];
  limit?: string | string[];
  documentType?: string | string[];
  search?: string | string[];
  employeeId?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolved = await searchParams;
  const page = Math.max(1, parseInt(getParam(resolved.page) || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(getParam(resolved.limit) || "10", 10)),
  );
  const documentType = getParam(resolved.documentType);
  const search = getParam(resolved.search).trim();
  const employeeIdFilter = getParam(resolved.employeeId);

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";
  const canDelete = hasPermission(session.user.role, "documents:read_all");

  const where: Prisma.DocumentWhereInput = { deletedAt: null };

  // Employees can only see their own documents
  if (!isHR) {
    if (!session.user.employeeId) {
      return (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6">
          <p className="text-sm text-neutral-600">
            Employee profile not linked. Contact HR.
          </p>
        </div>
      );
    }
    where.employeeId = session.user.employeeId;
  } else if (employeeIdFilter) {
    where.employeeId = employeeIdFilter;
  }

  if (documentType && documentType !== "all") {
    where.documentType = documentType as Prisma.EnumDocumentTypeFilter;
  }

  if (search) {
    const searchOr: Prisma.DocumentWhereInput["OR"] = [
      { title: { contains: search, mode: "insensitive" } },
      {
        employee: {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { staffId: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];

    if (where.employeeId) {
      where.AND = [{ employeeId: where.employeeId }, { OR: searchOr }];
      delete where.employeeId;
    } else {
      where.OR = searchOr;
    }
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [documents, total, expiringCount, expiredCount] = await Promise.all([
    prisma.document.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
        uploadedByUser: {
          select: {
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.document.count({ where }),
    prisma.document.count({
      where: {
        ...where,
        expiresAt: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
    prisma.document.count({
      where: {
        ...where,
        expiresAt: { lt: now },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const rows: DocumentRow[] = documents.map((doc) => {
    const uploaderEmployee = doc.uploadedByUser.employee;
    const uploadedByName = uploaderEmployee
      ? `${uploaderEmployee.firstName} ${uploaderEmployee.lastName}`
      : doc.uploadedByUser.email;

    return {
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      expiresAt: doc.expiresAt?.toISOString() ?? null,
      expiryAlertSent: doc.expiryAlertSent,
      createdAt: doc.createdAt.toISOString(),
      employeeId: doc.employee.id,
      employeeName: `${doc.employee.firstName} ${doc.employee.lastName}`,
      staffId: doc.employee.staffId,
      departmentName: doc.employee.department.name,
      uploadedByName,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">
            {isHR ? "HR Records" : "Self Service"}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {isHR ? "Documents" : "My Documents"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            {isHR
              ? "Manage employee documents, contracts, and compliance records."
              : "View and download your employment documents."}
          </p>
        </div>

        {isHR && (
          <Link
            href="/documents/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20"
          >
            <Plus className="h-4 w-4" />
            Upload Document
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={total}
          icon={FileText}
          accent="bg-primary-50 text-primary-700"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringCount}
          icon={Clock}
          accent="bg-warning/10 text-warning"
        />
        <StatCard
          title="Expired"
          value={expiredCount}
          icon={AlertTriangle}
          accent="bg-error/10 text-error"
        />
        <StatCard
          title="No Expiry"
          value={total - expiringCount - expiredCount}
          icon={ShieldAlert}
          accent="bg-success/10 text-success"
        />
      </div>

      <DocumentTable
        documents={rows}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }}
        showEmployee={isHR}
        currentDocumentType={documentType}
        canDelete={canDelete}
      />
    </div>
  );
}
