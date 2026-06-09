// app/api/employees/[employeeId]/id-card/route.ts
export const runtime = "nodejs";
export const maxDuration = 30;

import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { StaffIDCard } from "@/components/pdf/StaffIDCard";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

type RouteContext = { params: Promise<{ employeeId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { employeeId } = await params;

    // Employees can only generate their own ID card
    if (session.user.role === "EMPLOYEE") {
      if (session.user.employeeId !== employeeId) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    } else if (!hasPermission(session.user.role, "employees:read")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
      select: {
        id: true,
        staffId: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        gender: true,
        profilePhotoKey: true,
        department: { select: { name: true, code: true } },
        gradeLevel: { select: { level: true, step: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    // Generate signed photo URL if photo exists
    let profilePhotoUrl: string | null = null;
    if (employee.profilePhotoKey) {
      try {
        const result = await utapi.getFileUrls([employee.profilePhotoKey]);
        profilePhotoUrl = result.data[0]?.url ?? null;
      } catch {
        // Non-critical — card generates without photo
        profilePhotoUrl = null;
      }
    }

    const generatedDate = new Intl.DateTimeFormat("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(new Date());

    const gradeLevelLabel = `GL ${String(employee.gradeLevel.level).padStart(2, "0")} / Step ${employee.gradeLevel.step}`;

    const cardProps = {
      employeeName: `${employee.firstName} ${employee.lastName}`,
      staffId: employee.staffId,
      jobTitle: employee.jobTitle,
      department: employee.department.name,
      departmentCode: employee.department.code,
      gradeLevelLabel,
      gender: employee.gender,
      profilePhotoUrl,
      generatedDate,
    };

    // Render PDF
    const element = createElement(StaffIDCard, cardProps);
    const pdfInstance = pdf(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      element as React.ReactElement<any>,
    );
    const stream = await pdfInstance.toBuffer();

    // Collect stream into Uint8Array
    const chunks: Uint8Array[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        chunks.push(new Uint8Array(chunk));
      });
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
    const pdfBytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      pdfBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const safeName = `${employee.firstName}-${employee.lastName}`
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .toLowerCase();
    const filename = `icrc-staff-id-${safeName}-${employee.staffId}.pdf`;

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "EXPORT",
      entityType: "Employee",
      entityId: employeeId,
      description: `Staff ID card generated for ${employee.firstName} ${employee.lastName} (${employee.staffId})`,
      metadata: {
        staffId: employee.staffId,
        employeeId,
      },
      ipAddress,
      userAgent,
    });

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.byteLength),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    console.error("[GET /api/employees/:id/id-card]", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate staff ID card" },
      { status: 500 },
    );
  }
}
