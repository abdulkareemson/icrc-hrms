// lib/validators/employee.schema.ts
import { z } from "zod"

// ─────────────────────────────────────────────────────────────
// CREATE EMPLOYEE SCHEMA
// ─────────────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  // Personal Information
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  middleName: z
    .string()
    .max(50, "Middle name must be at most 50 characters")
    .regex(/^[a-zA-Z\s'-]*$/, "Middle name can only contain letters, spaces, hyphens, and apostrophes")
    .optional()
    .or(z.literal("")),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  gender: z.enum(["Male", "Female"], {
    required_error: "Please select a gender",
  }),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      const date = new Date(val)
      const now = new Date()
      const age = now.getFullYear() - date.getFullYear()
      return age >= 18 && age <= 70
    }, "Employee must be between 18 and 70 years old"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\+?[0-9\s-]+$/, "Please enter a valid phone number"),
  personalEmail: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address must be at most 255 characters"),
  stateOfOrigin: z
    .string()
    .min(2, "State of origin is required"),
  lga: z
    .string()
    .min(2, "LGA is required"),
  nin: z
    .string()
    .length(11, "NIN must be exactly 11 digits")
    .regex(/^[0-9]+$/, "NIN must contain only numbers")
    .optional()
    .or(z.literal("")),

  // Employment Information
  departmentId: z
    .string()
    .min(1, "Department is required"),
  gradeLevelId: z
    .string()
    .min(1, "Grade level is required"),
  jobTitle: z
    .string()
    .min(2, "Job title must be at least 2 characters")
    .max(100, "Job title must be at most 100 characters"),
  employmentType: z.enum(["FULL_TIME", "CONTRACT", "PART_TIME", "INTERN"], {
    required_error: "Please select an employment type",
  }),
  employmentDate: z
    .string()
    .min(1, "Employment date is required"),
  contractEndDate: z
    .string()
    .optional()
    .or(z.literal("")),
  lineManagerId: z
    .string()
    .optional()
    .or(z.literal("")),
  isManager: z.boolean().default(false),

  // Bank Details
  bankName: z
    .string()
    .max(100, "Bank name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  accountNumber: z
    .string()
    .regex(/^[0-9]*$/, "Account number must contain only numbers")
    .max(10, "Account number must be at most 10 digits")
    .optional()
    .or(z.literal("")),
  bankSortCode: z
    .string()
    .max(10, "Sort code must be at most 10 characters")
    .optional()
    .or(z.literal("")),

  // Account
  email: z
    .string()
    .min(1, "Work email is required")
    .email("Please enter a valid email address")
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/,
      "Password must include uppercase, lowercase, number, and special character"
    ),
})

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>

// ─────────────────────────────────────────────────────────────
// UPDATE EMPLOYEE SCHEMA (HR can edit everything)
// ─────────────────────────────────────────────────────────────

export const updateEmployeeSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters"),
  middleName: z.string().max(50).optional().or(z.literal("")),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters"),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits"),
  personalEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5).max(255),
  stateOfOrigin: z.string().min(2),
  lga: z.string().min(2),
  nin: z
    .string()
    .length(11, "NIN must be exactly 11 digits")
    .regex(/^[0-9]+$/)
    .optional()
    .or(z.literal("")),

  departmentId: z.string().min(1, "Department is required"),
  gradeLevelId: z.string().min(1, "Grade level is required"),
  jobTitle: z.string().min(2).max(100),
  employmentType: z.enum(["FULL_TIME", "CONTRACT", "PART_TIME", "INTERN"]),
  employmentDate: z.string().min(1),
  contractEndDate: z.string().optional().or(z.literal("")),
  confirmationDate: z.string().optional().or(z.literal("")),
  lineManagerId: z.string().optional().or(z.literal("")),
  isManager: z.boolean().default(false),
  isActive: z.boolean().default(true),

  bankName: z.string().max(100).optional().or(z.literal("")),
  accountNumber: z.string().max(10).optional().or(z.literal("")),
  bankSortCode: z.string().max(10).optional().or(z.literal("")),
})

export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>

// ─────────────────────────────────────────────────────────────
// EMPLOYEE SELF-UPDATE SCHEMA (limited fields)
// ─────────────────────────────────────────────────────────────

export const employeeSelfUpdateSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits"),
  personalEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5).max(255),
  bankName: z.string().max(100).optional().or(z.literal("")),
  accountNumber: z.string().max(10).optional().or(z.literal("")),
  bankSortCode: z.string().max(10).optional().or(z.literal("")),
})

export type EmployeeSelfUpdateFormValues = z.infer<typeof employeeSelfUpdateSchema>

// ─────────────────────────────────────────────────────────────
// EMPLOYMENT TYPES
// ─────────────────────────────────────────────────────────────

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "INTERN", label: "Intern" },
] as const

export const GENDERS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
] as const

// ─────────────────────────────────────────────────────────────
// NIGERIAN STATES
// ─────────────────────────────────────────────────────────────

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const