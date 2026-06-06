// app/(dashboard)/about/page.tsx
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ICRC } from "@/constants/system";
import {
  Building2,
  Scale,
  Globe,
  Target,
  User,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Landmark,
  ShieldCheck,
  FileText,
  Handshake,
  Plane,
  Droplets,
  Zap,
  Building,
  Wifi,
  TrainFront,
  Anchor,
  GraduationCap,
  Stethoscope,
  Container,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About ICRC",
  description:
    "About the Infrastructure Concession Regulatory Commission (ICRC) Nigeria",
};

// ─────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────

const mandateCards = [
  {
    icon: ShieldCheck,
    title: "Policy & Guidelines",
    description:
      "Take custody of every concession agreement made under the Act and monitor compliance by the parties to any such agreement with its terms and conditions.",
  },
  {
    icon: FileText,
    title: "Regulatory Oversight",
    description:
      "Ensure efficient execution of any concession agreement or contract entered into by the Federal Government.",
  },
  {
    icon: Scale,
    title: "Dispute Resolution",
    description:
      "Ensure compliance with the provisions of the ICRC Act 2005 in the implementation of Public-Private Partnership projects.",
  },
  {
    icon: Handshake,
    title: "Stakeholder Coordination",
    description:
      "Serve as a national centre for the collection, analysis, and dissemination of information on PPP matters and infrastructure development.",
  },
];

const infrastructureSectors = [
  { icon: TrainFront, label: "Railways" },
  { icon: Plane, label: "Airports" },
  { icon: Anchor, label: "Seaports" },
  { icon: Globe, label: "Highways & Roads" },
  { icon: Zap, label: "Power & Energy" },
  { icon: Droplets, label: "Water & Sewerage" },
  { icon: Wifi, label: "Telecommunications" },
  { icon: Building, label: "Housing & Urban" },
  { icon: GraduationCap, label: "Education" },
  { icon: Stethoscope, label: "Healthcare" },
  { icon: Container, label: "Free Trade Zones" },
  { icon: Landmark, label: "Tourism & Recreation" },
];

const objectives = [
  "Develop and issue guidelines on PPP processes and procedures to ensure transparency, competitiveness, and efficiency in the execution of PPP projects.",
  "Assess and certify the viability of PPP projects before the Federal Government commits resources or guarantees.",
  "Maintain a database of all PPP projects in Nigeria and publish periodic reports on the state of PPP implementation.",
  "Build capacity across MDAs for the development and management of PPP projects through training programs.",
  "Protect the interests of both the public and private sectors in PPP arrangements through fair and balanced regulation.",
  "Promote public awareness and understanding of PPP as a viable option for infrastructure development in Nigeria.",
  "Collaborate with international organizations and development finance institutions on best practices in PPP.",
  "Advise the Federal Government on policies and programs relating to infrastructure development through PPP.",
];

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ── SECTION 1: Header ── */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-700 shadow-lg">
            <Landmark className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-neutral-900">{ICRC.name}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Established by the {ICRC.act}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-800">
          <Building2 className="h-4 w-4" />
          Federal Government of Nigeria
        </div>
      </div>

      <Separator />

      {/* ── SECTION 2: About ICRC ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary-700" />
            About ICRC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-neutral-700">
          <p>
            The Infrastructure Concession Regulatory Commission (ICRC) is the
            agency of the Federal Government of Nigeria charged with the
            responsibility of regulating Public-Private Partnerships (PPPs) in
            Nigeria. The Commission was established by the ICRC Act of 2005 to
            provide a legal and institutional framework for the participation of
            the private sector in financing the construction, development,
            operation, or maintenance of infrastructure or development projects
            of the Federal Government through concession or contractual
            arrangements.
          </p>
          <p>
            The Commission serves as the PPP regulatory body of the Federal
            Government and plays a pivotal role in ensuring that PPP projects
            are implemented transparently, competitively, and in line with
            global best practices. It works closely with Ministries,
            Departments, and Agencies (MDAs) to identify, develop, and implement
            bankable PPP projects that deliver value for money and quality
            services to Nigerian citizens.
          </p>
          <p>
            Since its establishment, the ICRC has been instrumental in driving
            private sector participation in Nigeria&apos;s infrastructure
            development, facilitating billions of naira worth of investment in
            critical sectors including transportation, power, healthcare,
            education, and housing.
          </p>
        </CardContent>
      </Card>

      {/* ── SECTION 3: Mandate ── */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-700" />
          Our Mandate
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {mandateCards.map((card) => (
            <Card
              key={card.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                    <card.icon className="h-5 w-5 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: Infrastructure Sectors ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary-700" />
            Scope of Infrastructure Sectors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600 mb-5">
            The ICRC oversees PPP arrangements across the following critical
            infrastructure sectors of the Nigerian economy:
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {infrastructureSectors.map((sector) => (
              <div
                key={sector.label}
                className="flex items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm transition-colors hover:border-primary-200 hover:bg-primary-50/50"
              >
                <sector.icon className="h-4 w-4 shrink-0 text-primary-700" />
                <span className="text-neutral-700 font-medium text-xs">
                  {sector.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 5: Objectives ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary-700" />
            Key Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {objectives.map((objective, index) => (
              <li key={`obj-${index}`} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-700 text-[11px] font-bold text-white mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-neutral-700">
                  {objective}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* ── SECTION 6: Current Leadership ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Leadership
          </h2>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary-50 border-2 border-primary-200">
              <User className="h-10 w-10 text-primary-700" />
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {ICRC.directorGeneral}
                </h3>
                <p className="text-sm font-medium text-primary-700">
                  Director General / Chief Executive Officer
                </p>
              </div>
              <p className="text-xs text-neutral-500">
                Appointed: July {ICRC.dgAppointedYear}
              </p>
              <p className="text-sm leading-relaxed text-neutral-600">
                The Director General is the Chief Executive Officer of the
                Commission and is responsible for the day-to-day administration
                of the Commission. The DG is appointed by the President of the
                Federal Republic of Nigeria and serves as the accounting officer
                of the Commission.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 7: Contact Details ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary-700" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Address */}
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <MapPin className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Head Office
                </p>
                <p className="mt-1 text-sm text-neutral-700">{ICRC.address}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <Phone className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Phone
                </p>
                <p className="mt-1 text-sm text-neutral-700">{ICRC.phone}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <Mail className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Email
                </p>
                <a
                  href={`mailto:${ICRC.email}`}
                  className="mt-1 text-sm text-primary-700 hover:text-primary-800 font-medium transition-colors"
                >
                  {ICRC.email}
                </a>
              </div>
            </div>

            {/* Website */}
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                <ExternalLink className="h-4 w-4 text-primary-700" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Website
                </p>
                <a
                  href={ICRC.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-primary-700 hover:text-primary-800 font-medium transition-colors inline-flex items-center gap-1"
                >
                  {ICRC.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Footer Note ── */}
      <div className="rounded-lg bg-accent-300/10 border border-accent-500/20 p-4 text-center">
        <p className="text-xs text-accent-700">
          <span className="font-semibold">ICRC HRMS</span> — Internal Human
          Resource Management System developed for the Infrastructure Concession
          Regulatory Commission, Abuja, Nigeria.
        </p>
        <p className="text-[11px] text-accent-600 mt-1">
          Final Year Project — Department of Computer Science, Ahmadu Bello
          University, Zaria
        </p>
      </div>
    </div>
  );
}
