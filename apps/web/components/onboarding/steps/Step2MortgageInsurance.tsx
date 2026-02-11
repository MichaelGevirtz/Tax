"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import { IconHouse, IconShield, IconNone, IconQuestion } from "../icons";
import styles from "./steps.module.css";

const OPTION_MORTGAGE = "משכנתא";
const OPTION_LIFE_INSURANCE = "ביטוח חיים פרטי";
const OPTION_NONE = "לא היה לי";
const OPTION_UNSURE = "לא בטוח";

const EXCLUSIVE_OPTIONS = [OPTION_NONE, OPTION_UNSURE];

const WHY_TEXT_DEFAULT =
  "במקרים כאלה קיימים לעיתים תשלומים שעשויים לזכות בהטבות מס, אך הם לא תמיד מנוצלים אוטומטית ודורשים בדיקה יזומה.";

const WHY_TEXT_UNSURE =
  "זה בסדר אם אתה לא בטוח. בהמשך נבדוק את זה, ואם יהיה צורך נבקש אישור שנתי מתאים.";

/**
 * Apply Step 2 exclusivity rules when toggling an option.
 * "לא היה לי" and "לא בטוח" are exclusive with positive options.
 * Positive options (משכנתא, ביטוח חיים פרטי) can be multi-selected together.
 * Exported for testing.
 */
export function applyStep2Exclusivity(
  current: string[],
  toggled: string,
): string[] {
  if (current.includes(toggled)) {
    return current.filter((s) => s !== toggled);
  }
  if (EXCLUSIVE_OPTIONS.includes(toggled)) {
    return [toggled];
  }
  return current
    .filter((s) => !EXCLUSIVE_OPTIONS.includes(s))
    .concat(toggled);
}

function getAcknowledgment(selections: string[]): string | null {
  if (selections.length === 0) return null;

  if (selections.includes(OPTION_UNSURE)) {
    return "רשמנו שאין ודאות לגבי משכנתא או ביטוח חיים.";
  }
  if (selections.includes(OPTION_NONE)) {
    return "רשמנו שלא הייתה משכנתא או ביטוח חיים פרטי.";
  }

  const hasMortgage = selections.includes(OPTION_MORTGAGE);
  const hasInsurance = selections.includes(OPTION_LIFE_INSURANCE);

  if (hasMortgage && hasInsurance) {
    return "רשמנו שהייתה גם משכנתא וגם ביטוח חיים פרטי.";
  }
  if (hasMortgage) {
    return "רשמנו שהייתה משכנתא באחת מהשנים.";
  }
  if (hasInsurance) {
    return "רשמנו שהיה ביטוח חיים פרטי באחת מהשנים.";
  }

  return null;
}

const AckIcon = (
  <svg className={styles.ackIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12l3 3 5-5" />
  </svg>
);

interface Step2Props {
  selections: string[];
  onChange: (selections: string[]) => void;
}

export function Step2MortgageInsurance({
  selections,
  onChange,
}: Step2Props) {
  const handleToggle = (option: string) => {
    onChange(applyStep2Exclusivity(selections, option));
  };

  const acknowledgment = getAcknowledgment(selections);
  const isUnsure = selections.includes(OPTION_UNSURE);
  const whyText = isUnsure ? WHY_TEXT_UNSURE : WHY_TEXT_DEFAULT;

  return (
    <div className={styles.step}>
      <h2 className={styles.question}>
        האם באחת מהשנים היה לך אחד מהדברים הבאים?
      </h2>
      <div className={styles.options} role="group" aria-label="משכנתא וביטוח חיים">
        <WizardOption
          label={OPTION_MORTGAGE}
          icon={<IconHouse />}
          iconColor="property"
          selected={selections.includes(OPTION_MORTGAGE)}
          onToggle={() => handleToggle(OPTION_MORTGAGE)}
          variant="card"
        />
        <WizardOption
          label={OPTION_LIFE_INSURANCE}
          icon={<IconShield />}
          iconColor="neutral"
          selected={selections.includes(OPTION_LIFE_INSURANCE)}
          onToggle={() => handleToggle(OPTION_LIFE_INSURANCE)}
          variant="card"
        />
        <div className={styles.separator}>או</div>
        <WizardOption
          label={OPTION_NONE}
          icon={<IconNone />}
          selected={selections.includes(OPTION_NONE)}
          onToggle={() => handleToggle(OPTION_NONE)}
          variant="negation"
        />
        <WizardOption
          label={OPTION_UNSURE}
          icon={<IconQuestion />}
          selected={selections.includes(OPTION_UNSURE)}
          onToggle={() => handleToggle(OPTION_UNSURE)}
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
