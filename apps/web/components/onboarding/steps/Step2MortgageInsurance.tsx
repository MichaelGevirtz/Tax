"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import styles from "./steps.module.css";

const OPTION_MORTGAGE = "משכנתא";
const OPTION_LIFE_INSURANCE = "ביטוח חיים פרטי (שאינו חלק ממשכנתא)";
const OPTION_BOTH = "גם משכנתא וגם ביטוח חיים פרטי";
const OPTION_NONE = "לא היה לי אף אחד מאלה";
const OPTION_UNSURE = "לא בטוח";

const OPTIONS = [
  OPTION_MORTGAGE,
  OPTION_LIFE_INSURANCE,
  OPTION_BOTH,
  OPTION_NONE,
  OPTION_UNSURE,
];

const POSITIVE_OPTIONS = [OPTION_MORTGAGE, OPTION_LIFE_INSURANCE, OPTION_BOTH];
const EXCLUSIVE_OPTIONS = [OPTION_NONE, OPTION_UNSURE];

const WHY_TEXT =
  "במקרים כאלה קיימים לעיתים תשלומים שעשויים לזכות בהטבות מס, אך הם לא תמיד מנוצלים אוטומטית ודורשים בדיקה יזומה.";

interface Step2Props {
  selections: string[];
  onChange: (selections: string[]) => void;
}

/**
 * Apply Step 2 exclusivity rules when toggling an option.
 * Exported for testing.
 */
export function applyStep2Exclusivity(
  current: string[],
  toggled: string,
): string[] {
  // If currently selected, just deselect it
  if (current.includes(toggled)) {
    return current.filter((s) => s !== toggled);
  }

  // Selecting an exclusive option deselects all others
  if (EXCLUSIVE_OPTIONS.includes(toggled)) {
    return [toggled];
  }

  // Selecting "both" deselects individual items
  if (toggled === OPTION_BOTH) {
    return current
      .filter(
        (s) =>
          s !== OPTION_MORTGAGE &&
          s !== OPTION_LIFE_INSURANCE &&
          !EXCLUSIVE_OPTIONS.includes(s),
      )
      .concat(toggled);
  }

  // Selecting an individual positive option: deselect "both" and exclusive options
  if (toggled === OPTION_MORTGAGE || toggled === OPTION_LIFE_INSURANCE) {
    return current
      .filter((s) => s !== OPTION_BOTH && !EXCLUSIVE_OPTIONS.includes(s))
      .concat(toggled);
  }

  // Default: add the option, remove exclusive options
  return current
    .filter((s) => !EXCLUSIVE_OPTIONS.includes(s))
    .concat(toggled);
}

export function Step2MortgageInsurance({
  selections,
  onChange,
}: Step2Props) {
  const handleToggle = (option: string) => {
    onChange(applyStep2Exclusivity(selections, option));
  };

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>
        האם באחת מהשנים היה לך אחד מהדברים הבאים?
      </h2>
      <div className={styles.options} role="group" aria-label="משכנתא וביטוח חיים">
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
      <WhyBlock text={WHY_TEXT} visible={selections.length > 0} />
    </div>
  );
}
