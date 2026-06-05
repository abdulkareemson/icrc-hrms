// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ── 1. Departments ───────────────────────────────────────
  const departments = [
    { name: "PPP Resource Department", code: "PPP" },
    { name: "Contract Compliance Department", code: "CC" },
    { name: "Support Services Department", code: "SS" },
    { name: "Research and Planning Department", code: "RP" },
    { name: "Internal Audit Department", code: "IA" },
    { name: "Legal and Governance", code: "LG" },
    { name: "Revenue, Investment and Project Finance", code: "RIPF" },
    { name: "Transportation Infrastructure Department", code: "TI" },
    { name: "Information and Communications Technology", code: "ICT" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log("✅ Departments seeded (9 departments)");

  // ── 2. Grade Levels (GL 01-17, Step 1) ──────────────────
  const gradeLevels = [
    {
      level: 1,
      step: 1,
      basicSalary: 3000000,
      housingAllowance: 900000,
      transportAllowance: 500000,
      medicalAllowance: 300000,
      leaveAllowance: 250000,
      utilityAllowance: 150000,
    },
    {
      level: 2,
      step: 1,
      basicSalary: 3500000,
      housingAllowance: 1050000,
      transportAllowance: 550000,
      medicalAllowance: 350000,
      leaveAllowance: 291700,
      utilityAllowance: 175000,
    },
    {
      level: 3,
      step: 1,
      basicSalary: 4200000,
      housingAllowance: 1260000,
      transportAllowance: 630000,
      medicalAllowance: 420000,
      leaveAllowance: 350000,
      utilityAllowance: 210000,
    },
    {
      level: 4,
      step: 1,
      basicSalary: 5100000,
      housingAllowance: 1530000,
      transportAllowance: 765000,
      medicalAllowance: 510000,
      leaveAllowance: 425000,
      utilityAllowance: 255000,
    },
    {
      level: 5,
      step: 1,
      basicSalary: 6200000,
      housingAllowance: 1860000,
      transportAllowance: 930000,
      medicalAllowance: 620000,
      leaveAllowance: 516700,
      utilityAllowance: 310000,
    },
    {
      level: 6,
      step: 1,
      basicSalary: 7500000,
      housingAllowance: 2250000,
      transportAllowance: 1125000,
      medicalAllowance: 750000,
      leaveAllowance: 625000,
      utilityAllowance: 375000,
    },
    {
      level: 7,
      step: 1,
      basicSalary: 9200000,
      housingAllowance: 2760000,
      transportAllowance: 1380000,
      medicalAllowance: 920000,
      leaveAllowance: 766700,
      utilityAllowance: 460000,
    },
    {
      level: 8,
      step: 1,
      basicSalary: 11200000,
      housingAllowance: 3360000,
      transportAllowance: 1680000,
      medicalAllowance: 1120000,
      leaveAllowance: 933300,
      utilityAllowance: 560000,
    },
    {
      level: 9,
      step: 1,
      basicSalary: 13600000,
      housingAllowance: 4080000,
      transportAllowance: 2040000,
      medicalAllowance: 1360000,
      leaveAllowance: 1133300,
      utilityAllowance: 680000,
    },
    {
      level: 10,
      step: 1,
      basicSalary: 16500000,
      housingAllowance: 4950000,
      transportAllowance: 2475000,
      medicalAllowance: 1650000,
      leaveAllowance: 1375000,
      utilityAllowance: 825000,
    },
    {
      level: 11,
      step: 1,
      basicSalary: 20000000,
      housingAllowance: 6000000,
      transportAllowance: 3000000,
      medicalAllowance: 2000000,
      leaveAllowance: 1666700,
      utilityAllowance: 1000000,
    },
    {
      level: 12,
      step: 1,
      basicSalary: 24200000,
      housingAllowance: 7260000,
      transportAllowance: 3630000,
      medicalAllowance: 2420000,
      leaveAllowance: 2016700,
      utilityAllowance: 1210000,
    },
    {
      level: 13,
      step: 1,
      basicSalary: 29300000,
      housingAllowance: 8790000,
      transportAllowance: 4395000,
      medicalAllowance: 2930000,
      leaveAllowance: 2441700,
      utilityAllowance: 1465000,
    },
    {
      level: 14,
      step: 1,
      basicSalary: 35500000,
      housingAllowance: 10650000,
      transportAllowance: 5325000,
      medicalAllowance: 3550000,
      leaveAllowance: 2958300,
      utilityAllowance: 1775000,
    },
    {
      level: 15,
      step: 1,
      basicSalary: 43000000,
      housingAllowance: 12900000,
      transportAllowance: 6450000,
      medicalAllowance: 4300000,
      leaveAllowance: 3583300,
      utilityAllowance: 2150000,
    },
    {
      level: 16,
      step: 1,
      basicSalary: 52000000,
      housingAllowance: 15600000,
      transportAllowance: 7800000,
      medicalAllowance: 5200000,
      leaveAllowance: 4333300,
      utilityAllowance: 2600000,
    },
    {
      level: 17,
      step: 1,
      basicSalary: 63000000,
      housingAllowance: 18900000,
      transportAllowance: 9450000,
      medicalAllowance: 6300000,
      leaveAllowance: 5250000,
      utilityAllowance: 3150000,
    },
  ];

  for (const gl of gradeLevels) {
    await prisma.gradeLevel.upsert({
      where: { level_step: { level: gl.level, step: gl.step } },
      update: {},
      create: gl,
    });
  }
  console.log("✅ Grade Levels seeded (GL 01-17, Step 1)");

  // ── 3. Leave Types ───────────────────────────────────────
  const leaveTypes = [
    {
      name: "Annual Leave",
      daysAllowed: 21,
      isPaid: true,
      requiresDocument: false,
    },
    {
      name: "Sick Leave",
      daysAllowed: 30,
      isPaid: true,
      requiresDocument: true,
    },
    {
      name: "Maternity Leave",
      daysAllowed: 90,
      isPaid: true,
      requiresDocument: true,
    },
    {
      name: "Paternity Leave",
      daysAllowed: 14,
      isPaid: true,
      requiresDocument: true,
    },
    {
      name: "Compassionate Leave",
      daysAllowed: 5,
      isPaid: true,
      requiresDocument: false,
    },
    {
      name: "Study Leave",
      daysAllowed: 14,
      isPaid: false,
      requiresDocument: true,
    },
    {
      name: "Unpaid Leave",
      daysAllowed: 30,
      isPaid: false,
      requiresDocument: false,
    },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }
  console.log("✅ Leave Types seeded (7 types)");

  // ── 4. System Config ─────────────────────────────────────
  const configs = [
    {
      key: "WORK_START_TIME",
      value: "08:00",
      description: "Work resumption time (WAT)",
    },
    {
      key: "LATE_GRACE_PERIOD",
      value: "15",
      description: "Minutes grace before marking late",
    },
    {
      key: "PAYROLL_RUN_DAY",
      value: "25",
      description: "Day of month HR runs payroll",
    },
    {
      key: "FISCAL_YEAR_START",
      value: "01",
      description: "Starting month of fiscal year (January=01)",
    },
    {
      key: "CONTRACT_EXPIRY_ALERT_DAYS",
      value: "30,60",
      description: "Days before expiry to send alert",
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log("✅ System Config seeded");

  // ── 5. Super Admin ───────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Admin@2026!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@icrc.gov.ng" },
    update: {},
    create: {
      email: "admin@icrc.gov.ng",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const gl17 = await prisma.gradeLevel.findUnique({
    where: { level_step: { level: 17, step: 1 } },
  });

  const ictDept = await prisma.department.findUnique({
    where: { code: "ICT" },
  });

  if (gl17 && ictDept) {
    await prisma.employee.upsert({
      where: { userId: superAdmin.id },
      update: {},
      create: {
        staffId: "ICRC/ICT/2026/0001",
        userId: superAdmin.id,
        firstName: "System",
        lastName: "Administrator",
        gender: "Male",
        dateOfBirth: new Date("1990-01-01"),
        phoneNumber: "+2348000000000",
        address: "ICRC HQ, Plot 1270 Ayangba Street, Garki, Abuja",
        stateOfOrigin: "FCT",
        lga: "Abuja Municipal",
        departmentId: ictDept.id,
        gradeLevelId: gl17.id,
        jobTitle: "System Administrator",
        employmentType: "FULL_TIME",
        employmentDate: new Date("2026-01-01"),
        isManager: true,
      },
    });
  }

  console.log("✅ Super Admin created → admin@icrc.gov.ng / Admin@2026!");
  console.log("\n🌱 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
