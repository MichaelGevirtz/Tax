import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    number: 1,
    title: "בדיקה מקדימה",
    description: "ענה על כמה שאלות קצרות כדי לבדוק אם כדאי להמשיך.",
  },
  {
    number: 2,
    title: "העלאת טופס 106",
    description: "העלה את הטופס שקיבלת מהמעסיק. הנתונים נשלפים אוטומטית.",
  },
  {
    number: 3,
    title: "הפקת טופס 135",
    description: "המערכת מייצרת את הטופס על סמך הנתונים שבדקת ואישרת.",
  },
  {
    number: 4,
    title: "הגשה עצמית",
    description: "אתה מוריד את הטופס ומגיש בעצמך לרשות המסים.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>איך זה עובד?</h2>
        <div className={styles.steps}>
          {STEPS.map((step) => (
            <div key={step.number} className={styles.step}>
              <div className={styles.number} aria-hidden="true">
                {step.number}
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
