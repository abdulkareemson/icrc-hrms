// app/(dashboard)/employees/[employeeId]/id-card/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Download, Printer } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

type PageParams = Promise<{ employeeId: string }>;

export default async function IDCardPage({ params }: { params: PageParams }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { employeeId } = await params;

  // Access control
  if (session.user.role === "EMPLOYEE") {
    if (session.user.employeeId !== employeeId) redirect("/profile");
  } else if (!hasPermission(session.user.role, "employees:read")) {
    redirect("/dashboard");
  }

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, deletedAt: null },
    select: {
      id: true,
      staffId: true,
      firstName: true,
      lastName: true,
      jobTitle: true,
      gender: true,
      employmentDate: true,
      department: { select: { name: true, code: true } },
      gradeLevel: { select: { level: true, step: true } },
    },
  });

  if (!employee) notFound();

  const gradeLevelLabel = `GL ${String(employee.gradeLevel.level).padStart(2, "0")} / Step ${employee.gradeLevel.step}`;
  const backHref =
    session.user.role === "EMPLOYEE" ? "/profile" : `/employees/${employeeId}`;

  const downloadUrl = `/api/employees/${employeeId}/id-card`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={backHref}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-medium text-primary-700">
              Employee Records
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
              Staff ID Card
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {employee.firstName} {employee.lastName} — {employee.staffId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary-700/20 hover:from-primary-800 hover:to-primary-700"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              window.open(downloadUrl, "_blank");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </a>
        </div>
      </div>

      {/* Preview card */}
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Front preview */}
        <div className="overflow-hidden rounded-2xl border-2 border-primary-200 bg-white shadow-lg">
          {/* Card header */}
          <div
            className="px-6 py-5"
            style={{ background: "linear-gradient(135deg, #14532d, #15803d)" }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-green-300">
              Infrastructure Concession Regulatory Commission
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              Official Staff Identification Card
            </p>
          </div>

          {/* Card body */}
          <div className="flex gap-5 p-6">
            {/* Photo placeholder */}
            <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-100 text-center">
              <div>
                <CreditCard className="mx-auto h-6 w-6 text-neutral-400" />
                <p className="mt-1 text-xs text-neutral-400">Photo</p>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-neutral-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-sm font-semibold text-primary-700">
                {employee.jobTitle}
              </p>
              <p className="text-sm text-neutral-600">
                {employee.department.name} ({employee.department.code})
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
                <span className="text-xs text-green-700 font-medium">
                  Staff ID:
                </span>
                <span className="text-sm font-bold text-green-900 font-mono">
                  {employee.staffId}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                  {gradeLevelLabel}
                </span>
                <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                  {employee.gender}
                </span>
              </div>
            </div>
          </div>

          {/* Card footer */}
          <div className="flex items-center justify-between bg-primary-700 px-6 py-2">
            <span className="text-xs text-white/80">www.icrc.gov.ng</span>
            <span className="text-xs text-white/80">
              Employed: {formatDate(employee.employmentDate)}
            </span>
          </div>
        </div>

        {/* Back preview */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-md">
          <div className="bg-primary-700 px-6 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white">
              ICRC Nigeria — Staff ID Card
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            {/* Contact info */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Organisation Contact
              </p>
              {[
                {
                  label: "Address",
                  value: "Plot 1270, Ayangba Street, Garki, Abuja",
                },
                { label: "Website", value: "www.icrc.gov.ng" },
                { label: "Email", value: "info@icrc.gov.ng" },
                { label: "Phone", value: "+234 (0) 9 291 5801" },
              ].map((item) => (
                <div key={item.label} className="flex gap-2 text-xs">
                  <span className="w-16 shrink-0 text-neutral-400">
                    {item.label}:
                  </span>
                  <span className="text-neutral-700">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Return instructions */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                ⚠ If Found, Return To:
              </p>
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                This card is the property of ICRC. If found, please return to
                the HR Department at the address above.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-2">
            <span className="text-xs text-neutral-400">
              Generated by ICRC HRMS
            </span>
            <span className="text-xs font-bold text-error">
              MISUSE OF THIS CARD IS AN OFFENCE
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-neutral-500">
          Click{" "}
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-700 hover:underline"
          >
            Download PDF
          </a>{" "}
          to get the print-ready version of this ID card.
        </p>
      </div>
    </div>
  );
}
