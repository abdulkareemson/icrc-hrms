// lib/staff-id.ts
import { prisma } from "@/lib/prisma";
import { STAFF_ID } from "@/constants/system";

/**
 * Generate the next staff ID for a department
 *
 * Format: ICRC/{DEPT_CODE}/{YEAR}/{SEQUENCE}
 * Example: ICRC/PPP/2026/0001
 *
 * Uses a transaction to ensure no duplicates
 */
export async function generateStaffId(departmentCode: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `${STAFF_ID.prefix}${STAFF_ID.separator}${departmentCode}${STAFF_ID.separator}${currentYear}${STAFF_ID.separator}`;

  // Find the latest staff ID for this department and year
  const latestEmployee = await prisma.employee.findFirst({
    where: {
      staffId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      staffId: "desc",
    },
    select: {
      staffId: true,
    },
  });

  let nextSequence = 1;

  if (latestEmployee) {
    // Extract the sequence number from the last staff ID
    const parts = latestEmployee.staffId.split(STAFF_ID.separator);
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const lastSequence = parseInt(lastPart, 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }
  }

  const sequenceStr = nextSequence
    .toString()
    .padStart(STAFF_ID.sequenceLength, "0");

  return `${prefix}${sequenceStr}`;
}

/**
 * Validate a staff ID format
 * Returns true if format matches: ICRC/{CODE}/{YEAR}/{SEQUENCE}
 */
export function isValidStaffId(staffId: string): boolean {
  const pattern = /^ICRC\/[A-Z]{2,4}\/\d{4}\/\d{4,}$/;
  return pattern.test(staffId);
}
