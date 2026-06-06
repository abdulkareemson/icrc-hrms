// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      userRole={session.user.role}
      isManager={session.user.isManager ?? false}
      userName={session.user.fullName ?? session.user.email}
      userEmail={session.user.email}
      profilePhotoKey={session.user.profilePhotoKey ?? null}
    >
      {children}
    </DashboardShell>
  );
}
