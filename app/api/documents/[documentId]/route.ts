// app/api/documents/[documentId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }

    const { documentId } = await params;

    const document = await prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
      include: {
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true, code: true } },
          },
        },
        uploadedByUser: {
          select: {
            email: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    // Access control
    const isHR =
      session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";

    if (!isHR && document.employeeId !== session.user.employeeId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Generate signed URL on demand
    const result = await utapi.getFileUrls([document.fileKey]);
    const url = result.data[0]?.url ?? null;

    return NextResponse.json({
      success: true,
      data: { ...document, url },
    });
  } catch (error) {
    console.error("[GET /api/documents/:id]", error);
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

    if (!hasPermission(session.user.role, "documents:read_all")) {
      return NextResponse.json(
        { success: false, error: "Forbidden — HR only" },
        { status: 403 },
      );
    }

    const { documentId } = await params;

    const document = await prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
      select: {
        id: true,
        fileKey: true,
        title: true,
        documentType: true,
        employee: { select: { staffId: true } },
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 },
      );
    }

    // Soft delete the DB record first
    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // Delete the file from Uploadthing storage (non-critical)
    try {
      await utapi.deleteFiles([document.fileKey]);
    } catch (utError) {
      console.error("Uploadthing delete failed (non-critical):", utError);
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DELETE",
      entityType: "Document",
      entityId: documentId,
      description: `Deleted document "${document.title}" for employee ${document.employee.staffId}`,
      metadata: {
        documentType: document.documentType,
        fileKey: document.fileKey,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/documents/:id]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
