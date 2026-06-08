// components/modules/payroll/PayrollStatusActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface PayrollStatusActionsProps {
  recordId: string;
  currentStatus: string;
  employeeName: string;
  payPeriod: string;
}

interface TransitionConfig {
  next: string;
  label: string;
  description: string;
  variant: "primary" | "success";
}

// ─────────────────────────────────────────────────────────────
// STATUS TRANSITIONS
// ─────────────────────────────────────────────────────────────

const TRANSITIONS: Record<string, TransitionConfig> = {
  DRAFT: {
    next: "PROCESSED",
    label: "Mark as Processed",
    description: "Confirm payroll calculations are correct",
    variant: "primary",
  },
  PROCESSED: {
    next: "PAID",
    label: "Mark as Paid",
    description:
      "Confirm salary has been disbursed — this will send a payslip email",
    variant: "success",
  },
};

// ─────────────────────────────────────────────────────────────
// HELPER — get transition or null
// ─────────────────────────────────────────────────────────────

function getTransition(status: string): TransitionConfig | null {
  return TRANSITIONS[status] ?? null;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function PayrollStatusActions({
  recordId,
  currentStatus,
  employeeName,
  payPeriod,
}: PayrollStatusActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const transition = getTransition(currentStatus);
  if (!transition) return null;

  // Capture into const so TS narrows it as non-null
  const nextStatus = transition.next;
  const transitionLabel = transition.label;
  const transitionDescription = transition.description;
  const transitionVariant = transition.variant;

  async function handleUpdate() {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/payroll/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error("Failed to update status", { description: json.error });
        return;
      }

      toast.success(`Payroll ${nextStatus.toLowerCase()} successfully`);
      router.refresh();
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsUpdating(false);
      setIsConfirming(false);
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
      <CardContent className="py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {isConfirming
                  ? `Confirm: ${transitionLabel}?`
                  : `Status: ${currentStatus}`}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {isConfirming
                  ? `${transitionDescription} for ${employeeName} (${payPeriod})`
                  : transitionDescription}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isConfirming && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirming(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={isUpdating}
              className={cn(
                "text-white",
                transitionVariant === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-primary-600 hover:bg-primary-700",
              )}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Updating...
                </>
              ) : isConfirming ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Yes, {transitionLabel}
                </>
              ) : (
                <>
                  <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                  {transitionLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}