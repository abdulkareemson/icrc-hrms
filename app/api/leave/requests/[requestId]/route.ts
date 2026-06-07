// app/api/leave/requests/[requestId]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { createAuditLog, getRequestMeta } from "@/lib/audit"

/**
 * GET /api/leave/requests/[requestId]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { requestId } = await params

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            lineManagerId: true,
            department: { select: { name: true, code: true } },
            user: { select: { id: true } },
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            isPaid: true,
            requiresDocument: true,
          },
        },
        manager: {
          select: {
            id: true,
            staffId: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
          },
        },
      },
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      )
    }

    // Access check
    if (session.user.role === "EMPLOYEE") {
      const isOwn = leaveRequest.employee.user.id === session.user.id
      const isDirectReport =
        session.user.isManager &&
        leaveRequest.employee.lineManagerId === session.user.employeeId

      if (!isOwn && !isDirectReport) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        staffId: leaveRequest.employee.staffId,
        jobTitle: leaveRequest.employee.jobTitle,
        department: leaveRequest.employee.department.name,
        departmentCode: leaveRequest.employee.department.code,
        leaveTypeId: leaveRequest.leaveTypeId,
        leaveTypeName: leaveRequest.leaveType.name,
        isPaid: leaveRequest.leaveType.isPaid,
        requiresDocument: leaveRequest.leaveType.requiresDocument,
        startDate: leaveRequest.startDate.toISOString(),
        endDate: leaveRequest.endDate.toISOString(),
        totalDays: leaveRequest.totalDays,
        reason: leaveRequest.reason,
        status: leaveRequest.status,
        documentKey: leaveRequest.documentKey,
        managerId: leaveRequest.managerId,
        managerName: leaveRequest.manager
          ? `${leaveRequest.manager.firstName} ${leaveRequest.manager.lastName}`
          : null,
        managerComment: leaveRequest.managerComment,
        managerApprovedAt: leaveRequest.managerApprovedAt?.toISOString() ?? null,
        hrAdminId: leaveRequest.hrAdminId,
        hrComment: leaveRequest.hrComment,
        hrApprovedAt: leaveRequest.hrApprovedAt?.toISOString() ?? null,
        createdAt: leaveRequest.createdAt.toISOString(),
        updatedAt: leaveRequest.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("GET /api/leave/requests/[requestId] error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave request" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/leave/requests/[requestId]
 * Employee can cancel own PENDING request only
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { requestId } = await params

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        employee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            staffId: true,
          },
        },
        leaveType: { select: { name: true } },
      },
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      )
    }

    // Only the employee who submitted can cancel
    if (leaveRequest.employee.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    // Can only cancel if still pending
    if (
      leaveRequest.status !== "PENDING_MANAGER" &&
      leaveRequest.status !== "PENDING_HR"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel a request with status: ${leaveRequest.status}`,
        },
        { status: 409 }
      )
    }

    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    })

    const { ipAddress, userAgent } = getRequestMeta(request)
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "LeaveRequest",
      entityId: requestId,
      description: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName} cancelled ${leaveRequest.leaveType.name} request`,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: "Leave request cancelled successfully",
    })
  } catch (error) {
    console.error("PUT /api/leave/requests/[requestId] error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to cancel leave request" },
      { status: 500 }
    )
  }
}