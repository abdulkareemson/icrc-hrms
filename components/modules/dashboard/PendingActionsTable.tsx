// components/modules/dashboard/PendingActionsTable.tsx
"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatRelativeTime } from "@/lib/utils";
import {
  CalendarDays,
  MessageSquareWarning,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import type {
  LeaveStatus,
  ComplaintStatus,
  ApplicationStatus,
} from "@prisma/client";

interface PendingItem {
  id: string;
  type: "leave" | "complaint" | "application" | "performance";
  title: string;
  description: string;
  status: string;
  createdAt: string;
  href: string;
}

interface PendingActionsTableProps {
  items: PendingItem[];
}

const TYPE_META: Record<
  PendingItem["type"],
  { icon: React.ElementType; label: string; badgeType: string }
> = {
  leave: { icon: CalendarDays, label: "Leave", badgeType: "leave" },
  complaint: {
    icon: MessageSquareWarning,
    label: "Complaint",
    badgeType: "complaint",
  },
  application: {
    icon: UserPlus,
    label: "Application",
    badgeType: "application",
  },
  performance: {
    icon: TrendingUp,
    label: "Performance",
    badgeType: "performance",
  },
};

function renderStatusBadge(type: PendingItem["type"], status: string) {
  switch (type) {
    case "leave":
      return (
        <StatusBadge status={{ type: "leave", value: status as LeaveStatus }} />
      );
    case "complaint":
      return (
        <StatusBadge
          status={{ type: "complaint", value: status as ComplaintStatus }}
        />
      );
    case "application":
      return (
        <StatusBadge
          status={{
            type: "application",
            value: status as ApplicationStatus,
          }}
        />
      );
    case "performance":
      return (
        <StatusBadge
          status={{
            type: "custom",
            variant: "warning",
            label: "Pending Review",
          }}
        />
      );
    default:
      return (
        <StatusBadge
          status={{ type: "custom", variant: "neutral", label: status }}
        />
      );
  }
}

export function PendingActionsTable({ items }: PendingActionsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <EmptyState
          title="All caught up!"
          description="There are no pending actions requiring your attention."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white px-5 py-3.5">
        <h3 className="text-sm font-semibold text-neutral-900">
          Pending Actions
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Items requiring HR attention
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 hover:bg-neutral-50">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Type
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600 min-w-[200px]">
                Details
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Submitted
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;
              return (
                <TableRow
                  key={`${item.type}-${item.id}`}
                  className="transition-colors hover:bg-primary-50/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
                        <Icon className="h-3.5 w-3.5 text-primary-600" />
                      </div>
                      <span className="text-xs font-medium text-neutral-600">
                        {meta.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(item.type, item.status)}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {formatRelativeTime(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={item.href}
                      className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-primary-700"
                    >
                      Review
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
