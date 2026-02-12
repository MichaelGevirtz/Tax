"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  loadWizardState,
  loadSoftResult,
  clearSoftResult,
} from "../../lib/wizard-state";
import type { SoftResult as SoftResultType } from "../../lib/soft-evaluator";
import { trackEvent } from "../../lib/analytics";
import styles from "./SoftResult.module.css";

// Ring config: circumference = 2 * π * 50 = 314.16
// high = 85% fill → offset = 314.16 * 0.15 = 47.12
// medium = 60% fill → offset = 314.16 * 0.40 = 125.66
// low = 35% fill → offset = 314.16 * 0.65 = 204.20
const RING_CONFIG: Record<
  SoftResultType["confidence"],
  { target: number; label: string }
> = {
  high: { target: 47.12, label: "סיכוי גבוה" },
  medium: { target: 125.66, label: "סיכוי בינוני" },
  low: { target: 204.2, label: "סיכוי קיים" },
};

const RING_PROGRESS_STYLES: Record<SoftResultType["confidence"], string> = {
  high: styles.ringProgressHigh,
  medium: styles.ringProgressMedium,
  low: styles.ringProgressLow,
};

const RING_LABEL_STYLES: Record<SoftResultType["confidence"], string> = {
  high: styles.ringLabelHigh,
  medium: styles.ringLabelMedium,
  low: styles.ringLabelLow,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_DISPLAY_REASONS = 4;

export function SoftResultScreen() {
  const router = useRouter();
  const [result, setResult] = useState<SoftResultType | null>(null);
  const [ready, setReady] = useState(false);

  // Email form state
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailAlreadySent, setEmailAlreadySent] = useState(false);

  // Guide toggle state
  const [guideOpen, setGuideOpen] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const wizardState = loadWizardState();
    const softResult = loadSoftResult();

    if (!wizardState || !softResult) {
      router.replace("/precheck");
      return;
    }

    setResult(softResult);
    setReady(true);

    trackEvent(
      softResult.canProceedToUpload
        ? "flow_soft_result_viewed"
        : "flow_soft_result_not_eligible_viewed",
      {
        step_id: "soft_result",
        screen_id: "soft_result",
        confidence: softResult.confidence,
        can_proceed: softResult.canProceedToUpload,
        reasons_count: softResult.reasons.length,
      },
    );
  }, [router]);

  if (!ready || !result) return null;

  const handleUploadClick = () => {
    trackEvent("soft_result_upload_clicked", {
      step_id: "soft_result",
      screen_id: "soft_result",
      confidence: result.confidence,
      reasons_count: result.reasons.length,
    });
    router.push("/upload-106");
  };

  const handleBack = () => {
    trackEvent("flow_soft_result_back_clicked", {
      step_id: "soft_result",
      screen_id: "soft_result",
    });
    clearSoftResult();
    router.push("/precheck");
  };

  const handleGuideToggle = () => {
    if (!guideOpen) {
      trackEvent("soft_result_guide_expanded", {
        step_id: "soft_result",
        screen_id: "soft_result",
        confidence: result.confidence,
      });
    }
    setGuideOpen((prev) => !prev);
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError(true);
      trackEvent("soft_result_reminder_validation_failed", {
        step_id: "soft_result",
        screen_id: "soft_result",
        confidence: result.confidence,
      });
      emailInputRef.current?.focus();
      return;
    }

    setEmailError(false);
    setEmailSubmitting(true);

    try {
      const wizardState = loadWizardState();
      const softResult = loadSoftResult();

      const res = await fetch("/api/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          wizardState,
          softResult,
        }),
      });

      if (res.status === 429) {
        setEmailAlreadySent(true);
      } else {
        setEmailSent(true);
      }

      trackEvent("soft_result_reminder_submitted", {
        step_id: "soft_result",
        screen_id: "soft_result",
        confidence: result.confidence,
      });
    } catch {
      // Stub always succeeds, but handle network errors gracefully
      setEmailSent(true);
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleEmailInput = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(false);
  };

  // === Not Eligible Screen ===
  if (!result.canProceedToUpload) {
    return (
      <div className={styles.container}>
        <div className={styles.body}>
          {/* Empty ring with X icon */}
          <div className={styles.ringSection}>
            <div className={styles.ringWrapper}>
              <svg className={styles.ringSvg} viewBox="0 0 108 108">
                <circle className={styles.ringBg} cx="54" cy="54" r="50" />
              </svg>
              <div
                className={`${styles.ringLabel} ${styles.ringLabelLow} ${styles.ringLabelStatic}`}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B6560"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className={`${styles.title} ${styles.titleNotEligible}`}>
            לפי התשובות שלך, לא זוהו סימנים ברורים לזכאות
          </h1>

          <p className={styles.notEligibleBody}>
            התוצאה מבוססת על השאלון בלבד. ייתכן שיש מידע נוסף שלא בא לידי
            ביטוי בתשובות.
          </p>

          <div className={styles.notEligibleActions}>
            <button className={styles.btnPrimary} onClick={handleBack}>
              לעדכן תשובות
            </button>
            <button
              className={styles.btnSecondaryText}
              onClick={() => {
                clearSoftResult();
                router.push("/precheck");
              }}
            >
              לבדוק שנה אחרת
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === Eligible Screen ===
  const ringCfg = RING_CONFIG[result.confidence];
  const displayReasons = result.reasons.slice(0, MAX_DISPLAY_REASONS);

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        {/* 1. Confidence Ring */}
        <div className={styles.ringSection}>
          <div className={styles.ringWrapper}>
            <svg className={styles.ringSvg} viewBox="0 0 108 108">
              <circle className={styles.ringBg} cx="54" cy="54" r="50" />
              <circle
                className={`${styles.ringProgress} ${RING_PROGRESS_STYLES[result.confidence]} ${styles.ringProgressAnimate}`}
                cx="54"
                cy="54"
                r="50"
                style={
                  { "--ring-target": ringCfg.target } as React.CSSProperties
                }
              />
            </svg>
            <div
              className={`${styles.ringLabel} ${RING_LABEL_STYLES[result.confidence]}`}
            >
              {ringCfg.label}
            </div>
          </div>
        </div>

        {/* 2. Title */}
        <h1 className={styles.title}>
          לפי התשובות שלך, קיימים מצבים שעשויים להוביל להחזר מס
        </h1>

        {/* 3. Reason Bullets */}
        <ul className={styles.reasons}>
          {displayReasons.map((reason) => (
            <li key={reason} className={styles.reason}>
              <svg
                className={styles.reasonIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        {/* 4. Transparency Line */}
        <p className={styles.transparency}>
          האימות הסופי מבוסס על נתוני טופס 106 בלבד.
        </p>

        {/* 5. Fork Cards */}
        <div className={styles.fork}>
          {/* Card A — Upload */}
          <div className={`${styles.forkCard} ${styles.forkCardPrimary}`}>
            <svg
              className={styles.forkCardIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>
            <div className={styles.forkCardTitle}>יש לי טופס 106</div>
            <div className={styles.forkCardSubtitle}>
              אפשר להעלות עכשיו ולקבל תוצאה תוך דקות
            </div>
            <button className={styles.forkCardBtn} onClick={handleUploadClick}>
              העלאת טופס 106
            </button>
          </div>

          {/* Card B — Remind Later */}
          <div className={`${styles.forkCard} ${styles.forkCardSecondary}`}>
            <svg
              className={styles.forkCardIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="22 4 12 13 2 4" />
            </svg>
            <div className={styles.forkCardTitle}>
              עדיין אין לי את הטופס
            </div>
            <div className={styles.forkCardSubtitle}>
              נשלח תזכורת עם הוראות פשוטות להשגת הטופס
            </div>

            {/* Email form */}
            {!emailSent && !emailAlreadySent && (
              <form className={styles.emailForm} onSubmit={handleEmailSubmit}>
                <label htmlFor="reminder-email" className={styles.srOnly}>
                  כתובת מייל
                </label>
                <input
                  ref={emailInputRef}
                  id="reminder-email"
                  type="email"
                  className={`${styles.emailInput} ${emailError ? styles.emailInputError : ""}`}
                  placeholder="your@email.com"
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => handleEmailInput(e.target.value)}
                />
                <span
                  className={`${styles.emailError} ${emailError ? styles.emailErrorShow : ""}`}
                  role="alert"
                >
                  נא להזין כתובת מייל תקינה
                </span>
                <button
                  type="submit"
                  className={styles.emailSubmit}
                  disabled={emailSubmitting}
                >
                  {emailSubmitting ? "שולח..." : "שליחת תזכורת"}
                </button>
                <span className={styles.emailPrivacy}>
                  לא נשלח ספאם. תזכורת אחת בלבד.
                </span>
              </form>
            )}

            {/* Success state */}
            {emailSent && (
              <div
                className={`${styles.emailSuccess} ${styles.emailSuccessShow}`}
              >
                <svg
                  className={styles.emailSuccessIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
                <div className={styles.emailSuccessText}>התזכורת נשלחה</div>
                <div className={styles.emailSuccessSubtext}>
                  שלחנו מייל עם קישור חזרה והוראות
                  <br />
                  להשגת טופס 106 מהמעסיק
                </div>
              </div>
            )}

            {/* Already sent state (429) */}
            {emailAlreadySent && (
              <div
                className={`${styles.emailSuccess} ${styles.emailSuccessShow}`}
              >
                <svg
                  className={styles.emailSuccessIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
                <div className={styles.emailSuccessText}>
                  כבר שלחנו תזכורת
                </div>
                <div className={styles.emailSuccessSubtext}>
                  ניתן לבדוק בתיבת המייל
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Guide Toggle */}
        <button className={styles.guideToggle} onClick={handleGuideToggle}>
          איך משיגים טופס 106?
          <svg
            className={`${styles.guideChevron} ${guideOpen ? styles.guideChevronOpen : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          className={`${styles.guideContent} ${guideOpen ? styles.guideContentOpen : ""}`}
        >
          <ul className={styles.guideList}>
            <li className={styles.guideItem}>
              <div className={styles.guideDot} />
              <span>
                <strong className={styles.guideItemBold}>
                  ממערכת השכר של המעסיק
                </strong>{" "}
                — חלק מהמעסיקים מנפיקים דרך פורטל עובדים
              </span>
            </li>
            <li className={styles.guideItem}>
              <div className={styles.guideDot} />
              <span>
                <strong className={styles.guideItemBold}>
                  פנייה למחלקת שכר / HR
                </strong>{" "}
                — בדרך כלל מספיק מייל קצר
              </span>
            </li>
            <li className={styles.guideItem}>
              <div className={styles.guideDot} />
              <span>
                <strong className={styles.guideItemBold}>
                  מרואה החשבון של המעסיק
                </strong>{" "}
                — אם המעסיק משתמש ברו&quot;ח חיצוני
              </span>
            </li>
          </ul>
        </div>

        {/* 7. Back Link */}
        <div className={styles.backLink}>
          <button className={styles.backLinkAnchor} onClick={handleBack}>
            חזרה לשאלון
          </button>
        </div>
      </div>
    </div>
  );
}
