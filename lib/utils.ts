// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format kobo (integer) to Naira display string
 * e.g. 1650000 kobo → ₦16,500.00
 */
export function formatCurrency(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);
}

/**
 * Format a Date or ISO string to WAT display (UTC+1)
 * e.g. "12 Jun 2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy");
}

/**
 * Format a Date or ISO string to WAT date + time display
 * e.g. "12 Jun 2026, 09:30 AM"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy, hh:mm a");
}

/**
 * Format a Date to relative time
 * e.g. "2 hours ago"
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Get initials from a full name
 * e.g. "Mohammed Zanna Bilkisu" → "MZ"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Truncate a string to a max length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

/**
 * Convert a file size in bytes to a human-readable string
 * e.g. 1048576 → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];
  if (!size) return `${bytes} B`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${size}`;
}

/**
 * Capitalize the first letter of each word
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate a color from a string (for avatar backgrounds)
 */
export function stringToColor(str: string): string {
  const colors = [
    "#15803d",
    "#166534",
    "#0f766e",
    "#0e7490",
    "#1d4ed8",
    "#7c3aed",
    "#a21caf",
    "#be123c",
    "#c2410c",
    "#b45309",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index] ?? "#15803d";
}
