// app/(dashboard)/leave/new/page.tsx
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, CalendarDays } from "lucide-react"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/rbac"
import { LeaveRequestForm } from "@/components/forms/leave/LeaveRequestForm"

export default async function NewLeavePage() {
  const session = await getSession()

  if (!session) redirect("/login")

  if (!hasPermission(session.user.role, "leave:create")) {
    redirect("/leave")
  }

  if (!session.user.employeeId) {
    redirect("/leave")
  }

  const currentYear = new Date().getFullYear()

  const [leaveTypes, balances] = await Promise.all([
    prisma.leaveType.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.leaveBalance.findMany({
      where: {
        employeeId: session.user.employeeId,
        year: currentYear,
      },
    }),
  ])

  const balanceMap = new Map(
    balances.map((b) => [b.leaveTypeId, b.totalDays - b.usedDays])
  )

  const leaveTypeOptions = leaveTypes.map((lt) => ({
    id: lt.id,
    name: lt.name,
    daysAllowed: lt.daysAllowed,
    isPaid: lt.isPaid,
    requiresDocument: lt.requiresDocument,
    remainingDays: balanceMap.get(lt.id) ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Leave Management</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Apply for Leave
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Submit a leave request. Your manager and HR will be notified for
            approval.
          </p>
        </div>

        <Link
          href="/leave"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Leave
        </Link>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-green-50 px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">
              Two-tier approval process
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Your request will be reviewed by your line manager first, then
              approved by HR. If you have no line manager, it goes directly to HR.
            </p>
          </div>
        </div>
      </div>

      <LeaveRequestForm leaveTypes={leaveTypeOptions} />
    </div>
  )
}