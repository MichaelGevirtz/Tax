import styles from "./CTABar.module.css";

interface CTABarProps {
  primaryLabel: string;
  onPrimaryClick: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
}

export function CTABar({
  primaryLabel,
  onPrimaryClick,
  primaryDisabled = false,
  secondaryLabel,
  onSecondaryClick,
}: CTABarProps) {
  return (
    <div className={styles.bar}>
      <button
        className={styles.primary}
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        type="button"
      >
        {primaryLabel}
      </button>
      {secondaryLabel && onSecondaryClick && (
        <button
          className={styles.secondary}
          onClick={onSecondaryClick}
          type="button"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
