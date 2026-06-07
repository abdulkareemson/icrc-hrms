// components/forms/attendance/AttendanceOverrideForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  attendanceOverrideSchema,
  type AttendanceOverrideFormValues,
  ATTENDANCE_STATUS_OPTIONS,
} from "@/lib/validators/attendance.schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceOverrideFormProps {
  logId: string;
  employeeName: string;
  date: string;
  currentStatus: string;
  currentClockIn: string | null;
  currentClockOut: string | null;
}

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
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
  );
}

export function AttendanceOverrideForm({
  logId,
  employeeName,
  date,
  currentStatus,
  currentClockIn,
  currentClockOut,
}: AttendanceOverrideFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AttendanceOverrideFormValues>({
    resolver: zodResolver(attendanceOverrideSchema),
    defaultValues: {
      status: currentStatus as AttendanceOverrideFormValues["status"],
      clockInTime: currentClockIn ?? "",
      clockOutTime: currentClockOut ?? "",
      notes: "",
    },
  });

  const onSubmit = async (data: AttendanceOverrideFormValues) => {
    try {
      const response = await fetch(`/api/attendance/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
        details?: Record<string, string[]>;
      };

      if (!response.ok || !result.success) {
        if (result.details) {
          const firstError = Object.values(result.details).flat()[0];
          toast.error("Validation error", { description: firstError });
        } else {
          toast.error("Failed to update", { description: result.error });
        }
        return;
      }

      toast.success("Attendance record updated", {
        description: result.message,
      });
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              HR Override
            </p>
            <p className="text-xs text-neutral-600 mt-0.5">
              Editing attendance for <strong>{employeeName}</strong> on{" "}
              <strong>{date}</strong>. This action is logged in the audit trail.
            </p>
          </div>
        </div>
      </div>

      <FormField
        label="Status"
        htmlFor="status"
        error={errors.status?.message}
        required
      >
        <Select
          defaultValue={currentStatus}
          onValueChange={(value: string | null) => {
            if (value) {
              setValue(
                "status",
                value as AttendanceOverrideFormValues["status"],
                { shouldValidate: true, shouldDirty: true },
              );
            }
          }}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ATTENDANCE_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Clock In Time (WAT)"
          htmlFor="clockInTime"
          error={errors.clockInTime?.message}
        >
          <Input id="clockInTime" type="time" {...register("clockInTime")} />
        </FormField>

        <FormField
          label="Clock Out Time (WAT)"
          htmlFor="clockOutTime"
          error={errors.clockOutTime?.message}
        >
          <Input id="clockOutTime" type="time" {...register("clockOutTime")} />
        </FormField>
      </div>

      <FormField
        label="Notes"
        htmlFor="notes"
        error={errors.notes?.message}
        required
      >
        <Textarea
          id="notes"
          placeholder="Reason for override..."
          rows={3}
          {...register("notes")}
        />
      </FormField>

      <Button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className={cn(
          "w-full bg-gradient-to-r from-primary-700 to-primary-600",
          "text-white shadow-md hover:from-primary-800 hover:to-primary-700",
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Override
          </>
        )}
      </Button>
    </form>
  );
}
