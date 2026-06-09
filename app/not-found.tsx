// app/not-found.tsx
import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
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
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100">
            <FileQuestion className="h-12 w-12 text-neutral-400" />
          </div>

          {/* Text */}
          <h1 className="text-6xl font-bold text-neutral-900">404</h1>
          <h2 className="mt-3 text-xl font-semibold text-neutral-700">
            Page not found
          </h2>
          <p className="mt-2 max-w-md text-sm text-neutral-500">
            The page you are looking for does not exist or has been moved.
            Please check the URL or return to the dashboard.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-primary-700/20 hover:from-primary-800 hover:to-primary-700"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
            <Link
              href="javascript:history.back()"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-12 text-xs text-neutral-400">
            ICRC Nigeria · Plot 1270, Ayangba Street, Garki, Abuja
          </p>
        </div>
      </body>
    </html>
  );
}
