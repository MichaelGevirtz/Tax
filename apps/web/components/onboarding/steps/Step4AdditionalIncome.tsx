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

const WHY_TEXT =
  "הכנסות נוספות משפיעות על חישוב המס הכולל, גם כאשר חלקן פטור ממס או ממוסה בשיעור קבוע.";

interface Step4Props {
  selection: WizardState["additionalIncome"];
  onChange: (value: WizardState["additionalIncome"]) => void;
}

export function Step4AdditionalIncome({ selection, onChange }: Step4Props) {
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
      <WhyBlock text={WHY_TEXT} visible={selection !== null} />
    </div>
  );
}
