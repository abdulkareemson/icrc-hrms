// components/pdf/PayslipDocument.tsx
// @react-pdf/renderer payslip — Node.js runtime only
// All monetary values arrive as kobo integers — display only, no math here

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface PayslipDocumentProps {
  // Employee
  employeeName: string;
  staffId: string;
  jobTitle: string;
  department: string;
  departmentCode: string;
  gradeLevelLabel: string;

  // Period
  payPeriod: string;
  payMonth: number;
  payYear: number;

  // Earnings (kobo)
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  leaveAllowance: number;
  utilityAllowance: number;
  otherAllowances: number;
  grossPay: number;

  // Deductions (kobo)
  payeTax: number;
  employeePension: number;
  employerPension: number;
  nhfDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  // Net (kobo)
  netPay: number;

  // Meta
  status: string;
  processedAt: string | null;
  paidAt: string | null;
  processedBy: string | null;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Convert kobo integer to formatted NGN string */
function formatKobo(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);
}

function formatDateStr(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const PRIMARY = "#15803d";
const PRIMARY_DARK = "#166534";
const PRIMARY_LIGHT = "#f0fdf4";
const PRIMARY_BORDER = "#bbf7d0";
const NEUTRAL_50 = "#f9fafb";
const NEUTRAL_100 = "#f3f4f6";
const NEUTRAL_200 = "#e5e7eb";
const NEUTRAL_500 = "#6b7280";
const NEUTRAL_700 = "#374151";
const NEUTRAL_900 = "#111827";
const RED_600 = "#dc2626";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: NEUTRAL_900,
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },

  // ── Header ──
  header: {
    backgroundColor: PRIMARY_DARK,
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginBottom: 0,
  },
  headerOrg: {
    fontSize: 7,
    color: "#bbf7d0",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 9,
    color: "#d1fae5",
  },

  // ── Period Banner ──
  periodBanner: {
    backgroundColor: PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  statusPill: {
    fontSize: 7,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Body ──
  body: {
    paddingHorizontal: 32,
  },

  // ── Employee Info Card ──
  infoCard: {
    backgroundColor: NEUTRAL_50,
    borderWidth: 1,
    borderColor: NEUTRAL_200,
    borderRadius: 6,
    padding: 14,
    marginBottom: 18,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 7,
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_900,
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_200,
  },

  // ── Two Column Layout ──
  twoCol: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  col: {
    flex: 1,
  },

  // ── Line Items ──
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_100,
  },
  lineLabel: {
    fontSize: 8.5,
    color: NEUTRAL_700,
  },
  lineAmount: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: NEUTRAL_900,
  },
  lineAmountDeduction: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: RED_600,
  },

  // ── Subtotal row ──
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginTop: 2,
    borderTopWidth: 1.5,
    borderTopColor: NEUTRAL_700,
  },
  subtotalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_900,
  },
  subtotalAmount: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_900,
  },

  // ── Employer pension note ──
  employerNote: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 4,
    padding: 6,
    marginTop: 8,
  },
  employerNoteText: {
    fontSize: 7.5,
    color: "#1d4ed8",
    lineHeight: 1.4,
  },

  // ── Net Pay Box ──
  netPayBox: {
    backgroundColor: PRIMARY_LIGHT,
    borderWidth: 1.5,
    borderColor: PRIMARY_BORDER,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  netPayLeft: {
    flexDirection: "column",
  },
  netPayTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_DARK,
  },
  netPaySubtitle: {
    fontSize: 7.5,
    color: PRIMARY,
    marginTop: 2,
  },
  netPayAmount: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_DARK,
  },

  // ── Processing Info ──
  processingRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  processingItem: {
    flexDirection: "column",
  },
  processingLabel: {
    fontSize: 7,
    color: NEUTRAL_500,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  processingValue: {
    fontSize: 8.5,
    color: NEUTRAL_900,
  },

  // ── Footer ──
  footer: {
    borderTopWidth: 1,
    borderTopColor: NEUTRAL_200,
    paddingTop: 12,
    paddingHorizontal: 32,
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flexDirection: "column",
  },
  footerText: {
    fontSize: 7,
    color: NEUTRAL_500,
    lineHeight: 1.5,
  },
  footerConfidential: {
    fontSize: 7,
    color: RED_600,
    fontFamily: "Helvetica-Bold",
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerStamp: {
    fontSize: 7,
    color: NEUTRAL_500,
    fontStyle: "italic",
  },
});

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function PayslipDocument(props: PayslipDocumentProps) {
  const {
    employeeName,
    staffId,
    jobTitle,
    department,
    departmentCode,
    gradeLevelLabel,
    payPeriod,
    basicSalary,
    housingAllowance,
    transportAllowance,
    medicalAllowance,
    leaveAllowance,
    utilityAllowance,
    otherAllowances,
    grossPay,
    payeTax,
    employeePension,
    employerPension,
    nhfDeduction,
    otherDeductions,
    totalDeductions,
    netPay,
    status,
    processedAt,
    paidAt,
    processedBy,
  } = props;

  const generatedAt = new Date().toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document
      title={`Payslip — ${employeeName} — ${payPeriod}`}
      author="ICRC Nigeria HRMS"
      subject="Monthly Payslip"
      creator="ICRC HRMS"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerOrg}>
            Infrastructure Concession Regulatory Commission
          </Text>
          <Text style={styles.headerTitle}>Employee Payslip</Text>
          <Text style={styles.headerSubtitle}>
            Plot 1270, Ayangba Street, Garki, Abuja, Nigeria
          </Text>
        </View>

        {/* ── Period Banner ── */}
        <View style={styles.periodBanner}>
          <Text style={styles.periodLabel}>Pay Period: {payPeriod}</Text>
          <Text style={styles.statusPill}>{status}</Text>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* ── Employee Info ── */}
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Employee Name</Text>
                <Text style={styles.infoValue}>{employeeName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Staff ID</Text>
                <Text style={styles.infoValue}>{staffId}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Job Title</Text>
                <Text style={styles.infoValue}>{jobTitle}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>
                  {department} ({departmentCode})
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Grade Level</Text>
                <Text style={styles.infoValue}>{gradeLevelLabel}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Pay Period</Text>
                <Text style={styles.infoValue}>{payPeriod}</Text>
              </View>
            </View>
          </View>

          {/* ── Earnings + Deductions ── */}
          <View style={styles.twoCol}>
            {/* Earnings */}
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Earnings</Text>

              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Basic Salary</Text>
                <Text style={styles.lineAmount}>{formatKobo(basicSalary)}</Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Housing Allowance</Text>
                <Text style={styles.lineAmount}>
                  {formatKobo(housingAllowance)}
                </Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Transport Allowance</Text>
                <Text style={styles.lineAmount}>
                  {formatKobo(transportAllowance)}
                </Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Medical Allowance</Text>
                <Text style={styles.lineAmount}>
                  {formatKobo(medicalAllowance)}
                </Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Leave Allowance</Text>
                <Text style={styles.lineAmount}>
                  {formatKobo(leaveAllowance)}
                </Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Utility Allowance</Text>
                <Text style={styles.lineAmount}>
                  {formatKobo(utilityAllowance)}
                </Text>
              </View>
              {otherAllowances > 0 && (
                <View style={styles.lineItem}>
                  <Text style={styles.lineLabel}>Other Allowances</Text>
                  <Text style={styles.lineAmount}>
                    {formatKobo(otherAllowances)}
                  </Text>
                </View>
              )}

              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Gross Pay</Text>
                <Text style={styles.subtotalAmount}>
                  {formatKobo(grossPay)}
                </Text>
              </View>
            </View>

            {/* Deductions */}
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Deductions</Text>

              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>PAYE Tax</Text>
                <Text style={styles.lineAmountDeduction}>
                  −{formatKobo(payeTax)}
                </Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Pension (Employee 8%)</Text>
                <Text style={styles.lineAmountDeduction}>
                  −{formatKobo(employeePension)}
                </Text>
              </View>
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>NHF (2.5%)</Text>
                <Text style={styles.lineAmountDeduction}>
                  −{formatKobo(nhfDeduction)}
                </Text>
              </View>
              {otherDeductions > 0 && (
                <View style={styles.lineItem}>
                  <Text style={styles.lineLabel}>Other Deductions</Text>
                  <Text style={styles.lineAmountDeduction}>
                    −{formatKobo(otherDeductions)}
                  </Text>
                </View>
              )}

              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Total Deductions</Text>
                <Text style={[styles.subtotalAmount, { color: RED_600 }]}>
                  −{formatKobo(totalDeductions)}
                </Text>
              </View>

              {/* Employer pension — informational only */}
              <View style={styles.employerNote}>
                <Text style={styles.employerNoteText}>
                  Employer Pension Contribution (10%):{" "}
                  {formatKobo(employerPension)}
                  {"\n"}
                  Paid by employer — not deducted from salary.
                </Text>
              </View>
            </View>
          </View>

          {/* ── Net Pay ── */}
          <View style={styles.netPayBox}>
            <View style={styles.netPayLeft}>
              <Text style={styles.netPayTitle}>Net Pay</Text>
              <Text style={styles.netPaySubtitle}>
                Gross Pay minus Total Deductions
              </Text>
            </View>
            <Text style={styles.netPayAmount}>{formatKobo(netPay)}</Text>
          </View>

          {/* ── Processing Info ── */}
          <View style={styles.processingRow}>
            {processedAt && (
              <View style={styles.processingItem}>
                <Text style={styles.processingLabel}>Processed Date</Text>
                <Text style={styles.processingValue}>
                  {formatDateStr(processedAt)}
                </Text>
              </View>
            )}
            {paidAt && (
              <View style={styles.processingItem}>
                <Text style={styles.processingLabel}>Payment Date</Text>
                <Text style={styles.processingValue}>
                  {formatDateStr(paidAt)}
                </Text>
              </View>
            )}
            {processedBy && (
              <View style={styles.processingItem}>
                <Text style={styles.processingLabel}>Processed By</Text>
                <Text style={styles.processingValue}>{processedBy}</Text>
              </View>
            )}
            <View style={styles.processingItem}>
              <Text style={styles.processingLabel}>Status</Text>
              <Text style={styles.processingValue}>{status}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              Infrastructure Concession Regulatory Commission (ICRC)
            </Text>
            <Text style={styles.footerText}>
              Plot 1270, Ayangba Street, Garki, Abuja, Nigeria
            </Text>
            <Text style={styles.footerText}>
              www.icrc.gov.ng • +234 (0) 9 291 0000
            </Text>
            <Text style={[styles.footerConfidential, { marginTop: 4 }]}>
              CONFIDENTIAL — For the named recipient only
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerStamp}>Generated: {generatedAt}</Text>
            <Text style={[styles.footerStamp, { marginTop: 2 }]}>
              ICRC HRMS — System Generated
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
