// app/api/departments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * GET /api/departments — list all departments
 * Accessible by all authenticated users
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const departments = await prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        headId: true,
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffId: true,
          },
        },
        _count: {
          select: {
            employees: {
              where: { isActive: true, deletedAt: null },
            },
          },
        },
      },
    });

    const formatted = departments.map((dept) => ({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      description: dept.description,
      headId: dept.headId,
      headName: dept.head
        ? `${dept.head.firstName} ${dept.head.lastName}`
        : null,
      headStaffId: dept.head?.staffId ?? null,
      employeeCount: dept._count.employees,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch departments" },
      { status: 500 },
    );
  }
}
