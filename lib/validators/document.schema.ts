// lib/validators/document.schema.ts

import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// DOCUMENT TYPES (mirrors Prisma enum)
// ─────────────────────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contract",
  OFFER_LETTER: "Offer Letter",
  NIN: "National ID (NIN)",
  PASSPORT: "Passport",
  CERTIFICATE: "Certificate",
  MEDICAL: "Medical Record",
  DISCIPLINARY: "Disciplinary Record",
  OTHER: "Other",
};

// ─────────────────────────────────────────────────────────────
// UPLOAD DOCUMENT
// ─────────────────────────────────────────────────────────────

export const uploadDocumentSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  documentType: z.enum([
    "CONTRACT",
    "OFFER_LETTER",
    "NIN",
    "PASSPORT",
    "CERTIFICATE",
    "MEDICAL",
    "DISCIPLINARY",
    "OTHER",
  ]),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title must be under 200 characters")
    .trim(),
  fileKey: z.string().min(1, "File key is required"),
  fileSize: z.number().int().min(1, "File size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// ─────────────────────────────────────────────────────────────
// QUERY PARAMS
// ─────────────────────────────────────────────────────────────

export const documentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  employeeId: z.string().uuid().optional(),
  documentType: z
    .enum([
      "CONTRACT",
      "OFFER_LETTER",
      "NIN",
      "PASSPORT",
      "CERTIFICATE",
      "MEDICAL",
      "DISCIPLINARY",
      "OTHER",
    ])
    .optional(),
  sortBy: z.enum(["createdAt", "title", "documentType"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;