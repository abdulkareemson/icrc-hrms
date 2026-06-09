// components/pdf/StaffIDCard.tsx
// @react-pdf/renderer — Node.js runtime only
// Staff ID Card — front and back — A6 landscape format

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface StaffIDCardProps {
  // Employee
  employeeName: string;
  staffId: string;
  jobTitle: string;
  department: string;
  departmentCode: string;
  gradeLevelLabel: string;
  gender: string;
  // Photo
  profilePhotoUrl?: string | null;
  // Generated
  generatedDate: string;
}

// ─────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────

const GREEN_DARK = "#14532d";
const GREEN_MID = "#15803d";
const GREEN_LIGHT = "#dcfce7";
const GREEN_BORDER = "#86efac";
const GOLD = "#b45309";
const GOLD_LIGHT = "#fef9c3";
const WHITE = "#ffffff";
const NEUTRAL_50 = "#f9fafb";
const NEUTRAL_100 = "#f3f4f6";
const NEUTRAL_200 = "#e5e7eb";
const NEUTRAL_500 = "#6b7280";
const NEUTRAL_700 = "#374151";
const NEUTRAL_900 = "#111827";
const RED_600 = "#dc2626";

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Page ──
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    backgroundColor: WHITE,
    padding: 0,
  },

  // ── Card container (A6 landscape = 148 x 105 mm) ──
  card: {
    width: "100%",
    height: "50%",
    flexDirection: "column",
    overflow: "hidden",
  },

  // ── FRONT CARD ──
  frontCard: {
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL_200,
  },

  frontHeader: {
    backgroundColor: GREEN_DARK,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  frontHeaderTextBlock: {
    flex: 1,
  },

  frontHeaderOrg: {
    fontSize: 5.5,
    color: "#bbf7d0",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  frontHeaderTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginTop: 1,
  },

  frontBody: {
    flexDirection: "row",
    flex: 1,
    padding: 12,
    gap: 12,
  },

  // Photo placeholder
  photoContainer: {
    width: 60,
    height: 72,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: NEUTRAL_100,
    borderWidth: 1,
    borderColor: NEUTRAL_200,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  photo: {
    width: 60,
    height: 72,
    objectFit: "cover",
  },

  photoPlaceholder: {
    fontSize: 6,
    color: NEUTRAL_500,
    textAlign: "center",
  },

  // Employee details
  employeeDetails: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
  },

  employeeName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_900,
    lineHeight: 1.2,
  },

  jobTitle: {
    fontSize: 8,
    color: GREEN_MID,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
  },

  department: {
    fontSize: 7.5,
    color: NEUTRAL_700,
    marginTop: 1,
  },

  staffIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: GREEN_LIGHT,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  staffIdLabel: {
    fontSize: 6,
    color: GREEN_DARK,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  staffIdValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GREEN_DARK,
  },

  detailRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },

  detailPill: {
    backgroundColor: NEUTRAL_100,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },

  detailPillText: {
    fontSize: 6.5,
    color: NEUTRAL_700,
  },

  // Front footer strip
  frontFooter: {
    backgroundColor: GREEN_MID,
    paddingVertical: 4,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  frontFooterText: {
    fontSize: 6,
    color: WHITE,
    letterSpacing: 0.5,
  },

  // ── BACK CARD ──
  backCard: {
    backgroundColor: NEUTRAL_50,
  },

  backHeader: {
    backgroundColor: GREEN_MID,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },

  backHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  backBody: {
    flex: 1,
    padding: 12,
    flexDirection: "row",
    gap: 12,
  },

  // Contact block
  backContactBlock: {
    flex: 1,
    flexDirection: "column",
    gap: 5,
  },

  backContactTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: NEUTRAL_700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  backContactItem: {
    flexDirection: "row",
    gap: 4,
    alignItems: "flex-start",
  },

  backContactLabel: {
    fontSize: 6.5,
    color: NEUTRAL_500,
    width: 40,
  },

  backContactValue: {
    fontSize: 6.5,
    color: NEUTRAL_900,
    flex: 1,
  },

  // Return instructions
  backReturnBlock: {
    flex: 1,
    backgroundColor: GOLD_LIGHT,
    borderWidth: 1,
    borderColor: "#fde047",
    borderRadius: 4,
    padding: 8,
  },

  backReturnTitle: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  backReturnText: {
    fontSize: 6.5,
    color: NEUTRAL_700,
    lineHeight: 1.5,
  },

  backReturnAddress: {
    fontSize: 6.5,
    color: NEUTRAL_900,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    lineHeight: 1.5,
  },

  // Back footer
  backFooter: {
    borderTopWidth: 1,
    borderTopColor: NEUTRAL_200,
    paddingVertical: 5,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backFooterText: {
    fontSize: 5.5,
    color: NEUTRAL_500,
  },

  backFooterAlert: {
    fontSize: 5.5,
    color: RED_600,
    fontFamily: "Helvetica-Bold",
  },
});

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export function StaffIDCard({
  employeeName,
  staffId,
  jobTitle,
  department,
  departmentCode,
  gradeLevelLabel,
  gender,
  profilePhotoUrl,
  generatedDate,
}: StaffIDCardProps) {
  return (
    <Document
      title={`Staff ID Card — ${employeeName}`}
      author="ICRC Nigeria HRMS"
      subject="Staff Identification Card"
      creator="ICRC HRMS"
    >
      {/* A6 landscape: 419 x 298 pt (148mm x 105mm) */}
      <Page size={[419, 298]} style={styles.page}>
        {/* ──────────────── FRONT ──────────────── */}
        <View style={[styles.card, styles.frontCard]}>
          {/* Header */}
          <View style={styles.frontHeader}>
            <View style={styles.frontHeaderTextBlock}>
              <Text style={styles.frontHeaderOrg}>
                Infrastructure Concession Regulatory Commission
              </Text>
              <Text style={styles.frontHeaderTitle}>
                Official Staff Identification Card
              </Text>
            </View>
            <Text
              style={{
                fontSize: 7,
                color: "#86efac",
                fontFamily: "Helvetica-Bold",
              }}
            >
              ICRC
            </Text>
          </View>

          {/* Body */}
          <View style={styles.frontBody}>
            {/* Photo */}
            <View style={styles.photoContainer}>
              {profilePhotoUrl ? (
                <Image src={profilePhotoUrl} style={styles.photo} />
              ) : (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    gap: 2,
                  }}
                >
                  <Text style={styles.photoPlaceholder}>
                    {gender === "Female" ? "♀" : "♂"}
                  </Text>
                  <Text style={styles.photoPlaceholder}>Photo</Text>
                </View>
              )}
            </View>

            {/* Details */}
            <View style={styles.employeeDetails}>
              <Text style={styles.employeeName}>{employeeName}</Text>
              <Text style={styles.jobTitle}>{jobTitle}</Text>
              <Text style={styles.department}>
                {department} ({departmentCode})
              </Text>

              <View style={styles.staffIdRow}>
                <Text style={styles.staffIdLabel}>Staff ID:</Text>
                <Text style={styles.staffIdValue}>{staffId}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailPill}>
                  <Text style={styles.detailPillText}>{gradeLevelLabel}</Text>
                </View>
                <View style={styles.detailPill}>
                  <Text style={styles.detailPillText}>{gender}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer strip */}
          <View style={styles.frontFooter}>
            <Text style={styles.frontFooterText}>www.icrc.gov.ng</Text>
            <Text style={styles.frontFooterText}>Issued: {generatedDate}</Text>
          </View>
        </View>

        {/* ──────────────── BACK ──────────────── */}
        <View style={[styles.card, styles.backCard]}>
          {/* Header */}
          <View style={styles.backHeader}>
            <Text style={styles.backHeaderText}>
              ICRC Nigeria — Staff ID Card
            </Text>
          </View>

          {/* Body */}
          <View style={styles.backBody}>
            {/* Contact block */}
            <View style={styles.backContactBlock}>
              <Text style={styles.backContactTitle}>Organisation Contact</Text>

              {[
                {
                  label: "Address:",
                  value: "Plot 1270, Ayangba Street\nGarki, Abuja, Nigeria",
                },
                { label: "Website:", value: "www.icrc.gov.ng" },
                { label: "Email:", value: "info@icrc.gov.ng" },
                { label: "Phone:", value: "+234 (0) 9 291 5801" },
                { label: "Est.:", value: "ICRC Act 2005" },
              ].map((item) => (
                <View key={item.label} style={styles.backContactItem}>
                  <Text style={styles.backContactLabel}>{item.label}</Text>
                  <Text style={styles.backContactValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Return instructions */}
            <View style={styles.backReturnBlock}>
              <Text style={styles.backReturnTitle}>
                ⚠ If Found, Please Return To:
              </Text>
              <Text style={styles.backReturnText}>
                This card is the property of the Infrastructure Concession
                Regulatory Commission. If found, please return to:
              </Text>
              <Text style={styles.backReturnAddress}>
                The HR Department{"\n"}
                Infrastructure Concession Regulatory Commission{"\n"}
                Plot 1270, Ayangba Street{"\n"}
                Garki, Abuja, Nigeria
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.backFooter}>
            <Text style={styles.backFooterText}>
              Generated by ICRC HRMS on {generatedDate}
            </Text>
            <Text style={styles.backFooterAlert}>
              MISUSE OF THIS CARD IS AN OFFENCE
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
