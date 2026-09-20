// app/loading.tsx
import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-50 select-none">
      {/* Decorative Brand Top Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-500" />

      <div className="flex flex-col items-center space-y-6 max-w-xs text-center">
        {/* Animated Pulsing Logo Shell */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white border border-neutral-200/80 shadow-lg animate-pulse">
          <Image
            src="/icrc-logo.png"
            alt="ICRC National Seal"
            width={72}
            height={72}
            className="object-contain"
            priority
          />
        </div>

        {/* Informative Status Metadata */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-neutral-900 tracking-wide uppercase">
            ICRC Nigeria
          </h3>
          <p className="text-xs text-neutral-400 font-medium animate-pulse">
            Establishing secure connection...
          </p>
        </div>
      </div>

      {/* Footer Branding Tag */}
      <div className="absolute bottom-8 text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
        FGN Portal Gateway
      </div>
    </div>
  );
}
