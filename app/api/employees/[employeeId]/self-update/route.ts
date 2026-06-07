// app/api/employees/[employeeId]/self-update/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { employeeSelfUpdateSchema } from "@/lib/validators/employee.schema";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { employeeId } = await params;

    if (!session.user.employeeId || session.user.employeeId !== employeeId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = employeeSelfUpdateSchema.safeParse(body);

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

    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        userId: session.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        staffId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found" },
        { status: 404 },
      );
    }

    const data = parsed.data;

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        phoneNumber: data.phoneNumber,
        personalEmail: data.personalEmail || null,
        address: data.address,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        bankSortCode: data.bankSortCode || null,
      },
      select: {
        id: true,
        staffId: true,
        updatedAt: true,
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "Employee",
      entityId: employeeId,
      description: `Self-updated profile details for ${existing.firstName} ${existing.lastName} (${existing.staffId})`,
      metadata: {
        updatedFields: [
          "phoneNumber",
          "personalEmail",
          "address",
          "bankName",
          "accountNumber",
          "bankSortCode",
        ],
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        staffId: updated.staffId,
        updatedAt: updated.updatedAt.toISOString(),
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/employees/[employeeId]/self-update error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
