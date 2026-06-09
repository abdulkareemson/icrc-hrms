// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createUserSchema } from "@/lib/validators/user.schema";
import { sendEmail } from "@/lib/email/sender";
import { generateWelcomeEmail } from "@/lib/email/templates/welcome";
import bcrypt from "bcryptjs";
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
    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)),
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const roleFilter = searchParams.get("role") ?? "";
    const statusFilter = searchParams.get("status") ?? "";

    const where: Prisma.UserWhereInput = { deletedAt: null };

    if (roleFilter && roleFilter !== "all") {
      where.role = roleFilter as Prisma.EnumRoleFilter;
    }

    if (statusFilter === "active") where.isActive = true;
    if (statusFilter === "inactive") where.isActive = false;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        {
          employee: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { staffId: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          employee: {
            select: {
              id: true,
              staffId: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
              department: { select: { name: true, code: true } },
            },
          },
          _count: { select: { sessions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
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
    console.error("[GET /api/admin/users]", error);
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
    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = createUserSchema.safeParse(body);

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

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isActive: data.isActive,
      },
    });

    // Send welcome email
    try {
      const emailContent = generateWelcomeEmail({
        firstName: data.email.split("@")[0] ?? "User",
        lastName: "",
        email: data.email,
        staffId: "—",
        department: "—",
        jobTitle: "—",
        temporaryPassword: data.password,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
      });
      await sendEmail({
        to: data.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    } catch (emailError) {
      console.error("Welcome email failed (non-critical):", emailError);
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      description: `Created user account: ${data.email} (role: ${data.role})`,
      metadata: { email: data.email, role: data.role },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: user.id, email: user.email },
        message: "User created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/admin/users]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
