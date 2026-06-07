// components/forms/leave/LeaveApprovalForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  leaveApprovalSchema,
  type LeaveApprovalFormValues,
} from "@/lib/validators/leave.schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaveApprovalFormProps {
  requestId: string;
  employeeName: string;
  leaveType: string;
  totalDays: number;
  onSuccess?: () => void;
}

export function LeaveApprovalForm({
  requestId,
  employeeName,
  leaveType,
  totalDays,
  onSuccess,
}: LeaveApprovalFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeaveApprovalFormValues>({
    resolver: zodResolver(leaveApprovalSchema),
    defaultValues: {
      action: "approve",
      comment: "",
    },
  });

  const watchAction = watch("action");

  const onSubmit = async (data: LeaveApprovalFormValues) => {
    try {
      const response = await fetch(`/api/leave/requests/${requestId}/approve`, {
        method: "POST",
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
          toast.error("Failed to process request", {
            description: result.error,
          });
        }
        return;
      }

      toast.success(
        data.action === "approve"
          ? "Leave request approved"
          : "Leave request rejected",
        { description: result.message },
      );

      onSuccess?.();
      router.refresh();
    } catch {
      toast.error("Connection error", {
        description: "Unable to reach the server. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        <p>
          <strong className="text-neutral-900">{employeeName}</strong> has
          requested{" "}
          <strong className="text-neutral-900">
            {totalDays} day{totalDays !== 1 ? "s" : ""}
          </strong>{" "}
          of <strong className="text-neutral-900">{leaveType}</strong>.
        </p>
      </div>

      {/* Action selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setValue("action", "approve")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
            watchAction === "approve"
              ? "border-success bg-success/10 text-success"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-success/50",
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </button>

        <button
          type="button"
          onClick={() => setValue("action", "reject")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
            watchAction === "reject"
              ? "border-error bg-error/10 text-error"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-error/50",
          )}
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </div>

      {errors.action && (
        <p className="text-xs text-error" role="alert">
          {errors.action.message}
        </p>
      )}

      {/* Comment */}
      <div className="space-y-1.5">
        <Label
          htmlFor="comment"
          className="text-sm font-medium text-neutral-700"
        >
          Comment
          {watchAction === "reject" && (
            <span className="text-error ml-0.5">*</span>
          )}
          {watchAction === "approve" && (
            <span className="text-neutral-400 ml-1 text-xs">(optional)</span>
          )}
        </Label>
        <Textarea
          id="comment"
          placeholder={
            watchAction === "reject"
              ? "Provide a reason for rejection..."
              : "Add an optional comment..."
          }
          rows={3}
          aria-invalid={!!errors.comment}
          {...register("comment")}
        />
        {errors.comment && (
          <p className="text-xs text-error" role="alert">
            {errors.comment.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full font-semibold",
          watchAction === "approve"
            ? "bg-success hover:bg-success/90 text-white"
            : "bg-error hover:bg-error/90 text-white",
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : watchAction === "approve" ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Approval
          </>
        ) : (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Confirm Rejection
          </>
        )}
      </Button>
    </form>
  );
}
