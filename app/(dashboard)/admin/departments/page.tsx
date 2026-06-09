// app/(dashboard)/admin/departments/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";

export default async function DepartmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      head: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffId: true,
        },
      },
      _count: {
        select: {
          employees: { where: { isActive: true, deletedAt: null } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          Departments
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          View department structure and headcount.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept: any) => (
          <div
            key={dept.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                  <Building2 className="h-5 w-5 text-primary-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {dept.name}
                  </p>
                  <p className="text-xs font-mono text-neutral-500">
                    {dept.code}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">
                <Users className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-xs font-semibold text-neutral-700">
                  {dept._count.employees}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-neutral-100 pt-3">
              <p className="text-xs text-neutral-400">Department Head</p>
              {dept.head ? (
                <Link
                  href={`/employees/${dept.head.id}`}
                  className="mt-1 text-sm font-medium text-neutral-900 transition-colors hover:text-primary-700"
                >
                  {dept.head.firstName} {dept.head.lastName}
                </Link>
              ) : (
                <p className="mt-1 text-sm text-neutral-400">Not assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}