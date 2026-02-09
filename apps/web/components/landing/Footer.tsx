import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <nav className={styles.links} aria-label="קישורים משפטיים">
          <a href="/privacy">מדיניות פרטיות</a>
          <a href="/terms">תנאי שימוש</a>
        </nav>
        <p className={styles.copy}>&copy; 2026 TaxBack. כל הזכויות שמורות.</p>
      </div>
    </footer>
  );
}
