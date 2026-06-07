// app/api/grade-levels/[gradeLevelId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const updateGradeLevelSchema = z.object({
  basicSalary: z.number().int().min(0),
  housingAllowance: z.number().int().min(0),
  transportAllowance: z.number().int().min(0),
  medicalAllowance: z.number().int().min(0),
  leaveAllowance: z.number().int().min(0),
  utilityAllowance: z.number().int().min(0),
});

/**
 * PUT /api/grade-levels/[gradeLevelId] — update salary figures
 * SUPER_ADMIN only
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ gradeLevelId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden — Super Admin access required" },
        { status: 403 },
      );
    }

    const { gradeLevelId } = await params;
    const body = await request.json();

    const parsed = updateGradeLevelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    // Check grade level exists
    const existing = await prisma.gradeLevel.findUnique({
      where: { id: gradeLevelId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Grade level not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.gradeLevel.update({
      where: { id: gradeLevelId },
      data: parsed.data,
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "GradeLevel",
      entityId: gradeLevelId,
      description: `Updated salary for GL ${String(existing.level).padStart(2, "0")} Step ${existing.step}`,
      metadata: {
        before: {
          basicSalary: existing.basicSalary,
          housingAllowance: existing.housingAllowance,
          transportAllowance: existing.transportAllowance,
          medicalAllowance: existing.medicalAllowance,
          leaveAllowance: existing.leaveAllowance,
          utilityAllowance: existing.utilityAllowance,
        },
        after: parsed.data,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Grade level updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/grade-levels/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update grade level" },
      { status: 500 },
    );
  }
}
