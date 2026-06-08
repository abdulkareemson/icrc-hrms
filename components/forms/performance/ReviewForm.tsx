// components/forms/performance/ReviewForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2, AlertCircle, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PerformanceRating } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// RATING OPTIONS
// ─────────────────────────────────────────────────────────────

const RATING_OPTIONS: {
  value: PerformanceRating;
  label: string;
  description: string;
}[] = [
  {
    value: "OUTSTANDING",
    label: "Outstanding",
    description: "Consistently exceeds all expectations, exceptional results",
  },
  {
    value: "EXCEEDS_EXPECTATIONS",
    label: "Exceeds Expectations",
    description: "Regularly goes beyond what is required",
  },
  {
    value: "MEETS_EXPECTATIONS",
    label: "Meets Expectations",
    description: "Consistently meets all role requirements",
  },
  {
    value: "BELOW_EXPECTATIONS",
    label: "Below Expectations",
    description: "Partially meets requirements, improvement needed",
  },
  {
    value: "UNSATISFACTORY",
    label: "Unsatisfactory",
    description: "Does not meet minimum requirements",
  },
];

// ─────────────────────────────────────────────────────────────
// RATING BADGE — exported for use in AppraisalForm
// ─────────────────────────────────────────────────────────────

const RATING_STYLE: Record<PerformanceRating, string> = {
  OUTSTANDING: "bg-green-100 text-green-800 border-green-200",
  EXCEEDS_EXPECTATIONS: "bg-blue-100 text-blue-800 border-blue-200",
  MEETS_EXPECTATIONS: "bg-yellow-100 text-yellow-800 border-yellow-200",
  BELOW_EXPECTATIONS: "bg-orange-100 text-orange-800 border-orange-200",
  UNSATISFACTORY: "bg-red-100 text-red-800 border-red-200",
};

const RATING_LABEL: Record<PerformanceRating, string> = {
  OUTSTANDING: "Outstanding",
  EXCEEDS_EXPECTATIONS: "Exceeds Expectations",
  MEETS_EXPECTATIONS: "Meets Expectations",
  BELOW_EXPECTATIONS: "Below Expectations",
  UNSATISFACTORY: "Unsatisfactory",
};

