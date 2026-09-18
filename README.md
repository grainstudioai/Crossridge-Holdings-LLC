# Crossridge Holdings — Website

Static site (no build step required). Open `index.html` directly in a browser,
or serve the folder with any static file server.

Quick local preview:

```
npx serve .
```

or with Python:

```
python -m http.server 8000
```

## Stack

Plain HTML/CSS/JS — no framework, no Node.js dependency. This was a deliberate
choice: this machine doesn't have Node.js installed, and the site is a single
marketing landing page, so a build pipeline isn't needed to hit the design,
SEO, performance, or accessibility goals in the brief.

- `index.html` — the full one-page site
- `privacy.html`, `terms.html`, `accessibility.html` — footer legal pages (stubs)
- `css/styles.css` — design tokens (color/type/spacing) + all component styles
- `js/main.js` — nav, mobile menu, FAQ accordion, scroll-reveal, lead modal, form handling — no external libraries
- `robots.txt`, `sitemap.xml`

Type system: Poppins (H1/H2 and other display moments) + DM Sans (nav, buttons,
H3, form labels, FAQ questions) + Inter (body copy, paragraphs, footer, form
input text) — loaded from Google Fonts in each page's `<head>`.

## Before this goes live — placeholders to replace

Everything in `[BRACKETS]` in the HTML is a placeholder and must be replaced
with real content before launch. Per the brief, none of this was fabricated:

- **Phone number, email, contact info** — every `[PHONE NUMBER]` / `[EMAIL]` /
  `[CONTACT INFORMATION]` (nav, hero, about, final CTA, footer). Also update
  the `href="#"` on phone/email links to real `tel:`/`mailto:` links.
- **Founder name, photo, and 2–3 sentence company story** — About section.
- **Hero video** — `index.html` has an HTML comment right above the
  `.hero-media-fallback` div showing the exact `<video>` markup to drop in
  once real Ohio footage is ready (needs a compressed .mp4 + poster image).
- **All `.img-placeholder` blocks** — property photos, founder photo, home
  photography throughout. Replace with real `<img>` tags; alt text guidance
  is in the HTML `<head>` comment (natural, descriptive, no keyword stuffing).
- **Recent Property Matches / Testimonials sections** — currently placeholder
  cards clearly flagged "Placeholder — replace with real transaction /
  testimonial." Do not publish fabricated transactions, quotes, or review
  counts — replace with real ones only, or remove the section.
- **Service area list** — the eight cities listed (Columbus, Cleveland,
  Cincinnati, Dayton, Toledo, Akron, Canton, Youngstown) are real Ohio
  markets the client asked to show as examples, not confirmed exclusive
  coverage — swap in whichever markets Crossridge is actually active in if
  that list changes.
- **Ohio wholesaling disclosure** (footer) — literal placeholder text is
  shown; final language must come from Ohio real estate counsel, not be
  invented.
- **Structured data** (`<head>` of `index.html`) — Organization/WebSite/
  FAQPage schema is in place. A `telephone` and `address` (and a
  LocalBusiness schema block) should be added once real, verifiable NAP
  details are approved — see the TODO comment inline.
- **`sitemap.xml`** — swap `https://www.example.com` for the real domain.

## Lead capture flow

Every "Get Your Offer" button/link across the site (`.js-open-modal`) opens
one shared modal (`#lead-modal` in `index.html`, near the closing `</body>`)
that collects address, first/last name, phone, optional email, and a consent
checkbox. That modal form is the only thing that actually submits data.

The hero and final-CTA sections each keep a small address-only field
(`form.lead-form-mini`) for a quick first step — typing an address there and
hitting submit opens the modal with that address pre-filled, then the visitor
finishes with their contact info. These mini forms never submit on their own.

**Before launch:**

- `js/main.js` has a `LEAD_ENDPOINT` constant at the top, currently empty.
  Point it at a real server-side endpoint (serverless function,
  Formspree/Basin, or a custom backend). The form does full client-side
  validation and a honeypot field, but **client-side checks are not
  sufficient on their own** (see CLAUDE.md security rules — never trust the
  client) — that endpoint must independently validate/sanitize input and
  rate-limit submissions.
