import styles from "./DisclaimerBlock.module.css";

interface DisclaimerBlockProps {
  text: string;
}

export function DisclaimerBlock({ text }: DisclaimerBlockProps) {
  return (
    <div className={styles.disclaimer} role="note">
      <p>{text}</p>
    </div>
  );
}
