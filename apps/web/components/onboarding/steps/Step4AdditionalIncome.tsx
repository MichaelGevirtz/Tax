"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import styles from "./steps.module.css";

const OPTION_CAPITAL = "רווחים משוק ההון";
const OPTION_RENT = "הכנסה משכר דירה";
const OPTION_OTHER = "הכנסה נוספת אחרת";
const OPTION_NONE = "לא היו לי הכנסות נוספות";

const OPTIONS = [OPTION_CAPITAL, OPTION_RENT, OPTION_OTHER, OPTION_NONE];

const WHY_TEXT_HAS_INCOME =
  "הכנסות נוספות משפיעות על חישוב המס הכולל ועשויות לדרוש דיווח נפרד, גם כאשר חלקן פטור ממס או ממוסה בשיעור קבוע.";

const WHY_TEXT_NO_INCOME =
  "גם כשההכנסה מגיעה רק ממשכורת, בדיקה מלאה של הנתונים יכולה לחשוף פערים בחישוב המס השנתי.";

/**
 * Apply Step 4 exclusivity rules when toggling an option.
 * "לא היו לי הכנסות נוספות" is mutually exclusive with all other options.
 * Exported for testing.
 */
export function applyStep4Exclusivity(
  current: string[],
  toggled: string,
): string[] {
  // Deselect if already selected
  if (current.includes(toggled)) {
    return current.filter((s) => s !== toggled);
  }

  // Selecting "לא היו לי הכנסות נוספות" clears all others
  if (toggled === OPTION_NONE) {
    return [toggled];
  }

  // Selecting any positive option clears "לא היו לי הכנסות נוספות"
  return current.filter((s) => s !== OPTION_NONE).concat(toggled);
}

function getAcknowledgment(selections: string[]): string | null {
  if (selections.length === 0) return null;

  if (selections.includes(OPTION_NONE)) {
    return "רשמנו שלא היו הכנסות נוספות מעבר לתלוש השכר.";
  }

  const parts: string[] = [];
  if (selections.includes(OPTION_CAPITAL)) parts.push("רווחים משוק ההון");
  if (selections.includes(OPTION_RENT)) parts.push("הכנסה משכר דירה");
  if (selections.includes(OPTION_OTHER)) parts.push("הכנסה נוספת אחרת");

  if (parts.length === 0) return null;

  if (parts.length === 1) {
    return `רשמנו שהיו ${parts[0]}.`;
  }

  const last = parts.pop()!;
  return `רשמנו שהיו ${parts.join(", ")} ו${last}.`;
}

interface Step4Props {
  selections: string[];
  onChange: (selections: string[]) => void;
}

export function Step4AdditionalIncome({ selections, onChange }: Step4Props) {
  const handleToggle = (option: string) => {
    onChange(applyStep4Exclusivity(selections, option));
  };

  const isNone = selections.includes(OPTION_NONE);
  const whyText = isNone ? WHY_TEXT_NO_INCOME : WHY_TEXT_HAS_INCOME;
  const acknowledgment = getAcknowledgment(selections);

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>
        האם היו לך הכנסות נוספות מעבר לתלוש השכר?
      </h2>
      <div className={styles.options} role="group" aria-label="הכנסות נוספות">
        {OPTIONS.map((option) => (
          <WizardOption
            key={option}
            label={option}
            selected={selections.includes(option)}
            onToggle={() => handleToggle(option)}
            mode="checkbox"
          />
        ))}
      </div>
      {acknowledgment && (
        <p className={styles.helper}>{acknowledgment}</p>
      )}
      <WhyBlock text={whyText} visible={selections.length > 0} />
    </div>
  );
}
