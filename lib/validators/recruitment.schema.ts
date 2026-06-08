// lib/validators/recruitment.schema.ts
import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// VACANCY — CREATE / EDIT
// ─────────────────────────────────────────────────────────────

export const createVacancySchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  departmentId: z.string().min(1, "Department is required"),
  jobType: z.enum(["FULL_TIME", "CONTRACT", "PART_TIME", "INTERN"], {
    required_error: "Job type is required",
  }),
  location: z
    .string()
    .min(2, "Location is required")
    .max(200)
    .default("Abuja, Nigeria"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be at most 5000 characters"),
  requirements: z
    .string()
    .min(10, "Requirements must be at least 10 characters")
    .max(3000, "Requirements must be at most 3000 characters"),
  responsibilities: z
    .string()
    .min(10, "Responsibilities must be at least 10 characters")
    .max(3000, "Responsibilities must be at most 3000 characters"),
  salaryRange: z.string().max(100).optional().or(z.literal("")),
  deadline: z.string().min(1, "Application deadline is required"),
  isPublished: z.boolean().default(false),
});

export type CreateVacancyFormValues = z.infer<typeof createVacancySchema>;

export const updateVacancySchema = createVacancySchema;

export type UpdateVacancyFormValues = z.infer<typeof updateVacancySchema>;

// ─────────────────────────────────────────────────────────────
// APPLICATION — PUBLIC SUBMISSION (NO AUTH)
// ─────────────────────────────────────────────────────────────

export const publicApplicationSchema = z.object({
  vacancyId: z.string().min(1, "Vacancy ID is required"),
  applicantName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  applicantEmail: z.string().email("Please enter a valid email address"),
  applicantPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\+?[0-9\s-]+$/, "Please enter a valid phone number"),
  cvKey: z.string().min(1, "CV upload is required"),
  coverLetterKey: z.string().optional().or(z.literal("")),
  additionalInfo: z
    .string()
    .max(1000, "Additional info must be at most 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type PublicApplicationFormValues = z.infer<
  typeof publicApplicationSchema
>;

// ─────────────────────────────────────────────────────────────
// APPLICATION — HR UPDATE
// ─────────────────────────────────────────────────────────────

export const updateApplicationSchema = z.object({
  status: z.enum(
    [
      "APPLIED",
      "SHORTLISTED",
      "INTERVIEW_SCHEDULED",
      "OFFER_EXTENDED",
      "HIRED",
      "REJECTED",
    ],
    { required_error: "Status is required" },
  ),
  hrNotes: z.string().max(1000).optional().or(z.literal("")),
  interviewDate: z.string().optional().or(z.literal("")),
  interviewMode: z.string().max(50).optional().or(z.literal("")),
  interviewVenue: z.string().max(200).optional().or(z.literal("")),
});

export type UpdateApplicationFormValues = z.infer<
  typeof updateApplicationSchema
>;

// ─────────────────────────────────────────────────────────────
// JOB TYPE OPTIONS
// ─────────────────────────────────────────────────────────────

export const JOB_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "INTERN", label: "Internship" },
] as const;

// ─────────────────────────────────────────────────────────────
// APPLICATION STATUS CONFIG
// ─────────────────────────────────────────────────────────────

export const APPLICATION_STATUS_CONFIG = {
  APPLIED: {
    label: "Applied",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  INTERVIEW_SCHEDULED: {
    label: "Interview Scheduled",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  OFFER_EXTENDED: {
    label: "Offer Extended",
    className: "bg-teal-100 text-teal-800 border-teal-200",
  },
  HIRED: {
    label: "Hired",
    className: "bg-success/10 text-success border-success/20",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-error/10 text-error border-error/20",
  },
} as const;

export type ApplicationStatus = keyof typeof APPLICATION_STATUS_CONFIG;
