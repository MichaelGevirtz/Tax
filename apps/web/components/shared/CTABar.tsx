import styles from "./CTABar.module.css";

interface CTABarProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  trustFooter?: boolean;
}

const ClockIcon = (
  <svg className={styles.trustIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const LockIcon = (
  <svg className={styles.trustIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const CheckIcon = (
  <svg className={styles.trustIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export function CTABar({
  primaryLabel,
  onPrimaryClick,
  primaryDisabled = false,
  secondaryLabel,
  onSecondaryClick,
  trustFooter = false,
}: CTABarProps) {
  return (
    <>
      <div className={styles.bar}>
        {secondaryLabel && onSecondaryClick && (
          <button
            className={styles.secondary}
            onClick={onSecondaryClick}
            type="button"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          className={styles.primary}
          onClick={onPrimaryClick}
          disabled={primaryDisabled}
          type="button"
        >
          {primaryLabel}
        </button>
      </div>
      {trustFooter && (
        <div className={styles.trustFooter}>
          <span className={styles.trustItem}>{ClockIcon} כ-2 דקות</span>
          <span className={styles.trustItem}>{LockIcon} ללא רישום</span>
          <span className={styles.trustItem}>{CheckIcon} בדיקה חינמית</span>
        </div>
      )}
    </>
  );
}
