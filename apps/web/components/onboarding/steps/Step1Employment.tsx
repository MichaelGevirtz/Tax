"use client";

import { WizardOption } from "../WizardOption";
import { WhyBlock } from "../WhyBlock";
import styles from "./steps.module.css";

const OPTIONS = [
  "שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)",
  "החלפת מקום עבודה",
  "עבודה אצל יותר ממעסיק אחד באותה שנה",
  "תקופה ללא עבודה / עבודה חלקית",
  "לא זכור לי שינוי משמעותי",
];

const WHY_TEXT =
  "מס הכנסה מחשב מס לפי הנחת הכנסה חודשית אחידה לאורך השנה. שינויים בשכר או בתעסוקה עלולים ליצור פער בין המס שנוכה בפועל לבין המס הנדרש.";

interface Step1Props {
  selections: string[];
  onChange: (selections: string[]) => void;
}

export function Step1Employment({ selections, onChange }: Step1Props) {
  const handleToggle = (option: string) => {
    if (selections.includes(option)) {
      onChange(selections.filter((s) => s !== option));
    } else {
      onChange([...selections, option]);
    }
  };

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
      <WhyBlock text={WHY_TEXT} visible={selections.length > 0} />
    </div>
  );
}
