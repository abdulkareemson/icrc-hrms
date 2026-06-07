// components/modules/attendance/ClockWidget.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Clock, LogIn, LogOut, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TodayStatus {
  hasClockedIn: boolean
  hasClockedOut: boolean
  clockInTime: string | null
  clockOutTime: string | null
  hoursWorked: number | null
  isLate: boolean
  lateByMinutes: number | null
  status: string | null
}

interface ClockWidgetProps {
  initialStatus: TodayStatus
}

function formatWATTime(utcIso: string): string {
  const utc = new Date(utcIso)
  const watMs = utc.getTime() + 60 * 60 * 1000
  const wat = new Date(watMs)
  return `${wat.getUTCHours().toString().padStart(2, "0")}:${wat.getUTCMinutes().toString().padStart(2, "0")}`
}

function LiveClock() {
  const [time, setTime] = useState("")

  useEffect(() => {
    function tick() {
      const now = new Date()
      const watMs = now.getTime() + 60 * 60 * 1000
      const wat = new Date(watMs)
      setTime(
        `${wat.getUTCHours().toString().padStart(2, "0")}:${wat.getUTCMinutes().toString().padStart(2, "0")}:${wat.getUTCSeconds().toString().padStart(2, "0")}`
      )
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-center">
      <p className="text-5xl font-bold tracking-tight text-white tabular-nums">
        {time || "--:--:--"}
      </p>
      <p className="mt-2 text-sm text-primary-100">
        West Africa Time (WAT / UTC+1)
      </p>
    </div>
  )
}

export function ClockWidget({ initialStatus }: ClockWidgetProps) {
  const [status, setStatus] = useState<TodayStatus>(initialStatus)
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)

  const handleClockIn = useCallback(async () => {
    setIsClockingIn(true)
    try {
      const response = await fetch("/api/attendance/clock-in", {
        method: "POST",
        credentials: "include",
      })

      const result = (await response.json()) as {
        success: boolean
        data?: {
          clockInTime: string
          isLate: boolean
          lateByMinutes: number
          status: string
        }
        message?: string
        error?: string
      }

      if (!response.ok || !result.success) {
        toast.error("Clock-in failed", { description: result.error })
        return
      }

      setStatus((prev) => ({
        ...prev,
        hasClockedIn: true,
        clockInTime: result.data?.clockInTime ?? null,
        isLate: result.data?.isLate ?? false,
        lateByMinutes: result.data?.lateByMinutes ?? null,
        status: result.data?.status ?? "PRESENT",
      }))

      if (result.data?.isLate) {
        toast.warning(result.message)
      } else {
        toast.success(result.message)
      }
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server.",
      })
    } finally {
      setIsClockingIn(false)
    }
  }, [])

  const handleClockOut = useCallback(async () => {
    setIsClockingOut(true)
    try {
      const response = await fetch("/api/attendance/clock-out", {
        method: "POST",
        credentials: "include",
      })

      const result = (await response.json()) as {
        success: boolean
        data?: { clockOutTime: string; hoursWorked: number }
        message?: string
        error?: string
      }

      if (!response.ok || !result.success) {
        toast.error("Clock-out failed", { description: result.error })
        return
      }

      setStatus((prev) => ({
        ...prev,
        hasClockedOut: true,
        clockOutTime: result.data?.clockOutTime ?? null,
        hoursWorked: result.data?.hoursWorked ?? null,
      }))

      toast.success(result.message)
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server.",
      })
    } finally {
      setIsClockingOut(false)
    }
  }, [])

  const canClockIn = !status.hasClockedIn && status.status !== "ON_LEAVE"
  const canClockOut = status.hasClockedIn && !status.hasClockedOut

  return (
    <div className="space-y-6">
      {/* Live Clock */}
      <div className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-8 shadow-lg">
        <LiveClock />

        <div className="mt-8 flex justify-center gap-4">
          <Button
            onClick={handleClockIn}
            disabled={!canClockIn || isClockingIn}
            className={cn(
              "px-8 py-6 text-base font-semibold rounded-2xl shadow-md transition-all",
              canClockIn
                ? "bg-white text-primary-700 hover:bg-primary-50"
                : "bg-white/20 text-white/50 cursor-not-allowed"
            )}
          >
            {isClockingIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            Clock In
          </Button>

          <Button
            onClick={handleClockOut}
            disabled={!canClockOut || isClockingOut}
            className={cn(
              "px-8 py-6 text-base font-semibold rounded-2xl shadow-md transition-all",
              canClockOut
                ? "bg-white text-error hover:bg-red-50"
                : "bg-white/20 text-white/50 cursor-not-allowed"
            )}
          >
            {isClockingOut ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-5 w-5" />
            )}
            Clock Out
          </Button>
        </div>
      </div>

      {/* Today's Status */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-semibold text-neutral-900 mb-4">
          <Clock className="h-4.5 w-4.5 text-primary-700" />
          Today&apos;s Attendance
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Status
            </p>
            <p
              className={cn(
                "mt-1.5 text-sm font-semibold",
                status.status === "PRESENT" && "text-success",
                status.status === "LATE" && "text-warning",
                status.status === "ON_LEAVE" && "text-purple-700",
                status.status === "ABSENT" && "text-error",
                !status.status && "text-neutral-400"
              )}
            >
              {status.status ?? "Not clocked in"}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Clock In
            </p>
            <p className="mt-1.5 text-sm font-medium text-neutral-900">
              {status.clockInTime
                ? `${formatWATTime(status.clockInTime)} WAT`
                : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Clock Out
            </p>
            <p className="mt-1.5 text-sm font-medium text-neutral-900">
              {status.clockOutTime
                ? `${formatWATTime(status.clockOutTime)} WAT`
                : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Hours Worked
            </p>
            <p className="mt-1.5 text-sm font-medium text-neutral-900">
              {status.hoursWorked !== null
                ? `${status.hoursWorked} hrs`
                : "—"}
            </p>
          </div>
        </div>

        {/* Late warning */}
        {status.isLate && status.lateByMinutes !== null && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-warning/10 border border-warning/20 px-4 py-3 text-sm text-warning">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              You were <strong>{status.lateByMinutes} minute{status.lateByMinutes !== 1 ? "s" : ""}</strong> late
              today (after 15-minute grace period).
            </span>
          </div>
        )}

        {status.status === "ON_LEAVE" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>You are on approved leave today. Clock-in is disabled.</span>
          </div>
        )}
      </div>
    </div>
  )
}