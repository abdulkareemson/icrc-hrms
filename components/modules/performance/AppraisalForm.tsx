// components/modules/performance/AppraisalForm.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  Lock,
  User,
  Users,
  Building2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import {
  RatingBadge,
  ReviewForm,
} from "@/components/forms/performance/ReviewForm";
import { GoalTracker } from "@/components/modules/performance/GoalTracker";
import { cn } from "@/lib/utils";
import type {
  PerformanceReview,
  Goal,
  Employee,
  User as PrismaUser,
  PerformanceRating,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type ReviewWithRelations = PerformanceReview & {
  employee: Pick<
    Employee,
    | "id"
    | "firstName"
    | "lastName"
    | "staffId"
    | "jobTitle"
    | "profilePhotoKey"
    | "lineManagerId"
  > & {
    department: { name: string; code: string };
    gradeLevel: { level: number; step: number };
  };
  reviewer: Pick<
    Employee,
    "id" | "firstName" | "lastName" | "jobTitle" | "userId"
  >;
  hrFinalizedBy: Pick<PrismaUser, "id" | "email"> | null;
  goals: Goal[];
};

interface AppraisalFormProps {
  review: ReviewWithRelations;
  currentUserId: string;
  currentEmployeeId: string | undefined;
  currentUserRole: "SUPER_ADMIN" | "HR_ADMIN" | "EMPLOYEE";
  onUpdate: () => void;
}

// ─────────────────────────────────────────────────────────────
// STAGE STATUS INDICATOR
// ─────────────────────────────────────────────────────────────

function StageStatus({
  completed,
  locked,
}: {
  completed: boolean;
  locked: boolean;
}) {
  if (completed) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Submitted
      </span>
    );
  }
  if (locked) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-neutral-400">
        <Lock className="h-3.5 w-3.5" />
        Locked
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
      <Clock className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBMITTED REVIEW — read-only display
// ─────────────────────────────────────────────────────────────

