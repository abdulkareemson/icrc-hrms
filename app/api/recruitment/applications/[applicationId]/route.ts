// app/api/recruitment/applications/[applicationId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { updateApplicationSchema } from "@/lib/validators/recruitment.schema";
import { hasPermission } from "@/lib/rbac";

/**
 * GET /api/recruitment/applications/[applicationId]
 * HR/Admin only
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "recruitment:read")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { applicationId } = await params;

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        vacancy: {
          select: {
            id: true,
            title: true,
            jobType: true,
            location: true,
            deadline: true,
            department: { select: { id: true, code: true, name: true } },
          },
        },
        reviewedByHR: {
          select: { id: true, email: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        applicationRef: application.applicationRef,
        vacancyId: application.vacancyId,
        vacancyTitle: application.vacancy.title,
        vacancyJobType: application.vacancy.jobType,
        vacancyLocation: application.vacancy.location,
        vacancyDeadline: application.vacancy.deadline.toISOString(),
        departmentId: application.vacancy.department.id,
        departmentCode: application.vacancy.department.code,
        departmentName: application.vacancy.department.name,
        applicantName: application.applicantName,
        applicantEmail: application.applicantEmail,
        applicantPhone: application.applicantPhone,
        cvKey: application.cvKey,
        coverLetterKey: application.coverLetterKey,
        additionalInfo: application.additionalInfo,
        status: application.status,
        interviewDate: application.interviewDate?.toISOString() ?? null,
        interviewMode: application.interviewMode,
        interviewVenue: application.interviewVenue,
        hrNotes: application.hrNotes,
        reviewedByEmail: application.reviewedByHR?.email ?? null,
        reviewedAt: application.reviewedAt?.toISOString() ?? null,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/recruitment/applications/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/recruitment/applications/[applicationId]
 * HR/Admin — update status, schedule interview, add notes
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "recruitment:manage")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { applicationId } = await params;
    const body = await request.json();

    const parsed = updateApplicationSchema.safeParse(body);
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

    const existing = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        vacancy: { select: { title: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    const oldStatus = existing.status;

    const updateData: Record<string, unknown> = {
      status: data.status,
      hrNotes: data.hrNotes || existing.hrNotes,
      reviewedByHRId: session.user.id,
      reviewedAt: new Date(),
    };

    if (data.interviewDate) {
      updateData.interviewDate = new Date(data.interviewDate);
    }
    if (data.interviewMode) {
      updateData.interviewMode = data.interviewMode;
    }
    if (data.interviewVenue) {
      updateData.interviewVenue = data.interviewVenue;
    }

    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: updateData,
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "JobApplication",
      entityId: applicationId,
      description: `Application ${existing.applicationRef} for "${existing.vacancy.title}": ${oldStatus} → ${data.status}`,
      metadata: {
        applicationRef: existing.applicationRef,
        applicantName: existing.applicantName,
        oldStatus,
        newStatus: data.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Application status updated to ${data.status}`,
      data: { id: applicationId, status: data.status },
    });
  } catch (error) {
    console.error("PUT /api/recruitment/applications/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update application" },
      { status: 500 },
    );
  }
}
