// app/api/admin/audit-logs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
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
      Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)),
    );
    const action = searchParams.get("action") ?? "";
    const entityType = searchParams.get("entityType") ?? "";
    const actorEmail = searchParams.get("actorEmail")?.trim() ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const format = searchParams.get("format") ?? "";

    const where: Prisma.AuditLogWhereInput = {};

    if (action && action !== "all") {
      where.action = action as Prisma.EnumAuditActionFilter;
    }

    if (entityType && entityType !== "all") {
      where.entityType = entityType;
    }

    if (actorEmail) {
      where.actorEmail = { contains: actorEmail, mode: "insensitive" };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // CSV export
    if (format === "csv") {
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10000,
        select: {
          id: true,
          actorEmail: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          ipAddress: true,
          createdAt: true,
        },
      });

      const header =
        "ID,Actor Email,Action,Entity Type,Entity ID,Description,IP Address,Timestamp";
      const rows = logs.map(
        (log) =>
          `"${log.id}","${log.actorEmail}","${log.action}","${log.entityType}","${log.entityId}","${log.description.replace(/"/g, '""')}","${log.ipAddress ?? ""}","${log.createdAt.toISOString()}"`,
      );

      const csv = [header, ...rows].join("\n");

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="audit_logs.csv"',
        },
      });
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          actorId: true,
          actorEmail: true,
          action: true,
          entityType: true,
          entityId: true,
          description: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get distinct entity types for filter dropdown
    const entityTypes = await prisma.auditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      entityTypes: entityTypes.map((e) => e.entityType),
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
    console.error("[GET /api/admin/audit-logs]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
