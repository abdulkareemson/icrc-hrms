// app/(dashboard)/performance/[reviewId]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ReviewDetailClient } from "@/components/modules/performance/ReviewDetailClient";

export const metadata = {
  title: "Performance Review — ICRC HRMS",
};

interface PageProps {
  params: Promise<{ reviewId: string }>;
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { reviewId } = await params;

  const review = await prisma.performanceReview.findUnique({
    where: { id: reviewId },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffId: true,
          jobTitle: true,
          profilePhotoKey: true,
          lineManagerId: true,
          departmentId: true,
          department: { select: { name: true, code: true } },
          gradeLevel: { select: { level: true, step: true } },
        },
      },
      reviewer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          userId: true,
        },
      },
      hrFinalizedBy: {
        select: { id: true, email: true },
      },
      goals: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!review) notFound();

  // Access check
  const empId = session.user.employeeId;
  const isReviewee = review.employeeId === empId;
  const isReviewer = review.reviewerId === empId;
  const isHRUser = isHR(session.user.role);

  if (!isHRUser && !isReviewee && !isReviewer) {
    redirect("/performance");
  }

  const employeeName = `${review.employee.firstName} ${review.employee.lastName}`;

  return (
    <div className="space-y-6">
      {/* Back link + title — no backHref on PageHeader */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/performance"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reviews
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Performance Review — {review.reviewPeriod} {review.reviewYear}
          </h1>
          <p className="text-sm text-neutral-500">
            {employeeName} · {review.employee.staffId}
          </p>
        </div>
      </div>

      <ReviewDetailClient
        review={review}
        currentUserId={session.user.id}
        currentEmployeeId={session.user.employeeId}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
