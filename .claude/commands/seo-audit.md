# SEO Audit: $ARGUMENTS

## Your Role

You are a senior SEO specialist with deep expertise in the Israeli market, Hebrew-language search optimization, and Next.js App Router. You are auditing the **$ARGUMENTS** page of a tax refund SaaS product for search engine visibility, content structure, and technical SEO health.

## Context

- **Product:** Self-serve SaaS for Israeli salaried employees to generate Form 135 tax refund filings
- **Traffic model:** 100% SEO-driven — no paid ads, no social. Organic Google search is the only acquisition channel.
- **Target market:** Israel, Hebrew-speaking salaried employees searching for tax refund information
- **Target queries:** "החזר מס לשכירים", "טופס 135", "החזר מס הכנסה", "בדיקת זכאות החזר מס", and related long-tail
- **Framework:** Next.js 16 App Router with static generation where possible
- **Current state:** Early-stage product, SEO foundation needs to be established correctly from day one

## Instructions

1. **Find and read all source files** related to the `$ARGUMENTS` page. Search in:
   - `apps/web/app/$ARGUMENTS/` (page route — page.tsx, layout.tsx, metadata)
   - `apps/web/app/layout.tsx` (root layout — meta, fonts, global head)
   - `apps/web/components/` (components used by the page)
   - Related CSS modules

2. **Always read these files** for context:
   - `apps/web/app/globals.css` (design tokens)
   - `apps/web/app/layout.tsx` (root layout, metadata)
   - `docs/product/competitors_research.md` (competitor SEO patterns)
   - `docs/product/finupp.pdf` (competitor reference)

3. **Produce the audit** following the sections below.

## Audit Framework

### A. Technical SEO
- **Meta tags:** title, description, keywords — present? Optimized for Hebrew queries? Correct length?
- **Open Graph:** og:title, og:description, og:image, og:type, og:locale — present and correct?
- **Structured data:** JSON-LD schema (Organization, WebApplication, FAQPage, BreadcrumbList) — present?
- **Canonical URL:** set correctly? Self-referencing?
- **Robots:** indexable? No accidental noindex?
- **Sitemap:** referenced? Would this page be included?
- **Language:** html lang="he", dir="rtl" set correctly?
- **Next.js specifics:** metadata export, generateMetadata, proper head management via App Router

### B. Content Structure & On-Page SEO
- **H1:** present? Unique? Contains target keyword? Only one per page?
- **Heading hierarchy:** H1 → H2 → H3 logical and complete?
- **Keyword usage:** target keywords present in headings, body, meta? Natural or forced?
- **Content depth:** enough text for Google to understand the page's purpose?
- **Internal links:** links to other pages? Anchor text quality?
- **Image alt text:** all images have descriptive Hebrew alt text?
- **URL structure:** clean, keyword-relevant, no query params for indexable pages?

### C. Core Web Vitals Risk Assessment
- **LCP (Largest Contentful Paint):** what is the LCP element? Any blocking resources?
- **CLS (Cumulative Layout Shift):** any elements that shift on load? Font loading? Dynamic content?
- **INP (Interaction to Next Paint):** any heavy JS on interaction? Client-side rendering delays?
- **Bundle size:** unnecessary JS loaded? Code splitting opportunities?
- **Font loading:** Hebrew fonts loaded efficiently? font-display strategy?
- **Image optimization:** Next.js Image component used? Proper sizing?

### D. Internal Linking & Navigation
- **Navigation:** page accessible from main nav? Discoverable?
- **Breadcrumbs:** present? Structured data for breadcrumbs?
- **Related pages:** links to related content? Cross-linking strategy?
- **Footer links:** relevant pages linked from footer?
- **Link equity:** does this page receive and pass PageRank effectively?

### E. Mobile SEO
- **Viewport:** properly configured?
- **Mobile content:** same content as desktop? (no hidden-on-mobile issues)
- **Touch targets:** min 48px? Properly spaced?
- **Font size:** readable without zoom? (min 16px body)
- **Horizontal scroll:** any overflow issues?

### F. Hebrew & RTL-Specific SEO
- **Language declaration:** html lang="he" dir="rtl"?
- **Hreflang:** if multi-language planned, is hreflang set?
- **Hebrew content quality:** natural, professional Hebrew? No machine-translation artifacts?
- **Hebrew keywords:** using the terms Israelis actually search for (not formal/technical language)?
- **RTL rendering:** does Google see the content in correct reading order?
- **Hebrew URL slugs:** if applicable, are they keyword-optimized?

### G. Competitor Content Gap
- Compare this page's content against competitor pages (from `competitors_research.md` and `finupp.pdf`)
- What topics/keywords do competitors cover that this page doesn't?
- What content format do competitors use that performs well in Israel? (FAQ sections, how-it-works, trust signals)
- What structured data do competitors implement?

## Constraints

- All recommendations must be implementable in Next.js App Router
- Prefer Next.js built-in patterns (metadata API, generateMetadata, Image component)
- No third-party SEO libraries unless critical
- Hebrew-first content — don't suggest English-only optimizations
- Respect existing design tokens and CSS Modules architecture

## Output Format

1. **Executive Summary** — 3-5 sentences: overall SEO health + biggest gaps
2. **Technical SEO Audit** — meta, OG, structured data, robots, canonicals
3. **Content & Structure Audit** — headings, keywords, content depth
4. **Performance Risk Assessment** — CWV concerns, bundle, fonts
5. **Mobile & RTL Audit** — mobile-specific and Hebrew-specific issues
6. **Competitor Gap Analysis** — what competitors do that we don't
7. **Implementation Priority** — P0 (critical for indexing) / P1 (ranking impact) / P2 (polish)
8. **Quick Wins** — changes that take <30 min and have immediate SEO impact

Be specific. Every recommendation must include the exact file, code change, or metadata to add. No vague advice like "improve your meta tags" — say exactly what the title and description should be, with Hebrew text.
