// components/modules/admin/AuditLogFilterPanel.tsx
"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, Loader2, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

interface AuditLogFilterPanelProps {
  entityTypes: string[];
  currentAction?: string;
  currentEntityType?: string;
  currentActorEmail?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}

const ACTION_OPTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "EXPORT", label: "Export" },
  { value: "VIEW_CONFIDENTIAL", label: "View Confidential" },
];

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AuditLogFilterPanel({
  entityTypes,
  currentAction = "",
  currentEntityType = "",
  currentActorEmail = "",
  currentDateFrom = "",
  currentDateTo = "",
}: AuditLogFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const [actorEmail, setActorEmail] = useState(currentActorEmail);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  const handleApply = () => {
    updateQuery({
      actorEmail: actorEmail.trim() || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      page: "1",
    });
  };

  const handleReset = () => {
    setActorEmail("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("format", "csv");
      params.delete("page");
      params.delete("limit");

      const response = await fetch(
        `/api/admin/audit-logs?${params.toString()}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        toast.error("Export failed");
        return;
      }

      const csv = await response.text();
      const timestamp = new Date().toISOString().split("T")[0];
      downloadCSV(csv, `audit_logs_${timestamp}.csv`);

      // Log this export
      void fetch("/api/reports/log-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reportKey: "audit-logs",
          reportTitle: "Audit Logs Export",
        }),
      });

      toast.success("Audit logs exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-neutral-500" />
        <h3 className="text-sm font-semibold text-neutral-900">Filters</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Action type */}
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">Action</Label>
          <Select
            value={currentAction || "all"}
            onValueChange={(value: string | null) => {
              updateQuery({
                action: value && value !== "all" ? value : null,
                page: "1",
              });
            }}
          >
            <SelectTrigger aria-label="Action type">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity type */}
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">Entity Type</Label>
          <Select
            value={currentEntityType || "all"}
            onValueChange={(value: string | null) => {
              updateQuery({
                entityType: value && value !== "all" ? value : null,
                page: "1",
              });
            }}
          >
            <SelectTrigger aria-label="Entity type">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actor email */}
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">Actor Email</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <Input
              value={actorEmail}
              onChange={(e) => setActorEmail(e.target.value)}
              placeholder="Search by email"
              className="pl-8"
            />
          </div>
        </div>

        {/* Date from */}
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">From Date</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        {/* Date to */}
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">To Date</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={isPending}
            className="bg-primary-700 text-white hover:bg-primary-800"
          >
            Apply Filters
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleExport()}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Export CSV
        </Button>
      </div>
    </div>
  );
}
