"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import {
  IconSalary,
  IconSwitch,
  IconMulti,
  IconGap,
  IconNone,
} from "../icons";
import type { IconCategory } from "../icons";
import type { ReactNode } from "react";
import styles from "./steps.module.css";

const OPTION_NO_CHANGE = "לא זכור לי שינוי משמעותי";

const POSITIVE_OPTIONS: { label: string; icon: ReactNode; iconColor: IconCategory }[] = [
  { label: "שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)", icon: <IconSalary />, iconColor: "financial" },
  { label: "החלפת מקום עבודה", icon: <IconSwitch />, iconColor: "financial" },
  { label: "עבודה אצל יותר ממעסיק אחד באותה שנה", icon: <IconMulti />, iconColor: "financial" },
  { label: "תקופה ללא עבודה / עבודה חלקית", icon: <IconGap />, iconColor: "financial" },
];

const WHY_TEXT =
  "מס הכנסה מחשב מס לפי הנחת הכנסה חודשית אחידה לאורך השנה. שינויים בשכר או בתעסוקה עלולים ליצור פער בין המס שנוכה בפועל לבין המס הנדרש.";

/**
 * Apply Step 1 exclusivity rules when toggling an option.
 * "לא זכור לי שינוי משמעותי" is a negation option — mutually exclusive with all others.
 * Exported for testing.
 */
export function applyStep1Exclusivity(
  current: string[],
  toggled: string,
): string[] {
  if (current.includes(toggled)) {
    return current.filter((s) => s !== toggled);
  }
  if (toggled === OPTION_NO_CHANGE) {
    return [toggled];
  }
  return current.filter((s) => s !== OPTION_NO_CHANGE).concat(toggled);
}

function getAcknowledgment(selections: string[]): string | null {
  if (selections.length === 0) return null;
  if (selections.includes(OPTION_NO_CHANGE)) {
    return "רשמנו שלא זכור שינוי משמעותי בתבנית ההעסקה.";
  }
  if (selections.length === 1) {
    return "רשמנו שהיה שינוי בתבנית ההעסקה או השכר.";
  }
  return "רשמנו מספר שינויים בתבנית ההעסקה והשכר.";
}

const AckIcon = (
  <svg className={styles.ackIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

interface Step1Props {
  selections: string[];
  onChange: (selections: string[]) => void;
}

export function Step1Employment({ selections, onChange }: Step1Props) {
  const handleToggle = (option: string) => {
    onChange(applyStep1Exclusivity(selections, option));
  };

  const acknowledgment = getAcknowledgment(selections);

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>
        האם במהלך שש השנים האחרונות היה שינוי בתבנית ההעסקה או השכר שלך?
      </h2>
      <div className={styles.options} role="group" aria-label="בחירת שינויים בהעסקה">
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
          label={OPTION_NO_CHANGE}
          icon={<IconNone />}
          selected={selections.includes(OPTION_NO_CHANGE)}
          onToggle={() => handleToggle(OPTION_NO_CHANGE)}
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
