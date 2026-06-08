// components/modules/performance/ReviewDetailClient.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { AppraisalForm } from "@/components/modules/performance/AppraisalForm";
import { RatingBadge } from "@/components/forms/performance/ReviewForm";
import { Building2, Briefcase, GraduationCap, Lock } from "lucide-react";
import { toast } from "sonner";
import type {
  PerformanceReview,
  Goal,
  Employee,
  User,
  Role,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type ReviewData = PerformanceReview & {
  employee: Pick<
    Employee,
    | "id"
    | "firstName"
    | "lastName"
    | "staffId"
    | "jobTitle"
    | "profilePhotoKey"
    | "lineManagerId"
    | "departmentId"
  > & {
    department: { name: string; code: string };
    gradeLevel: { level: number; step: number };
  };
  reviewer: Pick<
    Employee,
    "id" | "firstName" | "lastName" | "jobTitle" | "userId"
  >;
  hrFinalizedBy: Pick<User, "id" | "email"> | null;
  goals: Goal[];
};

interface Props {
  review: ReviewData;
  currentUserId: string;
  currentEmployeeId: string | undefined;
  currentUserRole: Role;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function ReviewDetailClient({
  review: initialReview,
  currentUserId,
  currentEmployeeId,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const [review, setReview] = useState<ReviewData>(initialReview);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshReview = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/performance/reviews/${review.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setReview(json.data as ReviewData);
      } else {
        toast.error("Failed to refresh review data");
      }
    } catch {
      toast.error("Failed to refresh review data");
    } finally {
      setIsRefreshing(false);
      router.refresh();
    }
  }, [review.id, router]);

  return (
    <div className="space-y-6">
      {/* Employee Info Card */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* UserAvatar uses imageUrl prop — profilePhotoKey is a storage key, not a URL */}
            {/* Pass null for imageUrl; initials fallback will be used */}
            <UserAvatar
              name={`${review.employee.firstName} ${review.employee.lastName}`}
              imageUrl={null}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-neutral-900">
                  {review.employee.firstName} {review.employee.lastName}
                </h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {review.employee.staffId}
                </Badge>
                {review.isFinalized && (
                  <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                    <Lock className="h-3 w-3" />
                    Finalized
                  </Badge>
                )}
                {review.hrFinalRating && (
                  <RatingBadge rating={review.hrFinalRating} />
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-neutral-400" />
                  {review.employee.jobTitle}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-neutral-400" />
                  {review.employee.department.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-neutral-400" />
                  GL {review.employee.gradeLevel.level} Step{" "}
                  {review.employee.gradeLevel.step}
                </span>
              </div>

              <p className="mt-2 text-xs text-neutral-500">
                Reviewer:{" "}
                <span className="font-medium">
                  {review.reviewer.firstName} {review.reviewer.lastName}
                </span>{" "}
                · {review.reviewer.jobTitle}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraisal Form */}
      {isRefreshing ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <AppraisalForm
          review={review}
          currentUserId={currentUserId}
          currentEmployeeId={currentEmployeeId}
          currentUserRole={
            currentUserRole as "SUPER_ADMIN" | "HR_ADMIN" | "EMPLOYEE"
          }
          onUpdate={refreshReview}
        />
      )}
    </div>
  );
}