// app/api/reports/log-export/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { isHR } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }
    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      reportKey?: string;
      reportTitle?: string;
    };

    const { ipAddress, userAgent } = getRequestMeta(request);

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "EXPORT",
      entityType: "Report",
      entityId: body.reportKey ?? "unknown",
      description: `Exported report: ${body.reportTitle ?? body.reportKey ?? "Unknown"}`,
      metadata: {
        reportKey: body.reportKey,
        reportTitle: body.reportTitle,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/reports/log-export]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
