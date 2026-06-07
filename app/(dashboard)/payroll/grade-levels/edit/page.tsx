// app/(dashboard)/payroll/grade-levels/edit/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeDollarSign, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditGradeLevelForm } from "@/components/forms/payroll/EditGradeLevelForm";

type PageSearchParams = Promise<{
  gradeLevelId?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function EditGradeLevelPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/payroll/grade-levels");
  }

  const resolvedSearchParams = await searchParams;
  const gradeLevelId = getParam(resolvedSearchParams.gradeLevelId);

  if (!gradeLevelId) {
    redirect("/payroll/grade-levels");
  }

  const gradeLevel = await prisma.gradeLevel.findUnique({
    where: { id: gradeLevelId },
    select: {
      id: true,
      level: true,
      step: true,
      basicSalary: true,
      housingAllowance: true,
      transportAllowance: true,
      medicalAllowance: true,
      leaveAllowance: true,
      utilityAllowance: true,
      _count: {
        select: {
          employees: {
            where: {
              deletedAt: null,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!gradeLevel) {
    notFound();
  }

  const label = `GL ${String(gradeLevel.level).padStart(2, "0")} / Step ${gradeLevel.step}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Payroll Setup</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Edit Grade Level
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Update salary components for the selected grade level. Changes take
            effect immediately for future payroll calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/payroll/grade-levels"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Grade Levels
          </Link>

          <div className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 border border-primary-100">
            <ShieldCheck className="h-4 w-4" />
            {label}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-green-50 px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <BadgeDollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">
              Salary structure editor
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              You are editing <strong>{label}</strong>. This grade level is
              currently assigned to{" "}
              <strong>{gradeLevel._count.employees}</strong>{" "}
              {gradeLevel._count.employees === 1 ? "employee" : "employees"}.
            </p>
          </div>
        </div>
      </div>

      <EditGradeLevelForm
        gradeLevelId={gradeLevel.id}
        label={label}
        employeeCount={gradeLevel._count.employees}
        defaults={{
          basicSalary: gradeLevel.basicSalary,
          housingAllowance: gradeLevel.housingAllowance,
          transportAllowance: gradeLevel.transportAllowance,
          medicalAllowance: gradeLevel.medicalAllowance,
          leaveAllowance: gradeLevel.leaveAllowance,
          utilityAllowance: gradeLevel.utilityAllowance,
        }}
      />
    </div>
  );
}
