// lib/validators/announcement.schema.ts

import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// CREATE ANNOUNCEMENT
// ─────────────────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be under 200 characters")
    .trim(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10_000, "Content must be under 10,000 characters")
    .trim(),
  target: z.enum(["ALL", "DEPARTMENT", "ROLE"]).default("ALL"),
  departmentId: z.string().uuid().optional().nullable(),
  targetRole: z
    .enum(["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"])
    .optional()
    .nullable(),
  isUrgent: z.boolean().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

// ─────────────────────────────────────────────────────────────
// UPDATE ANNOUNCEMENT
// ─────────────────────────────────────────────────────────────

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// ─────────────────────────────────────────────────────────────
// QUERY PARAMS
// ─────────────────────────────────────────────────────────────

export const announcementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  target: z.enum(["ALL", "DEPARTMENT", "ROLE"]).optional(),
  isUrgent: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "publishedAt", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AnnouncementQueryInput = z.infer<typeof announcementQuerySchema>;
