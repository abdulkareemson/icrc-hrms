// components/shared/LoadingSpinner.tsx
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  fullPage?: boolean;
}

const SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const;

export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading...",
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullPage && "fixed inset-0 z-50 bg-white/80",
        className,
      )}
      role="status"
      aria-label={label}
    >
      <Loader2
        className={cn("animate-spin text-primary-700", SIZE_MAP[size])}
        aria-hidden="true"
      />
      {size !== "sm" && (
        <span className="text-sm text-neutral-500">{label}</span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );

  return spinner;
}
