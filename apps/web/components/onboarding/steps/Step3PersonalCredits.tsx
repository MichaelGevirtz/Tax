"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import type { WizardState } from "../../../lib/wizard-state";
import styles from "./steps.module.css";

const OPTIONS: { label: string; value: WizardState["personalCredits"] }[] = [
  { label: "סיימתי תואר / לימודים אקדמיים", value: "degree" },
  {
    label:
      "יש לי נקודות זיכוי אישיות (ילדים מתחת לגיל 18, מגבלה, עולה חדש וכד׳)",
    value: "credits",
  },
  { label: "לא רלוונטי", value: "none" },
];

const WHY_TEXT =
  "נקודות זיכוי והטבות אישיות אינן תמיד מחושבות במלואן דרך המעסיק.";

interface Step3Props {
  selection: WizardState["personalCredits"];
  onChange: (value: WizardState["personalCredits"]) => void;
}

export function Step3PersonalCredits({ selection, onChange }: Step3Props) {
  return (
    <div className={styles.step}>
      <h2 className={styles.question}>
        האם יש לך נקודות זיכוי או הטבות אישיות שייתכן שלא נוצלו?
      </h2>
      <div className={styles.options} role="radiogroup" aria-label="נקודות זיכוי">
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