export function RatingBadge({ rating }: { rating: PerformanceRating }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        RATING_STYLE[rating],
      )}
    >
      <Star className="h-3 w-3" />
      {RATING_LABEL[rating]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
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
// ALERT BOX
// ─────────────────────────────────────────────────────────────

function InfoAlert({
  variant,
  title,
  message,
}: {
  variant: "blue" | "amber" | "red";
  title: string;
  message: string;
}) {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  const titleStyles = {
    blue: "text-blue-800",
    amber: "text-amber-800",
    red: "text-red-800",
  };

  return (
    <div className={cn("rounded-lg border px-4 py-3", styles[variant])}>
      <div className="flex gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className={cn("text-sm font-semibold", titleStyles[variant])}>
            {title}
          </p>
          <p className="text-sm mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────

const ratingEnum = z.enum([
  "OUTSTANDING",
  "EXCEEDS_EXPECTATIONS",
  "MEETS_EXPECTATIONS",
  "BELOW_EXPECTATIONS",
  "UNSATISFACTORY",
]);

const selfSchema = z.object({
  employeeSelfRating: ratingEnum,
  employeeSelfComment: z
    .string()
    .min(10, "Please provide at least 10 characters")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

const managerSchema = z.object({
  managerRating: ratingEnum,
  managerComment: z
    .string()
    .min(10, "Please provide at least 10 characters")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

const hrSchema = z.object({
  hrFinalRating: ratingEnum,
  hrComment: z
    .string()
    .min(10, "Please provide at least 10 characters")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

type SelfValues = z.infer<typeof selfSchema>;
type ManagerValues = z.infer<typeof managerSchema>;
type HRValues = z.infer<typeof hrSchema>;

// ─────────────────────────────────────────────────────────────
// SELF ASSESSMENT FORM
// ─────────────────────────────────────────────────────────────

function SelfAssessmentForm({
  reviewId,
  onSuccess,
}: {
  reviewId: string;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SelfValues>({
    resolver: zodResolver(selfSchema),
    defaultValues: {
      employeeSelfRating: undefined,
      employeeSelfComment: "",
    },
  });

  const commentValue = watch("employeeSelfComment") ?? "";
  const ratingValue = watch("employeeSelfRating");

  async function onSubmit(values: SelfValues) {
    try {
      const res = await fetch(`/api/performance/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "self", ...values }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Failed to submit self-assessment");
        return;
      }
      toast.success("Self-assessment submitted successfully");
      onSuccess();
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <InfoAlert
        variant="blue"
        title="Self-Assessment"
        message="Rate your own performance honestly. Your manager and HR will also provide their assessments. Once submitted, this cannot be edited."
      />

      <FieldWrapper
        label="Your Performance Rating"
        htmlFor="self-rating"
        error={errors.employeeSelfRating?.message}
      >
        <Select
          value={ratingValue}
          onValueChange={(val) =>
            setValue("employeeSelfRating", val as PerformanceRating)
          }
          disabled={isSubmitting}
        >
          <SelectTrigger id="self-rating" aria-label="Self performance rating">
            <SelectValue placeholder="Select your rating..." />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-neutral-500">
                    {opt.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>

      <FieldWrapper
        label="Self-Assessment Comments"
        htmlFor="self-comment"
        error={errors.employeeSelfComment?.message}
        hint={`${commentValue.length}/2000 characters`}
      >
        <Textarea
          id="self-comment"
          placeholder="Describe your key achievements, challenges faced, and areas where you've grown this review period..."
          rows={6}
          {...register("employeeSelfComment")}
          disabled={isSubmitting}
          aria-label="Self-assessment comment"
        />
      </FieldWrapper>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Self-Assessment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// MANAGER REVIEW FORM
// ─────────────────────────────────────────────────────────────

function ManagerReviewForm({
  reviewId,
  onSuccess,
}: {
  reviewId: string;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManagerValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      managerRating: undefined,
      managerComment: "",
    },
  });

  const commentValue = watch("managerComment") ?? "";
  const ratingValue = watch("managerRating");

  async function onSubmit(values: ManagerValues) {
    try {
      const res = await fetch(`/api/performance/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "manager", ...values }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Failed to submit manager review");
        return;
      }
      toast.success("Manager review submitted successfully");
      onSuccess();
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <InfoAlert
        variant="amber"
        title="Manager Review"
        message="Provide an objective assessment of this employee's performance. Your review will be visible to HR and the employee after HR finalizes."
      />

      <FieldWrapper
        label="Performance Rating"
        htmlFor="manager-rating"
        error={errors.managerRating?.message}
      >
        <Select
          value={ratingValue}
          onValueChange={(val) =>
            setValue("managerRating", val as PerformanceRating)
          }
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="manager-rating"
            aria-label="Manager performance rating"
          >
            <SelectValue placeholder="Select rating..." />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-neutral-500">
                    {opt.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>

      <FieldWrapper
        label="Manager Review Comments"
        htmlFor="manager-comment"
        error={errors.managerComment?.message}
        hint={`${commentValue.length}/2000 characters`}
      >
        <Textarea
          id="manager-comment"
          placeholder="Evaluate the employee's performance, noting specific achievements, areas for improvement, and recommendations..."
          rows={6}
          {...register("managerComment")}
          disabled={isSubmitting}
          aria-label="Manager review comment"
        />
      </FieldWrapper>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-primary-600 hover:bg-primary-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Manager Review
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// HR FINAL FORM
// ─────────────────────────────────────────────────────────────

function HRFinalForm({
  reviewId,
  onSuccess,
}: {
  reviewId: string;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HRValues>({
    resolver: zodResolver(hrSchema),
    defaultValues: {
      hrFinalRating: undefined,
      hrComment: "",
    },
  });

  const commentValue = watch("hrComment") ?? "";
  const ratingValue = watch("hrFinalRating");

  async function onSubmit(values: HRValues) {
    try {
      const res = await fetch(`/api/performance/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "hr_final", ...values }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Failed to finalize review");
        return;
      }
      toast.success("Review finalized and locked successfully");
      onSuccess();
    } catch {
      toast.error("An unexpected error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <InfoAlert
        variant="red"
        title="Final HR Review — Irreversible"
        message="Submitting this will permanently finalize and lock the entire review. No further changes can be made by anyone after finalization."
      />

      <FieldWrapper
        label="Final Performance Rating"
        htmlFor="hr-rating"
        error={errors.hrFinalRating?.message}
      >
        <Select
          value={ratingValue}
          onValueChange={(val) =>
            setValue("hrFinalRating", val as PerformanceRating)
          }
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="hr-rating"
            aria-label="HR final performance rating"
          >
            <SelectValue placeholder="Select final rating..." />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-neutral-500">
                    {opt.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>

      <FieldWrapper
        label="HR Final Comments"
        htmlFor="hr-comment"
        error={errors.hrComment?.message}
        hint={`${commentValue.length}/2000 characters`}
      >
        <Textarea
          id="hr-comment"
          placeholder="Provide the official HR assessment, noting overall performance, development recommendations, and any HR actions..."
          rows={6}
          {...register("hrComment")}
          disabled={isSubmitting}
          aria-label="HR final comment"
        />
      </FieldWrapper>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finalizing...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Finalize &amp; Lock Review
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT — Stage Router
// ─────────────────────────────────────────────────────────────

type StageType = "self" | "manager" | "hr_final";

interface ReviewFormProps {
  reviewId: string;
  stage: StageType;
  onSuccess: () => void;
}

export function ReviewForm({ reviewId, stage, onSuccess }: ReviewFormProps) {
  if (stage === "self") {
    return <SelfAssessmentForm reviewId={reviewId} onSuccess={onSuccess} />;
  }
  if (stage === "manager") {
    return <ManagerReviewForm reviewId={reviewId} onSuccess={onSuccess} />;
  }
  if (stage === "hr_final") {
    return <HRFinalForm reviewId={reviewId} onSuccess={onSuccess} />;
  }
  return null;
}
