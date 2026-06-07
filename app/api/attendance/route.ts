// app/api/attendance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/attendance
 * HR/Admin: all records with filters (date, department, employee)
 * Employee: own records only
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

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)),
    );
    const dateFrom = url.searchParams.get("dateFrom") ?? "";
    const dateTo = url.searchParams.get("dateTo") ?? "";
    const departmentId = url.searchParams.get("departmentId") ?? "";
    const employeeId = url.searchParams.get("employeeId") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const search = url.searchParams.get("search")?.trim() ?? "";

    const where: Prisma.AttendanceLogWhereInput = {};

    // Role-based filtering
    if (session.user.role === "EMPLOYEE") {
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
    } else if (!hasPermission(session.user.role, "attendance:read_all")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    // Department filter (HR/Admin only)
    if (departmentId && session.user.role !== "EMPLOYEE") {
      where.employee = {
        ...((where.employee as Prisma.EmployeeWhereInput) ?? {}),
        departmentId,
      };
    }

    // Employee filter (HR/Admin only)
    if (employeeId && session.user.role !== "EMPLOYEE") {
      where.employeeId = employeeId;
    }

    // Status filter
    if (status) {
      where.status = status as Prisma.EnumAttendanceStatusFilter;
    }

    // Search (HR/Admin only)
    if (search && session.user.role !== "EMPLOYEE") {
      where.employee = {
        ...((where.employee as Prisma.EmployeeWhereInput) ?? {}),
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { staffId: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [logs, total] = await Promise.all([
      prisma.attendanceLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              staffId: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
              department: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      }),
      prisma.attendanceLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const formatted = logs.map((log) => ({
      id: log.id,
      employeeId: log.employeeId,
      employeeName: `${log.employee.firstName} ${log.employee.lastName}`,
      staffId: log.employee.staffId,
      jobTitle: log.employee.jobTitle,
      departmentId: log.employee.department.id,
      departmentCode: log.employee.department.code,
      departmentName: log.employee.department.name,
      date: log.date.toISOString(),
      clockInTime: log.clockInTime?.toISOString() ?? null,
      clockOutTime: log.clockOutTime?.toISOString() ?? null,
      hoursWorked: log.hoursWorked,
      status: log.status,
      isLate: log.isLate,
      lateByMinutes: log.lateByMinutes,
      notes: log.notes,
      editedByHRId: log.editedByHRId,
      createdAt: log.createdAt.toISOString(),
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
    console.error("GET /api/attendance error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance records" },
      { status: 500 },
    );
  }
}
