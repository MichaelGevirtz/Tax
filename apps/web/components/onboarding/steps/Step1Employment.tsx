"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import styles from "./steps.module.css";

const OPTION_NO_CHANGE = "לא זכור לי שינוי משמעותי";

const OPTIONS = [
  "שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)",
  "החלפת מקום עבודה",
  "עבודה אצל יותר ממעסיק אחד באותה שנה",
  "תקופה ללא עבודה / עבודה חלקית",
  OPTION_NO_CHANGE,
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
  // Deselect if already selected
  if (current.includes(toggled)) {
    return current.filter((s) => s !== toggled);
  }

  // Selecting the negation option clears all others
  if (toggled === OPTION_NO_CHANGE) {
    return [toggled];
  }

  // Selecting any positive option clears the negation option
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
        האם במהלך אחת מהשנים שבחרת היה שינוי בתבנית ההעסקה או השכר שלך?
      </h2>
      <div className={styles.options} role="group" aria-label="בחירת שינויים בהעסקה">
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
      <WhyBlock text={WHY_TEXT} visible={true} />
    </div>
  );
}
