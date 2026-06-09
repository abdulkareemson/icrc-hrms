// app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center font-sans antialiased">
      {/* ICRC branding */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700">
          <span className="text-lg font-bold text-white">IC</span>
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-neutral-900">ICRC HRMS</p>
          <p className="text-xs text-neutral-500">
            Infrastructure Concession Regulatory Commission
          </p>
        </div>
      </div>

      {/* Icon */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-error/10">
        <AlertTriangle className="h-12 w-12 text-error" />
      </div>

      {/* Text */}
      <h1 className="text-2xl font-bold text-neutral-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-neutral-500">
        An unexpected error occurred. This has been logged. Please try again or
        return to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-neutral-400">
          Error ID: {error.digest}
        </p>
      )}

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20 hover:from-primary-800 hover:to-primary-700"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>

      <p className="mt-12 text-xs text-neutral-400">
        ICRC Nigeria · Plot 1270, Ayangba Street, Garki, Abuja
      </p>
    </div>
  );
}
