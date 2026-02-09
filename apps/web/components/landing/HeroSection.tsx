"use client";

import { useRouter } from "next/navigation";
import { trackEvent } from "../../lib/analytics";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  const router = useRouter();

  const handlePrimaryClick = () => {
    trackEvent("cta_clicked", {
      step_id: "landing",
      screen_id: "S0",
      cta_id: "start_precheck",
    });
    router.push("/precheck");
  };

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <h1 className={styles.title}>
          שכירים רבים לא בודקים החזר מס
          <br />
          ומפספסים כסף שמגיע להם לפי החוק
        </h1>
        <p className={styles.subtitle}>
          בדיקה של 2 דקות · בלי התחייבות
        </p>
        <button
          className={styles.primaryBtn}
          onClick={handlePrimaryClick}
          type="button"
        >
          לבדוק עכשיו
        </button>
        <div className={styles.microCopy}>
          <span>ללא התחייבות</span>
          <span>בלי פרטי אשראי</span>
        </div>
      </div>
    </section>
  );
}
