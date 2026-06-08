// app/api/documents/[documentId]/download/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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
      select: {
        id: true,
        fileKey: true,
        title: true,
        mimeType: true,
        employeeId: true,
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
    const url = result.data[0]?.url;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "Could not generate download URL" },
        { status: 502 },
      );
    }

    // Redirect to signed URL — browser handles download
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[GET /api/documents/:id/download]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
