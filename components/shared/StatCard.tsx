// components/charts/StatCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CalendarDays,
  Clock,
  MessageSquareWarning,
  UserPlus,
  TrendingUp as TrendIcon,
  Banknote,
  Megaphone,
  FolderOpen,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ICON MAP — maps string names to Lucide icons
// ─────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  CalendarDays,
  Clock,
  MessageSquareWarning,
  UserPlus,
  TrendingUp: TrendIcon,
  Banknote,
  Megaphone,
  FolderOpen,
  BarChart3,
  LayoutDashboard,
};

// ─────────────────────────────────────────────────────────────
// COLOR MAP
// ─────────────────────────────────────────────────────────────

const COLOR_MAP = {
  green: {
    bg: "bg-primary-50",
    icon: "text-primary-700",
    trend: "text-primary-600",
  },
  gold: {
    bg: "bg-accent-300/20",
    icon: "text-accent-700",
    trend: "text-accent-600",
  },
  blue: {
    bg: "bg-info-light",
    icon: "text-info",
    trend: "text-info",
  },
  red: {
    bg: "bg-error-light",
    icon: "text-error",
    trend: "text-error",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: keyof typeof COLOR_MAP;
  href?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = "green",
  href,
  className,
}: StatCardProps) {
  const IconComponent = ICON_MAP[icon] ?? LayoutDashboard;
  const colors = COLOR_MAP[color];

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const content = (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        href && "cursor-pointer",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-neutral-500">{label}</p>
            <p className="text-3xl font-bold text-neutral-900">{value}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1">
                <TrendIcon
                  className={cn(
                    "h-3.5 w-3.5",
                    trend === "up" && "text-success",
                    trend === "down" && "text-error",
                    trend === "neutral" && "text-neutral-400",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-success",
                    trend === "down" && "text-error",
                    trend === "neutral" && "text-neutral-400",
                  )}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              colors.bg,
            )}
          >
            <IconComponent
              className={cn("h-6 w-6", colors.icon)}
              aria-hidden="true"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}
