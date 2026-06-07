// app/api/employees/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { generateStaffId } from "@/lib/staff-id";
import { createEmployeeSchema } from "@/lib/validators/employee.schema";
import { generateWelcomeEmail } from "@/lib/email/templates/welcome";
import { sendEmail } from "@/lib/email/sender";
import { hasPermission } from "@/lib/rbac";
import bcrypt from "bcryptjs";

/**
 * GET /api/employees — paginated, filtered, searchable employee list
 * HR_ADMIN + SUPER_ADMIN only
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

    if (!hasPermission(session.user.role, "employees:read")) {
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
    const search = url.searchParams.get("search")?.trim() ?? "";
    const departmentId = url.searchParams.get("departmentId") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
    const sortOrder =
      url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { staffId: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    // Build orderBy
    const validSortFields: Record<string, unknown> = {
      createdAt: { createdAt: sortOrder },
      firstName: { firstName: sortOrder },
      lastName: { lastName: sortOrder },
      staffId: { staffId: sortOrder },
      jobTitle: { jobTitle: sortOrder },
      employmentDate: { employmentDate: sortOrder },
    };

    const orderBy = validSortFields[sortBy] ?? { createdAt: "desc" };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: orderBy as Record<string, string>,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          staffId: true,
          firstName: true,
          middleName: true,
          lastName: true,
          gender: true,
          jobTitle: true,
          employmentType: true,
          employmentDate: true,
          isActive: true,
          isManager: true,
          profilePhotoKey: true,
          createdAt: true,
          userId: true,
          user: {
            select: {
              email: true,
              role: true,
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
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const formatted = employees.map((emp) => ({
      id: emp.id,
      staffId: emp.staffId,
      firstName: emp.firstName,
      middleName: emp.middleName,
      lastName: emp.lastName,
      fullName: [emp.firstName, emp.middleName, emp.lastName]
        .filter(Boolean)
        .join(" "),
      gender: emp.gender,
      jobTitle: emp.jobTitle,
      employmentType: emp.employmentType,
      employmentDate: emp.employmentDate,
      isActive: emp.isActive,
      isManager: emp.isManager,
      profilePhotoKey: emp.profilePhotoKey,
      email: emp.user.email,
      role: emp.user.role,
      departmentId: emp.department.id,
      departmentCode: emp.department.code,
      departmentName: emp.department.name,
      gradeLevel: emp.gradeLevel.level,
      gradeLevelStep: emp.gradeLevel.step,
      gradeLevelId: emp.gradeLevel.id,
      userId: emp.userId,
      createdAt: emp.createdAt,
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
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/employees — create new employee + user account
 * HR_ADMIN + SUPER_ADMIN only
 * Auto-generates staff ID, hashes password, sends welcome email
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

    if (!hasPermission(session.user.role, "employees:create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);

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

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Check for duplicate NIN
    if (data.nin) {
      const existingNin = await prisma.employee.findUnique({
        where: { nin: data.nin },
      });
      if (existingNin) {
        return NextResponse.json(
          { success: false, error: "An employee with this NIN already exists" },
          { status: 409 },
        );
      }
    }

    // Get department for staff ID generation
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { id: true, code: true, name: true },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 },
      );
    }

    // Validate grade level
    const gradeLevel = await prisma.gradeLevel.findUnique({
      where: { id: data.gradeLevelId },
    });

    if (!gradeLevel) {
      return NextResponse.json(
        { success: false, error: "Grade level not found" },
        { status: 404 },
      );
    }

    // Generate staff ID
    const staffId = await generateStaffId(department.code);

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user + employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: "EMPLOYEE",
          isActive: true,
        },
      });

      const employee = await tx.employee.create({
        data: {
          staffId,
          userId: user.id,
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
          lineManagerId: data.lineManagerId || null,
          isManager: data.isManager,
          bankName: data.bankName || null,
          accountNumber: data.accountNumber || null,
          bankSortCode: data.bankSortCode || null,
        },
        include: {
          department: { select: { name: true, code: true } },
          gradeLevel: { select: { level: true, step: true } },
        },
      });

      // Create leave balances for all leave types
      const leaveTypes = await tx.leaveType.findMany();
      const currentYear = new Date().getFullYear();

      await tx.leaveBalance.createMany({
        data: leaveTypes.map((lt) => ({
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: currentYear,
          totalDays: lt.daysAllowed,
          usedDays: 0,
        })),
      });

      return { user, employee };
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(request);
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CREATE",
      entityType: "Employee",
      entityId: result.employee.id,
      description: `Created employee ${data.firstName} ${data.lastName} (${staffId})`,
      metadata: {
        staffId,
        email: data.email,
        department: department.code,
        gradeLevel: `GL ${gradeLevel.level} Step ${gradeLevel.step}`,
      },
      ipAddress,
      userAgent,
    });

    // Send welcome email (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const emailContent = generateWelcomeEmail({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      staffId,
      department: department.name,
      jobTitle: data.jobTitle,
      temporaryPassword: data.password,
      loginUrl: `${appUrl}/login`,
    });

    void sendEmail({
      to: data.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.employee.id,
          staffId,
          userId: result.user.id,
          fullName: `${data.firstName} ${data.lastName}`,
          email: data.email,
          department: department.name,
        },
        message: `Employee created successfully with Staff ID: ${staffId}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/employees error:", error);

    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A record with these details already exists"
        : "Failed to create employee";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
