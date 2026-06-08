// app/api/announcements/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createAnnouncementSchema } from "@/lib/validators/announcement.schema";
import { sendEmail } from "@/lib/email/sender";
import { generateAnnouncementEmail } from "@/lib/email/templates/announcement";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)),
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const target = searchParams.get("target") ?? "";
    const isUrgentParam = searchParams.get("isUrgent") ?? "";

    const canManage = hasPermission(session.user.role, "announcements:create");

    const now = new Date();
    const baseWhere: Prisma.AnnouncementWhereInput = {
      deletedAt: null,
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    };

    if (!canManage) {
      baseWhere.AND = [
        {
          OR: [
            { target: "ALL" },
            {
              target: "DEPARTMENT",
              department: {
                employees: {
                  some: { id: session.user.employeeId ?? "" },
                },
              },
            },
            { target: "ROLE", targetRole: session.user.role },
          ],
        },
      ];
    }

    const where: Prisma.AnnouncementWhereInput = { ...baseWhere };

    if (target && target !== "all") {
      where.target = target as Prisma.EnumAnnouncementTargetFilter;
    }
    if (isUrgentParam === "true") where.isUrgent = true;
    if (isUrgentParam === "false") where.isUrgent = false;
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
        include: {
          createdByHR: {
            select: {
              email: true,
              employee: { select: { firstName: true, lastName: true } },
            },
          },
          department: { select: { name: true, code: true } },
          _count: { select: { notifications: true } },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/announcements]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "announcements:create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = createAnnouncementSchema.safeParse(body);
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

    if (data.target === "DEPARTMENT" && !data.departmentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Department is required when targeting a department",
        },
        { status: 422 },
      );
    }
    if (data.target === "ROLE" && !data.targetRole) {
      return NextResponse.json(
        {
          success: false,
          error: "Role is required when targeting a role",
        },
        { status: 422 },
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        target: data.target,
        departmentId: data.target === "DEPARTMENT" ? data.departmentId : null,
        targetRole: data.target === "ROLE" ? data.targetRole : null,
        isUrgent: data.isUrgent,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdByHRId: session.user.id,
      },
      include: {
        department: { select: { name: true } },
      },
    });

    // Fan-out notifications — pass departmentName as third argument
    await fanOutNotifications(
      announcement.id,
      data,
      announcement.department?.name ?? null,
    );

    // Send emails for urgent announcements
    if (data.isUrgent) {
      await sendUrgentEmails(
        announcement.id,
        data,
        announcement.department?.name ?? null,
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "Announcement",
      entityId: announcement.id,
      description: `Created announcement: "${data.title}" → target: ${data.target}`,
      metadata: {
        title: data.title,
        target: data.target,
        isUrgent: data.isUrgent,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: announcement.id },
        message: "Announcement published successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/announcements]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── Fan-out helpers ──────────────────────────────────────────

async function fanOutNotifications(
  announcementId: string,
  data: {
    title: string;
    content: string;
    target: string;
    departmentId?: string | null;
    targetRole?: string | null;
  },
  _departmentName: string | null, // ← third param restored
) {
  let userIds: string[] = [];

  if (data.target === "ALL") {
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else if (data.target === "DEPARTMENT" && data.departmentId) {
    const employees = await prisma.employee.findMany({
      where: {
        departmentId: data.departmentId,
        deletedAt: null,
        isActive: true,
      },
      select: { userId: true },
    });
    userIds = employees.map((e) => e.userId);
  } else if (data.target === "ROLE" && data.targetRole) {
    const users = await prisma.user.findMany({
      where: {
        role: data.targetRole as "SUPER_ADMIN" | "HR_ADMIN" | "EMPLOYEE",
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  }

  if (userIds.length === 0) return;

  // departmentName used only to build the notification message label

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: data.title,
      message:
        data.content.slice(0, 200) + (data.content.length > 200 ? "..." : ""),
      link: `/announcements/${announcementId}`,
      announcementId,
    })),
    skipDuplicates: true,
  });
}

async function sendUrgentEmails(
  announcementId: string,
  data: {
    title: string;
    content: string;
    target: string;
    departmentId?: string | null;
    targetRole?: string | null;
    isUrgent: boolean;
  },
  _departmentName: string | null, // ← third param restored, prefixed _ (not used in body)
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const announcementUrl = `${appUrl}/announcements/${announcementId}`;
  const publishedAt = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  let recipients: { name: string; email: string }[] = [];

  if (data.target === "ALL") {
    const employees = await prisma.employee.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    });
    recipients = employees.map((e) => ({
      name: `${e.firstName} ${e.lastName}`,
      email: e.user.email,
    }));
  } else if (data.target === "DEPARTMENT" && data.departmentId) {
    const employees = await prisma.employee.findMany({
      where: {
        departmentId: data.departmentId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    });
    recipients = employees.map((e) => ({
      name: `${e.firstName} ${e.lastName}`,
      email: e.user.email,
    }));
  } else if (data.target === "ROLE" && data.targetRole) {
    const users = await prisma.user.findMany({
      where: {
        role: data.targetRole as "SUPER_ADMIN" | "HR_ADMIN" | "EMPLOYEE",
        isActive: true,
        deletedAt: null,
      },
      select: {
        email: true,
        employee: { select: { firstName: true, lastName: true } },
      },
    });
    recipients = users.map((u) => ({
      name: u.employee
        ? `${u.employee.firstName} ${u.employee.lastName}`
        : u.email,
      email: u.email,
    }));
  }

  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((recipient) => {
        const emailContent = generateAnnouncementEmail({
          recipientName: recipient.name,
          title: data.title,
          content: data.content,
          isUrgent: data.isUrgent,
          target: data.target,
          announcementUrl,
          publishedAt,
        });
        return sendEmail({
          to: recipient.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      }),
    );
  }
}
