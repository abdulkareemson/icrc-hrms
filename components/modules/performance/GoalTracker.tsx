// components/modules/performance/GoalTracker.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Target,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { GoalForm } from "@/components/forms/performance/GoalForm";
import { cn } from "@/lib/utils";
import type { Goal, GoalStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface GoalTrackerProps {
  reviewId: string;
  goals: Goal[];
  canEdit: boolean;
  onGoalsChange: (goals: Goal[]) => void;
}

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────

const GOAL_STATUS_CONFIG: Record<
  GoalStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "bg-neutral-100 text-neutral-700",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: AlertCircle,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

// ─────────────────────────────────────────────────────────────
// WEIGHT INDICATOR
// ─────────────────────────────────────────────────────────────

function WeightIndicator({ totalWeight }: { totalWeight: number }) {
  const isValid = totalWeight === 100;
  const isOver = totalWeight > 100;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">Total Goal Weight</span>
        <span
          className={cn(
            "font-bold",
            isValid
              ? "text-green-600"
              : isOver
                ? "text-red-600"
                : "text-amber-600",
          )}
        >
          {totalWeight}%
        </span>
      </div>
      <Progress
        value={Math.min(totalWeight, 100)}
        className={cn(
          "h-2",
          isOver
            ? "[&>div]:bg-red-500"
            : isValid
              ? "[&>div]:bg-green-500"
              : "[&>div]:bg-amber-500",
        )}
      />
      {!isValid && (
        <p className="mt-1.5 text-xs text-neutral-500">
          {isOver
            ? `Over by ${totalWeight - 100}% — reduce goal weights`
            : `${100 - totalWeight}% remaining — must total 100% before submitting`}
        </p>
      )}
      {isValid && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Goals are balanced — ready for self-assessment
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DELETE CONFIRMATION DIALOG (inline — no alert-dialog dependency)
// ─────────────────────────────────────────────────────────────

function DeleteConfirmDialog({
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <h2
          id="delete-dialog-title"
          className="text-base font-semibold text-neutral-900"
        >
          Delete Goal?
        </h2>
        <p id="delete-dialog-desc" className="mt-2 text-sm text-neutral-600">
          This goal will be permanently removed. This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete Goal"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GOAL CARD
// ─────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  canEdit,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  canEdit: boolean;
  totalWeight: number;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}) {
  const statusConfig = GOAL_STATUS_CONFIG[goal.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-neutral-900">
              {goal.title}
            </h4>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                statusConfig.color,
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </span>
          </div>
          <p className="mb-3 line-clamp-2 text-sm text-neutral-600">
            {goal.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Target: {formatDate(goal.targetDate)}
            </span>
            <Badge
              variant="outline"
              className="border-primary-200 bg-primary-50 text-xs font-semibold text-primary-600"
            >
              {goal.weight}% weight
            </Badge>
          </div>
          {goal.completionNote && (
            <p className="mt-2 rounded bg-green-50 px-2 py-1 text-xs text-green-700">
              <strong>Completion note:</strong> {goal.completionNote}
            </p>
          )}
        </div>

        {canEdit && (
          <DropdownMenu>
            {/* 🔧 FIX: No asChild — base-ui Trigger renders as <button> natively.
                Style it directly to look like a ghost button. */}
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label="Goal actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(goal.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export function GoalTracker({
  reviewId,
  goals,
  canEdit,
  onGoalsChange,
}: GoalTrackerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalWeight = goals.reduce((sum, g) => sum + g.weight, 0);

  function handleGoalAdded(newGoal: Goal) {
    onGoalsChange([...goals, newGoal]);
    setIsAddOpen(false);
  }

  function handleGoalUpdated(updatedGoal: Goal) {
    onGoalsChange(
      goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)),
    );
    setEditingGoal(null);
  }

  async function handleDeleteConfirm() {
    if (!deletingGoalId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/performance/goals/${deletingGoalId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Failed to delete goal");
        return;
      }

      toast.success("Goal deleted successfully");
      onGoalsChange(goals.filter((g) => g.id !== deletingGoalId));
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setDeletingGoalId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-600" />
          <h3 className="text-base font-semibold text-neutral-900">
            Performance Goals
          </h3>
          <Badge variant="outline" className="text-xs">
            {goals.length} {goals.length === 1 ? "goal" : "goals"}
          </Badge>
        </div>
        {canEdit && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            {/* 🔧 FIX: No asChild — base-ui DialogTrigger renders as <button> natively.
                Style it directly. */}
            <DialogTrigger
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={totalWeight >= 100}
              title={
                totalWeight >= 100 ? "Total weight is already 100%" : "Add goal"
              }
              aria-label="Add goal"
            >
              <Plus className="h-4 w-4" />
              Add Goal
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Performance Goal</DialogTitle>
              </DialogHeader>
              <GoalForm
                reviewId={reviewId}
                currentTotalWeight={totalWeight}
                onSuccess={handleGoalAdded}
                onCancel={() => setIsAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Weight Indicator */}
      <WeightIndicator totalWeight={totalWeight} />

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-200 py-10 text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-500">
            No goals set yet
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {canEdit
              ? "Add goals to get started. Total weight must equal 100%."
              : "No goals have been set for this review period."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              canEdit={canEdit}
              totalWeight={totalWeight}
              onEdit={(g) => setEditingGoal(g)}
              onDelete={(id) => setDeletingGoalId(id)}
            />
          ))}
        </div>
      )}

      {/* Edit Goal Dialog */}
      <Dialog
        open={!!editingGoal}
        onOpenChange={(open: boolean) => {
          if (!open) setEditingGoal(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <GoalForm
              reviewId={reviewId}
              existingGoal={editingGoal}
              currentTotalWeight={totalWeight}
              onSuccess={handleGoalUpdated}
              onCancel={() => setEditingGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deletingGoalId}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingGoalId(null)}
      />
    </div>
  );
}
