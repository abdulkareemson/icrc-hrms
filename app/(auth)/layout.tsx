// app/(auth)/layout.tsx
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <span className="text-xl font-bold text-white">IC</span>
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-white leading-tight">
              ICRC HRMS
            </h1>
            <p className="text-xs text-primary-200 leading-tight">
              Human Resource Management System
            </p>
          </div>
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md">{children}</div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-primary-300">
        &copy; {new Date().getFullYear()} Infrastructure Concession Regulatory
        Commission. All rights reserved.
      </p>
    </div>
  );
}
