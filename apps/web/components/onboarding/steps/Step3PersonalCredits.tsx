"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import styles from "./steps.module.css";

const OPTION_DEGREE = "סיימתי תואר / לימודים אקדמיים";
const OPTION_CREDITS =
  "יש לי נקודות זיכוי אישיות (ילדים מתחת לגיל 18, מגבלה, עולה חדש וכד׳)";
const OPTION_NONE = "לא רלוונטי";

const OPTIONS = [OPTION_DEGREE, OPTION_CREDITS, OPTION_NONE];

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
  // Deselect if already selected
  if (current.includes(toggled)) {
    return current.filter((s) => s !== toggled);
  }

  // Selecting "לא רלוונטי" clears all others
  if (toggled === OPTION_NONE) {
    return [toggled];
  }

  // Selecting any positive option clears "לא רלוונטי"
  return current.filter((s) => s !== OPTION_NONE).concat(toggled);
}

function getAcknowledgment(selections: string[]): string | null {
  if (selections.length === 0) return null;

  if (selections.includes(OPTION_NONE)) {
    return "רשמנו שאין הטבות או נקודות זיכוי ידועות.";
  }

  const hasDegree = selections.includes(OPTION_DEGREE);
  const hasCredits = selections.includes(OPTION_CREDITS);

  if (hasDegree && hasCredits) {
    return "רשמנו שסיימת תואר ויש לך נקודות זיכוי אישיות.";
  }
  if (hasDegree) {
    return "רשמנו שסיימת תואר או לימודים אקדמיים.";
  }
  if (hasCredits) {
    return "רשמנו שיש לך נקודות זיכוי אישיות.";
  }

  return null;
}

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
      <WhyBlock text={WHY_TEXT} visible={selections.length > 0} />
    </div>
  );
}
