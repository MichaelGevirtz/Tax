"use client";

import styles from "./WizardOption.module.css";

interface WizardOptionProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  mode: "checkbox" | "radio";
}

export function WizardOption({
  label,
  selected,
  onToggle,
  mode,
}: WizardOptionProps) {
  return (
    <button
      type="button"
      className={[
        styles.option,
        selected ? styles.selected : "",
        mode === "radio" ? styles.radio : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onToggle}
      role={mode === "radio" ? "radio" : "checkbox"}
      aria-checked={selected}
    >
      <span className={styles.indicator}>
        {selected && (
          <svg
            className={styles.checkmark}
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
