// app/(dashboard)/payroll/grade-levels/page.tsx
import { redirect } from "next/navigation";
import { BadgeDollarSign, Coins, ShieldCheck, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  GradeLevelTable,
  type GradeLevelRow,
} from "@/components/forms/payroll/GradeLevelTable";

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default async function GradeLevelsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const gradeLevels = await prisma.gradeLevel.findMany({
    orderBy: [{ level: "asc" }, { step: "asc" }],
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
              isActive: true,
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  const rows: GradeLevelRow[] = gradeLevels.map((gradeLevel) => {
    const grossAnnual =
      gradeLevel.basicSalary +
      gradeLevel.housingAllowance +
      gradeLevel.transportAllowance +
      gradeLevel.medicalAllowance +
      gradeLevel.leaveAllowance +
      gradeLevel.utilityAllowance;

    return {
      id: gradeLevel.id,
      label: `GL ${String(gradeLevel.level).padStart(2, "0")} / Step ${gradeLevel.step}`,
      level: gradeLevel.level,
      step: gradeLevel.step,
      basicSalary: gradeLevel.basicSalary,
      housingAllowance: gradeLevel.housingAllowance,
      transportAllowance: gradeLevel.transportAllowance,
      medicalAllowance: gradeLevel.medicalAllowance,
      leaveAllowance: gradeLevel.leaveAllowance,
      utilityAllowance: gradeLevel.utilityAllowance,
      grossAnnual,
      grossMonthly: Math.round(grossAnnual / 12),
      employeeCount: gradeLevel._count.employees,
    };
  });

  const totalEmployeesMapped = rows.reduce(
    (sum, row) => sum + row.employeeCount,
    0,
  );
  const averageMonthlyGross =
    rows.length > 0
      ? Math.round(
          rows.reduce((sum, row) => sum + row.grossMonthly, 0) / rows.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Payroll Setup</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Grade Level Salary Table
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-500">
            Review salary structure across all grade levels and steps. Gross
            salary values are derived from basic salary and all configured
            allowances.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700 border border-primary-100">
            <ShieldCheck className="h-4 w-4" />
            Super Admin editing enabled
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Grade Levels"
          value={rows.length.toLocaleString("en-NG")}
          icon={BadgeDollarSign}
          accent="bg-primary-50 text-primary-700"
        />
        <StatCard
          title="Employees Assigned"
          value={totalEmployeesMapped.toLocaleString("en-NG")}
          icon={Users}
          accent="bg-success/10 text-success"
        />
        <StatCard
          title="Average Monthly Gross"
          value={formatCurrency(averageMonthlyGross)}
          icon={Coins}
          accent="bg-warning/10 text-warning"
        />
      </div>

      <GradeLevelTable rows={rows} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
