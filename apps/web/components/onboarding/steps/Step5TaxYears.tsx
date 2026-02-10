"use client";

import { WizardOption } from "../WizardOption";
import styles from "./steps.module.css";

const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

interface Step5Props {
  selections: number[];
  onChange: (selections: number[]) => void;
}

export function Step5TaxYears({ selections, onChange }: Step5Props) {
  const handleToggle = (year: number) => {
    if (selections.includes(year)) {
      onChange(selections.filter((y) => y !== year));
    } else {
      onChange([...selections, year]);
    }
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>לאילו שנים תרצה לבדוק?</h2>
      <div className={styles.options} role="group" aria-label="בחירת שנות מס">
        {YEARS.map((year) => (
          <WizardOption
            key={year}
            label={String(year)}
            selected={selections.includes(year)}
            onToggle={() => handleToggle(year)}
            mode="checkbox"
          />
        ))}
      </div>
      <p className={styles.helper}>כל שנה נבדקת בנפרד לפי הנתונים שלה.</p>
    </div>
  );
}
