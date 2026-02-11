"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import { IconChart, IconRental, IconBriefcase, IconNone } from "../icons";
import type { IconCategory } from "../icons";
import type { ReactNode } from "react";
import styles from "./steps.module.css";

const OPTION_CAPITAL = "רווחים משוק ההון";
const OPTION_RENT = "הכנסה משכר דירה";
const OPTION_OTHER = "הכנסה נוספת אחרת";
const OPTION_NONE = "לא היו לי הכנסות נוספות";

const POSITIVE_OPTIONS: { label: string; icon: ReactNode; iconColor: IconCategory }[] = [
  { label: OPTION_CAPITAL, icon: <IconChart />, iconColor: "financial" },
  { label: OPTION_RENT, icon: <IconRental />, iconColor: "property" },
  { label: OPTION_OTHER, icon: <IconBriefcase />, iconColor: "financial" },
];

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
  if (current.includes(toggled)) {
    return current.filter((s) => s !== toggled);
  }
  if (toggled === OPTION_NONE) {
    return [toggled];
  }
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
  if (parts.length === 1) return `רשמנו שהיו ${parts[0]}.`;

  const last = parts.pop()!;
  return `רשמנו שהיו ${parts.join(", ")} ו${last}.`;
}

const AckIcon = (
  <svg className={styles.ackIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

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
        {POSITIVE_OPTIONS.map((opt) => (
          <WizardOption
            key={opt.label}
            label={opt.label}
            icon={opt.icon}
            iconColor={opt.iconColor}
            selected={selections.includes(opt.label)}
            onToggle={() => handleToggle(opt.label)}
            variant="card"
          />
        ))}
        <div className={styles.separator}>או</div>
        <WizardOption
          label={OPTION_NONE}
          icon={<IconNone />}
          selected={selections.includes(OPTION_NONE)}
          onToggle={() => handleToggle(OPTION_NONE)}
          variant="negation"
        />
      </div>
      {selections.length > 0 && (
        <div className={styles.feedback}>
          {acknowledgment && (
            <div className={styles.ack}>
              {AckIcon}
              <span>{acknowledgment}</span>
            </div>
          )}
          <WhyBlock text={whyText} visible={true} />
        </div>
      )}
    </div>
  );
}
