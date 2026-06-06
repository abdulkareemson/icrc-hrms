// app/api/auth/[...betterauth]/route.ts
import { NextResponse } from "next/server";
import { getSession, signIn, signOut } from "@/lib/auth";
import { getRequestMeta, createAuditLog } from "@/lib/audit";

/**
 * GET /api/auth/session — get current session
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];

  if (lastSegment === "session") {
    try {
      const session = await getSession();

      if (!session) {
        return NextResponse.json({ user: null }, { status: 401 });
      }

      return NextResponse.json({ user: session.user });
    } catch {
      return NextResponse.json({ user: null }, { status: 401 });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

/**
 * POST /api/auth/sign-in — sign in with email + password
 * POST /api/auth/sign-out — sign out
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];

  // ── SIGN IN ──────────────────────────────────────────────
  if (lastSegment === "sign-in") {
    try {
      const body = (await request.json()) as {
        email?: string;
        password?: string;
      };

      if (!body.email || !body.password) {
        return NextResponse.json(
          { success: false, error: "Email and password are required" },
          { status: 400 },
        );
      }

      const { ipAddress, userAgent } = getRequestMeta(request);

      const result = await signIn(
        body.email,
        body.password,
        ipAddress ?? undefined,
        userAgent ?? undefined,
      );

      if (!result.success || !result.user) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 401 },
        );
      }

      // Audit log
      await createAuditLog({
        actorId: result.user.id,
        actorEmail: result.user.email,
        action: "LOGIN",
        entityType: "User",
        entityId: result.user.id,
        description: `User ${result.user.email} logged in`,
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        user: result.user,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "An unexpected error occurred" },
        { status: 500 },
      );
    }
  }

  // ── SIGN OUT ─────────────────────────────────────────────
  if (lastSegment === "sign-out") {
    try {
      const session = await getSession();

      if (session) {
        const { ipAddress, userAgent } = getRequestMeta(request);
        await createAuditLog({
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "LOGOUT",
          entityType: "User",
          entityId: session.user.id,
          description: `User ${session.user.email} logged out`,
          ipAddress,
          userAgent,
        });
      }

      await signOut();

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { success: false, error: "Sign out failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
