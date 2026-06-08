// components/modules/dashboard/HRDashboard.tsx
"use client";

import { useState } from "react";
import { StatCard } from "@/components/shared/StatCard";
import { BarChartCard } from "@/components/charts/BarChart";
import { PieChartCard } from "@/components/charts/PieChart";
import { LineChartCard } from "@/components/charts/LineChart";
import { PendingActionsTable } from "@/components/modules/dashboard/PendingActionsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─────────────────────────────────────────────────────────────
// PROP TYPES — all plain serializable data from server
// ─────────────────────────────────────────────────────────────

interface StatCardData {
  label: string;
  value: number | string;
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "green" | "gold" | "blue" | "red";
  href?: string;
}

interface ChartDataItem {
  name: string;
  [key: string]: string | number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface PendingItem {
  id: string;
  type: "leave" | "complaint" | "application" | "performance";
  title: string;
  description: string;
  status: string;
  createdAt: string;
  href: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface HRDashboardProps {
  stats: StatCardData[];
  departmentDistribution: PieDataItem[];
  employmentTypeDistribution: PieDataItem[];
  monthlyAttendance: ChartDataItem[];
  leaveUtilization: ChartDataItem[];
  pendingActions: PendingItem[];
  departments: DepartmentOption[];
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function HRDashboard({
  stats,
  departmentDistribution,
  employmentTypeDistribution,
  monthlyAttendance,
  leaveUtilization,
  pendingActions,
  departments,
}: HRDashboardProps) {
  const [_selectedDept, setSelectedDept] = useState<string>("all");

  return (
    <div className="space-y-6">
      {/* Department filter */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Department:</span>
          <Select
            value="all"
            onValueChange={(value: string | null) => {
              if (value) setSelectedDept(value);
            }}
          >
            <SelectTrigger
              className="w-[200px]"
              aria-label="Filter by department"
            >
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            trendValue={stat.trendValue}
            color={stat.color}
            href={stat.href}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PieChartCard
          title="Employees by Department"
          description="Distribution across departments"
          data={departmentDistribution}
          innerRadius={50}
          outerRadius={100}
        />
        <PieChartCard
          title="Employment Type"
          description="Full-time, contract, and part-time breakdown"
          data={employmentTypeDistribution}
          innerRadius={50}
          outerRadius={100}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LineChartCard
          title="Monthly Attendance Trend"
          description="On-time vs late arrivals over the past 6 months"
          data={monthlyAttendance}
          series={[
            { dataKey: "onTime", label: "On Time", color: "#15803d" },
            { dataKey: "late", label: "Late", color: "#dc2626" },
            {
              dataKey: "absent",
              label: "Absent",
              color: "#6b7280",
              dashed: true,
            },
          ]}
        />
        <BarChartCard
          title="Leave Utilization by Type"
          description="Days used per leave type this year"
          data={leaveUtilization}
          series={[
            { dataKey: "used", label: "Used", color: "#15803d" },
            { dataKey: "remaining", label: "Remaining", color: "#e5e7eb" },
          ]}
        />
      </div>

      {/* Pending actions */}
      <PendingActionsTable items={pendingActions} />
    </div>
  );
}
