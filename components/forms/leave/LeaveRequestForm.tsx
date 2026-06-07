// components/forms/leave/LeaveRequestForm.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createLeaveRequestSchema,
  type CreateLeaveRequestFormValues,
} from "@/lib/validators/leave.schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  CalendarDays,
  Loader2,
  FileText,
  Info,
  Send,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaveTypeOption {
  id: string
  name: string
  daysAllowed: number
  isPaid: boolean
  requiresDocument: boolean
  remainingDays: number
}

interface LeaveRequestFormProps {
  leaveTypes: LeaveTypeOption[]
}

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function countWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (endDate < startDate) return 0

  let count = 0
  const current = new Date(startDate)
  while (current <= endDate) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

export function LeaveRequestForm({ leaveTypes }: LeaveRequestFormProps) {
  const router = useRouter()
  const [selectedLeaveType, setSelectedLeaveType] =
    useState<LeaveTypeOption | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeaveRequestFormValues>({
    resolver: zodResolver(createLeaveRequestSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      documentKey: "",
    },
  })

  const watchStart = watch("startDate")
  const watchEnd = watch("endDate")
  const watchLeaveTypeId = watch("leaveTypeId")

  const workingDays = useMemo(
    () => countWorkingDays(watchStart, watchEnd),
    [watchStart, watchEnd]
  )

  useEffect(() => {
    const found = leaveTypes.find((lt) => lt.id === watchLeaveTypeId)
    setSelectedLeaveType(found ?? null)
  }, [watchLeaveTypeId, leaveTypes])

  const today = new Date().toISOString().split("T")[0] ?? ""

  const onSubmit = async (data: CreateLeaveRequestFormValues) => {
    try {
      const response = await fetch("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      const result = (await response.json()) as {
        success: boolean
        data?: { id: string; status: string }
        message?: string
        error?: string
        details?: Record<string, string[]>
      }

      if (!response.ok || !result.success) {
        if (result.details) {
          const firstError = Object.values(result.details).flat()[0]
          toast.error("Validation error", {
            description: firstError ?? result.error,
          })
        } else {
          toast.error("Failed to submit leave request", {
            description: result.error,
          })
        }
        return
      }

      toast.success("Leave request submitted!", {
        description: result.message,
      })

      router.push("/leave")
      router.refresh()
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="overflow-hidden border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-4">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
              <CalendarDays className="h-4.5 w-4.5 text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                Leave Details
              </p>
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Select leave type and dates
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Leave Type"
              htmlFor="leaveTypeId"
              error={errors.leaveTypeId?.message}
              required
              className="sm:col-span-2"
            >
              <Select
                onValueChange={(value: string | null) => {
                  if (value) setValue("leaveTypeId", value, { shouldValidate: true })
                }}
              >
                <SelectTrigger id="leaveTypeId" aria-invalid={!!errors.leaveTypeId}>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      <span className="font-medium">{lt.name}</span>
                      <span className="ml-2 text-neutral-500 text-xs">
                        ({lt.remainingDays} days remaining)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Leave type info */}
            {selectedLeaveType && (
              <div className="sm:col-span-2 rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">Entitlement: </span>
                    <span className="font-semibold text-neutral-900">
                      {selectedLeaveType.daysAllowed} days/year
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Remaining: </span>
                    <span
                      className={cn(
                        "font-semibold",
                        selectedLeaveType.remainingDays <= 3
                          ? "text-error"
                          : "text-success"
                      )}
                    >
                      {selectedLeaveType.remainingDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Type: </span>
                    <span className="font-semibold text-neutral-900">
                      {selectedLeaveType.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  {selectedLeaveType.requiresDocument && (
                    <div className="flex items-center gap-1 text-warning text-xs font-medium">
                      <FileText className="h-3.5 w-3.5" />
                      Supporting document required
                    </div>
                  )}
                </div>
              </div>
            )}

            <FormField
              label="Start Date"
              htmlFor="startDate"
              error={errors.startDate?.message}
              required
            >
              <Input
                id="startDate"
                type="date"
                min={today}
                aria-invalid={!!errors.startDate}
                {...register("startDate")}
              />
            </FormField>

            <FormField
              label="End Date"
              htmlFor="endDate"
              error={errors.endDate?.message}
              required
            >
              <Input
                id="endDate"
                type="date"
                min={watchStart || today}
                aria-invalid={!!errors.endDate}
                {...register("endDate")}
              />
            </FormField>

            {/* Working days preview */}
            {workingDays > 0 && (
              <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <Info className="h-4 w-4 text-primary-600 shrink-0" />
                <p className="text-sm text-neutral-700">
                  This request covers{" "}
                  <strong className="text-primary-700">
                    {workingDays} working day{workingDays !== 1 ? "s" : ""}
                  </strong>{" "}
                  (weekends excluded).
                  {selectedLeaveType &&
                    workingDays > selectedLeaveType.remainingDays && (
                      <span className="ml-1 text-warning font-medium">
                        ⚠️ This exceeds your remaining balance.
                      </span>
                    )}
                </p>
              </div>
            )}

            <FormField
              label="Reason"
              htmlFor="reason"
              error={errors.reason?.message}
              required
              className="sm:col-span-2"
            >
              <Textarea
                id="reason"
                placeholder="Briefly describe the reason for your leave request..."
                rows={4}
                aria-invalid={!!errors.reason}
                {...register("reason")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 text-white shadow-md shadow-primary-700/20 hover:from-primary-800 hover:to-primary-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Request
            </>
          )}
        </Button>
      </div>
    </form>
  )
}