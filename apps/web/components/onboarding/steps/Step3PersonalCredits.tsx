"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import {
  IconDegree,
  IconFamily,
  IconPlane,
  IconAccess,
  IconNone,
} from "../icons";
import type { IconCategory } from "../icons";
import type { ReactNode } from "react";
import styles from "./steps.module.css";

const OPTION_DEGREE = "סיום תואר / לימודים אקדמיים";
const OPTION_CHILDREN = "ילדים מתחת לגיל 18";
const OPTION_IMMIGRANT = "עולה חדש / תושב חוזר";
const OPTION_DISABILITY = "מגבלה רפואית";
const OPTION_NONE = "לא רלוונטי";

const POSITIVE_OPTIONS: { label: string; icon: ReactNode; iconColor: IconCategory }[] = [
  { label: OPTION_DEGREE, icon: <IconDegree />, iconColor: "personal" },
  { label: OPTION_CHILDREN, icon: <IconFamily />, iconColor: "personal" },
  { label: OPTION_IMMIGRANT, icon: <IconPlane />, iconColor: "personal" },
  { label: OPTION_DISABILITY, icon: <IconAccess />, iconColor: "personal" },
];

const WHY_TEXT =
  "נקודות זיכוי והטבות אישיות אינן תמיד מחושבות במלואן דרך המעסיק.";

/**
 * Apply Step 3 exclusivity rules when toggling an option.
 * "לא רלוונטי" is mutually exclusive with all other options.
 * Exported for testing.
 */
export function applyStep3Exclusivity(
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
    return "רשמנו שאין הטבות או נקודות זיכוי ידועות.";
  }

  const parts = selections.filter((s) => s !== OPTION_NONE);
  if (parts.length === 1) return `רשמנו: ${parts[0]}.`;
  if (parts.length === 2) return `רשמנו: ${parts[0]} ו${parts[1]}.`;
  return `רשמנו ${parts.length} נקודות זיכוי שייתכן שלא נוצלו.`;
}

const AckIcon = (
  <svg className={styles.ackIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

interface Step3Props {
  selections: string[];
  onChange: (selections: string[]) => void;
}

export function Step3PersonalCredits({ selections, onChange }: Step3Props) {
  const handleToggle = (option: string) => {
    onChange(applyStep3Exclusivity(selections, option));
  };

  const acknowledgment = getAcknowledgment(selections);

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>
        האם יש לך נקודות זיכוי או הטבות אישיות שייתכן שלא נוצלו?
      </h2>
      <div className={styles.options} role="group" aria-label="נקודות זיכוי">
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
          <WhyBlock text={WHY_TEXT} visible={true} />
        </div>
      )}
    </div>
  );
}
