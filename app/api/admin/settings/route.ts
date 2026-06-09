// app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { updateSystemConfigSchema } from "@/lib/validators/user.schema";

export async function GET(_request: Request) {
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

    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: "asc" },
      include: {
        updatedByAdmin: {
          select: { email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: configs.map((c) => ({
        id: c.id,
        key: c.key,
        value: c.value,
        description: c.description,
        updatedByEmail: c.updatedByAdmin?.email ?? null,
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/settings]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
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
    const parsed = updateSystemConfigSchema.safeParse(body);

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

    const existing = await prisma.systemConfig.findUnique({
      where: { key: data.key },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Configuration key not found" },
        { status: 404 },
      );
    }

    const oldValue = existing.value;

    await prisma.systemConfig.update({
      where: { key: data.key },
      data: {
        value: data.value,
        description: data.description ?? existing.description,
        updatedByAdminId: session.user.id,
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "SystemConfig",
      entityId: data.key,
      description: `Updated system config: ${data.key} from "${oldValue}" to "${data.value}"`,
      metadata: { key: data.key, oldValue, newValue: data.value },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Configuration "${data.key}" updated successfully`,
    });
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
