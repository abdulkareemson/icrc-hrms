// components/modules/recruitment/ApplicationTable.tsx
"use client"

import { useCallback, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import { APPLICATION_STATUS_CONFIG } from "@/lib/validators/recruitment.schema"

export interface ApplicationRow {
  id: string
  applicationRef: string
  applicantName: string
  applicantEmail: string
  vacancyTitle: string
  department: string
  status: string
  createdAt: string
}

interface ApplicationTableProps {
  applications: ApplicationRow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  currentStatus?: string
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr))
}

export function ApplicationTable({
  applications,
  pagination,
  currentStatus = "",
}: ApplicationTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const query = params.toString()
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname)
      })
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                const timer = setTimeout(() => {
                  updateQuery({ search: e.target.value.trim() || null, page: "1" })
                }, 350)
                return () => clearTimeout(timer)
              }}
              placeholder="Search by name, email, reference..."
              className="pl-9"
              disabled={isPending}
            />
          </div>

          <Select
            value={currentStatus || "all"}
            onValueChange={(value: string | null) => {
              updateQuery({ status: value && value !== "all" ? value : null, page: "1" })
            }}
          >
            <SelectTrigger className="w-[200px]" aria-label="Status filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(APPLICATION_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Reference</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Applicant</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Position</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Applied</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <EmptyState title="No applications found" description="No applications match your current filters." />
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => {
                  const statusConfig = APPLICATION_STATUS_CONFIG[app.status as keyof typeof APPLICATION_STATUS_CONFIG]

                  return (
                    <TableRow key={app.id} className="hover:bg-primary-50/30">
                      <TableCell>
                        <span className="text-sm font-bold text-primary-700">{app.applicationRef}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{app.applicantName}</p>
                          <p className="text-xs text-neutral-500">{app.applicantEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{app.vacancyTitle}</p>
                          <p className="text-xs text-neutral-500">{app.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusConfig?.className ?? "bg-neutral-100 text-neutral-600")}>
                          {statusConfig?.label ?? app.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">{formatDate(app.createdAt)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/recruitment/applications/${app.id}`}
                          className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                        >
                          Review
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!pagination.hasPreviousPage} onClick={() => updateQuery({ page: "1" })}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!pagination.hasPreviousPage} onClick={() => updateQuery({ page: String(pagination.page - 1) })}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-3 text-sm font-medium text-neutral-700">{pagination.page} / {pagination.totalPages}</span>
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!pagination.hasNextPage} onClick={() => updateQuery({ page: String(pagination.page + 1) })}><ChevronRight className="h-4 w-4" /></Button>
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!pagination.hasNextPage} onClick={() => updateQuery({ page: String(pagination.totalPages) })}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}