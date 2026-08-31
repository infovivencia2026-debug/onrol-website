# ONROL.in — Design Discipline (single source of truth)

The marketing site (`onrol.in`) uses one disciplined system. **Read this before
building or restyling any page.** When in doubt, copy an existing redesigned
section rather than inventing a new pattern.

> Primitives live in **`src/components/system/grid.tsx`** — reuse them, don't
> hand-roll colors or borders: `Page`, `Frame`, `Shell`, `Label`, `Tick`,
> `OrangeButton`, `CornerCrosshairs`, and the `HAIRLINE / INK / ORANGE` tokens.

---

## 1. Non-negotiable brand rules (hard constraints)
- **NEVER dark.** No dark themes, dark cards, navy/`#0B1640`, `#2d2d2d`, B&W or
  grayscale-cinematic backgrounds. Light/warm only. (One sanctioned exception:
  the AI Architect hero uses a warm **bronze image** — explicitly approved.)
- **No course price reveal** on the site. No sticky price bars, strikethrough
  pricing, fee numbers, or countdown-urgency. Pricing is handled off-site.
  ("INR-priced" with no number is fine.)
- **No refunds/chargeback flows** anywhere.

## 2. Color
- **Orange (brand) = `#f46718`** (the ONROL logo color). **STRICT — every orange on the site MUST be exactly `#f46718`**: buttons, icons, accents, labels, ticks, links. Never `#fb6319`, `#ff5a00`, `#f46718`, or any `orange-NNN` Tailwind class. Hover tint `#ff7f33`.
- **Ink (text) = `#0A0A0A`** (near-black). Body muted = `text-black/60`–`/70`.
- **Canvas = white `#ffffff`**; alternate band = warm grey **`#F6F5F2`**.
- **Orange is an accent, not a fill.** Reserve it for: ONE primary CTA per view,
  small ALL-CAPS section labels, `+` tick markers, and at most ONE accent word in
  a heading. Headlines are black ink.
- **Black text on orange** (≈6.8:1 AA). **Never white text on orange.**

## 3. Shape & surface
- **Sharp corners.** No `rounded-*` on cards/buttons/inputs (true circles like
  avatars/dots are OK). No glassmorphism, no `backdrop-blur` as decoration.
- **Hairline borders:** `border-black/10` (1px). No drop shadows
  (`shadow-[...]`) except a single subtle lift on a form card floating over an
  image.
- **No decorative glows** (`blur-2xl/3xl` radial blobs), gradients-as-fill, or
  `bg-gradient-to-*` buttons. Solid `bg-[#f46718]`.

## 4. Layout — the continuous hairline grid
- Wrap a page's section stack **once** in `<Page>` (`max-w-[1680px]`, continuous
  left/right outer hairlines). Sections are **connected rows** (`border-b`),
  **not** separate boxes with gaps.
- Shared page width = `Shell` / `max-w-[1680px]`, padding `px-4 sm:px-6 lg:px-10`.
- **Section rhythm:** alternate **white** and **`#F6F5F2`** bands so sections
  read as distinct blocks (the light answer to outskill's black/white banding).
- Grids share cell borders (`border-r`/`border-b` or `divide-*`), corners
  collapsed with `-mr-px -mb-px` + `overflow-hidden` when needed.
- Section header = `<Label>` (orange ALL-CAPS eyebrow) + black H2 + muted intro.

## 5. Typography
- Display/headings: **Fira Sans** (Google Fonts, 400-800).
  `font-black`, tight tracking (`-0.02em` to `-0.045em`).
- Body/UI: **Figtree** (Google Fonts, 300-900) + system fallback. (Manrope/DM Sans/Inter removed.)
- Headlines black ink; optional single orange accent word.

## 6. Components / CTAs
- Primary CTA = `<OrangeButton>` — sharp, `min-h-[44px]`, black text, uppercase.
  **One per viewport.** Secondary actions are hairline ghost buttons or links.
- Navbar: **solid white on every page**, 1px bottom hairline, right-aligned
  Programs dropdown + LOGIN. (Consistent everywhere — no transparent variants.)

## 7. Accessibility & responsive (gates before "done")
- Contrast ≥ 4.5:1 (black on white/orange passes). Visible focus rings.
- Touch targets ≥ 44px. `aria-label` on icon-only buttons. Real `alt` text.
- Mobile-first: no horizontal overflow (wide tables → stacked mobile cards;
  long tool/logo grids → swipe carousels; multi-row chip filters → dropdowns).
- Images: AVIF/WebP/JPG `<picture>`, sized (`width/height`), lazy below the fold.
- Honour `prefers-reduced-motion`.

## 8. Forms → CRM
- Public forms POST to **`https://go.onrol.in/api/public/leads`** with
  `{ name, phone, email, role, tag, source, campaign, notes }` + a honeypot +
  429/error handling + a success state. Optionally dual-sink to the Google Sheet
  via `VITE_APPS_SCRIPT_CAREER_CATALYST_URL` (Apps Script in
  `scripts/apps-script-career-catalyst.gs`, routed by `form_type`).

## 9. Build & deploy
- This is **not** stock Next/CRA — read `node_modules/next/dist/docs/` notes /
  AGENTS.md before assuming APIs. Build with
  `PUPPETEER_EXECUTABLE_PATH` set (system Chrome) so the 262-route prerender runs.
- Deploy = `tar dist` → `/home/onrol.in/public_html` on the VPS (back up first).
- Funnel/landing pages that shouldn't be discoverable: add the route to the
  `hideGlobalNavbar` list in `App.tsx`, set `<SEO noindex />`, and **don't** link
  them in nav/footer/sitemap.

## 10. Anti-patterns (reject on sight)
Dark sections · glassmorphism · rounded soft cards · drop shadows · gradient
buttons · white-on-orange text · multiple orange CTAs competing · price numbers ·
generic AI-slop (purple-on-white, cookie-cutter) · off-brand accent colors
(violet/emerald/navy/amber) · separate gapped section boxes instead of the
connected hairline grid.
