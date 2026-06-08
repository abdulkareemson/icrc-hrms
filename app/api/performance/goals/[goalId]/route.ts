// app/api/performance/goals/[goalId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { updateGoalSchema } from "@/lib/validators/performance.schema";
import type { ApiResponse } from "@/types";

// ─────────────────────────────────────────────────────────────
// PUT — Update goal
// ─────────────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { goalId } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        review: {
          select: {
            isFinalized: true,
            employeeSubmittedAt: true,
            employeeId: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404 },
      );
    }

    if (goal.review.isFinalized) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot modify goals in a finalized review",
        },
        { status: 409 },
      );
    }

    const empId = session.user.employeeId;
    const isOwner = goal.employeeId === empId;

    if (!isHR(session.user.role) && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (
      goal.review.employeeSubmittedAt &&
      !isHR(session.user.role) &&
      isOwner
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot edit goals after self-assessment has been submitted",
        },
        { status: 409 },
      );
    }

    const body = await req.json();
    const parsed = updateGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 422 },
      );
    }

    // Validate weight ceiling
    if (parsed.data.weight !== undefined) {
      const otherGoals = await prisma.goal.findMany({
        where: { reviewId: goal.reviewId, id: { not: goalId } },
        select: { weight: true },
      });
      const otherTotal = otherGoals.reduce((sum, g) => sum + g.weight, 0);

      if (otherTotal + parsed.data.weight > 100) {
        return NextResponse.json(
          {
            success: false,
            error: `Total goal weight cannot exceed 100%. Other goals total: ${otherTotal}%`,
          },
          { status: 422 },
        );
      }
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.targetDate) {
      updateData.targetDate = new Date(parsed.data.targetDate);
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "Goal",
      entityId: goalId,
      description: `Updated goal "${updated.title}"`,
      metadata: parsed.data as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Goal updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("[PUT /api/performance/goals/[goalId]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — Remove goal
// ─────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ goalId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { goalId } = await params;
    const { ipAddress, userAgent } = getRequestMeta(req);

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        review: {
          select: {
            isFinalized: true,
            employeeSubmittedAt: true,
            employeeId: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404 },
      );
    }

    if (goal.review.isFinalized) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete goals from a finalized review",
        },
        { status: 409 },
      );
    }

    if (goal.review.employeeSubmittedAt && !isHR(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete goals after self-assessment is submitted",
        },
        { status: 409 },
      );
    }

    const empId = session.user.employeeId;
    const isOwner = goal.employeeId === empId;

    if (!isHR(session.user.role) && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const title = goal.title;
    await prisma.goal.delete({ where: { id: goalId } });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DELETE",
      entityType: "Goal",
      entityId: goalId,
      description: `Deleted goal "${title}" from review ${goal.reviewId}`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/performance/goals/[goalId]]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
