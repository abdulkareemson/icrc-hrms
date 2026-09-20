// app/(auth)/layout.tsx
import Link from "next/link";
import Image from "next/image";
import { Shield, Activity, Lock, Users } from "lucide-react";

// ─── Branding Constants ───────────────────────────────────────────────────────
const ORG_NAME = "Infrastructure Concession Regulatory Commission";
const ORG_ADDRESS = "Plot 1270, Ayangba Street, Area 11, Garki, Abuja";
const APP_NAME = "Human Resource Management System";

// ─── Feature Pill Component ───────────────────────────────────────────────────
function FeaturePill({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-xs text-white/90 font-medium transition-all duration-200 hover:bg-white/20">
      <Icon className="h-3.5 w-3.5 text-accent-300" />
      {label}
    </div>
  );
}

// ─── Layout Component ─────────────────────────────────────────────────────────
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Branding ───────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col justify-between p-12 overflow-hidden bg-primary-950">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/icrc-image.jpg"
            alt="ICRC National Infrastructure Projects"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center opacity-95 select-none pointer-events-none"
          />
          {/* Green-to-black gradient overlay for perfect readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-950/90 to-neutral-900/95 mix-blend-multiply" />
        </div>

        {/* Ambient Blur decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 opacity-60">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-primary-400/20 blur-3xl" />
        </div>

        {/* Top: ICRC Logo + Name */}
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-4 group w-fit">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/20 overflow-hidden flex-shrink-0 group-hover:shadow-accent-500/20 transition-all duration-300">
              <Image
                src="/icrc-logo.png"
                alt="ICRC Nigeria logo"
                width={64}
                height={64}
                className="w-full h-full object-contain p-1.5"
                priority
              />
            </div>

            <div>
              <p className="text-white font-bold text-base leading-tight tracking-wide">
                ICRC Nigeria
              </p>
              <p className="text-primary-200 text-xs mt-1 leading-tight font-medium max-w-[220px]">
                {APP_NAME}
              </p>
            </div>
          </Link>
        </div>

        {/* Middle: Hero content */}
        <div className="relative z-20 space-y-6 my-auto">
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Workforce Governance
              <br />
              <span className="text-accent-400">Made Transparent.</span>
            </h1>
            <p className="text-primary-200 text-sm mt-4 max-w-md leading-relaxed">
              Integrated payroll engine, leave manager, and compliance trackers
              configured under the ICRC Act 2005.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 max-w pt-2">
            <FeaturePill icon={Shield} label="NDPR Compliant" />
            <FeaturePill icon={Lock} label="Role-Based Access" />
            <FeaturePill icon={Users} label="Multi-Department" />
            <FeaturePill icon={Activity} label="Immutable Audit Trail" />
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="relative z-20 space-y-1 pt-6 border-t border-white/10">
          <p className="text-accent-400/80 text-xs font-semibold uppercase tracking-wider">
            Federal Commission Headquarters
          </p>
          <p className="text-white/80 text-xs leading-relaxed">{ORG_ADDRESS}</p>
          <p className="text-primary-300/60 text-xs pt-1">
            © {new Date().getFullYear()} {ORG_NAME}
            &nbsp;·&nbsp; Ahmadu Bello University, Zaria (FYP)
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header — shown on small viewports only */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-neutral-100 bg-white">
          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 overflow-hidden flex-shrink-0 shadow-sm">
            <Image
              src="/icrc-logo.png"
              alt="ICRC Nigeria logo"
              width={40}
              height={40}
              className="w-full h-full object-contain p-1"
              priority
            />
          </div>
          <div>
            <p className="font-bold text-neutral-800 text-sm leading-tight">
              ICRC Nigeria
            </p>
            <p className="text-neutral-400 text-[10px] leading-tight mt-0.5">
              HRMS
            </p>
          </div>
        </div>

        {/* Form rendering wrapper area */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-neutral-50">
          <div className="w-full max-w-md animate-fade-in">
            {/* Main authentication form card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-neutral-200/60 border border-neutral-100 p-8">
              {children}
            </div>

            {/* Verification badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-400">
              <Shield className="h-3.5 w-3.5 text-neutral-300" />
              <span>Secured by ICRC HRMS · Federal Government of Nigeria</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
