import styles from "./TrustSignals.module.css";

const SIGNALS = [
  { icon: "\u2713", label: "שירות עצמי" },
  { icon: "\u2713", label: "ללא עמלת הצלחה" },
  { icon: "\u2713", label: "אתה שולט בתהליך" },
  { icon: "\u26E8", label: "מאובטח" },
] as const;

export function TrustSignals() {
  return (
    <section className={styles.trust}>
      <div className={styles.row}>
        {SIGNALS.map((signal) => (
          <div key={signal.label} className={styles.badge}>
            <span className={styles.icon} aria-hidden="true">
              {signal.icon}
            </span>
            {signal.label}
          </div>
        ))}
      </div>
      <p className={styles.privacy}>
        המידע שלך מעובד באופן מאובטח ואינו נשמר מעבר לשימוש הנוכחי.
      </p>
    </section>
  );
}
