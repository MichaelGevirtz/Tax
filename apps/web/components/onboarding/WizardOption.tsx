"use client";

import type { ReactNode } from "react";
import type { IconCategory } from "./icons";
import styles from "./WizardOption.module.css";

interface WizardOptionProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  iconColor?: IconCategory;
  variant?: "card" | "negation" | "pill";
}

const CheckmarkSvg = (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
    className={styles.checkSvg}
  >
    <path
      d="M2 6l3 3 5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ICON_COLOR_CLASS: Record<IconCategory, string> = {
  financial: styles.iconFinancial,
  property: styles.iconProperty,
  personal: styles.iconPersonal,
  neutral: styles.iconNeutral,
};

export function WizardOption({
  label,
  selected,
  onToggle,
  icon,
  iconColor = "neutral",
  variant = "card",
}: WizardOptionProps) {
  if (variant === "pill") {
    return (
      <button
        type="button"
        className={[styles.pill, selected ? styles.pillSelected : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={onToggle}
        role="checkbox"
        aria-checked={selected}
      >
        {label}
      </button>
    );
  }

  if (variant === "negation") {
    return (
      <button
        type="button"
        className={[styles.negation, selected ? styles.negationSelected : ""]
          .filter(Boolean)
          .join(" ")}
        onClick={onToggle}
        role="checkbox"
        aria-checked={selected}
      >
        {icon && <span className={styles.negationIcon}>{icon}</span>}
        <span className={styles.negationLabel}>{label}</span>
        <span className={styles.negationCheck}>
          {selected && CheckmarkSvg}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={[styles.card, selected ? styles.cardSelected : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
    >
      {icon && (
        <span
          className={[styles.cardIcon, ICON_COLOR_CLASS[iconColor]]
            .filter(Boolean)
            .join(" ")}
        >
          {icon}
        </span>
      )}
      <span className={styles.cardLabel}>{label}</span>
      <span className={styles.cardCheck}>{selected && CheckmarkSvg}</span>
    </button>
  );
}
