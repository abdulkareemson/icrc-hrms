// app/api/admin/users/[userId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { updateUserSchema } from "@/lib/validators/user.schema";
import bcrypt from "bcryptjs";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { userId } = await params;

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            department: { select: { name: true, code: true } },
            gradeLevel: { select: { level: true, step: true } },
          },
        },
        _count: { select: { sessions: true, auditLogs: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("[GET /api/admin/users/:id]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { userId } = await params;

    const existing = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Prevent self-demotion
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot modify your own account here" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = updateUserSchema.safeParse(body);

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

    const data = parsed.data;
    const changes: Record<string, unknown> = {};

    // Build update payload
    const updateData: {
      email?: string;
      role?: "SUPER_ADMIN" | "HR_ADMIN" | "EMPLOYEE";
      isActive?: boolean;
      password?: string;
    } = {};

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailTaken && emailTaken.id !== userId) {
        return NextResponse.json(
          { success: false, error: "Email already in use" },
          { status: 409 },
        );
      }
      updateData.email = data.email;
      changes.email = { from: existing.email, to: data.email };
    }

    if (data.role && data.role !== existing.role) {
      updateData.role = data.role;
      changes.role = { from: existing.role, to: data.role };
    }

    if (data.isActive !== undefined && data.isActive !== existing.isActive) {
      updateData.isActive = data.isActive;
      changes.isActive = { from: existing.isActive, to: data.isActive };
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
      changes.passwordChanged = true;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: "No changes to apply",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Invalidate sessions on role change or deactivation
    const shouldInvalidateSessions =
      changes.role !== undefined || data.isActive === false;

    if (shouldInvalidateSessions) {
      await prisma.session.deleteMany({ where: { userId } });
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      description: `Updated user: ${existing.email}`,
      metadata: changes,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("[PUT /api/admin/users/:id]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { userId } = await params;

    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 403 },
      );
    }

    const existing = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Soft delete user + deactivate
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    // Delete all sessions
    await prisma.session.deleteMany({ where: { userId } });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DELETE",
      entityType: "User",
      entityId: userId,
      description: `Deleted user: ${existing.email}`,
      metadata: { email: existing.email, role: existing.role },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/admin/users/:id]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
