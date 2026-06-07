// app/(dashboard)/attendance/[employeeId]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceOverrideForm } from "@/components/forms/attendance/AttendanceOverrideForm";
import { ATTENDANCE_STATUS_CONFIG } from "@/lib/validators/attendance.schema";
import { cn } from "@/lib/utils";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(utcDate: Date | null): string {
  if (!utcDate) return "—";
  const watMs = utcDate.getTime() + 60 * 60 * 1000;
  const wat = new Date(watMs);
  return `${wat.getUTCHours().toString().padStart(2, "0")}:${wat.getUTCMinutes().toString().padStart(2, "0")} WAT`;
}

export default async function EmployeeAttendancePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "attendance:read_all")) {
    redirect("/attendance");
  }

  const { employeeId } = await params;

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
    select: {
      id: true,
      staffId: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      department: { select: { name: true, code: true } },
    },
  });

  if (!employee) notFound();

  const recentLogs = await prisma.attendanceLog.findMany({
    where: { employeeId },
    orderBy: { date: "desc" },
    take: 30,
  });

  const canOverride = hasPermission(session.user.role, "attendance:override");
  const latestLog = recentLogs[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Attendance</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {employee.staffId} • {employee.department.name} •{" "}
            {employee.jobTitle}
          </p>
        </div>

        <Link
          href="/attendance"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Attendance
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Recent Logs */}
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4.5 w-4.5 text-primary-700" />
              Recent Attendance (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">
                No attendance records found.
              </p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => {
                  const config =
                    ATTENDANCE_STATUS_CONFIG[
                      log.status as keyof typeof ATTENDANCE_STATUS_CONFIG
                    ];

                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <p className="font-medium text-neutral-900">
                            {formatDate(log.date)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            In: {formatTime(log.clockInTime)} • Out:{" "}
                            {formatTime(log.clockOutTime)}
                            {log.hoursWorked !== null && (
                              <span> • {log.hoursWorked}h</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.isLate && log.lateByMinutes !== null && (
                          <span className="text-xs font-medium text-warning">
                            {log.lateByMinutes}m late
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            config?.className ??
                              "bg-neutral-100 text-neutral-600",
                          )}
                        >
                          {config?.label ?? log.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Override Form */}
        {canOverride && latestLog && (
          <Card className="border-neutral-200 shadow-sm h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Override Latest Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceOverrideForm
                logId={latestLog.id}
                employeeName={`${employee.firstName} ${employee.lastName}`}
                date={formatDate(latestLog.date)}
                currentStatus={latestLog.status}
                currentClockIn={
                  latestLog.clockInTime
                    ? (() => {
                        const d = new Date(
                          latestLog.clockInTime.getTime() + 3600000,
                        );
                        return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
                      })()
                    : null
                }
                currentClockOut={
                  latestLog.clockOutTime
                    ? (() => {
                        const d = new Date(
                          latestLog.clockOutTime.getTime() + 3600000,
                        );
                        return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
                      })()
                    : null
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
