// app/api/recruitment/applications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { publicApplicationSchema } from "@/lib/validators/recruitment.schema";
import { hasPermission } from "@/lib/rbac";
import { generateApplicationReceivedEmail } from "@/lib/email/templates/application-received";
import { sendEmail } from "@/lib/email/sender";
import type { Prisma } from "@prisma/client";

/**
 * Generate application reference: APP-{YEAR}-{SEQUENCE}
 */
async function generateApplicationRef(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `APP-${year}-`;

  const latest = await prisma.jobApplication.findFirst({
    where: { applicationRef: { startsWith: prefix } },
    orderBy: { applicationRef: "desc" },
    select: { applicationRef: true },
  });

  let nextSequence = 1;

  if (latest) {
    const parts = latest.applicationRef.split("-");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const parsed = parseInt(lastPart, 10);
      if (!isNaN(parsed)) nextSequence = parsed + 1;
    }
  }

  return `${prefix}${nextSequence.toString().padStart(4, "0")}`;
}

/**
 * GET /api/recruitment/applications
 * HR/Admin only — list all applications with filters
 */
export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)),
    );
    const vacancyId = url.searchParams.get("vacancyId") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const search = url.searchParams.get("search")?.trim() ?? "";

    const where: Prisma.JobApplicationWhereInput = {};

    if (vacancyId) where.vacancyId = vacancyId;
    if (status) where.status = status as Prisma.EnumApplicationStatusFilter;

    if (search) {
      where.OR = [
        { applicantName: { contains: search, mode: "insensitive" } },
        { applicantEmail: { contains: search, mode: "insensitive" } },
        { applicationRef: { contains: search, mode: "insensitive" } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vacancy: {
            select: {
              id: true,
              title: true,
              department: { select: { name: true, code: true } },
            },
          },
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const formatted = applications.map((app) => ({
      id: app.id,
      applicationRef: app.applicationRef,
      vacancyId: app.vacancyId,
      vacancyTitle: app.vacancy.title,
      department: app.vacancy.department.name,
      departmentCode: app.vacancy.department.code,
      applicantName: app.applicantName,
      applicantEmail: app.applicantEmail,
      applicantPhone: app.applicantPhone,
      cvKey: app.cvKey,
      coverLetterKey: app.coverLetterKey,
      additionalInfo: app.additionalInfo,
      status: app.status,
      interviewDate: app.interviewDate?.toISOString() ?? null,
      interviewMode: app.interviewMode,
      interviewVenue: app.interviewVenue,
      hrNotes: app.hrNotes,
      createdAt: app.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/recruitment/applications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/recruitment/applications
 * PUBLIC — no auth required
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = publicApplicationSchema.safeParse(body);

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

    // Validate vacancy exists and is open
    const vacancy = await prisma.jobVacancy.findFirst({
      where: {
        id: data.vacancyId,
        deletedAt: null,
        isPublished: true,
      },
      include: {
        department: { select: { name: true } },
      },
    });

    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: "This vacancy is no longer available" },
        { status: 404 },
      );
    }

    // Check deadline
    if (vacancy.deadline < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "The application deadline for this position has passed",
        },
        { status: 422 },
      );
    }

    // Check duplicate email for same vacancy
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        vacancyId: data.vacancyId,
        applicantEmail: data.applicantEmail.toLowerCase(),
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: "You have already applied for this position" },
        { status: 409 },
      );
    }

    const applicationRef = await generateApplicationRef();

    const application = await prisma.jobApplication.create({
      data: {
        applicationRef,
        vacancyId: data.vacancyId,
        applicantName: data.applicantName,
        applicantEmail: data.applicantEmail.toLowerCase(),
        applicantPhone: data.applicantPhone,
        cvKey: data.cvKey,
        coverLetterKey: data.coverLetterKey || null,
        additionalInfo: data.additionalInfo || null,
        status: "APPLIED",
      },
    });

    // Send confirmation email to applicant
    void sendEmail({
      to: data.applicantEmail,
      ...generateApplicationReceivedEmail({
        applicantName: data.applicantName,
        applicationRef,
        vacancyTitle: vacancy.title,
        department: vacancy.department.name,
      }),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: application.id,
          applicationRef,
        },
        message: `Application submitted successfully. Your reference number is ${applicationRef}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/recruitment/applications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
