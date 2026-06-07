// components/modules/employee/EmployeeDetailTabs.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Shield,
  UserCircle2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EmployeeDetailView } from "@/components/modules/employee/EmployeeProfileCard";

interface EmployeeDetailTabsProps {
  employee: EmployeeDetailView;
}

function formatDate(date?: string | null): string {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(date?: string | null): string {
  if (!date) return "Never";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatCurrency(amountInKobo: number): string {
  return `₦${(amountInKobo / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}`;
}

function maskAccountNumber(accountNumber?: string | null): string {
  if (!accountNumber) return "Not provided";
  if (accountNumber.length <= 4) return accountNumber;
  return `••••••${accountNumber.slice(-4)}`;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}

export function EmployeeDetailTabs({ employee }: EmployeeDetailTabsProps) {
  const tabs = useMemo(
    () => [
      { key: "overview", label: "Overview", icon: UserCircle2 },
      { key: "employment", label: "Employment", icon: Briefcase },
      { key: "banking", label: "Banking", icon: CreditCard },
      { key: "leave", label: "Leave", icon: BadgeCheck },
      { key: "team", label: "Team", icon: Users },
      { key: "account", label: "Account", icon: Shield },
    ],
    [],
  );

  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]["key"]>("overview");

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary-700 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCircle2 className="h-4.5 w-4.5 text-primary-700" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Gender" value={employee.gender} />
              <InfoItem
                label="Date of Birth"
                value={formatDate(employee.dateOfBirth)}
              />
              <InfoItem
                label="State of Origin"
                value={employee.stateOfOrigin}
              />
              <InfoItem label="LGA" value={employee.lga} />
              <InfoItem label="NIN" value={employee.nin || "Not provided"} />
              <InfoItem label="Address" value={employee.address} />
            </CardContent>
          </Card>

          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4.5 w-4.5 text-primary-700" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Work Email" value={employee.email} />
              <InfoItem
                label="Personal Email"
                value={employee.personalEmail || "Not provided"}
              />
              <InfoItem label="Phone Number" value={employee.phoneNumber} />
              <InfoItem label="Staff ID" value={employee.staffId} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "employment" && (
        <div className="space-y-5">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4.5 w-4.5 text-primary-700" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <InfoItem
                label="Department"
                value={`${employee.departmentCode} — ${employee.departmentName}`}
              />
              <InfoItem label="Job Title" value={employee.jobTitle} />
              <InfoItem
                label="Grade Level"
                value={`GL ${employee.gradeLevel} Step ${employee.gradeLevelStep}`}
              />
              <InfoItem
                label="Employment Type"
                value={employee.employmentType}
              />
              <InfoItem
                label="Employment Date"
                value={formatDate(employee.employmentDate)}
              />
              <InfoItem
                label="Confirmation Date"
                value={formatDate(employee.confirmationDate)}
              />
              <InfoItem
                label="Contract End Date"
                value={formatDate(employee.contractEndDate)}
              />
              <InfoItem
                label="Line Manager"
                value={employee.lineManager?.fullName ?? "Not assigned"}
              />
              <InfoItem
                label="Manager Status"
                value={employee.isManager ? "Yes" : "No"}
              />
            </CardContent>
          </Card>

          {employee.salary && (
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BadgeCheck className="h-4.5 w-4.5 text-primary-700" />
                  Salary Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoItem
                  label="Basic Salary"
                  value={formatCurrency(employee.salary.basicSalary)}
                />
                <InfoItem
                  label="Housing Allowance"
                  value={formatCurrency(employee.salary.housingAllowance)}
                />
                <InfoItem
                  label="Transport Allowance"
                  value={formatCurrency(employee.salary.transportAllowance)}
                />
                <InfoItem
                  label="Medical Allowance"
                  value={formatCurrency(employee.salary.medicalAllowance)}
                />
                <InfoItem
                  label="Leave Allowance"
                  value={formatCurrency(employee.salary.leaveAllowance)}
                />
                <InfoItem
                  label="Utility Allowance"
                  value={formatCurrency(employee.salary.utilityAllowance)}
                />
                <InfoItem
                  label="Gross Annual"
                  value={formatCurrency(employee.salary.grossAnnual)}
                />
                <InfoItem
                  label="Gross Monthly"
                  value={formatCurrency(employee.salary.grossMonthly)}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "banking" && (
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4.5 w-4.5 text-primary-700" />
              Bank Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InfoItem
              label="Bank Name"
              value={employee.bankName || "Not provided"}
            />
            <InfoItem
              label="Account Number"
              value={maskAccountNumber(employee.accountNumber)}
            />
            <InfoItem
              label="Sort Code"
              value={employee.bankSortCode || "Not provided"}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === "leave" && (
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4.5 w-4.5 text-primary-700" />
              Current Year Leave Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employee.leaveBalances.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                No leave balances found for the current year.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {employee.leaveBalances.map((balance) => {
                  const usedPercent =
                    balance.totalDays > 0
                      ? Math.min(
                          100,
                          (balance.usedDays / balance.totalDays) * 100,
                        )
                      : 0;

                  return (
                    <div
                      key={balance.leaveType}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-neutral-900">
                          {balance.leaveType}
                        </p>
                        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                          {balance.remainingDays} left
                        </span>
                      </div>

                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-700"
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm text-neutral-600">
                        <span>Total: {balance.totalDays}</span>
                        <span>Used: {balance.usedDays}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "team" && (
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4.5 w-4.5 text-primary-700" />
              Direct Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employee.directReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                This employee currently has no direct reports.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {employee.directReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/employees/${report.id}`}
                    className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-sm font-semibold text-white">
                        {report.fullName
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0] ?? "")
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="font-semibold text-neutral-900">
                          {report.fullName}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {report.staffId}
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {report.jobTitle}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "account" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4.5 w-4.5 text-primary-700" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Role" value={employee.role} />
              <InfoItem
                label="Account Status"
                value={employee.accountActive ? "Active" : "Inactive"}
              />
              <InfoItem label="Work Email" value={employee.email} />
              <InfoItem
                label="Last Login"
                value={formatDateTime(employee.lastLoginAt)}
              />
            </CardContent>
          </Card>

          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4.5 w-4.5 text-primary-700" />
                Record Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                label="Account Created"
                value={formatDate(employee.accountCreatedAt)}
              />
              <InfoItem
                label="Employee Record Created"
                value={formatDate(employee.createdAt)}
              />
              <InfoItem
                label="Last Updated"
                value={formatDate(employee.updatedAt)}
              />
              <InfoItem label="User ID" value={employee.userId} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
