// app/(dashboard)/leave/balances/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveBalanceGrid } from "@/components/modules/leave/LeaveBalanceGrid";
import { LeaveCalendar } from "@/components/modules/leave/LeaveCalendar";

type PageSearchParams = Promise<{
  year?: string | string[];
  employeeId?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function LeaveBalancesPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const resolved = await searchParams;
  const yearParam = getParam(resolved.year);
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const isHR =
    session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";

  let employeeId = session.user.employeeId;

  if (isHR) {
    const requestedEmployeeId = getParam(resolved.employeeId);
    if (requestedEmployeeId) {
      employeeId = requestedEmployeeId;
    }
  }

  if (!employeeId) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6">
        <p className="text-sm text-neutral-600">
          No employee profile found. Contact HR.
        </p>
      </div>
    );
  }

  const [balances, approvedLeave, employee] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: {
        leaveType: {
          select: {
            name: true,
            daysAllowed: true,
            isPaid: true,
            requiresDocument: true,
          },
        },
      },
      orderBy: { leaveType: { name: "asc" } },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: "APPROVED",
        startDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      select: {
        startDate: true,
        endDate: true,
        status: true,
        leaveType: { select: { name: true } },
      },
    }),
    prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true, staffId: true },
    }),
  ]);

  // Expand approved leave into individual days for calendar
  const leaveDays: Array<{
    date: string;
    status: string;
    leaveType: string;
  }> = [];

  for (const req of approvedLeave) {
    const current = new Date(req.startDate);
    const end = new Date(req.endDate);
    while (current <= end) {
      leaveDays.push({
        date: current.toISOString(),
        status: req.status,
        leaveType: req.leaveType.name,
      });
      current.setDate(current.getDate() + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Leave Management</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          Leave Balances
        </h1>
        {employee && (
          <p className="mt-2 text-sm text-neutral-500">
            {employee.firstName} {employee.lastName} ({employee.staffId}) —{" "}
            {year}
          </p>
        )}
      </div>

      <LeaveBalanceGrid
        balances={balances.map((b) => ({
          id: b.id,
          leaveTypeName: b.leaveType.name,
          totalDays: b.totalDays,
          usedDays: b.usedDays,
          remainingDays: b.totalDays - b.usedDays,
          isPaid: b.leaveType.isPaid,
          requiresDocument: b.leaveType.requiresDocument,
        }))}
        year={year}
      />

      <LeaveCalendar leaveDays={leaveDays} />
    </div>
  );
}
