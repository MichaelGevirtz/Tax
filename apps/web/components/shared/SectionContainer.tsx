import styles from "./SectionContainer.module.css";

interface SectionContainerProps {
  children: React.ReactNode;
  /** Use "page" for wider content pages, "content" for app flow */
  maxWidth?: "content" | "page";
  /** Alternate background color */
  alt?: boolean;
  className?: string;
  id?: string;
}

export function SectionContainer({
  children,
  maxWidth = "content",
  alt = false,
  className,
  id,
}: SectionContainerProps) {
  return (
    <section
      id={id}
      className={[
        styles.section,
        alt ? styles.alt : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={styles.inner}
        style={{
          maxWidth:
            maxWidth === "page"
              ? "var(--max-page-width)"
              : "var(--max-content-width)",
        }}
      >
        {children}
      </div>
    </section>
  );
}