- The modal has a `.verify-placeholder` box where a real Google reCAPTCHA
  (v2 or v3) widget should go — it needs a site key from the Google
  reCAPTCHA console. It's currently just a labeled placeholder box, not a
  working widget or real Google branding — intentionally not faked, since a
  non-functional lookalike of Google's actual reCAPTCHA UI would mislead
  visitors into thinking spam-verification is happening when it isn't.
- Wire `trackEvent()` to real analytics (GA4, etc.) — it currently just logs
  to the console.

## Hero: dual-audience toggle

The hero (`.hero-cover`) has two pill tabs — "I Want To Sell (Get an Offer)"
and "I Am A Cash Buyer / Investor" — that swap between two panels
(`#panel-seller` / `#panel-investor`, toggled in `js/main.js`). The investor
panel's "Join the Cash Buyers List" button opens a second modal
(`#buyer-modal`) collecting name/phone/email/buying criteria — a separate
flow from the seller lead modal, since the fields and purpose differ.

This was modeled on a reference design that used a wholesaler-style layout
with specific fabricated performance stats ("32.4% avg ARV discount," "4.8
day contract velocity," "$365k median ARV," "Browse 28 Live Wholesale
Contracts," "100% Guaranteed"). Those exact numbers weren't carried over:
publishing precise, unverifiable performance stats and a "100% guaranteed"
claim to consumers is exactly what CLAUDE.md's anti-fabrication rule and the
brief's "do not claim... guaranteed" line both rule out, and "browse N live
contracts" implies a real deal inventory this site doesn't have. The layout
pattern (toggle, badge, bold two-line headline, address bar, stat-card row)
is intact — the investor stat row currently shows honest, qualitative claims
("Off-Market Opportunities," "Ohio Statewide," "Transparent Assignment")
instead. If real performance numbers become available later, they can drop
into `.hero-stat` cards directly.

## Business model: wholesaling, not direct-buy — and Ohio-wide, not Columbus-only

A later revision corrected two things that were wrong about the original
build:

1. **Crossridge does not buy properties itself.** It's a wholesaling company:
   it may enter into a purchase agreement and assign that agreement to an
   investor. Earlier copy said things like "we buy houses" and "we'll
   provide a written cash offer," which overstated Crossridge's role. Every
   section (hero, How It Works, Offer Process, FAQ, comparison table, the
   proof-card template) now frames this as "we may enter a purchase
   agreement and assign it," not "we buy." The FAQ's first question/answer
   (kept in sync with the matching FAQPage JSON-LD in `<head>`) is the
   canonical plain-English disclosure of this — don't let it drift out of
   sync with the JSON-LD if either changes later.
2. **Positioning is Ohio statewide, not Columbus-exclusive.** Meta tags,
   the Organization schema's `areaServed` (now `State: Ohio`), the hero,
   service-area section, and footer all lead with Ohio. Columbus still
   appears — as the literal office address in the About section, as one of
   eight example markets in Service Area, and as address-field placeholder
   text — because those are legitimate uses, not exclusivity claims.
3. **"No Repairs" is no longer the headline positioning.** The site now
   says properties are considered "in a range of conditions," since
   different investors in the network want different things (some want
   fixer-uppers, some want move-in-ready). "No repairs required to submit"
   still appears as a supporting detail (FAQ, benefit strip), which is
   accurate and distinct from implying every property must need repairs.

Also trimmed: the "No Repairs / No Commissions / Flexible Closing / No
Obligation" benefit list used to repeat across the hero, benefit strip,
value-prop section, and "Why Sell Directly" section (5-7 times each). It
now lives once in the benefit strip; the other sections were rewritten to
cover the investor network, transparency, and property-condition range
instead, per the client's explicit request to reduce repetition.

## What was intentionally left out

- Additional location/topic pages (e.g. `/sell-inherited-house-columbus-oh/`)
  — the brief says these should only be built once each can carry genuinely
  unique, useful content, not just a swapped city name.
- Fake trust signals, review counts, "years in business," or office/employee
  claims — none of that is stated anywhere on the site, per the brief.
- A real "browse live wholesale contracts" inventory feature — that would
  need an actual deal database/back office, not just a marketing page, and
  likely its own look at Ohio wholesaling rules (see the disclosure
  placeholder in the footer).
