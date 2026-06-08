// app/(dashboard)/documents/new/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { DocumentUploadForm } from "@/components/forms/document/DocumentUploadForm";

type PageSearchParams = Promise<{
  employeeId?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "documents:read_all")) {
    redirect("/documents");
  }

  const resolved = await searchParams;
  const preselectedEmployeeId = getParam(resolved.employeeId);

  const employees = await prisma.employee.findMany({
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      staffId: true,
      firstName: true,
      lastName: true,
      department: { select: { name: true } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  const employeeOptions = employees.map((emp) => ({
    id: emp.id,
    staffId: emp.staffId,
    firstName: emp.firstName,
    lastName: emp.lastName,
    departmentName: emp.department.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">HR Records</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          Upload Document
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Upload and categorise an employee document for secure storage.
        </p>
      </div>

      <DocumentUploadForm
        employees={employeeOptions}
        preselectedEmployeeId={
          preselectedEmployeeId || undefined
        }
      />
    </div>
  );
}