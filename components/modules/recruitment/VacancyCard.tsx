// components/modules/recruitment/VacancyCard.tsx
import Link from "next/link";
import { Briefcase, CalendarDays, MapPin, Users } from "lucide-react";

interface VacancyCardProps {
  id: string;
  title: string;
  departmentName: string;
  jobType: string;
  location: string;
  deadline: string;
  applicationCount?: number;
  isPublic?: boolean;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatJobType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function isDeadlineSoon(deadline: string): boolean {
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

export function VacancyCard({
  id,
  title,
  departmentName,
  jobType,
  location,
  deadline,
  applicationCount,
  isPublic = false,
}: VacancyCardProps) {
  const href = isPublic ? `/careers/${id}` : `/recruitment/vacancies/${id}`;
  const deadlineSoon = isDeadlineSoon(deadline);

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-200"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 line-clamp-2">
            {title}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{departmentName}</p>
        </div>

        <span className="shrink-0 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 border border-primary-100">
          {formatJobType(jobType)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-neutral-400" />
          <span>{location}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-neutral-400" />
          <span className={deadlineSoon ? "text-warning font-medium" : ""}>
            {deadlineSoon ? "Closing soon: " : "Deadline: "}
            {formatDate(deadline)}
          </span>
        </div>

        {applicationCount !== undefined && (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-neutral-400" />
            <span>
              {applicationCount} applicant{applicationCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {isPublic && (
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-700">
          <Briefcase className="h-4 w-4" />
          View Details & Apply →
        </div>
      )}
    </Link>
  );
}
