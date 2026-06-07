// app/(dashboard)/attendance/clock/page.tsx
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"
import { ClockWidget } from "@/components/modules/attendance/ClockWidget"

function getTodayWAT(): Date {
  const now = new Date()
  const watMs = now.getTime() + 60 * 60 * 1000
  const wat = new Date(watMs)
  return new Date(
    Date.UTC(wat.getUTCFullYear(), wat.getUTCMonth(), wat.getUTCDate())
  )
}

export default async function AttendanceClockPage() {
  const session = await getSession()

  if (!session) redirect("/login")

  if (!hasPermission(session.user.role, "attendance:clock")) {
    redirect("/attendance")
  }

  if (!session.user.employeeId) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-6">
        <p className="text-sm text-neutral-600">
          Your employee profile is not linked. Contact HR.
        </p>
      </div>
    )
  }

  const todayDate = getTodayWAT()

  const todayLog = await prisma.attendanceLog.findUnique({
    where: {
      employeeId_date: {
        employeeId: session.user.employeeId,
        date: todayDate,
      },
    },
  })

  const initialStatus = {
    hasClockedIn: !!todayLog?.clockInTime,
    hasClockedOut: !!todayLog?.clockOutTime,
    clockInTime: todayLog?.clockInTime?.toISOString() ?? null,
    clockOutTime: todayLog?.clockOutTime?.toISOString() ?? null,
    hoursWorked: todayLog?.hoursWorked ?? null,
    isLate: todayLog?.isLate ?? false,
    lateByMinutes: todayLog?.lateByMinutes ?? null,
    status: todayLog?.status ?? null,
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Self Service</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          Attendance
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Clock in and out to record your daily attendance.
          Late arrivals after the 15-minute grace period are automatically flagged.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <ClockWidget initialStatus={initialStatus} />
      </div>
    </div>
  )
}