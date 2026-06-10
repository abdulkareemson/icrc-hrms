// app/not-found.tsx
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          {/* ICRC branding */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-700 overflow-hidden shadow-lg shadow-primary-700/20">
              <Image
                src="/icrc-logo.png"
                alt="ICRC Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="text-left">
              <p className="text-lg font-bold text-neutral-900">ICRC HRMS</p>
              <p className="text-xs text-neutral-500">
                Human Resource Management System
              </p>
            </div>
          </div>

          {/* 404 */}
          <div className="mb-2">
            <span className="text-8xl font-black text-primary-700/10 leading-none select-none">
              404
            </span>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900">
            Page Not Found
          </h1>

          <p className="mt-4 max-w-md text-sm text-neutral-500 leading-relaxed">
            The page you are looking for does not exist or has been moved.
            Please check the URL or return to the dashboard.
          </p>

          {/* Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary-700/20 hover:bg-primary-800 transition-colors cursor-pointer"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Login
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-16 text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} Infrastructure Concession Regulatory
            Commission · Plot 1270, Ayangba Street, Garki, Abuja
          </p>
        </div>
      </body>
    </html>
  );
}