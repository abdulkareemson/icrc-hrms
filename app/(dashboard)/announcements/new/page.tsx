// app/(dashboard)/announcements/new/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AnnouncementForm } from "@/components/forms/announcement/AnnouncementForm";

export default async function NewAnnouncementPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasPermission(session.user.role, "announcements:create")) {
    redirect("/announcements");
  }

  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">
          HR Communications
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          New Announcement
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Compose and publish an announcement to your target audience.
        </p>
      </div>

      <AnnouncementForm departments={departments} mode="create" />
    </div>
  );
}
