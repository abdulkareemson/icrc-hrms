// app/(dashboard)/admin/settings/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/rbac";
import { SystemSettingsClient } from "@/components/modules/admin/SystemSettingsClient";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdmin(session.user.role)) redirect("/dashboard");

  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: "asc" },
    include: {
      updatedByAdmin: { select: { email: true } },
    },
  });

  const serialized = configs.map((c) => ({
    id: c.id,
    key: c.key,
    value: c.value,
    description: c.description,
    updatedByEmail: c.updatedByAdmin?.email ?? null,
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary-700">Administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">
          System Settings
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Manage global system configuration values.
        </p>
      </div>

      <SystemSettingsClient configs={serialized} />
    </div>
  );
}
