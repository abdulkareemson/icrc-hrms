// app/(dashboard)/hr/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isHR } from "@/lib/rbac";
import { HRDashboard } from "@/components/modules/dashboard/HRDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HR Dashboard — ICRC HRMS",
};

const DEPT_COLORS = [
  "#15803d",
  "#0e7490",
  "#7c3aed",
  "#be123c",
  "#b45309",
  "#0f766e",
  "#1d4ed8",
  "#a21caf",
  "#c2410c",
];

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  "Full-time": "#15803d",
  Contract: "#0e7490",
  "Part-time": "#7c3aed",
  Intern: "#b45309",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default async function HRDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isHR(session.user.role)) redirect("/dashboard");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // ── Stat queries ──
  const [
    totalEmployees,
    activeEmployees,
    pendingLeave,
    pendingComplaints,
    openVacancies,
    lastMonthEmployees,
  ] = await Promise.all([
    prisma.employee.count({ where: { deletedAt: null } }),
    prisma.employee.count({
      where: { deletedAt: null, isActive: true },
    }),
    prisma.leaveRequest.count({
      where: { status: { in: ["PENDING_MANAGER", "PENDING_HR"] } },
    }),
    prisma.complaint.count({
      where: {
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS"] },
        deletedAt: null,
      },
    }),
    prisma.jobVacancy.count({
      where: {
        isPublished: true,
        closedAt: null,
        deletedAt: null,
        deadline: { gte: now },
      },
    }),
    prisma.performanceReview.count({
      where: { isFinalized: false },
    }),
    prisma.payrollRecord.count({
      where: { payMonth: currentMonth, payYear: currentYear },
    }),
    prisma.employee.count({
      where: {
        deletedAt: null,
        createdAt: {
          lt: new Date(currentYear, now.getMonth(), 1),
        },
      },
    }),
  ]);

  const growthPercent =
    lastMonthEmployees > 0
      ? (
          ((totalEmployees - lastMonthEmployees) / lastMonthEmployees) *
          100
        ).toFixed(1)
      : "0";

  const stats = [
    {
      label: "Total Employees",
      value: totalEmployees,
      icon: "Users",
      trend: "up" as const,
      trendValue: `${growthPercent}% from last month`,
      color: "green" as const,
      href: "/employees",
    },
    {
      label: "Pending Leave",
      value: pendingLeave,
      icon: "CalendarDays",
      color: (pendingLeave > 0 ? "gold" : "green") as "gold" | "green",
      href: "/leave",
    },
    {
      label: "Open Complaints",
      value: pendingComplaints,
      icon: "MessageSquareWarning",
      color: (pendingComplaints > 0 ? "red" : "green") as "red" | "green",
      href: "/complaints",
    },
    {
      label: "Open Vacancies",
      value: openVacancies,
      icon: "UserPlus",
      color: "blue" as const,
      href: "/recruitment",
    },
  ];

  // ── Department distribution ──
  const deptCounts = await prisma.employee.groupBy({
    by: ["departmentId"],
    where: { deletedAt: null, isActive: true },
    _count: true,
  });

  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  const deptMap = new Map(departments.map((d) => [d.id, d]));

  const departmentDistribution = deptCounts
    .map((dc, i) => {
      const dept = deptMap.get(dc.departmentId);
      return {
        name: dept?.code ?? "Unknown",
        value: dc._count,
        color: DEPT_COLORS[i % DEPT_COLORS.length] ?? "#6b7280",
      };
    })
    .sort((a, b) => b.value - a.value);

  // ── Employment type distribution ──
  const typeCounts = await prisma.employee.groupBy({
    by: ["employmentType"],
    where: { deletedAt: null, isActive: true },
    _count: true,
  });

  const employmentTypeDistribution = typeCounts.map((tc) => ({
    name: tc.employmentType,
    value: tc._count,
    color: EMPLOYMENT_TYPE_COLORS[tc.employmentType] ?? "#6b7280",
  }));

  // ── Monthly attendance (last 6 months) ──
  const sixMonthsAgo = new Date(currentYear, now.getMonth() - 5, 1);

  const attendanceLogs = await prisma.attendanceLog.findMany({
    where: { date: { gte: sixMonthsAgo } },
    select: { date: true, status: true, isLate: true },
  });

  const attendanceByMonth = new Map<
    string,
    { onTime: number; late: number; absent: number }
  >();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = MONTH_NAMES[d.getMonth()] ?? key;
    attendanceByMonth.set(`${key}|${monthLabel}`, {
      onTime: 0,
      late: 0,
      absent: 0,
    });
  }

  for (const log of attendanceLogs) {
    const d = new Date(log.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = MONTH_NAMES[d.getMonth()] ?? key;
    const mapKey = `${key}|${monthLabel}`;
    const entry = attendanceByMonth.get(mapKey);
    if (!entry) continue;

    if (log.status === "ABSENT") {
      entry.absent++;
    } else if (log.isLate) {
      entry.late++;
    } else {
      entry.onTime++;
    }
  }

  const monthlyAttendance = Array.from(attendanceByMonth.entries()).map(
    ([compositeKey, counts]) => ({
      name: compositeKey.split("|")[1] ?? compositeKey,
      ...counts,
    }),
  );

  // ── Leave utilization ──
  const leaveTypes = await prisma.leaveType.findMany({
    select: { id: true, name: true, daysAllowed: true },
  });

  const leaveUsage = await prisma.leaveRequest.groupBy({
    by: ["leaveTypeId"],
    where: {
      status: "APPROVED",
      startDate: {
        gte: new Date(currentYear, 0, 1),
      },
    },
    _sum: { totalDays: true },
  });

  const usageMap = new Map(
    leaveUsage.map((u) => [u.leaveTypeId, u._sum.totalDays ?? 0]),
  );

  const leaveUtilization = leaveTypes.map((lt) => {
    const used = usageMap.get(lt.id) ?? 0;
    return {
      name: lt.name.length > 12 ? `${lt.name.slice(0, 12)}…` : lt.name,
      used,
      remaining: Math.max(0, lt.daysAllowed * activeEmployees - used),
    };
  });

  // ── Pending actions ──
  const pendingLeaveRequests = await prisma.leaveRequest.findMany({
    where: { status: { in: ["PENDING_MANAGER", "PENDING_HR"] } },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { firstName: true, lastName: true, staffId: true } },
      leaveType: { select: { name: true } },
    },
  });

  const pendingComplaintsList = await prisma.complaint.findMany({
    where: {
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      deletedAt: null,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      referenceNumber: true,
      title: true,
      status: true,
      isConfidential: true,
      createdAt: true,
    },
  });

  const pendingApplications = await prisma.jobApplication.findMany({
    where: { status: "APPLIED" },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      vacancy: { select: { title: true } },
    },
  });

  const pendingActions = [
    ...pendingLeaveRequests.map((lr) => ({
      id: lr.id,
      type: "leave" as const,
      title: `${lr.employee.firstName} ${lr.employee.lastName}`,
      description: `${lr.leaveType.name} — ${lr.totalDays} day${lr.totalDays !== 1 ? "s" : ""}`,
      status: lr.status,
      createdAt: lr.createdAt.toISOString(),
      href: `/leave/${lr.id}`,
    })),
    ...pendingComplaintsList.map((c) => ({
      id: c.id,
      type: "complaint" as const,
      title: c.isConfidential ? "Confidential Complaint" : c.title,
      description: `Ref: ${c.referenceNumber}`,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      href: `/complaints/${c.id}`,
    })),
    ...pendingApplications.map((a) => ({
      id: a.id,
      type: "application" as const,
      title: a.applicantName,
      description: `Applied for: ${a.vacancy.title}`,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      href: `/recruitment/applications/${a.id}`,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">HR Operations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            HR Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Overview of workforce metrics, pending actions, and key HR
            analytics.
          </p>
        </div>
      </div>

      <HRDashboard
        stats={stats}
        departmentDistribution={departmentDistribution}
        employmentTypeDistribution={employmentTypeDistribution}
        monthlyAttendance={monthlyAttendance}
        leaveUtilization={leaveUtilization}
        pendingActions={pendingActions}
        departments={departments}
      />
    </div>
  );
}
