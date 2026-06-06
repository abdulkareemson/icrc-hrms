// lib/auth.ts
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  isManager?: boolean;
  profilePhotoKey?: string | null;
  departmentId?: string;
  departmentCode?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  user: AuthUser;
}

// ─────────────────────────────────────────────────────────────
// SESSION TOKEN GENERATION
// ─────────────────────────────────────────────────────────────

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

// ─────────────────────────────────────────────────────────────
// COOKIE CONFIG
// ─────────────────────────────────────────────────────────────

const SESSION_COOKIE_NAME = "icrc_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─────────────────────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
      include: {
        employee: {
          include: {
            department: { select: { code: true } },
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Your account has been deactivated. Contact your administrator.",
      };
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    const authUser = buildAuthUser(user);

    return { success: true, user: authUser };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ─────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

// ─────────────────────────────────────────────────────────────
// GET CURRENT SESSION
// ─────────────────────────────────────────────────────────────

export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            employee: {
              include: {
                department: { select: { code: true } },
              },
            },
          },
        },
      },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      const cs = await cookies();
      cs.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Check if user is still active
    if (!session.user.isActive || session.user.deletedAt) {
      await prisma.session.delete({ where: { id: session.id } });
      const cs = await cookies();
      cs.delete(SESSION_COOKIE_NAME);
      return null;
    }

    const authUser = buildAuthUser(session.user);

    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      user: authUser,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// REQUIRE SESSION (throws if not authenticated)
// ─────────────────────────────────────────────────────────────

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

// ─────────────────────────────────────────────────────────────
// HELPER: Build AuthUser from Prisma user
// ─────────────────────────────────────────────────────────────

interface UserWithEmployee {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    isManager: boolean;
    profilePhotoKey: string | null;
    departmentId: string;
    department: { code: string };
  } | null;
}

function buildAuthUser(user: UserWithEmployee): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    employeeId: user.employee?.id,
    firstName: user.employee?.firstName,
    lastName: user.employee?.lastName,
    fullName: user.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`
      : user.email,
    isManager: user.employee?.isManager ?? false,
    profilePhotoKey: user.employee?.profilePhotoKey,
    departmentId: user.employee?.departmentId,
    departmentCode: user.employee?.department.code,
  };
}
