// components/modules/leave/LeaveCalendar.tsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LEAVE_STATUS_CONFIG } from "@/lib/validators/leave.schema";

interface LeaveDay {
  date: string;
  status: string;
  leaveType: string;
}

interface LeaveCalendarProps {
  leaveDays: LeaveDay[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function LeaveCalendar({ leaveDays }: LeaveCalendarProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const leaveMap = new Map<string, LeaveDay>();
  for (const day of leaveDays) {
    const dateKey = day.date.split("T")[0];
    if (dateKey) leaveMap.set(dateKey, day);
  }

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: Array<number | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goBack = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goForward = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goBack}
          className="h-8 w-8 p-0"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h3 className="text-sm font-semibold text-neutral-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goForward}
          className="h-8 w-8 p-0"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-neutral-100">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="h-12 border-b border-r border-neutral-100 bg-neutral-50/50"
              />
            );
          }

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const leaveDay = leaveMap.get(dateStr);
          const isToday =
            day === now.getDate() &&
            viewMonth === now.getMonth() &&
            viewYear === now.getFullYear();

          const statusConfig = leaveDay
            ? LEAVE_STATUS_CONFIG[
                leaveDay.status as keyof typeof LEAVE_STATUS_CONFIG
              ]
            : null;

          return (
            <div
              key={dateStr}
              className={cn(
                "relative h-12 border-b border-r border-neutral-100 p-1 flex flex-col items-center justify-center",
                leaveDay && "bg-primary-50",
              )}
              title={
                leaveDay
                  ? `${leaveDay.leaveType} — ${statusConfig?.label}`
                  : undefined
              }
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                  isToday && "bg-primary-700 font-bold text-white",
                  !isToday && leaveDay && "font-semibold text-primary-700",
                  !isToday && !leaveDay && "text-neutral-700",
                )}
              >
                {day}
              </span>
              {leaveDay && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
          <span className="h-3 w-3 rounded-full bg-primary-600 block" />
          Leave day
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-600">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[10px] text-white font-bold">
            {now.getDate()}
          </span>
          Today
        </div>
      </div>
    </div>
  );
}
