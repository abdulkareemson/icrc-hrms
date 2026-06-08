// app/api/announcements/[announcementId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { updateAnnouncementSchema } from "@/lib/validators/announcement.schema";
import type { Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// GET /api/announcements/[announcementId]
// All authenticated users — subject to targeting rules
// ─────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { announcementId } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId, deletedAt: null },
      include: {
        createdByHR: { select: { email: true } },
        department: { select: { name: true, code: true } },
        _count: { select: { notifications: true } },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 },
      );
    }

    // ── Access check for employees ──
    const isHRUser =
      session.user.role === "SUPER_ADMIN" || session.user.role === "HR_ADMIN";

    if (!isHRUser) {
      const canView =
        announcement.target === "ALL" ||
        (announcement.target === "DEPARTMENT" &&
          announcement.departmentId === session.user.departmentId) ||
        (announcement.target === "ROLE" &&
          announcement.targetRole === session.user.role);

      if (!canView) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        target: announcement.target,
        departmentId: announcement.departmentId,
        departmentName: announcement.department?.name ?? null,
        targetRole: announcement.targetRole,
        isUrgent: announcement.isUrgent,
        publishedAt: announcement.publishedAt?.toISOString() ?? null,
        expiresAt: announcement.expiresAt?.toISOString() ?? null,
        createdByEmail: announcement.createdByHR.email,
        notificationCount: announcement._count.notifications,
        createdAt: announcement.createdAt.toISOString(),
        updatedAt: announcement.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/announcements/[announcementId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch announcement" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/announcements/[announcementId]
// HR only — update announcement
// ─────────────────────────────────────────────────────────────

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "announcements:create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { announcementId } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id: announcementId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 422 },
      );
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...parsed.data,
        targetRole: parsed.data.targetRole
          ? (parsed.data.targetRole as Role)
          : undefined,
        publishedAt: parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : undefined,
        expiresAt: parsed.data.expiresAt
          ? new Date(parsed.data.expiresAt)
          : undefined,
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "Announcement",
      entityId: announcementId,
      description: `Announcement updated: "${updated.title}"`,
      metadata: parsed.data,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Announcement updated successfully",
      data: { id: updated.id, title: updated.title },
    });
  } catch (error) {
    console.error("PUT /api/announcements/[announcementId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update announcement" },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/announcements/[announcementId]
// HR only — soft delete
// ─────────────────────────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "announcements:create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { announcementId } = await params;

    const existing = await prisma.announcement.findUnique({
      where: { id: announcementId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 },
      );
    }

    await prisma.announcement.update({
      where: { id: announcementId },
      data: { deletedAt: new Date() },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DELETE",
      entityType: "Announcement",
      entityId: announcementId,
      description: `Announcement deleted: "${existing.title}"`,
      metadata: { title: existing.title, target: existing.target },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/announcements/[announcementId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete announcement" },
      { status: 500 },
    );
  }
}
