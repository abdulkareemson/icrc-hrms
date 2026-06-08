// app/api/recruitment/vacancies/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { createVacancySchema } from "@/lib/validators/recruitment.schema";
import { hasPermission } from "@/lib/rbac";

/**
 * GET /api/recruitment/vacancies
 * Public: published + non-expired only (no auth)
 * HR/Admin: all vacancies with filters
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)),
    );
    const search = url.searchParams.get("search")?.trim() ?? "";
    const departmentId = url.searchParams.get("departmentId") ?? "";
    const isPublicRequest = url.searchParams.get("public") === "true";

    const isHR =
      session &&
      (session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN");

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (!isHR || isPublicRequest) {
      where.isPublished = true;
      where.deadline = { gte: new Date() };
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [vacancies, total] = await Promise.all([
      prisma.jobVacancy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          department: {
            select: { id: true, code: true, name: true },
          },
          _count: {
            select: { applications: true },
          },
        },
      }),
      prisma.jobVacancy.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const formatted = vacancies.map((v) => ({
      id: v.id,
      title: v.title,
      departmentId: v.department.id,
      departmentCode: v.department.code,
      departmentName: v.department.name,
      jobType: v.jobType,
      location: v.location,
      description: v.description,
      requirements: v.requirements,
      responsibilities: v.responsibilities,
      salaryRange: v.salaryRange,
      deadline: v.deadline.toISOString(),
      isPublished: v.isPublished,
      publishedAt: v.publishedAt?.toISOString() ?? null,
      closedAt: v.closedAt?.toISOString() ?? null,
      applicationCount: v._count.applications,
      createdAt: v.createdAt.toISOString(),
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
    console.error("GET /api/recruitment/vacancies error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vacancies" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/recruitment/vacancies
 * HR/Admin only
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const parsed = createVacancySchema.safeParse(body);

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

    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { name: true },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 },
      );
    }

    const vacancy = await prisma.jobVacancy.create({
      data: {
        title: data.title,
        departmentId: data.departmentId,
        jobType: data.jobType,
        location: data.location,
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        salaryRange: data.salaryRange || null,
        deadline: new Date(data.deadline),
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
        createdByHRId: session.user.id,
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "JobVacancy",
      entityId: vacancy.id,
      description: `Created vacancy: ${data.title} (${department.name})${data.isPublished ? " — published" : " — draft"}`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: vacancy.id, title: vacancy.title },
        message: data.isPublished
          ? "Vacancy published successfully"
          : "Vacancy saved as draft",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/recruitment/vacancies error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create vacancy" },
      { status: 500 },
    );
  }
}
