// app/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardPath } from "@/lib/rbac";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    redirect(getDashboardPath(session.user.role));
  }

  redirect("/login");
}