function SubmittedReview({
  rating,
  comment,
  submittedAt,
  submittedByLabel,
}: {
  rating: PerformanceRating | null | undefined;
  comment: string | null | undefined;
  submittedAt: Date | null | undefined;
  submittedByLabel: string;
}) {
  if (!rating) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <RatingBadge rating={rating} />
        {submittedAt && (
          <span className="text-xs text-neutral-500">
            Submitted {formatDateTime(submittedAt)} by {submittedByLabel}
          </span>
        )}
      </div>
      {comment && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {comment}
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOCKED PLACEHOLDER
// ─────────────────────────────────────────────────────────────

function LockedState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
      <Lock className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function AppraisalForm({
  review: initialReview,
  currentUserId: _currentUserId,
  currentEmployeeId,
  currentUserRole,
  onUpdate,
}: AppraisalFormProps) {
  const [localGoals, setLocalGoals] = useState<Goal[]>(initialReview.goals);

  const review = initialReview;
  const isHR =
    currentUserRole === "HR_ADMIN" || currentUserRole === "SUPER_ADMIN";
  const isReviewee = review.employeeId === currentEmployeeId;
  const isReviewer = review.reviewerId === currentEmployeeId;
  const employeeIsOwnReviewer = review.reviewerId === review.employeeId;

  const selfDone = !!review.employeeSubmittedAt;
  const managerDone = !!review.managerSubmittedAt;

  const canSubmitSelf = !review.isFinalized && isReviewee && !selfDone;
  const canSubmitManager =
    !review.isFinalized &&
    isReviewer &&
    !isReviewee &&
    selfDone &&
    !managerDone;
  const canSubmitHR =
    !review.isFinalized &&
    isHR &&
    selfDone &&
    (employeeIsOwnReviewer || managerDone);

  const canEditGoals = review.isFinalized
    ? false
    : isHR || (isReviewee && !selfDone);

  return (
    <div className="space-y-6">
      {/* Finalized Banner */}
      {review.isFinalized && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <Lock className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Review Finalized &amp; Locked
            </p>
            {review.hrFinalizedAt && (
              <p className="text-xs text-green-700">
                Finalized on {formatDateTime(review.hrFinalizedAt)}
                {review.hrFinalizedBy
                  ? ` by ${review.hrFinalizedBy.email}`
                  : ""}
              </p>
            )}
          </div>
          {review.hrFinalRating && (
            <div className="ml-auto">
              <RatingBadge rating={review.hrFinalRating} />
            </div>
          )}
        </div>
      )}

      {/* Stage Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <User className="h-5 w-5 text-primary-600" />
              <span className="text-xs font-medium text-neutral-700">
                Self-Assessment
              </span>
              <StageStatus completed={selfDone} locked={false} />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Users className="h-5 w-5 text-amber-600" />
              <span className="text-xs font-medium text-neutral-700">
                Manager Review
              </span>
              <StageStatus
                completed={managerDone}
                locked={!selfDone || employeeIsOwnReviewer}
              />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Building2 className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium text-neutral-700">
                HR Final
              </span>
              <StageStatus
                completed={review.isFinalized}
                locked={
                  !selfDone ||
                  (!employeeIsOwnReviewer && !managerDone)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="goals">
        <TabsList className={cn("w-full sm:w-auto")}>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="self">Self-Assessment</TabsTrigger>
          {!employeeIsOwnReviewer && (
            <TabsTrigger value="manager">Manager Review</TabsTrigger>
          )}
          <TabsTrigger value="hr">HR Final</TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-4">
          <GoalTracker
            reviewId={review.id}
            goals={localGoals}
            canEdit={canEditGoals}
            onGoalsChange={setLocalGoals}
          />
        </TabsContent>

        {/* Self-Assessment Tab */}
        <TabsContent value="self" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary-600" />
                Employee Self-Assessment
                {selfDone && (
                  <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">
                    Submitted
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selfDone ? (
                <SubmittedReview
                  rating={review.employeeSelfRating}
                  comment={review.employeeSelfComment}
                  submittedAt={review.employeeSubmittedAt}
                  submittedByLabel={`${review.employee.firstName} ${review.employee.lastName}`}
                />
              ) : canSubmitSelf ? (
                <ReviewForm
                  reviewId={review.id}
                  stage="self"
                  onSuccess={onUpdate}
                />
              ) : (
                <LockedState message="Self-assessment has not been submitted yet." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manager Review Tab */}
        {!employeeIsOwnReviewer && (
          <TabsContent value="manager" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-amber-600" />
                  Manager Review
                  <span className="text-sm font-normal text-neutral-500">
                    — {review.reviewer.firstName} {review.reviewer.lastName}
                  </span>
                  {managerDone && (
                    <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">
                      Submitted
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {managerDone ? (
                  isHR || isReviewer || review.isFinalized ? (
                    <SubmittedReview
                      rating={review.managerRating}
                      comment={review.managerComment}
                      submittedAt={review.managerSubmittedAt}
                      submittedByLabel={`${review.reviewer.firstName} ${review.reviewer.lastName}`}
                    />
                  ) : (
                    <LockedState message="Manager review is visible after HR finalization." />
                  )
                ) : canSubmitManager ? (
                  <ReviewForm
                    reviewId={review.id}
                    stage="manager"
                    onSuccess={onUpdate}
                  />
                ) : (
                  <LockedState
                    message={
                      !selfDone
                        ? "Awaiting employee self-assessment"
                        : "Manager review pending"
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* HR Final Tab */}
        <TabsContent value="hr" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-green-600" />
                HR Final Assessment
                {review.isFinalized && (
                  <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">
                    Finalized
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {review.isFinalized ? (
                <SubmittedReview
                  rating={review.hrFinalRating}
                  comment={review.hrComment}
                  submittedAt={review.hrFinalizedAt}
                  submittedByLabel={
                    review.hrFinalizedBy?.email ?? "HR Administrator"
                  }
                />
              ) : canSubmitHR ? (
                <ReviewForm
                  reviewId={review.id}
                  stage="hr_final"
                  onSuccess={onUpdate}
                />
              ) : (
                <LockedState
                  message={
                    !selfDone
                      ? "Awaiting employee self-assessment"
                      : !employeeIsOwnReviewer && !managerDone
                        ? "Awaiting manager review"
                        : isHR
                          ? "Ready for finalization"
                          : "HR review pending"
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}