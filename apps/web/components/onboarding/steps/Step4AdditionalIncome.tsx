"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import type { WizardState } from "../../../lib/wizard-state";
import styles from "./steps.module.css";

const OPTIONS: { label: string; value: WizardState["additionalIncome"] }[] = [
  { label: "רווחים משוק ההון", value: "capital_markets" },
  { label: "הכנסה משכר דירה", value: "rent" },
  { label: "הכנסה נוספת אחרת", value: "other" },
  { label: "לא היו לי הכנסות נוספות", value: "none" },
];

const WHY_TEXT_HAS_INCOME =
  "הכנסות נוספות משפיעות על חישוב המס הכולל ועשויות לדרוש דיווח נפרד, גם כאשר חלקן פטור ממס או ממוסה בשיעור קבוע.";

const WHY_TEXT_NO_INCOME =
  "גם כשההכנסה מגיעה רק ממשכורת, בדיקה מלאה של הנתונים יכולה לחשוף פערים בחישוב המס השנתי.";

const ACKNOWLEDGMENT: Record<NonNullable<WizardState["additionalIncome"]>, string> = {
  capital_markets: "רשמנו שהיו רווחים משוק ההון.",
  rent: "רשמנו שהייתה הכנסה משכר דירה.",
  other: "רשמנו שהייתה הכנסה נוספת אחרת.",
  none: "רשמנו שלא היו הכנסות נוספות מעבר לתלוש השכר.",
};

interface Step4Props {
  selection: WizardState["additionalIncome"];
  onChange: (value: WizardState["additionalIncome"]) => void;
}

export function Step4AdditionalIncome({ selection, onChange }: Step4Props) {
  const whyText = selection === "none" ? WHY_TEXT_NO_INCOME : WHY_TEXT_HAS_INCOME;

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>
        האם היו לך הכנסות נוספות מעבר לתלוש השכר?
      </h2>
      <div className={styles.options} role="radiogroup" aria-label="הכנסות נוספות">
        {OPTIONS.map((option) => (
          <WizardOption
            key={option.value}
            label={option.label}
            selected={selection === option.value}
            onToggle={() => onChange(option.value)}
            mode="radio"
          />
        ))}
      </div>
      {selection && (
        <p className={styles.helper}>{ACKNOWLEDGMENT[selection]}</p>
      )}
      <WhyBlock text={whyText} visible={selection !== null} />
    </div>
  );
}
