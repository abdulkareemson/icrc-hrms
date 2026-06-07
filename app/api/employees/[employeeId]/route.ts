// app/api/employees/[employeeId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { updateEmployeeSchema } from "@/lib/validators/employee.schema";
import { hasPermission } from "@/lib/rbac";

/**
 * GET /api/employees/[employeeId] — full employee detail
 * HR/SUPER_ADMIN: any employee
 * EMPLOYEE: only own profile (matched by userId)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { employeeId } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        gradeLevel: {
          select: {
            id: true,
            level: true,
            step: true,
            basicSalary: true,
            housingAllowance: true,
            transportAllowance: true,
            medicalAllowance: true,
            leaveAllowance: true,
            utilityAllowance: true,
          },
        },
        lineManager: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
        directReports: {
          where: { isActive: true, deletedAt: null },
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            profilePhotoKey: true,
          },
        },
        leaveBalances: {
          where: { year: new Date().getFullYear() },
          include: {
            leaveType: {
              select: { name: true, daysAllowed: true },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    // EMPLOYEE role can only view own profile
    if (
      session.user.role === "EMPLOYEE" &&
      employee.userId !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const grossAnnual =
      employee.gradeLevel.basicSalary +
      employee.gradeLevel.housingAllowance +
      employee.gradeLevel.transportAllowance +
      employee.gradeLevel.medicalAllowance +
      employee.gradeLevel.leaveAllowance +
      employee.gradeLevel.utilityAllowance;

    const formatted = {
      id: employee.id,
      staffId: employee.staffId,
      userId: employee.userId,
      firstName: employee.firstName,
      middleName: employee.middleName,
      lastName: employee.lastName,
      fullName: [employee.firstName, employee.middleName, employee.lastName]
        .filter(Boolean)
        .join(" "),
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth,
      phoneNumber: employee.phoneNumber,
      personalEmail: employee.personalEmail,
      address: employee.address,
      stateOfOrigin: employee.stateOfOrigin,
      lga: employee.lga,
      nin: employee.nin,
      profilePhotoKey: employee.profilePhotoKey,

      // Employment
      departmentId: employee.department.id,
      departmentCode: employee.department.code,
      departmentName: employee.department.name,
      gradeLevelId: employee.gradeLevel.id,
      gradeLevel: employee.gradeLevel.level,
      gradeLevelStep: employee.gradeLevel.step,
      jobTitle: employee.jobTitle,
      employmentType: employee.employmentType,
      employmentDate: employee.employmentDate,
      contractEndDate: employee.contractEndDate,
      confirmationDate: employee.confirmationDate,
      isManager: employee.isManager,
      isActive: employee.isActive,

      // Salary (only for HR/ADMIN)
      salary:
        session.user.role !== "EMPLOYEE"
          ? {
              basicSalary: employee.gradeLevel.basicSalary,
              housingAllowance: employee.gradeLevel.housingAllowance,
              transportAllowance: employee.gradeLevel.transportAllowance,
              medicalAllowance: employee.gradeLevel.medicalAllowance,
              leaveAllowance: employee.gradeLevel.leaveAllowance,
              utilityAllowance: employee.gradeLevel.utilityAllowance,
              grossAnnual,
              grossMonthly: Math.round(grossAnnual / 12),
            }
          : undefined,

      // Bank details
      bankName: employee.bankName,
      accountNumber: employee.accountNumber,
      bankSortCode: employee.bankSortCode,

      // Line manager
      lineManager: employee.lineManager
        ? {
            id: employee.lineManager.id,
            staffId: employee.lineManager.staffId,
            fullName: `${employee.lineManager.firstName} ${employee.lineManager.lastName}`,
            jobTitle: employee.lineManager.jobTitle,
          }
        : null,

      // Direct reports
      directReports: employee.directReports.map((dr) => ({
        id: dr.id,
        staffId: dr.staffId,
        fullName: `${dr.firstName} ${dr.lastName}`,
        jobTitle: dr.jobTitle,
        profilePhotoKey: dr.profilePhotoKey,
      })),

      // Leave balances
      leaveBalances: employee.leaveBalances.map((lb) => ({
        leaveType: lb.leaveType.name,
        totalDays: lb.totalDays,
        usedDays: lb.usedDays,
        remainingDays: lb.totalDays - lb.usedDays,
      })),

      // Account info
      email: employee.user.email,
      role: employee.user.role,
      accountActive: employee.user.isActive,
      lastLoginAt: employee.user.lastLoginAt,
      accountCreatedAt: employee.user.createdAt,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/employees/[employeeId] — update employee
 * HR_ADMIN + SUPER_ADMIN: full update
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "employees:update")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { employeeId } = await params;
    const body = await request.json();

    const parsed = updateEmployeeSchema.safeParse(body);
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

    // Check employee exists
    const existing = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
      include: {
        department: { select: { code: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    // Validate department
    if (data.departmentId !== existing.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!dept) {
        return NextResponse.json(
          { success: false, error: "Department not found" },
          { status: 404 },
        );
      }
    }

    // Validate grade level
    if (data.gradeLevelId !== existing.gradeLevelId) {
      const gl = await prisma.gradeLevel.findUnique({
        where: { id: data.gradeLevelId },
      });
      if (!gl) {
        return NextResponse.json(
          { success: false, error: "Grade level not found" },
          { status: 404 },
        );
      }
    }

    // Update employee
    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth),
        phoneNumber: data.phoneNumber,
        personalEmail: data.personalEmail || null,
        address: data.address,
        stateOfOrigin: data.stateOfOrigin,
        lga: data.lga,
        nin: data.nin || null,
        departmentId: data.departmentId,
        gradeLevelId: data.gradeLevelId,
        jobTitle: data.jobTitle,
        employmentType: data.employmentType,
        employmentDate: new Date(data.employmentDate),
        contractEndDate: data.contractEndDate
          ? new Date(data.contractEndDate)
          : null,
        confirmationDate: data.confirmationDate
          ? new Date(data.confirmationDate)
          : null,
        lineManagerId: data.lineManagerId || null,
        isManager: data.isManager,
        isActive: data.isActive,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        bankSortCode: data.bankSortCode || null,
      },
    });

    // Sync user isActive status
    if (data.isActive !== existing.isActive) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: data.isActive },
      });

      // If deactivating, delete all sessions
      if (!data.isActive) {
        await prisma.session.deleteMany({
          where: { userId: existing.userId },
        });
      }
    }

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "Employee",
      entityId: employeeId,
      description: `Updated employee ${data.firstName} ${data.lastName} (${existing.staffId})`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id: updated.id, staffId: updated.staffId },
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update employee" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/employees/[employeeId] — soft delete
 * HR_ADMIN + SUPER_ADMIN only
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!hasPermission(session.user.role, "employees:delete")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { employeeId } = await params;

    const existing = await prisma.employee.findUnique({
      where: { id: employeeId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    // Soft delete employee + deactivate user
    await prisma.$transaction([
      prisma.employee.update({
        where: { id: employeeId },
        data: { deletedAt: new Date(), isActive: false },
      }),
      prisma.user.update({
        where: { id: existing.userId },
        data: { deletedAt: new Date(), isActive: false },
      }),
      prisma.session.deleteMany({
        where: { userId: existing.userId },
      }),
    ]);

    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DELETE",
      entityType: "Employee",
      entityId: employeeId,
      description: `Soft-deleted employee ${existing.firstName} ${existing.lastName} (${existing.staffId})`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete employee" },
      { status: 500 },
    );
  }
}
