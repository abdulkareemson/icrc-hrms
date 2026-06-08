// app/api/performance/reviews/[reviewId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission, isHR } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  selfAssessmentSchema,
  managerReviewSchema,
  hrFinalReviewSchema,
} from "@/lib/validators/performance.schema";
import type { ApiResponse } from "@/types";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type ReviewStage = "self" | "manager" | "hr_final";

interface StageBody {
  stage: ReviewStage;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────
// GET — Single review detail
// ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

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
            departmentId: true,
            lineManagerId: true,
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

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    const empId = session.user.employeeId;
    const isReviewee = review.employeeId === empId;
    const isReviewer = review.reviewerId === empId;

    if (!isHR(session.user.role) && !isReviewee && !isReviewer) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You do not have access to this review",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("[GET /api/performance/reviews/[reviewId]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT — Submit stage (self / manager / hr_final)
// ─────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { reviewId } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const review = await prisma.performanceReview.findUnique({
      where: { id: reviewId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userId: true,
            lineManagerId: true,
          },
        },
        goals: { select: { id: true } },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    if (review.isFinalized) {
      return NextResponse.json(
        {
          success: false,
          error: "This review has been finalized and is read-only",
        },
        { status: 409 },
      );
    }

    const body: StageBody = await req.json();
    const { stage } = body;

    if (!stage || !["self", "manager", "hr_final"].includes(stage)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid stage. Must be: self | manager | hr_final",
        },
        { status: 422 },
      );
    }

    const empId = session.user.employeeId;

    // ── STAGE: self ──
    if (stage === "self") {
      if (review.employeeId !== empId && !isHR(session.user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: "Only the employee can submit their self-assessment",
          },
          { status: 403 },
        );
      }

      if (review.employeeSubmittedAt) {
        return NextResponse.json(
          { success: false, error: "Self-assessment already submitted" },
          { status: 409 },
        );
      }

      if (review.goals.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot submit self-assessment without setting any goals first",
          },
          { status: 422 },
        );
      }

      const parsed = selfAssessmentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.errors[0]?.message ?? "Validation failed",
          },
          { status: 422 },
        );
      }

      const updated = await prisma.performanceReview.update({
        where: { id: reviewId },
        data: {
          employeeSelfRating: parsed.data.employeeSelfRating,
          employeeSelfComment: parsed.data.employeeSelfComment,
          employeeSubmittedAt: new Date(),
        },
      });

      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "UPDATE",
        entityType: "PerformanceReview",
        entityId: reviewId,
        description: `Employee submitted self-assessment (${parsed.data.employeeSelfRating})`,
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "Self-assessment submitted successfully",
        data: updated,
      });
    }

    // ── STAGE: manager ──
    if (stage === "manager") {
      const isReviewer = review.reviewerId === empId;
      if (!isReviewer && !isHR(session.user.role)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only the assigned reviewer can submit the manager review",
          },
          { status: 403 },
        );
      }

      if (!review.employeeSubmittedAt) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Employee must complete self-assessment before manager review",
          },
          { status: 422 },
        );
      }

      if (review.managerSubmittedAt) {
        return NextResponse.json(
          { success: false, error: "Manager review already submitted" },
          { status: 409 },
        );
      }

      const parsed = managerReviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.errors[0]?.message ?? "Validation failed",
          },
          { status: 422 },
        );
      }

      const updated = await prisma.performanceReview.update({
        where: { id: reviewId },
        data: {
          managerRating: parsed.data.managerRating,
          managerComment: parsed.data.managerComment,
          managerSubmittedAt: new Date(),
        },
      });

      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "UPDATE",
        entityType: "PerformanceReview",
        entityId: reviewId,
        description: `Manager submitted review (${parsed.data.managerRating})`,
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "Manager review submitted successfully",
        data: updated,
      });
    }

    // ── STAGE: hr_final ──
    if (stage === "hr_final") {
      if (!hasPermission(session.user.role, "performance:manage")) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: HR role required to finalize",
          },
          { status: 403 },
        );
      }

      const employeeIsOwnReviewer =
        review.reviewerId === review.employeeId;

      if (!employeeIsOwnReviewer && !review.managerSubmittedAt) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Manager must complete their review before HR can finalize",
          },
          { status: 422 },
        );
      }

      if (!review.employeeSubmittedAt) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Employee must complete self-assessment before HR can finalize",
          },
          { status: 422 },
        );
      }

      const parsed = hrFinalReviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.errors[0]?.message ?? "Validation failed",
          },
          { status: 422 },
        );
      }

      const updated = await prisma.performanceReview.update({
        where: { id: reviewId },
        data: {
          hrFinalRating: parsed.data.hrFinalRating,
          hrComment: parsed.data.hrComment,
          hrFinalizedAt: new Date(),
          hrFinalizedById: session.user.id,
          isFinalized: true,
        },
      });

      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "UPDATE",
        entityType: "PerformanceReview",
        entityId: reviewId,
        description: `HR finalized performance review (${parsed.data.hrFinalRating}) — review locked`,
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: "Review finalized successfully. It is now read-only.",
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid stage" },
      { status: 422 },
    );
  } catch (error) {
    console.error("[PUT /api/performance/reviews/[reviewId]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}