// lib/auth-client.ts
"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────
// SESSION HOOK
// ─────────────────────────────────────────────────────────────

interface UseSessionReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const data = (await response.json()) as { user: AuthUser };
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refresh,
  };
}

// ─────────────────────────────────────────────────────────────
// SIGN OUT HOOK
// ─────────────────────────────────────────────────────────────

export function useSignOut() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = useCallback(() => {
    startTransition(async () => {
      try {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          credentials: "include",
        });
        router.replace("/login");
      } catch {
        router.replace("/login");
      }
    });
  }, [router]);

  return {
    signOut: handleSignOut,
    isPending,
  };
}
