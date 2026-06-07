// lib/validators/complaint.schema.ts
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// COMPLAINT — CREATE
// ─────────────────────────────────────────────────────────────

export const createComplaintSchema = z.object({
  category: z.enum(
    [
      "HARASSMENT",
      "PAYROLL",
      "WORKPLACE_SAFETY",
      "LEAVE_DISPUTE",
      "DISCRIMINATION",
      "MISCONDUCT",
      "OTHER",
    ],
    { required_error: "Please select a category" },
  ),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
  isConfidential: z.boolean().default(false),
});

export type CreateComplaintFormValues = z.infer<typeof createComplaintSchema>;

// ─────────────────────────────────────────────────────────────
// COMPLAINT — HR UPDATE
// ─────────────────────────────────────────────────────────────

export const updateComplaintSchema = z
  .object({
    status: z.enum(
      ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "DISMISSED"],
      { required_error: "Status is required" },
    ),
    hrNotes: z
      .string()
      .max(1000, "Notes must be at most 1000 characters")
      .optional()
      .or(z.literal("")),
    resolutionNote: z
      .string()
      .max(1000, "Resolution note must be at most 1000 characters")
      .optional()
      .or(z.literal("")),
    assignedToId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.status === "RESOLVED") {
        return data.resolutionNote && data.resolutionNote.trim().length >= 10;
      }
      return true;
    },
    {
      message:
        "Resolution note is required when resolving a complaint (min 10 characters)",
      path: ["resolutionNote"],
    },
  );

export type UpdateComplaintFormValues = z.infer<typeof updateComplaintSchema>;

// ─────────────────────────────────────────────────────────────
// CATEGORY DISPLAY
// ─────────────────────────────────────────────────────────────

export const COMPLAINT_CATEGORIES = [
  { value: "HARASSMENT", label: "Harassment" },
  { value: "PAYROLL", label: "Payroll Issue" },
  { value: "WORKPLACE_SAFETY", label: "Workplace Safety" },
  { value: "LEAVE_DISPUTE", label: "Leave Dispute" },
  { value: "DISCRIMINATION", label: "Discrimination" },
  { value: "MISCONDUCT", label: "Misconduct" },
  { value: "OTHER", label: "Other" },
] as const;

export const COMPLAINT_CATEGORY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  HARASSMENT: {
    label: "Harassment",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  PAYROLL: {
    label: "Payroll",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  WORKPLACE_SAFETY: {
    label: "Safety",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  LEAVE_DISPUTE: {
    label: "Leave",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  DISCRIMINATION: {
    label: "Discrimination",
    className: "bg-pink-100 text-pink-800 border-pink-200",
  },
  MISCONDUCT: {
    label: "Misconduct",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  OTHER: {
    label: "Other",
    className: "bg-neutral-100 text-neutral-700 border-neutral-200",
  },
};

// ─────────────────────────────────────────────────────────────
// STATUS DISPLAY
// ─────────────────────────────────────────────────────────────

export const COMPLAINT_STATUS_CONFIG = {
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-success/10 text-success border-success/20",
  },
  DISMISSED: {
    label: "Dismissed",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
} as const;

export type ComplaintStatus = keyof typeof COMPLAINT_STATUS_CONFIG;
