// app/(public)/apply/success/page.tsx
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type PageSearchParams = Promise<{
  ref?: string | string[];
  title?: string | string[];
}>;

function getParam(value?: string | string[]): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const resolved = await searchParams;
  const applicationRef = getParam(resolved.ref);
  const vacancyTitle = getParam(resolved.title);

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="max-w-lg w-full overflow-hidden shadow-lg">
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">
            Application Submitted!
          </h1>
          <p className="text-primary-100 text-sm">
            Your application has been received successfully.
          </p>
        </div>

        <CardContent className="p-8 text-center">
          {applicationRef && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
                Your Reference Number
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-primary-50 px-6 py-3">
                <Sparkles className="h-4 w-4 text-primary-600" />
                <span className="text-xl font-bold text-primary-800 tracking-wide">
                  {applicationRef}
                </span>
              </div>
            </div>
          )}

          {vacancyTitle && (
            <p className="text-sm text-neutral-600 mb-4">
              Position:{" "}
              <strong className="text-neutral-900">{vacancyTitle}</strong>
            </p>
          )}

          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 mt-0.5">
                  1
                </span>
                <span>
                  A confirmation email has been sent to your email address.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 mt-0.5">
                  2
                </span>
                <span>Our HR team will review your application and CV.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 mt-0.5">
                  3
                </span>
                <span>
                  If shortlisted, you will be contacted for an interview.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-neutral-400 mb-6">
            Please save your reference number for future correspondence.
          </p>

          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Careers
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
