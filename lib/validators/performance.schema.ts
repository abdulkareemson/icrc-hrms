// lib/validators/performance.schema.ts

import { z } from "zod";
import { PerformanceRating, GoalStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────────────────────

export const performanceRatingEnum = z.nativeEnum(PerformanceRating);
export const goalStatusEnum = z.nativeEnum(GoalStatus);

// ─────────────────────────────────────────────────────────────
// INITIATE REVIEW (HR only — single)
// ─────────────────────────────────────────────────────────────

export const initiateReviewSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  reviewerId: z.string().uuid("Invalid reviewer ID"),
  reviewPeriod: z
    .string()
    .min(1, "Review period is required")
    .max(100, "Review period too long")
    .trim(),
  reviewYear: z
    .number()
    .int()
    .min(2020, "Year must be 2020 or later")
    .max(2099, "Year must be before 2100"),
});

export type InitiateReviewInput = z.infer<typeof initiateReviewSchema>;

// ─────────────────────────────────────────────────────────────
// BULK INITIATE
// ─────────────────────────────────────────────────────────────

export const bulkInitiateReviewSchema = z.object({
  employeeIds: z
    .array(z.string().uuid("Invalid employee ID"))
    .min(1, "Select at least one employee")
    .max(200, "Cannot initiate more than 200 reviews at once"),
  reviewPeriod: z
    .string()
    .min(1, "Review period is required")
    .max(100, "Review period too long")
    .trim(),
  reviewYear: z
    .number()
    .int()
    .min(2020, "Year must be 2020 or later")
    .max(2099, "Year must be before 2100"),
});

export type BulkInitiateReviewInput = z.infer<typeof bulkInitiateReviewSchema>;

// ─────────────────────────────────────────────────────────────
// SELF ASSESSMENT
// ─────────────────────────────────────────────────────────────

export const selfAssessmentSchema = z.object({
  employeeSelfRating: performanceRatingEnum,
  employeeSelfComment: z
    .string()
    .min(10, "Self-assessment comment must be at least 10 characters")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

export type SelfAssessmentInput = z.infer<typeof selfAssessmentSchema>;

// ─────────────────────────────────────────────────────────────
// MANAGER REVIEW
// ─────────────────────────────────────────────────────────────

export const managerReviewSchema = z.object({
  managerRating: performanceRatingEnum,
  managerComment: z
    .string()
    .min(10, "Manager review comment must be at least 10 characters")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

export type ManagerReviewInput = z.infer<typeof managerReviewSchema>;

// ─────────────────────────────────────────────────────────────
// HR FINAL REVIEW
// ─────────────────────────────────────────────────────────────

export const hrFinalReviewSchema = z.object({
  hrFinalRating: performanceRatingEnum,
  hrComment: z
    .string()
    .min(10, "HR final comment must be at least 10 characters")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

export type HRFinalReviewInput = z.infer<typeof hrFinalReviewSchema>;

// ─────────────────────────────────────────────────────────────
// GOAL — CREATE
// ─────────────────────────────────────────────────────────────

export const createGoalSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID"),
  title: z
    .string()
    .min(3, "Goal title must be at least 3 characters")
    .max(150, "Goal title cannot exceed 150 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Goal description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters")
    .trim(),
  targetDate: z
    .string()
    .min(1, "Target date is required")
    .refine((d) => !isNaN(Date.parse(d)), "Invalid target date")
    .refine(
      (d) => new Date(d) > new Date(),
      "Target date must be in the future",
    ),
  weight: z
    .number()
    .int("Weight must be a whole number")
    .min(1, "Weight must be at least 1%")
    .max(100, "Weight cannot exceed 100%"),
  status: goalStatusEnum.optional().default("NOT_STARTED"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

// ─────────────────────────────────────────────────────────────
// GOAL — UPDATE
// ─────────────────────────────────────────────────────────────

export const updateGoalSchema = z.object({
  title: z
    .string()
    .min(3, "Goal title must be at least 3 characters")
    .max(150, "Goal title cannot exceed 150 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, "Goal description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters")
    .trim()
    .optional(),
  targetDate: z
    .string()
    .min(1, "Target date is required")
    .refine((d) => !isNaN(Date.parse(d)), "Invalid target date")
    .optional(),
  weight: z
    .number()
    .int("Weight must be a whole number")
    .min(1, "Weight must be at least 1%")
    .max(100, "Weight cannot exceed 100%")
    .optional(),
  status: goalStatusEnum.optional(),
  completionNote: z
    .string()
    .max(500, "Completion note cannot exceed 500 characters")
    .trim()
    .optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// ─────────────────────────────────────────────────────────────
// QUERY PARAMS
// ─────────────────────────────────────────────────────────────

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  year: z.coerce.number().int().min(2020).max(2099).optional(),
  isFinalized: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  employeeId: z.string().uuid().optional(),
  sortBy: z
    .enum(["createdAt", "reviewYear", "reviewPeriod"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;