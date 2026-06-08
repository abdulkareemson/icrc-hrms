// app/api/performance/reviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission, isHR } from "@/lib/rbac";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  initiateReviewSchema,
  bulkInitiateReviewSchema,
  reviewQuerySchema,
} from "@/lib/validators/performance.schema";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { PerformanceReview, Employee, User } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type ReviewWithRelations = PerformanceReview & {
  employee: Pick<
    Employee,
    "id" | "firstName" | "lastName" | "staffId" | "jobTitle" | "departmentId"
  > & {
    department: { name: string; code: string };
  };
  reviewer: Pick<Employee, "id" | "firstName" | "lastName" | "jobTitle">;
  hrFinalizedBy: Pick<User, "id" | "email"> | null;
  _count: { goals: number };
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function emptyPagination() {
  return {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

// ─────────────────────────────────────────────────────────────
// GET — List reviews (role-filtered)
// ─────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
): Promise<NextResponse<PaginatedResponse<ReviewWithRelations>>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, data: [], pagination: emptyPagination() },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "performance:read_own")) {
      return NextResponse.json(
        { success: false, data: [], pagination: emptyPagination() },
        { status: 403 },
      );
    }

    const params = reviewQuerySchema.safeParse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    if (!params.success) {
      return NextResponse.json(
        { success: false, data: [], pagination: emptyPagination() },
        { status: 400 },
      );
    }

    const {
      page,
      limit,
      search,
      year,
      isFinalized,
      employeeId,
      sortBy,
      sortOrder,
    } = params.data;

    // Build where clause based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (!isHR(session.user.role)) {
      const empId = session.user.employeeId;
      if (!empId) {
        return NextResponse.json(
          { success: false, data: [], pagination: emptyPagination() },
          { status: 403 },
        );
      }
      where.OR = [{ employeeId: empId }, { reviewerId: empId }];
    } else {
      if (employeeId) {
        where.employeeId = employeeId;
      }
    }

    if (year !== undefined) {
      where.reviewYear = year;
    }

    if (isFinalized !== undefined) {
      where.isFinalized = isFinalized;
    }

    if (search) {
      where.OR = [
        ...(where.OR ?? []),
        { reviewPeriod: { contains: search, mode: "insensitive" } },
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

    const [reviews, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffId: true,
              jobTitle: true,
              departmentId: true,
              department: { select: { name: true, code: true } },
            },
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
            },
          },
          hrFinalizedBy: {
            select: { id: true, email: true },
          },
          _count: { select: { goals: true } },
        },
      }),
      prisma.performanceReview.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: reviews as unknown as ReviewWithRelations[],
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
    console.error("[GET /api/performance/reviews]", error);
    return NextResponse.json(
      { success: false, data: [], pagination: emptyPagination() },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST — Initiate review(s) (HR only)
// ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "performance:manage")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: HR role required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { ipAddress, userAgent } = getRequestMeta(req);

    // ── Bulk initiation ──
    const isBulk = Array.isArray(body.employeeIds);

    if (isBulk) {
      const parsed = bulkInitiateReviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.errors[0]?.message ?? "Validation failed",
          },
          { status: 422 },
        );
      }

      const { employeeIds, reviewPeriod, reviewYear } = parsed.data;

      const employees = await prisma.employee.findMany({
        where: { id: { in: employeeIds }, isActive: true, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          lineManagerId: true,
        },
      });

      if (employees.length !== employeeIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "One or more employees not found or inactive",
          },
          { status: 404 },
        );
      }

      // Check for duplicates
      const existing = await prisma.performanceReview.findMany({
        where: {
          employeeId: { in: employeeIds },
          reviewPeriod,
          reviewYear,
        },
        select: { employeeId: true },
      });

      const existingIds = new Set(existing.map((r) => r.employeeId));
      const newEmployees = employees.filter((e) => !existingIds.has(e.id));

      if (newEmployees.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `All selected employees already have a review for ${reviewPeriod} ${reviewYear}`,
          },
          { status: 409 },
        );
      }

      const hrEmployeeId = session.user.employeeId;

      const createdReviews = await prisma.$transaction(
        newEmployees.map((emp) => {
          const reviewerId = emp.lineManagerId ?? hrEmployeeId ?? emp.id;
          return prisma.performanceReview.create({
            data: {
              employeeId: emp.id,
              reviewerId,
              reviewPeriod,
              reviewYear,
            },
          });
        }),
      );

      await createAuditLog({
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "CREATE",
        entityType: "PerformanceReview",
        entityId: "bulk",
        description: `Initiated ${createdReviews.length} performance reviews for ${reviewPeriod} ${reviewYear}`,
        metadata: {
          skipped: existingIds.size,
          created: createdReviews.length,
          reviewPeriod,
          reviewYear,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Created ${createdReviews.length} reviews${existingIds.size > 0 ? `, skipped ${existingIds.size} duplicate(s)` : ""}`,
          data: createdReviews,
        },
        { status: 201 },
      );
    }

    // ── Single review ──
    const parsed = initiateReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message ?? "Validation failed",
        },
        { status: 422 },
      );
    }

    const { employeeId, reviewerId, reviewPeriod, reviewYear } = parsed.data;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, isActive: true, deletedAt: null },
    });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found or inactive" },
        { status: 404 },
      );
    }

    const reviewer = await prisma.employee.findFirst({
      where: { id: reviewerId, isActive: true, deletedAt: null },
    });
    if (!reviewer) {
      return NextResponse.json(
        { success: false, error: "Reviewer not found or inactive" },
        { status: 404 },
      );
    }

    const existing = await prisma.performanceReview.findFirst({
      where: { employeeId, reviewPeriod, reviewYear },
    });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `A review for ${reviewPeriod} ${reviewYear} already exists for this employee`,
        },
        { status: 409 },
      );
    }

    const review = await prisma.performanceReview.create({
      data: { employeeId, reviewerId, reviewPeriod, reviewYear },
      include: {
        employee: {
          select: { firstName: true, lastName: true, staffId: true },
        },
        reviewer: { select: { firstName: true, lastName: true } },
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "PerformanceReview",
      entityId: review.id,
      description: `Initiated performance review for ${employee.firstName} ${employee.lastName} — ${reviewPeriod} ${reviewYear}`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Performance review initiated",
        data: review,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/performance/reviews]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}