// app/(public)/layout.tsx

import { ICRC } from "@/constants/system";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Public Header */}
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-700 to-primary-800 text-sm font-bold text-white">
                ICRC
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">
                  {ICRC.shortName}
                </p>
                <p className="text-xs text-neutral-500">{ICRC.name}</p>
              </div>
            </div>

            <a
              href="/login"
              className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Staff Login
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs text-neutral-500">
              © {new Date().getFullYear()} {ICRC.name}
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>{ICRC.address}</span>
              <a
                href={ICRC.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-700 hover:underline"
              >
                {ICRC.website}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
