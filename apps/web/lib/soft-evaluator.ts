/**
 * Soft Eligibility Evaluator — TASK-016.
 * Heuristic gate based on wizard Steps 1–5 answers.
 * Pure function, no IO.
 */

import type { WizardState } from "./wizard-state";

export interface SoftResult {
  canProceedToUpload: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

// ── Signal classification ──────────────────────────────────────────

const STRONG_SIGNALS: Record<keyof Omit<WizardState, "years">, { options: string[]; reason: string }[]> = {
  employmentChanges: [
    { options: ["עבודה אצל יותר ממעסיק אחד באותה שנה"], reason: "עבודה אצל מספר מעסיקים באותה שנה" },
    { options: ["תקופה ללא עבודה / עבודה חלקית"], reason: "תקופה ללא עבודה או עבודה חלקית" },
    { options: ["שינוי בשכר במהלך השנה (עלייה / ירידה / בונוסים)"], reason: "שינוי בשכר במהלך השנה" },
    { options: ["החלפת מקום עבודה"], reason: "החלפת מקום עבודה" },
  ],
  mortgageAndLifeInsurance: [
    { options: ["משכנתא"], reason: "תשלומי משכנתא" },
    { options: ["ביטוח חיים פרטי"], reason: "ביטוח חיים פרטי" },
  ],
  personalCredits: [
    { options: ["סיום תואר / לימודים אקדמיים"], reason: "סיום תואר אקדמי" },
    { options: ["ילדים מתחת לגיל 18"], reason: "ילדים מתחת לגיל 18" },
    { options: ["עולה חדש / תושב חוזר"], reason: "עולה חדש או תושב חוזר" },
    { options: ["מגבלה רפואית"], reason: "מגבלה רפואית" },
  ],
  additionalIncome: [
    { options: ["רווחים משוק ההון"], reason: "הכנסות משוק ההון" },
    { options: ["הכנסה משכר דירה"], reason: "הכנסה משכר דירה" },
  ],
};

const WEAK_SIGNALS: Record<keyof Omit<WizardState, "years">, { options: string[]; reason: string }[]> = {
  employmentChanges: [],
  mortgageAndLifeInsurance: [
    { options: ["לא בטוח"], reason: "ייתכנו הטבות מס שלא נוצלו" },
  ],
  personalCredits: [],
  additionalIncome: [
    { options: ["הכנסה נוספת אחרת"], reason: "הכנסה נוספת שעשויה להשפיע על חישוב המס" },
  ],
};

// ── Evaluator ──────────────────────────────────────────────────────

export function evaluateSoftEligibility(state: WizardState): SoftResult {
  const matchedStrong: string[] = [];
  const matchedWeak: string[] = [];

  for (const key of Object.keys(STRONG_SIGNALS) as (keyof typeof STRONG_SIGNALS)[]) {
    const selections = state[key] as string[];
    for (const signal of STRONG_SIGNALS[key]) {
      if (signal.options.some((opt) => selections.includes(opt))) {
        matchedStrong.push(signal.reason);
      }
    }
  }

  for (const key of Object.keys(WEAK_SIGNALS) as (keyof typeof WEAK_SIGNALS)[]) {
    const selections = state[key] as string[];
    for (const signal of WEAK_SIGNALS[key]) {
      if (signal.options.some((opt) => selections.includes(opt))) {
        matchedWeak.push(signal.reason);
      }
    }
  }

  const strongCount = matchedStrong.length;
  const weakCount = matchedWeak.length;
  const canProceedToUpload = strongCount > 0 || weakCount > 0;

  let confidence: SoftResult["confidence"];
  if (strongCount >= 2) {
    confidence = "high";
  } else if (strongCount === 1 || weakCount >= 2) {
    confidence = "medium";
  } else if (weakCount >= 1) {
    confidence = "low";
  } else {
    confidence = "low";
  }

  // Build reasons: strong first, then weak. Cap at 5.
  let reasons = [...matchedStrong, ...matchedWeak].slice(0, 5);

  if (!canProceedToUpload) {
    reasons = ["לפי התשובות שלך, לא זוהו סימנים מובהקים לזכאות להחזר מס"];
  }

  return { canProceedToUpload, confidence, reasons };
}
