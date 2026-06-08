// app/api/reports/complaint-report/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isHR } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorised" },
        { status: 401 },
      );
    }
    if (!isHR(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(
      searchParams.get("year") ?? String(new Date().getFullYear()),
      10,
    );

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const complaints = await prisma.complaint.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        referenceNumber: true,
        category: true,
        title: true,
        status: true,
        isConfidential: true,
        createdAt: true,
        resolvedAt: true,
        employee: {
          select: {
            staffId: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Apply confidentiality rules for HR_ADMIN
    const isSuper = session.user.role === "SUPER_ADMIN";

    const header =
      "Reference,Category,Title,Status,Confidential,Employee,Staff ID,Department,Submitted,Resolved";

    const rows = complaints.map((c) => {
      const employeeName =
        c.isConfidential && !isSuper
          ? "Anonymous Employee"
          : `${c.employee.firstName} ${c.employee.lastName}`;
      const staffId = c.isConfidential && !isSuper ? "—" : c.employee.staffId;
      const dept =
        c.isConfidential && !isSuper ? "—" : c.employee.department.name;

      return `"${c.referenceNumber}","${c.category}","${c.title}","${c.status}",${c.isConfidential ? "Yes" : "No"},"${employeeName}","${staffId}","${dept}","${c.createdAt.toISOString().split("T")[0]}","${c.resolvedAt?.toISOString().split("T")[0] ?? ""}"`;
    });

    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="complaint_report.csv"',
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/complaint-report]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
