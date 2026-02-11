# Hebrew Copy Rules — Tax Refund SaaS

All user-facing text is Hebrew. Developer instructions stay in English.

---

## Voice & Tone

| Attribute | Rule |
|-----------|------|
| Person | Second person singular (את/ה). Never first-person plural (אנחנו). |
| Tone | Direct, calm, professional. Like a competent accountant, not a salesperson. |
| Register | Formal-neutral (שפה תקנית but not stiff). No slang, no marketing superlatives. |
| Emotion | Factual reassurance. Never fear-mongering about tax. Never hype. |
| Length | Shortest correct sentence wins. If it can be 3 words, don't make it 7. |

---

## Hard Forbidden Patterns

These NEVER appear in any user-facing string:

| Pattern | Why |
|---------|-----|
| Refund amounts/ranges pre-payment | Decision-log: Option D — amounts only post-payment |
| "נגיש בשבילך" / "אנחנו מטפלים" | We don't file. User submits themselves. |
| "מאושר" / "אושר" / "מוגש" | System generates; doesn't approve or submit. |
| "מובטח" / "בטוח" / "100%" | No outcome guarantees. |
| "הזדמנות אחרונה" / "מוגבל" / "מבצע" | No urgency/scarcity tactics. |
| "צור קשר" / "התקשר" / "שלח הודעה" | No human support — self-serve only. |
| First-person plural ("אנחנו נפיק") | Use: "המערכת מפיקה" (the system generates). |
| English words in Hebrew UI | Write everything in Hebrew. |
| Percentages for confidence | Use qualitative: גבוה / בינוני / נמוך. |
| "ייעוץ מס" | We don't provide tax advice. |

---

## Approved Copy Patterns

### CTAs (Primary)
- "בדוק/י זכאות" — Check eligibility
- "העלה/י טופס 106" — Upload Form 106
- "המשך/י" — Continue
- "הפק/י טופס 135" — Generate Form 135
- "הורד/י את הטופס" — Download the form

### CTAs (Secondary)
- "חזרה" — Back
- "דלג/י" — Skip
- "למידע נוסף" — Learn more
- "איך זה עובד?" — How does it work?

### Disabled State Reasons
- "יש להעלות קובץ PDF תחילה" — Upload a PDF first
- "יש לאשר את הנתונים לפני המשך" — Confirm the data before continuing
- "יש לסמן את תיבת האישור" — Check the confirmation box

### Eligibility Levels (Pre-Payment)
- "סיכוי גבוה להחזר" — High likelihood of refund
- "סיכוי בינוני להחזר" — Medium likelihood
- "סיכוי נמוך להחזר" — Low likelihood
- "לא נמצאה זכאות ברורה" — No clear eligibility found
- Always pair with: "לתוצאה מדויקת, הפק/י טופס 135" when applicable.

### Error Messages

Pattern: **[מה קרה] + [מה לעשות]**

- "הקובץ שהועלה אינו PDF. יש להעלות קובץ בפורמט PDF."
- "לא הצלחנו לקרוא את הטופס. נסה/י להעלות סריקה באיכות גבוהה יותר."
- "אירעה שגיאה. ניתן לנסות שוב."
- "הטופס שהועלה אינו טופס 106. יש להעלות טופס 106 מהמעסיק."

**Never blame the user. Never use technical jargon.**

### Legal/Disclaimer Copy
- "המערכת מפיקה את טופס 135 על בסיס הנתונים שהזנת. האחריות על נכונות הנתונים והגשת הטופס היא שלך."
- "השירות אינו מהווה ייעוץ מס. בכל שאלה יש לפנות ליועץ מס מוסמך."
- "טופס 135 מופק באופן אוטומטי. המערכת אינה מגישה את הטופס לרשות המסים."

### Tooltip / Help Text
- One sentence where possible.
- Start with benefit, not definition.
- "מאפשר לקבל החזר מס עבור תשלומי משכנתא" > "סעיף 35א לפקודת מס הכנסה"

---

## Page Title Patterns (SEO)

Format: `[Primary keyword] — [Value prop] | [Brand]`

- "החזר מס לשכירים — בדיקת זכאות חינם | [Brand]"
- "איך מגישים טופס 135 בעצמך | [Brand]"
- "החזר מס על משכנתא — מי זכאי ואיך מגישים | [Brand]"

Meta description pattern: **[What the page answers] + [Implied CTA]**

- "בדוק/י אם מגיע לך החזר מס. העלה טופס 106 וקבל/י טופס 135 מוכן להגשה — ללא תיווך, ללא עמלות."

---

## Number & Date Formatting

| Type | Format | Example |
|------|--------|---------|
| Currency | Number + space + ₪ | 167,596 ₪ |
| Dates | DD/MM/YYYY or month-name year | 15/03/2026 or מרץ 2026 |
| Tax years | Year only | 2024, 2023 |
| ID numbers | As-is (9 digits, no dashes) | 031394828 |
| Thousands separator | Comma | 622,809 |
