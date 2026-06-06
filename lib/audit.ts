// lib/audit.ts
import { prisma } from "@/lib/prisma";
import { Prisma, type AuditAction } from "@prisma/client";

interface CreateAuditLogParams {
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Create an audit log entry
 * Should be called after every significant action
 */
export async function createAuditLog(
  params: CreateAuditLogParams,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper to get IP and User-Agent from request headers
 */
export function getRequestMeta(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  return { ipAddress, userAgent };
}
