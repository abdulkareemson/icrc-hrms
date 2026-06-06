// constants/system.ts

export const APP_NAME = "ICRC HRMS";
export const APP_DESCRIPTION =
  "Human Resource Management System for the Infrastructure Concession Regulatory Commission";

export const ICRC = {
  name: "Infrastructure Concession Regulatory Commission",
  shortName: "ICRC",
  address: "Plot 1270, Ayangba Street, Garki, Abuja",
  website: "https://www.icrc.gov.ng",
  email: "info@icrc.gov.ng",
  phone: "+234 (0) 9 291 5801",
  established: "2005",
  act: "Infrastructure Concession Regulatory Commission Act 2005",
  directorGeneral: "Dr. Jobson Oseodion Ewalefoh",
  dgAppointedYear: "2024",
} as const;

export const WAT_TIMEZONE = "Africa/Lagos";
export const WAT_OFFSET = "+01:00";

export const WORK_CONFIG = {
  startTime: "08:00",
  graceMinutes: 15,
  endTime: "17:00",
} as const;

export const PAGINATION = {
  defaultLimit: 10,
  maxLimit: 100,
  limitOptions: [10, 25, 50, 100],
} as const;

export const FILE_UPLOAD = {
  maxSizeMB: 16,
  maxSizeBytes: 16 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedDocTypes: ["application/pdf", "image/jpeg", "image/png"],
} as const;

export const STAFF_ID = {
  prefix: "ICRC",
  separator: "/",
  sequenceLength: 4,
} as const;

export const ROUTES = {
  home: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  hrDashboard: "/hr",
  adminDashboard: "/admin",
  about: "/about",
  profile: "/profile",
  careers: "/careers",
} as const;
