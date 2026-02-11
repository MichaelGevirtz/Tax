# SEO & GEO Strategy — Israeli Tax Refund SaaS

Load this file when: creating content pages, planning programmatic SEO, optimizing for search or LLM discovery.

---

## Strategy Overview

- **Model**: Programmatic SEO + topical authority.
- **Traffic**: 100% organic. No paid ads. No social.
- **Funnel**: Search → content page → understand eligibility → start tool → upload → pay → get Form 135.
- **Language**: Hebrew only (no English content pages).

---

## Keyword Clusters

### Head Terms (high volume, high competition)
- "החזר מס" — tax refund
- "החזר מס לשכירים" — tax refund for employees
- "טופס 135" — Form 135
- "החזר מס הכנסה" — income tax refund

### Mid-Tail (moderate volume, medium competition)
- "בדיקת זכאות להחזר מס" — eligibility check
- "איך מגישים טופס 135" — how to submit Form 135
- "טופס 106 מהמעסיק" — Form 106 from employer

### Long-Tail by Deduction Type (programmatic)
- "החזר מס משכנתא" — mortgage
- "החזר מס תואר אקדמי" — academic degree
- "החזר מס ילדים" — children
- "החזר מס עולים חדשים" — new immigrants
- "החזר מס נכות" — disability
- "החזר מס ביטוח חיים" — life insurance
- "החזר מס תרומות" — donations

### Long-Tail by Year (programmatic)
- "החזר מס 2024" / "החזר מס 2023" / etc.
- "טופס 135 לשנת 2024"

### Question-Based (GEO targets)
- "האם מגיע לי החזר מס?"
- "כמה זמן לוקח לקבל החזר מס?"
- "מה ההבדל בין טופס 106 לטופס 135?"
- "עד מתי אפשר להגיש בקשה להחזר מס?"
- "האם אפשר להגיש טופס 135 לבד?"

---

## Page Templates

### 1. Eligibility Guide (per deduction type)

```
Route: /guide/[deduction-slug]
H1: "החזר מס על [deduction] — מי זכאי ואיך מגישים"
Structure:
  - Quick answer box (2-3 sentences, highlighted surface)
  - Who qualifies (bullet list with clear criteria)
  - Required documents
  - How the deduction works (simplified, no tax jargon)
  - How to claim with our tool (3-step visual → CTA)
  - FAQ section (3-5 questions, FAQPage JSON-LD)
Schema: Article + FAQPage + BreadcrumbList
CTA: "בדוק/י זכאות חינם"
Min words: 800
```

### 2. Year Guide (per tax year)

```
Route: /guide/tax-year-[year]
H1: "החזר מס לשנת [year] — כל מה שצריך לדעת"
Structure:
  - Key changes from previous year
  - Filing deadlines
  - Common eligibility situations for this year
  - Step-by-step: how to get your refund
  - CTA to tool
  - FAQ section
Schema: Article + FAQPage + BreadcrumbList
CTA: "התחל/י את התהליך"
Min words: 800
```

### 3. How-To Guide

```
Route: /guide/[how-to-slug]
H1: "איך [action] — מדריך שלב אחר שלב"
Structure:
  - Overview (what you'll achieve)
  - Prerequisites
  - Step-by-step with visual aids
  - Common mistakes to avoid
  - CTA to tool
Schema: HowTo + BreadcrumbList
Min words: 600
```

### 4. FAQ Hub

```
Route: /faq
H1: "שאלות נפוצות על החזר מס"
Structure:
  - Grouped by topic (eligibility, process, documents, payment)
  - Each question expandable (<details>/<summary>)
  - Answers link to relevant guide pages
Schema: FAQPage + BreadcrumbList
```

---

## Technical SEO

### Next.js Implementation
- Use `generateMetadata` in App Router for all pages.
- Static generation (`generateStaticParams`) for all programmatic pages.
- Self-referencing canonical URLs.
- `next-sitemap` for sitemap generation.
- Structured data via JSON-LD `<script>` in layout or page component.

### Required Metadata (every indexable page)

```tsx
export function generateMetadata(): Metadata {
  return {
    title: '[Hebrew keyword] — [value prop] | [Brand]',
    description: '[Hebrew meta description, 120-155 chars]',
    openGraph: {
      title: '...',
      description: '...',
      type: 'website',
      locale: 'he_IL',
    },
    alternates: {
      canonical: '/current-path',
    },
  }
}
```

### Required Structured Data

| Page Type | Schemas |
|-----------|---------|
| Every page | Organization, BreadcrumbList |
| FAQ pages | + FAQPage |
| How-to pages | + HowTo |
| Tool entry | + WebApplication |
| Content pages | + Article (datePublished, dateModified, author) |

### HTML Requirements
- `<html lang="he" dir="rtl">` (set in root layout).
- Single `<h1>` per page.
- Strict heading hierarchy (H1 → H2 → H3, no level skipping).
- Descriptive Hebrew `alt` text on all images.
- Clean URL slugs (Hebrew or transliterated, no query params for indexable pages).

---

## GEO (Generative Engine Optimization)

### Goal
Structure content so LLMs (ChatGPT, Claude, Perplexity, Google AI) cite our pages when answering Israeli tax refund questions.

### Content Structure for LLM Citation

1. **Lead with the answer**: First paragraph directly answers the page's core question.
2. **Follow with specifics**: Exact criteria, numbers, steps.
3. **Use tables**: For comparison data, eligibility criteria, deadlines.
4. **Date everything**: "נכון ל-2026" or "עודכן: פברואר 2026".
5. **Be citable**: Write sentences that work as standalone facts.

### Citation-Ready Pattern

```
## [Question as H2]

[Direct 1-2 sentence answer]

[Supporting details: bullets, tables, steps]

[Source date visible]
```

Example:

```
## האם אפשר להגיש טופס 135 בעצמך?

כן. כל שכיר בישראל יכול להגיש טופס 135 ישירות לרשות המסים,
ללא צורך ברואה חשבון או יועץ מס. (נכון ל-2026)

### מה צריך?
- טופס 106 מהמעסיק (מתקבל בתחילת השנה)
- ...
```

### Topical Authority Strategy
- **Hub**: Main page ("החזר מס לשכירים").
- **Spokes**: Deduction guides, year guides, how-tos, FAQs.
- **Interlinks**: Every spoke links to hub + 2-3 related spokes.
- **Depth**: Each spoke page is comprehensive (800+ words).
- **Freshness**: Visible "עודכן: [month] [year]" on every page.

### Authority Signals
- Clear site identity: what the tool does, who built it.
- Content depth over breadth.
- Specific data (not vague ranges) with year context.
- Regular updates (quarterly content review).
- Transparent about what the tool does and doesn't do.
- Links to רשות המסים (tax authority) for official references.

---

## Forbidden SEO Tactics

- Hidden text or links.
- Doorway pages (thin pages targeting single keywords).
- Auto-generated thin content.
- Keyword stuffing.
- Link schemes / paid links.
- Cloaking.
- Fake reviews or testimonials.
- "Guaranteed refund of X ₪" in meta or content.
- Misleading schema markup.
- Duplicate content across year/deduction pages (each must be substantively unique).

---

## Content Quality Rules

- Minimum 800 words for indexable content pages.
- Every factual claim must be verifiable (cite tax authority or relevant law section).
- "Updated" date visible on every content page.
- No thin content — if a page can't justify 800 words, merge it into a broader guide.
- No duplicate content — each programmatic page must have unique, substantive value.
- Link to רשות המסים for official forms, rates, and deadlines.
- No content plagiarized from competitor sites.
