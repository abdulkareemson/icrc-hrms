// components/modules/employee/EmployeeTable.tsx
"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface EmployeeTableDepartmentOption {
  id: string;
  code: string;
  name: string;
}

export interface EmployeeTablePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface EmployeeTableRow {
  id: string;
  staffId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle: string;
  departmentName: string;
  departmentCode: string;
  gradeLevel: number;
  gradeLevelStep: number;
  employmentType: string;
  employmentDate: string;
  isActive: boolean;
  isManager: boolean;
  role: string;
  profilePhotoKey?: string | null;
}

interface EmployeeTableProps {
  employees: EmployeeTableRow[];
  departments: EmployeeTableDepartmentOption[];
  pagination: EmployeeTablePagination;
  currentSearch?: string;
  currentDepartmentId?: string;
  currentStatus?: string;
  currentSortBy?: string;
  currentSortOrder?: "asc" | "desc";
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatEmploymentType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function SortButton({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-neutral-900"
      aria-label={`Sort by ${label}`}
    >
      <span>{label}</span>
      {active ? (
        order === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 text-neutral-300" />
      )}
    </button>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        active
          ? "bg-success/10 text-success border border-success/15"
          : "bg-error/10 text-error border border-error/15",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RolePill({ isManager }: { isManager: boolean }) {
  if (!isManager) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-1 text-[11px] font-medium text-primary-700 border border-primary-100">
      <ShieldCheck className="h-3 w-3" />
      Manager
    </span>
  );
}

export function EmployeeTable({
  employees,
  departments,
  pagination,
  currentSearch = "",
  currentDepartmentId = "",
  currentStatus = "",
  currentSortBy = "createdAt",
  currentSortOrder = "desc",
}: EmployeeTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalizedSearch = search.trim();
      const normalizedCurrent = currentSearch.trim();

      if (normalizedSearch === normalizedCurrent) return;

      updateQuery({
        search: normalizedSearch || null,
        page: "1",
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, currentSearch, updateQuery]);

  const handleSort = (field: string) => {
    const nextOrder =
      currentSortBy === field && currentSortOrder === "asc" ? "desc" : "asc";

    updateQuery({
      sortBy: field,
      sortOrder: nextOrder,
      page: "1",
    });
  };

  const handlePageChange = (page: number) => {
    updateQuery({ page: String(page) });
  };

  const handlePageSizeChange = (value: string | null) => {
    if (!value) return;

    updateQuery({
      limit: value,
      page: "1",
    });
  };

  const handleDepartmentChange = (value: string | null) => {
    updateQuery({
      departmentId: value && value !== "all" ? value : null,
      page: "1",
    });
  };

  const handleStatusChange = (value: string | null) => {
    updateQuery({
      status: value && value !== "all" ? value : null,
      page: "1",
    });
  };

  const startIndex =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, staff ID, title, or email..."
              className="pl-9"
              aria-label="Search employees"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={currentDepartmentId || "all"}
              onValueChange={handleDepartmentChange}
            >
              <SelectTrigger
                className="w-full sm:w-[220px]"
                aria-label="Filter by department"
              >
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.code} — {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentStatus || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger
                className="w-full sm:w-[160px]"
                aria-label="Filter by status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(pagination.limit)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger
                className="w-full sm:w-[130px]"
                aria-label="Rows per page"
              >
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isPending && (
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-600" />
            Updating employee list...
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="min-w-[280px] text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  <SortButton
                    label="Employee"
                    active={currentSortBy === "firstName"}
                    order={currentSortOrder}
                    onClick={() => handleSort("firstName")}
                  />
                </TableHead>
                <TableHead className="min-w-[170px] text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Department
                </TableHead>
                <TableHead className="min-w-[180px] text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  <SortButton
                    label="Job Title"
                    active={currentSortBy === "jobTitle"}
                    order={currentSortOrder}
                    onClick={() => handleSort("jobTitle")}
                  />
                </TableHead>
                <TableHead className="min-w-[120px] text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Grade
                </TableHead>
                <TableHead className="min-w-[130px] text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Type
                </TableHead>
                <TableHead className="min-w-[140px] text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  <SortButton
                    label="Joined"
                    active={currentSortBy === "employmentDate"}
                    order={currentSortOrder}
                    onClick={() => handleSort("employmentDate")}
                  />
                </TableHead>
                <TableHead className="min-w-[130px] text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-56">
                    <EmptyState
                      title="No employees found"
                      description="Try adjusting your search, filters, or page size."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    onClick={() => router.push(`/employees/${employee.id}`)}
                    className="cursor-pointer transition-colors hover:bg-primary-50/40"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-sm font-semibold text-white shadow-sm">
                          {getInitials(employee.fullName)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-neutral-900">
                              {employee.fullName}
                            </p>
                            <RolePill isManager={employee.isManager} />
                          </div>
                          <p className="text-sm text-neutral-500">
                            {employee.staffId}
                          </p>
                          <p className="truncate text-sm text-neutral-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-neutral-800">
                          {employee.departmentCode}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {employee.departmentName}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Briefcase className="mt-0.5 h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-700">
                          {employee.jobTitle}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-100 inline-block">
                        GL {employee.gradeLevel} / Step{" "}
                        {employee.gradeLevelStep}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex rounded-full bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning border border-warning/15">
                        {formatEmploymentType(employee.employmentType)}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-neutral-600">
                      {formatDate(employee.employmentDate)}
                    </TableCell>

                    <TableCell>
                      <StatusPill active={employee.isActive} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <Users className="h-4 w-4" />
              <span>
                Showing {startIndex}–{endIndex} of {pagination.total} employees
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="First page"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(1)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Previous page"
                disabled={!pagination.hasPreviousPage}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="px-3 text-sm font-medium text-neutral-700">
                {pagination.page} / {pagination.totalPages}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Next page"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Last page"
                disabled={!pagination.hasNextPage}
                onClick={() => handlePageChange(pagination.totalPages)}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-500">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total records</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {pagination.total.toLocaleString("en-NG")}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-500">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm">Current page</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {pagination.page}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-500">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm">Page size</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">
            {pagination.limit}
          </p>
        </div>
      </div>
    </div>
  );
}
