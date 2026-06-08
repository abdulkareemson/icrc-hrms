// components/modules/dashboard/ReportsPageClient.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Users,
  Banknote,
  CalendarDays,
  Clock,
  MessageSquareWarning,
  UserPlus,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ReportsPageClientProps {
  userId: string;
  userEmail: string;
}

interface ReportDefinition {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  endpoint: string;
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
}

const CURRENT_YEAR = new Date().getFullYear();

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  value: String(CURRENT_YEAR - i),
  label: String(CURRENT_YEAR - i),
}));

const REPORTS: ReportDefinition[] = [
  {
    key: "employee-headcount",
    title: "Employee Headcount",
    description: "Breakdown by department, employment type, and grade level.",
    icon: Users,
    endpoint: "/api/reports/employee-headcount",
  },
  {
    key: "monthly-payroll",
    title: "Monthly Payroll Summary",
    description: "Gross, net, PAYE, pension, and NHF totals per month.",
    icon: Banknote,
    endpoint: "/api/reports/monthly-payroll",
    filters: [
      { key: "month", label: "Month", options: MONTH_OPTIONS },
      { key: "year", label: "Year", options: YEAR_OPTIONS },
    ],
  },
  {
    key: "leave-utilization",
    title: "Leave Utilization",
    description: "Usage by leave type, department, and employee.",
    icon: CalendarDays,
    endpoint: "/api/reports/leave-utilization",
    filters: [{ key: "year", label: "Year", options: YEAR_OPTIONS }],
  },
  {
    key: "attendance-summary",
    title: "Attendance Summary",
    description: "Punctuality and absence rates by department.",
    icon: Clock,
    endpoint: "/api/reports/attendance-summary",
    filters: [
      { key: "month", label: "Month", options: MONTH_OPTIONS },
      { key: "year", label: "Year", options: YEAR_OPTIONS },
    ],
  },
  {
    key: "complaint-report",
    title: "Complaint Report",
    description: "Complaints by category, status, and period.",
    icon: MessageSquareWarning,
    endpoint: "/api/reports/complaint-report",
    filters: [{ key: "year", label: "Year", options: YEAR_OPTIONS }],
  },
  {
    key: "recruitment-pipeline",
    title: "Recruitment Pipeline",
    description: "Application funnel by vacancy and conversion rates.",
    icon: UserPlus,
    endpoint: "/api/reports/recruitment-pipeline",
  },
  {
    key: "performance-summary",
    title: "Performance Summary",
    description: "Average scores and ratings by department.",
    icon: TrendingUp,
    endpoint: "/api/reports/performance-summary",
    filters: [{ key: "year", label: "Year", options: YEAR_OPTIONS }],
  },
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

export function ReportsPageClient({
  userId,
  userEmail,
}: ReportsPageClientProps) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<
    Record<string, Record<string, string>>
  >({});

  const handleFilterChange = (
    reportKey: string,
    filterKey: string,
    value: string,
  ) => {
    setFilterValues((prev) => ({
      ...prev,
      [reportKey]: { ...(prev[reportKey] ?? {}), [filterKey]: value },
    }));
  };

  const handleExport = async (report: ReportDefinition) => {
    setLoadingKey(report.key);
    try {
      const params = new URLSearchParams();
      const filters = filterValues[report.key];
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v) params.set(k, v);
        }
      }

      const url = `${report.endpoint}?${params.toString()}`;
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        const result = (await response.json()) as {
          success: boolean;
          error?: string;
        };
        toast.error("Export failed", { description: result.error });
        return;
      }

      const csv = await response.text();
      const timestamp = new Date().toISOString().split("T")[0];
      downloadCSV(csv, `${report.key}_${timestamp}.csv`);

      // Log export action — fire-and-forget
      void fetch("/api/reports/log-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          userEmail,
          reportKey: report.key,
          reportTitle: report.title,
        }),
      });

      toast.success("Report exported", {
        description: `${report.title} downloaded successfully.`,
      });
    } catch {
      toast.error("Export failed", {
        description: "Unable to reach the server. Please try again.",
      });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {REPORTS.map((report) => {
        const Icon = report.icon;
        const isLoading = loadingKey === report.key;

        return (
          <Card
            key={report.key}
            className="overflow-hidden border-neutral-200 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100/80">
                  <Icon className="h-4.5 w-4.5 text-primary-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {report.title}
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-neutral-500">
                    {report.description}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {/* Filters */}
              {report.filters && report.filters.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {report.filters.map((filter) => (
                    <Select
                      key={filter.key}
                      value={filterValues[report.key]?.[filter.key] ?? ""}
                      onValueChange={(value: string | null) => {
                        if (value) {
                          handleFilterChange(report.key, filter.key, value);
                        }
                      }}
                    >
                      <SelectTrigger
                        className="w-[130px]"
                        aria-label={filter.label}
                      >
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )}

              <Button
                type="button"
                onClick={() => void handleExport(report)}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-sm hover:from-primary-800 hover:to-primary-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
