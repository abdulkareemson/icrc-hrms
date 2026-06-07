// app/(dashboard)/complaints/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquareWarning } from "lucide-react";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ComplaintForm } from "@/components/forms/complaint/ComplaintForm";

export default async function NewComplaintPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "complaints:create")) {
    redirect("/complaints");
  }

  if (!session.user.employeeId) {
    redirect("/complaints");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary-700">Complaints</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
            Submit a Complaint
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Formally raise a grievance. You can choose to submit anonymously
            using the confidential option.
          </p>
        </div>

        <Link
          href="/complaints"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </Link>
      </div>

      <div className="rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50 to-green-50 px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">
              Your complaint will be reviewed by HR
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              A unique reference number will be assigned. You&apos;ll receive
              email notifications at every stage of the process.
            </p>
          </div>
        </div>
      </div>

      <ComplaintForm />
    </div>
  );
}
