// app/(dashboard)/employees/[employeeId]/id-card/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={backHref}
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-500 shadow-sm border border-neutral-100 transition-all hover:bg-neutral-50 hover:text-neutral-700 hover:shadow-md cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-medium text-primary-600">
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

        <div className="flex items-center gap-3">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-700/20 hover:bg-primary-800 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Front preview */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-neutral-100">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 px-6 py-6">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm overflow-hidden">
                <Image
                  src="/icrc-logo.png"
                  alt="ICRC"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary-100">
                  Infrastructure Concession
                </p>
                <p className="text-xs font-medium uppercase tracking-wider text-primary-100">
                  Regulatory Commission
                </p>
              </div>
            </div>
            <p className="relative mt-4 text-lg font-bold text-white">
              Official Staff Identification Card
            </p>
          </div>

          <div className="flex gap-6 p-6">
            <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50">
              <div className="text-center">
                <CreditCard className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-2 text-xs font-medium text-neutral-400">
                  Photo
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <h2 className="text-2xl font-bold text-neutral-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-base font-semibold text-primary-600">
                {employee.jobTitle}
              </p>
              <p className="text-sm text-neutral-500">
                {employee.department.name} ({employee.department.code})
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-50 border border-primary-100 px-4 py-2">
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                  Staff ID:
                </span>
                <span className="text-sm font-bold text-primary-800 font-mono tracking-wider">
                  {employee.staffId}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex rounded-lg bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {gradeLevelLabel}
                </span>
                <span className="inline-flex rounded-lg bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {employee.gender}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-primary-700/5 px-6 py-3 border-t border-primary-100">
            <span className="text-xs font-medium text-primary-700">
              www.icrc.gov.ng
            </span>
            <span className="text-xs font-medium text-primary-700">
              Issued: {formatDate(employee.employmentDate)}
            </span>
          </div>
        </div>

        {/* Back preview */}
        <div className="overflow-hidden rounded-3xl bg-neutral-50 shadow-xl ring-1 ring-neutral-100">
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white">
              ICRC Nigeria — Staff ID Card
            </p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
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
                <div key={item.label} className="flex gap-3 text-sm">
                  <span className="w-16 shrink-0 text-neutral-400 text-xs uppercase font-medium">
                    {item.label}
                  </span>
                  <span className="text-neutral-700 font-medium">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">
                ⚠ If Found, Please Return To:
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                The HR Department
                <br />
                Infrastructure Concession Regulatory Commission
                <br />
                Plot 1270, Ayangba Street, Garki, Abuja
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3 bg-white">
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
            className="font-semibold text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-2"
          >
            Download PDF
          </a>{" "}
          to get the print-ready version.
        </p>
      </div>
    </div>
  );
}
