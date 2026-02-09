"use client";

import { useState } from "react";
import { trackEvent } from "../../lib/analytics";
import styles from "./FAQAccordion.module.css";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "guaranteed_refund",
    question: "האם מובטח לי החזר?",
    answer:
      "לא. הבדיקה היא אינדיקטיבית בלבד. הבדיקה הסופית מתבצעת על ידי רשות המסים על סמך הנתונים שתגיש.",
  },
  {
    id: "filing_for_me",
    question: "האם אתם מגישים בשבילי?",
    answer:
      "לא. אנחנו מייצרים את הטופס — אתה מגיש בעצמך. אתה שולט בכל שלב בתהליך.",
  },
  {
    id: "required_documents",
    question: "אילו מסמכים צריך?",
    answer:
      "טופס 106 מהמעסיק שלך. זה המסמך היחיד הנדרש לתחילת הבדיקה.",
  },
  {
    id: "pricing",
    question: "כמה זה עולה?",
    answer:
      "מחיר קבוע לכל הפקה. ללא עמלת הצלחה, ללא מנוי, ללא הפתעות.",
  },
];

export function FAQAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    const isOpening = openId !== id;
    setOpenId(isOpening ? id : null);

    if (isOpening) {
      trackEvent("faq_opened", {
        step_id: "landing",
        screen_id: "S0",
        faq_id: id,
      });
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>שאלות נפוצות</h2>
        <div className={styles.list}>
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className={styles.item}>
                <button
                  className={styles.question}
                  onClick={() => toggle(item.id)}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span>{item.question}</span>
                  <span className={styles.toggle} aria-hidden="true">
                    {isOpen ? "\u2212" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${item.id}`}
                    className={styles.answer}
                    role="region"
                    aria-labelledby={`faq-question-${item.id}`}
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
