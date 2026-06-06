// components/shared/PageHeader.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-neutral-500">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {action && action.href ? (
          <Link href={action.href}>
            <Button className="bg-primary-700 hover:bg-primary-800 text-white">
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          </Link>
        ) : action ? (
          <Button
            onClick={action.onClick}
            className="bg-primary-700 hover:bg-primary-800 text-white"
          >
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
