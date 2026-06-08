// app/api/performance/goals/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createGoalSchema } from "@/lib/validators/performance.schema";
import type { ApiResponse } from "@/types";

// ─────────────────────────────────────────────────────────────
// GET — Goals for a review
// ─────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const reviewId = req.nextUrl.searchParams.get("reviewId");
    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "reviewId query param required" },
        { status: 400 },
      );
    }

    const review = await prisma.performanceReview.findUnique({
      where: { id: reviewId },
      select: {
        employeeId: true,
        reviewerId: true,
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
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const goals = await prisma.goal.findMany({
      where: { reviewId },
      orderBy: { createdAt: "asc" },
    });

    const totalWeight = goals.reduce((sum, g) => sum + g.weight, 0);

    return NextResponse.json({
      success: true,
      data: { goals, totalWeight },
    });
  } catch (error) {
    console.error("[GET /api/performance/goals]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST — Create goal
// ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 422 },
      );
    }

    const { reviewId, title, description, targetDate, weight, status } =
      parsed.data;

    const review = await prisma.performanceReview.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        employeeId: true,
        isFinalized: true,
        employeeSubmittedAt: true,
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
        { success: false, error: "Cannot add goals to a finalized review" },
        { status: 409 },
      );
    }

    const empId = session.user.employeeId;
    const isReviewee = review.employeeId === empId;

    if (!isHR(session.user.role) && !isReviewee) {
      return NextResponse.json(
        { success: false, error: "Only the employee or HR can add goals" },
        { status: 403 },
      );
    }

    if (review.employeeSubmittedAt && !isHR(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot add goals after self-assessment is submitted",
        },
        { status: 409 },
      );
    }

    // Check weight ceiling
    const existingGoals = await prisma.goal.findMany({
      where: { reviewId },
      select: { weight: true },
    });
    const currentTotal = existingGoals.reduce((sum, g) => sum + g.weight, 0);

    if (currentTotal + weight > 100) {
      return NextResponse.json(
        {
          success: false,
          error: `Total goal weight cannot exceed 100%. Current total: ${currentTotal}%, attempting to add: ${weight}%`,
        },
        { status: 422 },
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    const goal = await prisma.goal.create({
      data: {
        reviewId,
        employeeId: review.employeeId,
        title,
        description,
        targetDate: new Date(targetDate),
        weight,
        status: status ?? "NOT_STARTED",
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "Goal",
      entityId: goal.id,
      description: `Added goal "${title}" (weight: ${weight}%) to review ${reviewId}`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, message: "Goal created successfully", data: goal },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/performance/goals]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
