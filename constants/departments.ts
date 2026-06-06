// constants/departments.ts

export interface DepartmentInfo {
  code: string;
  name: string;
  shortName: string;
}

export const DEPARTMENTS: DepartmentInfo[] = [
  {
    code: "PPP",
    name: "PPP Resource Department",
    shortName: "PPP Resource",
  },
  {
    code: "CC",
    name: "Contract Compliance Department",
    shortName: "Contract Compliance",
  },
  {
    code: "SS",
    name: "Support Services Department",
    shortName: "Support Services",
  },
  {
    code: "RP",
    name: "Research and Planning Department",
    shortName: "Research & Planning",
  },
  {
    code: "IA",
    name: "Internal Audit Department",
    shortName: "Internal Audit",
  },
  {
    code: "LG",
    name: "Legal and Governance",
    shortName: "Legal & Governance",
  },
  {
    code: "RIPF",
    name: "Revenue, Investment and Project Finance",
    shortName: "Revenue & Finance",
  },
  {
    code: "TI",
    name: "Transportation Infrastructure Department",
    shortName: "Transportation",
  },
  {
    code: "ICT",
    name: "Information and Communications Technology",
    shortName: "ICT",
  },
];

export function getDepartmentByCode(code: string): DepartmentInfo | undefined {
  return DEPARTMENTS.find((d) => d.code === code);
}

export const DEPARTMENT_CODES = DEPARTMENTS.map((d) => d.code);
