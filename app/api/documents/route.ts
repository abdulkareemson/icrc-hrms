// app/api/documents/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { uploadDocumentSchema } from "@/lib/validators/document.schema";
import { sendEmail } from "@/lib/email/sender";
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
    const documentType = searchParams.get("documentType") ?? "";
    const employeeIdFilter = searchParams.get("employeeId") ?? "";

    const isHR =
      session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN";

    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
    };

    if (!isHR) {
      if (!session.user.employeeId) {
        return NextResponse.json(
          { success: false, error: "Employee profile not linked" },
          { status: 403 },
        );
      }

      where.employeeId = session.user.employeeId;
    } else if (employeeIdFilter) {
      where.employeeId = employeeIdFilter;
    }

    if (documentType && documentType !== "all") {
      where.documentType = documentType as Prisma.EnumDocumentTypeFilter;
    }

    if (search) {
      const searchOr: Prisma.DocumentWhereInput["OR"] = [
        { title: { contains: search, mode: "insensitive" } },
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

      if (where.employeeId) {
        where.AND = [{ employeeId: where.employeeId }, { OR: searchOr }];
        delete where.employeeId;
      } else {
        where.OR = searchOr;
      }
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              staffId: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
          uploadedByUser: {
            select: {
              email: true,
              employee: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: documents,
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
    console.error("[GET /api/documents]", error);
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

    if (!hasPermission(session.user.role, "documents:read_all")) {
      return NextResponse.json(
        { success: false, error: "Forbidden — HR only" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = uploadDocumentSchema.safeParse(body);

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

    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, deletedAt: null },
      include: {
        user: { select: { email: true } },
        department: { select: { name: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    const document = await prisma.document.create({
      data: {
        employeeId: data.employeeId,
        documentType: data.documentType,
        title: data.title,
        fileKey: data.fileKey,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        uploadedByUserId: session.user.id,
      },
    });

    if (data.expiresAt) {
      const expiryDate = new Date(data.expiresAt);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        await sendExpiryAlert(
          employee.user.email,
          `${employee.firstName} ${employee.lastName}`,
          data.title,
          expiryDate,
          document.id,
        );

        await prisma.document.update({
          where: { id: document.id },
          data: { expiryAlertSent: true },
        });
      }
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "Document",
      entityId: document.id,
      description: `Uploaded document "${data.title}" for employee ${employee.staffId}`,
      metadata: {
        documentType: data.documentType,
        employeeId: data.employeeId,
        fileSize: data.fileSize,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: document.id },
        message: "Document uploaded successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/documents]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function sendExpiryAlert(
  email: string,
  name: string,
  documentTitle: string,
  expiryDate: Date,
  documentId: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const formattedDate = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(expiryDate);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#15803d,#166534);padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;">Document Expiry Alert</h1>
          <p style="margin:6px 0 0;font-size:12px;color:#bbf7d0;">Infrastructure Concession Regulatory Commission</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#374151;">Dear <strong>${name}</strong>,</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
            This is a reminder that the following document is expiring soon.
          </p>
          <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:4px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:13px;color:#9a3412;font-weight:700;">⚠ Expiring Document</p>
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">${documentTitle}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;">Expires: <strong>${formattedDate}</strong></p>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${appUrl}/documents/${documentId}"
               style="display:inline-block;background:#15803d;color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
              View Document
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Please ensure this document is renewed before expiry to remain compliant.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            ICRC Nigeria • Plot 1270, Ayangba Street, Garki, Abuja
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  await sendEmail({
    to: email,
    subject: `⚠ Document Expiring Soon: ${documentTitle} — ICRC`,
    html,
    text: `Dear ${name},\n\nYour document "${documentTitle}" expires on ${formattedDate}.\n\nView it at: ${appUrl}/documents/${documentId}\n\nICRC Nigeria`,
  });
}
