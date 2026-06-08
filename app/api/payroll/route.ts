// app/api/payroll/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission, isHR } from "@/lib/rbac";
import { payrollQuerySchema } from "@/lib/validators/payroll.schema";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// GET /api/payroll
// HR/Admin: all payroll records with filters
// Employee: own payroll records only
// ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "payroll:read_own")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const params = payrollQuerySchema.safeParse(
      Object.fromEntries(url.searchParams),
    );

    if (!params.success) {
      return NextResponse.json(
        {
          success: false,
          error: params.error.errors[0]?.message ?? "Invalid query parameters",
        },
        { status: 400 },
      );
    }

    const {
      page,
      limit,
      search,
      payMonth,
      payYear,
      status,
      employeeId,
      sortBy,
      sortOrder,
    } = params.data;

    // ── Build WHERE clause ──
    const where: Prisma.PayrollRecordWhereInput = {};

    if (!isHR(session.user.role)) {
      // EMPLOYEE — own records only
      if (!session.user.employeeId) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }
      where.employeeId = session.user.employeeId;
    } else {
      // HR — optional employee filter
      if (employeeId) {
        where.employeeId = employeeId;
      }
    }

    if (payMonth !== undefined) {
      where.payMonth = payMonth;
    }

    if (payYear !== undefined) {
      where.payYear = payYear;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.employee = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { staffId: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [records, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          employee: {
            select: {
              id: true,
              staffId: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
              department: { select: { name: true, code: true } },
            },
          },
          gradeLevel: {
            select: {
              level: true,
              step: true,
            },
          },
        },
      }),
      prisma.payrollRecord.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const formatted = records.map((rec) => ({
      id: rec.id,
      employeeId: rec.employeeId,
      employeeName: `${rec.employee.firstName} ${rec.employee.lastName}`,
      staffId: rec.employee.staffId,
      jobTitle: rec.employee.jobTitle,
      department: rec.employee.department.name,
      departmentCode: rec.employee.department.code,
      gradeLevelLabel: `GL ${String(rec.gradeLevel.level).padStart(2, "0")} / Step ${rec.gradeLevel.step}`,
      gradeLevel: rec.gradeLevel.level,
      gradeLevelStep: rec.gradeLevel.step,
      payMonth: rec.payMonth,
      payYear: rec.payYear,
      basicSalary: rec.basicSalary,
      housingAllowance: rec.housingAllowance,
      transportAllowance: rec.transportAllowance,
      medicalAllowance: rec.medicalAllowance,
      leaveAllowance: rec.leaveAllowance,
      utilityAllowance: rec.utilityAllowance,
      otherAllowances: rec.otherAllowances,
      grossPay: rec.grossPay,
      payeTax: rec.payeTax,
      employeePension: rec.employeePension,
      employerPension: rec.employerPension,
      nhfDeduction: rec.nhfDeduction,
      otherDeductions: rec.otherDeductions,
      totalDeductions: rec.totalDeductions,
      netPay: rec.netPay,
      status: rec.status,
      processedAt: rec.processedAt?.toISOString() ?? null,
      paidAt: rec.paidAt?.toISOString() ?? null,
      createdAt: rec.createdAt.toISOString(),
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
    console.error("GET /api/payroll error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payroll records" },
      { status: 500 },
    );
  }
}