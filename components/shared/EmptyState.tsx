// components/shared/EmptyState.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
        <Icon className="h-8 w-8 text-neutral-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href}>
              <Button className="bg-primary-700 hover:bg-primary-800 text-white">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={action.onClick}
              className="bg-primary-700 hover:bg-primary-800 text-white"
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
