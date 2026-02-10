import styles from "./WhyBlock.module.css";

interface WhyBlockProps {
  text: string;
  visible: boolean;
}

export function WhyBlock({ text, visible }: WhyBlockProps) {
  if (!visible) return null;

  return (
    <div className={styles.container} role="note">
      <div className={styles.label}>למה זה חשוב?</div>
      <div className={styles.text}>{text}</div>
    </div>
  );
}
