// app/api/recruitment/vacancies/[vacancyId]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { createAuditLog, getRequestMeta } from "@/lib/audit"
import { updateVacancySchema } from "@/lib/validators/recruitment.schema"
import { hasPermission } from "@/lib/rbac"

/**
 * GET /api/recruitment/vacancies/[vacancyId]
 * Public: published vacancies (no auth)
 * HR: any vacancy
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vacancyId: string }> }
) {
  try {
    const session = await getSession()
    const { vacancyId } = await params

    const isHR = session && (session.user.role === "HR_ADMIN" || session.user.role === "SUPER_ADMIN")

    const vacancy = await prisma.jobVacancy.findFirst({
      where: {
        id: vacancyId,
        deletedAt: null,
        ...(isHR ? {} : { isPublished: true }),
      },
      include: {
        department: { select: { id: true, code: true, name: true } },
        _count: { select: { applications: true } },
      },
    })

    if (!vacancy) {
      return NextResponse.json({ success: false, error: "Vacancy not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: vacancy.id,
        title: vacancy.title,
        departmentId: vacancy.department.id,
        departmentCode: vacancy.department.code,
        departmentName: vacancy.department.name,
        jobType: vacancy.jobType,
        location: vacancy.location,
        description: vacancy.description,
        requirements: vacancy.requirements,
        responsibilities: vacancy.responsibilities,
        salaryRange: vacancy.salaryRange,
        deadline: vacancy.deadline.toISOString(),
        isPublished: vacancy.isPublished,
        publishedAt: vacancy.publishedAt?.toISOString() ?? null,
        closedAt: vacancy.closedAt?.toISOString() ?? null,
        applicationCount: vacancy._count.applications,
        createdAt: vacancy.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("GET /api/recruitment/vacancies/[vacancyId] error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch vacancy" }, { status: 500 })
  }
}

/**
 * PUT /api/recruitment/vacancies/[vacancyId]
 * HR only
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ vacancyId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    if (!hasPermission(session.user.role, "recruitment:manage")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { vacancyId } = await params
    const body = await request.json()
    const parsed = updateVacancySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const existing = await prisma.jobVacancy.findFirst({
      where: { id: vacancyId, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: "Vacancy not found" }, { status: 404 })
    }

    const data = parsed.data
    const wasPublished = existing.isPublished
    const nowPublished = data.isPublished

    await prisma.jobVacancy.update({
      where: { id: vacancyId },
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
        publishedAt: !wasPublished && nowPublished ? new Date() : existing.publishedAt,
      },
    })

    const { ipAddress, userAgent } = getRequestMeta(request)
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "UPDATE",
      entityType: "JobVacancy",
      entityId: vacancyId,
      description: `Updated vacancy: ${data.title}${!wasPublished && nowPublished ? " — now published" : ""}`,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: "Vacancy updated successfully",
    })
  } catch (error) {
    console.error("PUT /api/recruitment/vacancies/[vacancyId] error:", error)
    return NextResponse.json({ success: false, error: "Failed to update vacancy" }, { status: 500 })
  }
}

/**
 * DELETE /api/recruitment/vacancies/[vacancyId]
 * HR only — soft delete
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ vacancyId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    if (!hasPermission(session.user.role, "recruitment:manage")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { vacancyId } = await params

    const existing = await prisma.jobVacancy.findFirst({
      where: { id: vacancyId, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: "Vacancy not found" }, { status: 404 })
    }

    await prisma.jobVacancy.update({
      where: { id: vacancyId },
      data: { deletedAt: new Date(), isPublished: false },
    })

    const { ipAddress, userAgent } = getRequestMeta(request)
    await createAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DELETE",
      entityType: "JobVacancy",
      entityId: vacancyId,
      description: `Deleted vacancy: ${existing.title}`,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true, message: "Vacancy deleted" })
  } catch (error) {
    console.error("DELETE /api/recruitment/vacancies/[vacancyId] error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete vacancy" }, { status: 500 })
  }
}