// app/api/notifications/[notificationId]/read/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type RouteContext = { params: Promise<{ notificationId: string }> };

export async function PATCH(_request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }

    const { notificationId } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: session.user.id },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 },
      );
    }

    if (notification.isRead) {
      return NextResponse.json({ success: true, message: "Already read" });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Marked as read",
    });
  } catch (error) {
    console.error("[PATCH /api/notifications/:id/read]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
