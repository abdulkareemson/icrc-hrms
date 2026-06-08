// components/forms/performance/GoalForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Target, Calendar, Weight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Goal, GoalStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────

const goalFormSchema = z.object({
  title: z
    .string()
    .min(3, "Goal title must be at least 3 characters")
    .max(150, "Goal title cannot exceed 150 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters")
    .trim(),
  targetDate: z
    .string()
    .min(1, "Target date is required")
    .refine((d) => !isNaN(Date.parse(d)), "Invalid target date"),
  weight: z.coerce
    .number()
    .int("Weight must be a whole number")
    .min(1, "Weight must be at least 1%")
    .max(100, "Weight cannot exceed 100%"),
  status: z
    .enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .default("NOT_STARTED"),
  completionNote: z.string().max(500).trim().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

// ─────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────

interface GoalFormProps {
  reviewId: string;
  existingGoal?: Goal;
  currentTotalWeight: number;
  onSuccess: (goal: Goal) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

// ─────────────────────────────────────────────────────────────
// FIELD WRAPPER — matches your EmployeeSelfEditForm pattern
// ─────────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  htmlFor,
  error,
  required = false,
  children,
  hint,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function GoalForm({
  reviewId,
  existingGoal,
  currentTotalWeight,
  onSuccess,
  onCancel,
}: GoalFormProps) {
  const isEditing = !!existingGoal;
  const ownWeight = existingGoal?.weight ?? 0;
  const availableWeight = 100 - currentTotalWeight + ownWeight;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: existingGoal?.title ?? "",
      description: existingGoal?.description ?? "",
      targetDate: existingGoal?.targetDate
        ? new Date(existingGoal.targetDate).toISOString().split("T")[0]
        : "",
      weight: existingGoal?.weight ?? 10,
      status:
        (existingGoal?.status as GoalFormValues["status"]) ?? "NOT_STARTED",
      completionNote: existingGoal?.completionNote ?? "",
    },
  });

  const watchedWeight = watch("weight");
  const watchedStatus = watch("status");
  const remainingAfter = availableWeight - (watchedWeight ?? 0);

  async function onSubmit(values: GoalFormValues) {
    const proposedTotal = currentTotalWeight - ownWeight + (values.weight ?? 0);
    if (proposedTotal > 100) {
      toast.error(
        `Total goal weight would be ${proposedTotal}%. Maximum is 100%.`,
      );
      return;
    }

    try {
      const url = isEditing
        ? `/api/performance/goals/${existingGoal.id}`
        : "/api/performance/goals";
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing ? values : { ...values, reviewId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Failed to save goal");
        return;
      }

      toast.success(
        isEditing ? "Goal updated successfully" : "Goal added successfully",
      );
      onSuccess(json.data as Goal);
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Title */}
      <FieldWrapper
        label="Goal Title"
        htmlFor="goal-title"
        error={errors.title?.message}
        required
      >
        <div className="relative">
          <Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="goal-title"
            placeholder="e.g. Complete Q2 staff training programme"
            className="pl-9"
            {...register("title")}
            disabled={isSubmitting}
            aria-label="Goal title"
          />
        </div>
      </FieldWrapper>

      {/* Description */}
      <FieldWrapper
        label="Description"
        htmlFor="goal-description"
        error={errors.description?.message}
        required
      >
        <Textarea
          id="goal-description"
          placeholder="Describe the goal, success criteria, and how it aligns with departmental objectives..."
          rows={4}
          {...register("description")}
          disabled={isSubmitting}
          aria-label="Goal description"
        />
      </FieldWrapper>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Target Date */}
        <FieldWrapper
          label="Target Date"
          htmlFor="goal-targetDate"
          error={errors.targetDate?.message}
          required
        >
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              id="goal-targetDate"
              type="date"
              className="pl-9"
              min={new Date().toISOString().split("T")[0]}
              {...register("targetDate")}
              disabled={isSubmitting}
              aria-label="Goal target date"
            />
          </div>
        </FieldWrapper>

        {/* Weight */}
        <FieldWrapper
          label="Weight (%)"
          htmlFor="goal-weight"
          error={errors.weight?.message}
          required
          hint={
            remainingAfter >= 0
              ? `${remainingAfter}% remaining after this goal`
              : `Over by ${Math.abs(remainingAfter)}%`
          }
        >
          <div className="relative">
            <Weight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              id="goal-weight"
              type="number"
              min={1}
              max={availableWeight}
              placeholder="e.g. 25"
              className={cn(
                "pl-9",
                remainingAfter < 0 &&
                  "border-red-500 focus-visible:ring-red-500",
              )}
              {...register("weight", { valueAsNumber: true })}
              disabled={isSubmitting}
              aria-label="Goal weight percentage"
            />
          </div>
        </FieldWrapper>
      </div>

      {/* Status — editing only */}
      {isEditing && (
        <FieldWrapper
          label="Status"
          htmlFor="goal-status"
          error={errors.status?.message}
        >
          <Select
            value={watchedStatus}
            onValueChange={(val) =>
              setValue("status", val as GoalFormValues["status"])
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="goal-status" aria-label="Goal status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrapper>
      )}

      {/* Completion Note — editing + COMPLETED */}
      {isEditing && watchedStatus === "COMPLETED" && (
        <FieldWrapper
          label="Completion Note"
          htmlFor="goal-completionNote"
          error={errors.completionNote?.message}
        >
          <Textarea
            id="goal-completionNote"
            placeholder="Describe how this goal was achieved..."
            rows={3}
            {...register("completionNote")}
            disabled={isSubmitting}
            aria-label="Completion note"
          />
        </FieldWrapper>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            "Update Goal"
          ) : (
            "Add Goal"
          )}
        </Button>
      </div>
    </form>
  );
}
