/**
 * Inline SVG icon components for the onboarding wizard.
 * All icons: 24×24, currentColor, stroke-based.
 */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function Icon(props: IconProps & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <svg {...defaults} {...rest}>
      {children}
    </svg>
  );
}

/** Step 1: salary change */
export function IconSalary(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Icon>
  );
}

/** Step 1: switch jobs */
export function IconSwitch(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9h13M9 3l6 6-6 6" />
      <path d="M21 15H8M15 21l-6-6 6-6" />
    </Icon>
  );
}

/** Step 1: multiple employers */
export function IconMulti(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="7" height="18" rx="1" />
      <rect x="15" y="3" width="7" height="18" rx="1" />
      <path d="M9 12h6" />
    </Icon>
  );
}

/** Step 1: gap / partial work */
export function IconGap(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 2v4M16 2v4" />
      <path d="M10 16l2 2 4-4" opacity="0.4" />
    </Icon>
  );
}

/** Negation: minus circle (shared) */
export function IconNone(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </Icon>
  );
}

/** Step 2: mortgage / house */
export function IconHouse(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
      <path d="M9 21v-6h6v6" />
    </Icon>
  );
}

/** Step 2: life insurance / shield */
export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4M12 16h.01" />
    </Icon>
  );
}

/** Step 2: unsure / question */
export function IconQuestion(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

/** Step 3: degree */
export function IconDegree(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 10l-10-5-10 5 10 5 10-5z" />
      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
      <path d="M22 10v6" />
    </Icon>
  );
}

/** Step 3: children / family */
export function IconFamily(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="10" r="2" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path d="M21 21v-1a3 3 0 00-3-3h-1" />
    </Icon>
  );
}

/** Step 3: new immigrant / plane */
export function IconPlane(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </Icon>
  );
}

/** Step 3: disability / accessibility */
export function IconAccess(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="4.5" r="2.5" />
      <path d="M12 7v6" />
      <path d="M8 13l4 4 4-4" />
      <path d="M7 20h10" />
    </Icon>
  );
}

/** Step 4: capital gains / chart */
export function IconChart(props: IconProps) {
  return (
    <Icon {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </Icon>
  );
}

/** Step 4: rental income */
export function IconRental(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
      <circle cx="12" cy="15" r="2" />
      <path d="M12 13v-2" />
    </Icon>
  );
}

/** Step 4: other income / briefcase */
export function IconBriefcase(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <path d="M12 12v2" />
    </Icon>
  );
}

/** Semantic icon color categories */
export type IconCategory = "financial" | "property" | "personal" | "neutral";

export const ICON_CATEGORIES: Record<string, IconCategory> = {
  salary: "financial",
  switch: "financial",
  multi: "financial",
  gap: "financial",
  chart: "financial",
  briefcase: "financial",
  house: "property",
  rental: "property",
  degree: "personal",
  family: "personal",
  plane: "personal",
  access: "personal",
  shield: "neutral",
  question: "neutral",
  none: "neutral",
};
