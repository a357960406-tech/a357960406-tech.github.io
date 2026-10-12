# Reverse-Engineering & Inference Guide

**Purpose:** The user gives you only a **screenshot (one or several)** or a **webpage URL** — never source code. Your job is to *visually analyze* the input, *infer* every slot the master clone-prompt template needs, and *emit a finished, deterministic clone prompt* in the house style learned from the 11 reference prompts.

The reference prompts achieve 1:1 fidelity by pinning: exact stack → identity sentence → design tokens (fonts/colors/CSS utilities) → sections in DOM order with per-element Tailwind strings + verbatim copy + numeric motion params → shared components → responsive → recap. **You must reproduce that shape even though you are inferring, not transcribing.** When you can't know a value exactly, you still emit an *exact-looking* value (a specific hex, a specific ms delay) plus a quiet `[inferred]` marker — never vague prose like "large rounded corners." Keep the authorization boundary explicit: third-party original assets/copy are internal reference material unless the user owns or has permission to publish them.

---

## 0. The slot inventory you must fill

Every emitted clone prompt targets these slots (derived from the 11 anatomies). Each row says **where the value comes from** in screenshot vs URL mode.

| Slot | Screenshot source | URL source |
|---|---|---|
| Build sentence (stack + product name + section map + key libs + aesthetic) | Inferred wholesale | Inferred + DOM-confirmed section count |
| Product name / brand | Read the wordmark text; else invent + flag | Read `<title>`, logo `alt`, nav |
| Tech stack | Default policy (§2) | Sniff framework (§3.1); still emit a clean target stack |
| Fonts → **concrete loadable font + real load URL** | Shape-match to a real font, source it (§1.3 / font-matching.md) — **never a placeholder** | `getComputedStyle` / `<link>` / `@font-face` (§3.2) |
| Color tokens (bg/text/accent/border, by role + exact hex) | Eyedropper-estimate (§1.4) | Computed colors → exact hex (§3.3) |
| Custom CSS utilities (glass/noise/gradient-text) | Detect visually (§1.6) | Inspect CSS, else detect visually |
| Assets → **zero-user-work media specs** | Write generation briefs by default (§4 / asset-sourcing.md) — **never `REPLACE-ME`** | Pin stable public original URLs first for authorized/internal use; for third-party public release mark originals as replace-before-production, otherwise generation brief + optional fetch-only fallback |
| Section inventory & order | Count visual bands top→bottom (§1.1) | DOM `<section>`/landmark walk (§3.5) |
| Per-element Tailwind class strings | Infer from measured proportions (§1.2) | Infer; optionally cross-check computed box |
| Verbatim copy | **Transcribe exactly** (§1.7) | **Transcribe exactly** from DOM text |
| Motion (entrance/scroll/hover/mouse/canvas) | Assume by archetype (§1.5) | Inspect scripts/styles/rendered state for custom elements, canvas/WebGL, GSAP/Lenis, `pointermove`, `requestAnimationFrame`, `fontVariationSettings`, scroll timelines (§3.6–3.7) |
| Responsive behavior | Infer breakpoint ladder (§1.8) | Resize-inspect if possible, else infer |
| Page title | Brand + tagline | `<title>` verbatim |

---

## 1. Visual-Analysis Checklist (screenshot → slots)

Work **top-to-bottom, outside-in**: page-level globals first, then each section, then each element inside it. Narrate in DOM order so the emitted prompt is assemblable in one pass.

### 1.0 Screenshot frame registry — the screenshot is the source of truth
Screenshot mode cannot read source code, but it still requires evidence-based comparison. Before inference, register every uploaded image as a reference frame:

```text
REFERENCE_FRAME_01: filename, viewport/aspect, visible section(s), scroll position if inferable, exact visible crop boundaries.
REFERENCE_FRAME_02: ...
```

Rules:
- If one screenshot is a full viewport, treat it as the exact target for that visible screen; do not "improve" it with plausible layout changes.
- If multiple screenshots are same page sections, preserve order and compare each screen after implementation.
- If a screenshot is truncated, visible pixels remain exact; below-fold completion is inferred separately and labeled.
- If the screenshot contains hover/open/modal/menu states, record that state explicitly and require a matching clone screenshot for it.
- In prompt output, include a **Reference Frames / Visual Regression Targets** block so the consuming AI knows which screenshots it must match.
- In implementation-confirmed runs, capture clone screenshots at matching viewport/aspect and compare against every `REFERENCE_FRAME_N`, not only the hero.

### 1.1 Section count & order
- Scan for horizontal "bands" separated by background-color change, full-width media, or large vertical whitespace. Each band = one `### SECTION N`.
- A single tall screenshot that fills the viewport with one composition (nav + headline + CTA over one background) can mean two different scopes:
  - User asks for **hero / first screen / only what is shown** → emit a one-section hero prompt. Do not invent below-the-fold content.
  - User asks for **page / site / landing page / website** → treat the screenshot as a truncated capture of a longer page. Recreate the visible hero exactly, then infer the rest of the landing page from nav labels, industry, visible visual system, and common landing-page information architecture. Mark inferred sections as `[inferred from visible design system]`, but still specify exact class strings, copy, media briefs, and motion.
- If the screenshot shows a **site inside a centered frame/mockup with visible outer backdrop** (e.g. rounded page shell, browser/device frame, blurred lifestyle background around the page), treat that outer presentation context as part of the clone unless the user explicitly asks for the raw website only. Emit a `GLOBAL PAGE FRAME` block before sections: body backdrop, shell width, shell radius, shadows, top/bottom spacing, and whether section corners are clipped by the frame.
- Name each section by its job: `Hero`, `Capabilities`/`Features`, `About`, `Marquee`, `Services`, `Projects`, `Footer`. Emit a `SECTION ORDER` manifest before detailing (ref 4 device).
- **Fixed/sticky nav** is its own block layered over section 1 (note `z-50`), not a section.

### 1.1b Truncated screenshot → full landing-page extrapolation
When scope is a full landing page but the screenshot is cut off, infer a complete structure instead of stopping at the visible crop.

Use this priority order:
1. **Visible nav labels** become the section map. Example: `О нас / Гольф-поле / Членство / Инфраструктура / Локация / Мероприятия` implies `About`, `Course`, `Membership`, `Infrastructure`, `Location`, `Events`, plus a closing CTA/Footer.
2. **Visible sections** keep exact placement and copy; inferred sections reuse their typography, spacing, radii, icon style, media treatment, and color rhythm.
3. **Industry conventions** fill content type, not visual style. A golf club page can infer course stats, membership tiers, amenities, map/location block, event cards, and final CTA; a SaaS page can infer features, integrations, pricing/CTA, proof, FAQ. Never switch the design language.
4. **Copy policy:** visible copy is verbatim; inferred copy may be generated but must be marked `[inferred copy]` and written in the same language, tone, casing, and line-break style as the visible page.
5. **Asset policy:** every inferred image still gets a full generation brief derived from the visible asset grammar, not a generic stock-like prompt.
6. **Layout balance policy:** inferred sections must pass a visual-balance sanity check before emission. For two-column media/text sections, specify whether columns are equal, 8/4, or 5/7, then make the media block and text block carry comparable vertical mass (`items-stretch`, matching `min-h`, `h-full`, or `justify-between`). Do not emit a short image beside a tall text/stats column that leaves a large blank area under one side unless the screenshot explicitly shows that asymmetry.

Emit an `INFERRED PAGE COMPLETION` block near the top:
```
Visible in screenshot: Hero, About, first part of Features.
Inferred below fold from nav/visual system: Course, Membership, Infrastructure, Location, Events, Final CTA/Footer.
Rule: visible copy is verbatim; inferred sections are marked `[inferred from visible design system]` but fully specified.
```

### 1.2 Layout grid & containers
- Estimate the column structure of each section: single centered column (`text-center`, `max-w-*`), 2-column split (`lg:grid lg:grid-cols-2`), 8/4 asymmetric grid, or a card row (`grid-cols-3`). Express as the explicit column count (ref 1: "12-column grid: left 8, right 4").
- Read content **anchor**: top-aligned hero vs **bottom-aligned** hero (content pushed down via `flex-1 ... justify-end`, a "spacer pushes content to the bottom" — refs 7, 8). Bottom-anchored + top glass nav is a very common pattern.
- Note inset/padding rhythm: full-bleed vs an "inset" rounded container (`p-4 md:p-6`, `rounded-[2rem]` — ref 1).
- Convert proportions to a responsive padding ladder: `px-6 md:px-12 lg:px-16` is the safe default; tighten/loosen by how much breathing room you see.
- For floating side labels, dates, `EST.`, section numbers, and similar microcopy, anchor them to the exact element they visually align with, not the whole section. Example: if `EST.` and `1998` sit on the midline of a wordmark, define them inside the wordmark wrapper with `top-1/2 -translate-y-1/2`; do not position them against the combined title/subtitle/CTA block.
- If a photographic/mockup image overlaps or blocks a title, wordmark, CTA, or section boundary, treat that as a **state in motion**, not automatically as a bad static composition. Infer both the initial state and the captured/final state: e.g. wordmark first visible unobstructed, then laptop/phone mockup rises/fades into the final occluding position on load or scroll. Emit exact `initial → final` transform values and the trigger (`delay`, `whileInView`, or `useScroll` progress).
- If the hero uses **layered landscape occlusion** (background hills/sky, a dashboard/device/modal mockup, then foreground hills/trees/fog/black field), map it as a depth stack, not as one background image. Emit every layer with: DOM order, `z-index`, `position`, `bottom/top`, image crop/`object-position`, `useScroll` transform range, and whether it masks/crops another layer. The foreground landscape must sit above the mockup and create the visible cutout; the black terminal field only fills the area below the foreground asset.
- For nested mockups hidden by foreground scenery, specify a **dynamic leak guard**: crop or mask the mockup only behind the foreground shape, never with a visible horizontal cut line. QA must inspect the opening animation and early scroll frames for rectangular tails, top/bottom slivers, and source-absent dark overlays.
- Run a **layout QA line** for every inferred section: "left/right visual mass", "top/bottom alignment", "rounded-corner clipping", and "long-word fit". If a long Cyrillic/uppercase heading can collide with its column, lower its responsive font size or widen the column in the prompt.

### 1.3 Fonts — match to a CONCRETE, LOADABLE font (never a placeholder) 🔴
You can't read a font name off pixels, but you **must** still resolve to a real, loadable font + a real load URL (this is cloning, not original design — see `references/font-matching.md` for the full method, the Cyrillic-aware tables, non-Google loading, and the WhatTheFont/Matcherator identify-then-resolve workflow). Classify and pick a faithful match:
- **Serif with high contrast + ball terminals, often italic display** → `Instrument Serif` (italic) or `Playfair Display`. Editorial/luxury/cinematic headings.
- **Old-style serif body** → `Garamond` / `EB Garamond`.
- **Geometric/condensed heavy uppercase display** → `Anton`, `Kanit` (300–900), `Barlow Condensed`.
- **Neutral grotesque UI/body** → `Inter` (the default workhorse), `Geist`, `Barlow`, `Helvetica Neue`/`Nimbus Sans`.
- **Monospace everywhere (technical/AI vibe)** → `Space Mono`.
- **Rounded humanist / soft** → `Almarai`, `Askan Light`.
Assign **roles**: heading font vs body font vs accent/wordmark font. Emit each as `family + weights + real load URL (@import/<link>) + role`. Default weights: body `300;400;500;600`, display add `700;800` or `900`. Note italics explicitly if the display type is slanted ("always italic"). **Ornate swash/script wordmarks** (luxury logos) rarely live on Google Fonts → identify + source a real free alternative per font-matching.md; do not leave it as "[swap this]".

### 1.4 Color palette — read approximate hex
- Identify **background**, **primary text**, **secondary text**, **accent/CTA**, **border/glass tint** — each as an exact hex *with the surface it paints* (ref 1 convention).
- Dark cinematic pages are almost always near-pure black: emit `#000000`, `#010101`, or `#0C0C0C` (pick by how "lifted" the black looks). Card surfaces a notch lighter: `#101010`, `#1a1a1c`, `#212121`.
- Cream/off-white text on black → `#E1E0CC`/`#DEDBC8`-family. Pure light themes → `bg-gray-50`, text `gray-900`.
- The **one saturated accent** (button, link, dot) is the highest-value pin — estimate it tightly (e.g. terracotta `#e8702a`, magenta-gradient CTA). Read it carefully; it's what makes the clone "feel right."
- Translucent chrome → express as rgba or Tailwind opacity slashes (`bg-black/20`, `border-white/10`, `text-white/70`).
- If two near-identical tones appear, document both and how each is applied (ref 1's `#DEDBC8` Tailwind class vs `#E1E0CC` inline-style quirk).

### 1.5 Motion — what to assume from a STATIC frame
A screenshot has no motion, so **infer by archetype** and emit concrete numbers (every ref pins exact numbers; so do you):
- **Background media moving?** If the bg is photographic/cinematic and full-bleed, first infer the original likely intended **motion language**: drone push, slow orbit, parallax pan, macro float, masked reveal, or Ken Burns. If video generation is unavailable, prescribe **generated still image + code motion** rather than a dead static background.
  - Drone/aerial course or landscape: pseudo-video loop with CSS/Framer `scale(1.04) rotate(-1.8deg) translate3d(-3%, -1.6%, 0) → scale(1.18) rotate(1.8deg) translate3d(3%, 1.6%, 0)`, duration `18–24s`, `ease-in-out`, `repeat: Infinity`, `repeatType: mirror`. If this feels too strong for a specific page, reduce it deliberately, but never below the threshold where the user cannot perceive motion.
  - Product/macro/lifestyle close-up: slow parallax pan `scale(1.06) translateX(-2%) → translateX(2%)`, duration `18–28s`.
  - Flat illustration/3D render: subtle layered drift on foreground/background shapes, not full-image rotation.
  - If you can use real video (URL stable or video generation requested), use `<video autoplay muted loop playsInline object-cover>` and still define poster/blur fallback.
- **Entrance animations (always assume these for hero content):**
  - Word/line **blur-rise**: `initial {filter: blur(10px), opacity:0, y:20} → easeOut`, per-element stagger.
  - **Fade-up**: `y:20→0, opacity 0→1`, duration `0.8s`.
  - **Staggered cascade** down the hero: badge `0.4s` → heading `0.6s` → subtext `0.8s` → CTA `1.1s` → stats/partners `1.3–1.4s`.
  - **Character-by-character** reveal for big headlines (split to `<span>`s, `charDelay≈30ms`).
- **Shared easing default:** `cubic-bezier(0.22, 1, 0.36, 1)` or `[0.16, 1, 0.3, 1]`.
- **Scroll-driven** (only if multiple sections imply it): progressive text opacity reveal (`useScroll` offset `['start 0.8','end 0.2']`, char opacity `0.2→1`), horizontal marquee rows, sticky-stacking scaling cards (`targetScale = 1 - (n-1-i)*0.03`).
- **Hover micro-interactions (always add):** CTA `hover:scale-105 active:scale-95`, nav links color/opacity transition `200ms`, glass `hover` brighten.
- **Motion QA:** if implementing after prompt approval, verify the pseudo-video is real by comparing computed transform or screenshots 3-5 seconds apart. A static-looking hero after implementation is a failure even if the prompt contains animation code.
- Match the **library to the page's framework reality**: if you'll emit a CDN/single-file React build, hand-roll animation as CSS `@keyframes` + a tiny `BlurText`/`FadeIn` component (refs 8, 9); if a Vite app, use **Framer Motion** (refs 1, 4, 5, 11). State the choice once.

### 1.6 Backgrounds & signature visual effects — detect the type
- **Video vs image vs gradient/noise:** cinematic motion-implying media → video; crisp single still → image; smooth color wash → CSS gradient; visible film grain → SVG `feTurbulence` noise overlay (`baseFrequency 0.85, numOctaves 3`, `mix-blend-overlay`, `opacity 0.15`).
- **Glassmorphism / "liquid glass":** frosted translucent panels with a faint bright top-edge = the signature effect in refs 2, 6, 8, 11. Emit the full recipe: `background: rgba(255,255,255,0.01); backdrop-filter: blur(4px)` (or `blur(50px)` strong) + a masked `::before` gradient-stroke border (`mask-composite: exclude`). This is a named utility (`.liquid-glass`) referenced by name.
- **Gradient-clipped metallic text:** silver headings via `linear-gradient(180deg,#646973,#BBCCD7)` + `background-clip:text` (ref 4) — detect by a heading that fades light-to-dark within the glyphs.
- **Giant low-opacity watermark word** behind content (ref 5) → note it.
- **Dot-grid / radial overlays** → `radial-gradient(#fff 1px, transparent 1px)` at low opacity.

### 1.7 Copy — transcribe verbatim (non-negotiable)
- Transcribe **every visible string exactly**, character-for-character: nav labels (in order), headline (note intended line breaks `\n`), subtitle, button labels, eyebrow/kicker, stat values, card titles + bodies, footer/© line, placeholder text.
- Preserve casing quirks (lowercase "i'm jack"), punctuation, em-dashes, `·` separators, `//` kicker prefixes, trailing periods.
- If text is truncated/illegible in the screenshot, write your best transcription and flag `[verify wording]`. Never paraphrase legible copy.
- Quote nav/label lists as ordered arrays — order is load-bearing.

### 1.8 Responsive behavior
- Emit a mobile-first ladder even from one desktop frame: typography `text-4xl md:text-5xl lg:text-6xl xl:text-7xl`; padding `px-5 sm:px-8 lg:px-12`.
- Default hide/show rules: center nav `hidden md:flex`, mobile hamburger `md:hidden` (lucide `Menu`/`X`), 2-col grids collapse to 1, multi-card rows `grid-cols-1 md:grid-cols-3`.
- Use `min-h-[100svh]`/`h-[100dvh]` for full-viewport sections (mobile chrome safety).

---

## 2. Tech-stack default policy (when you can't sniff)

Emit a clean, modern target stack rather than guessing the original's build:
- **Default:** `React 18 + TypeScript + Vite + Tailwind CSS`, `lucide-react` for icons.
- **Add Framer Motion** if you inferred any non-trivial entrance/scroll motion (most cinematic pages).
- **Hand-rolled CSS `@keyframes`** instead, if the page is animation-light or you want a single-file build.
- Pin `lucide-react` as the only icon lib; add `"No other UI libraries."` as a locking negative constraint (refs 8, 9).
- You are **rebuilding the look, not the original framework** — never claim the site "is" Next.js/Webflow/etc. just because it might be. Target the stack you can faithfully reproduce.

---

## 3. URL case — what to fetch & inspect

When given a URL you have far more signal. Fetch and inspect, then fill slots from *measured* values (and still fall back to §1 inference for anything you can't read). Use available fetch/scrape tools (e.g. WebFetch / a scraping MCP) to pull HTML + computed styles; if only rendered HTML is available, parse that.

### 3.1 Framework sniff (informational only)
- Look for `__NEXT_DATA__`, `/_next/`, `data-reactroot`, `wp-content`, Webflow `w-` classes, `data-framer-*`. This tells you the *aesthetic lineage* but you still emit the §2 target stack.
- Check loaded scripts for `framer-motion`, `gsap`, `lenis`, `three`, `ogl`, WebGL shaders, custom-element definitions, and pointer/scroll listeners → confirms motion library and interaction mechanics to mirror.

### 3.2 Fonts (exact)
- `getComputedStyle(el).fontFamily` on headings vs body → real family names + roles.
- Read `<link>` Google Fonts hrefs (with `wght`/`ital` axes) and any `@font-face`/CDN URLs (e.g. `onlinewebfonts.com/...`). Copy the **exact stylesheet URL and weight list** into the Fonts block.

### 3.3 Colors (exact)
- `getComputedStyle` for `backgroundColor`, `color`, `borderColor` on key nodes; convert rgb→hex. Pull the accent from the primary button's `background-color` and `:hover`.
- Read `backdrop-filter` blur radius and the glass `rgba()` directly if present — reproduce verbatim.

### 3.4 Assets (URL mode: stable originals first, briefs for gaps)
- Extract `<video>`/`<source>` `src`, `<img>` `src`/`srcset`, and CSS `background-image: url(...)`. Keep **full URLs including query params** (`?w=1280&q=85`, Cloudinary `f_auto/q_auto`).
- If assets are same-origin/public CDN and stable, pin them as originals and set `target_asset_mode=url-extracted-assets-primary`. If they're behind auth, ephemeral, 403, data/blob URLs, or you can't retrieve them → §4 and write a generation brief. Add a stock URL only for `target_asset_mode=fetch-only`; crop only when screenshot-mode pixel-exact original imagery is required.
- Grab inline SVG logo `path d` + `viewBox` verbatim (refs 3, 5, 7, 9, 11) so the mark is byte-reproducible.

### 3.5 DOM section structure
- Walk `<header>/<nav>/<section>/<main>/<footer>` and obvious top-level wrapper divs to get the **true section count and order** — this overrides the visual guess in §1.1.
- For each section read its text nodes for **verbatim copy** and its child structure for the element breakdown.

> **URL precedence rule:** measured > inferred. Use real fonts/colors/copy/section-order/assets where you can read them; fall back to §1 defaults only for gaps (e.g. motion timings, which aren't directly observable).

### 3.6 URL motion source audit — do not collapse custom motion into static approximation
URL mode must inspect the source motion system before writing the prompt. Search HTML/CSS/JS chunks for these tokens and record concrete parameters:

```text
canvas, webgl, ogl, three, shader, fragmentShader, vertexShader,
customElements.define, HTMLElement, pointermove, mousemove, mouseenter, mouseleave,
requestAnimationFrame, gsap, ScrollTrigger, lenis, locomotive, smooth scroll,
fontVariationSettings, wght, wdth, Wide, useScroll, scrollYProgress,
transform, translate3d, rotate, scale, filter, backdrop-filter, hover
```

For each hit, extract the **named primitive** and its parameters:
- **Canvas/WebGL background:** custom element name, DOM parent, canvas size, shader color uniforms, speed/frequency/amplitude, mouse uniform mapping, resize behavior, z-index.
- **Depth/parallax image:** color texture URL, depth-map URL, strength, mouse mapping, transform origin, initial/final scroll position.
- **Variable-font ripple:** selector for split chars, axis names (`"wght"`, `"Wide"`/`"wdth"`), min/max ranges, max distance, mouse lerp factor, scroll offset handling.
- **Liquid/custom cursor:** cursor element/class, rest size, expanded size, label source, follower lerp, filter/backdrop CSS, trigger selectors.
- **Opening timeline:** initial hidden/offscreen states, delays, duration/easing, order (`background → ring/device/media → title chars → baseline/CTA → cursor hint`).
- **Scroll/hover mechanics:** section progress ranges, sticky pinning, horizontal scrub, hover media swap, button/glass state changes.
- **Layered hero occlusion:** background landscape layers, mockup/dashboard/modal layer, foreground landscape/matte/black-field layers, each layer's z-index/DOM order, scroll transform, `clip-path`/mask math, and exit condition. If the source uses a foreground mountain/tree layer to cover a mockup, the clone must not replace it with a rectangular overlay.

Then turn each primitive into a prompt block. If the source has `c-aurora`, `c-parallax-depth`, `c-liquid-cursor`, or a similar custom element, name it directly in the clone prompt and specify its behavior. **Do not replace it with "a CSS gradient", "a static image", or "subtle hover" unless the source really is static.**

### 3.7 Rendered interaction sampling — same viewport, same pointer states
Before judging URL fidelity, capture evidence from the original site and, after implementation, from the clone with the same viewport. Minimum desktop states:

```text
first-paint / blank-loading
opening-sequence frames at fixed times before stable hero
rest after load
mouse-left  (x ≈ 20% viewport, y ≈ 50%)
mouse-center(x ≈ 50%, y ≈ 50%)
mouse-right (x ≈ 80%, y ≈ 50%)
scroll/wheel first transition
hero occlusion micro-frames when foreground scenery covers a mockup: scrollY ≈ 0/80/120/180/240/300 or source-equivalent anchors
one key hover target per visible interaction family
```

For each state, store both a screenshot and a small JSON snapshot:
- `document.querySelectorAll('canvas')`: count + rects. A URL source with 8 canvases and a clone with 0 is a hard failure.
- Key custom tags/classes: e.g. `c-aurora`, `c-parallax-depth`, `c-liquid-cursor`, `.hero-char`, `.project-card`.
- `fontVariationSettings` of several headline chars before/after mouse move. The values should visibly change if the source does variable-font ripple.
- Cursor rect/class/text/filter before and during a cursor area hover.
- For layered hero occlusion, snapshot the foreground layer rect, mockup rect, z-index, clip/mask value, and a screenshot for each micro-frame. A clone fails if the mockup tail leaks below the foreground, a top/bottom strip appears during entry, or a black/gray overlay appears where the source has only raw background/foreground imagery.
- Background/depth layer transform before/after mouse movement or time delay.
- Hover state diff: color/background/transform/opacity/filter.

Use this evidence to refine the prompt before building, not only after. If the original has a mouse-reactive canvas and the prompt only says "animated gradient background", the prompt is incomplete.

### 3.8 URL opening sequence capture — do not wait past the thing you need to clone
Many landing pages show a loader, brand reveal, product/person close-up, or video intro **before** the stable hero. If you only wait for `networkidle` or inspect the final screenshot, you miss the actual first impression.

Capture a timed frame sequence with a real browser:

```text
t000/t100/t250/t500/t750/t1000 after earliest navigation commit or DOMContentLoaded
t1500/t2000/t3000/t4000/t5000/t7000, plus any extra frames where visual state changes
```

For each frame, store:
- Screenshot.
- Visible image/video assets and rects.
- Loader/root overlay rect, opacity, height, filter, transform.
- Text/wordmark rect and opacity.
- Canvas count/rects and custom tags.
- CSS transitions/animations from source for the elements involved.

Turn the sequence into a prompt contract:

```text
OpeningSequence:
  Stage 0 blank/loading surface: bg <<hex>>, duration/condition <<asset-load or ms>>.
  Stage 1 primary subject: asset URL/brief, rect, blur/opacity from→to, timing/ease.
  Stage 2 brand/color field: gradient/wordmark/logo, z-order, reveal timing.
  Stage 3 transition out: overlay height/filter/clip/opacity from→to, duration/ease.
  Stage 4 stable hero: first post-loader frame and continuing mouse/scroll behavior.
```

Example from `theunknown.tv`: source shows `#loading`, `#loading-bg`, `#loading-cover`, `head-C5MOojJn.webp`, `loading-rays-BQXV9Jjo.svg`; source timings include cover `opacity/filter 1000ms`, background height `1250ms`, exit height `550ms`, exit filter `450ms`. The clone prompt must include that loader sequence, not only the later pink/purple hero.

### 3.9 URL complexity triage — ask before promising impossible 100%
URL mode can expose real source assets and scripts, but that does not mean the clone can cheaply recreate every runtime. Before writing the final prompt, classify the original:

```text
complexity: simple DOM/CSS | DOM+GSAP/smooth-scroll | canvas/WebGL shader | full 3D engine | video/physics/game-like
success_target: 100% replica | high-fidelity reimplementation | static/partial approximation
risk_items: exact engine unavailable, private shader, inaccessible assets, performance budget, browser API mismatch
```

Ask the user to confirm when the page depends on any of these:
- three/OGL/Babylon/custom WebGL scene with non-trivial geometry, shader uniforms, depth maps, particles, or postprocessing.
- Many synchronized canvases/videos, scroll-linked 3D, or physics-like interaction.
- Assets hidden behind auth, signed URLs, blob/data URLs, paid APIs, or source maps/chunks that cannot be fetched.
- Interaction whose fidelity requires large runtime work rather than prompt precision.

Use this short decision shape:

```text
This URL contains <<risk>>. I can target:
1. 100% replica attempt: higher time/risk, implement the runtime primitive.
2. High-fidelity visual clone: same screenshots and major motion, simpler internals.
3. Static approximation: fastest, not acceptable if the goal is strict 100%.
Which target should I use?
```

Do not ask for ordinary GSAP, smooth scroll, hover, loader, video, or variable-font effects; those are expected clone work.

### 3.10 URL dynamic-diff loop — compare motion as evidence, not memory
For URL implementation-confirmed runs, create an evidence matrix before coding and reuse it after coding. Minimum matrix:

```text
opening: t000, t100, t250, t500, t750, t1000, t1500, t2000, t3000, t4000, t5000, t7000
rest: stable hero after opening
pointer: mouse-left, mouse-center, mouse-right
scroll: first wheel transition, then key scroll progress anchors or 0/10/25/50/75/100%
hover: one representative target per interaction family
mobile: hero, menu/open state, first scroll state
```

Use **source anchors before percentages**. For each major section, identify a stable text or selector from the original (`hero`, first content headline, projects heading/card title, model/process section, CTA, footer headline). Capture original and clone at the same CSS viewport/DPR by scrolling those anchors into view. Percent scroll (`0/10/25/50/75/100%`) is a fallback for pages without reliable anchors or for continuous scroll effects.

Use a **fresh browser profile for one-time openings**. Disable cache and add a cache-busting query param when recording loader/opening frames; do not rely on a normal browsing session where localStorage/session/cache may already skip the intro.

Each captured state should include screenshot + JSON:
- viewport, scrollY or virtual scroll target/current values, body transform if fixed-scroll is used.
- canvas count, canvas rects, custom element tag names/classes, video currentTime/paused/readyState.
- root color variables, key background/canvas container computed colors, and 5-9 sampled frame colors for tone matching.
- key layer rects with z-index/opacity/filter/transform so opening elements do not accidentally persist into stable state.
- fontVariationSettings for representative chars when variable fonts react to pointer/scroll.
- cursor/follower rect, label, filter/backdrop, and trigger state.
- hover before/after color/background/transform/filter.

Treat these as hard failures:
- Original has canvas/WebGL/custom cursor/variable-font motion and clone has none.
- Original first impression includes loader/opening sequence and clone starts directly at stable hero.
- Clone background color family is close but sampled hue/luminance is materially off.
- Scroll works but source sticky/pin/scrub/color-field transitions are missing.
- The clone matches a single frame by stacking elements from multiple timestamps.
- Interaction is visibly janky because rAF/pointer/scroll updates cause layout thrash.
- Original/clone screenshots were captured at different CSS viewport widths or DPR but judged as one state.
- A framework default (`.container` max-width, body font/tracking, sticky transform, section overflow) changes the layout and no computed-style audit was performed.
- Source cards/galleries/partners have real cardinality/assets but the clone renders repeated placeholders or loops.
- Clone adds a dark overlay/veil in a state where the source has none.

Before patching layout by eye, run a small computed-box audit on both source and clone: container width/max-width, section rects, grid columns/gaps, h1/h2 font size/line-height/letter-spacing, image object-fit/object-position, overlay opacity/filter/transform. This is mandatory when layout looks "almost right" but keeps drifting; it exposes framework defaults such as Tailwind `.container` max-width.

---

## 4. Assets — the consuming AI MATERIALIZES them, never `REPLACE-ME`  🔴

The deliverable is a **portable, single text prompt**. Goal: the AI that consumes it completes every asset with **zero work handed back to the user**. The difference from a placeholder: `REPLACE-ME` leaves a blank for the *user* (❌); a **stable original URL** or **generation brief** leaves a precise executable spec for the *AI* (✅). **`REPLACE-ME` / `placehold.co` is banned.** Full method in `references/asset-sourcing.md`. Priority order:

1. **URL MODE DEFAULT → pin stable original URLs.** Public same-origin/CDN images, videos, fonts, SVG, Lottie/JSON, and CSS background files become primary assets in the prompt. This does not skip prompt generation; it makes the prompt more deterministic.
2. **SCREENSHOT MODE DEFAULT / URL GAP FALLBACK → write a generation brief.** For each image/video that cannot be stably extracted, embedded, or published with permission, embed a precise, generatable art-direction spec (medium · camera angle · lens feel · crop · composition grid · foreground/midground/background · subject details · negative space for live text · **palette matched to this page** · light · texture · aspect · `object-position` · `no text/watermark/logo` · style). Video-like hero briefs also state the code-motion treatment if only still images can be generated. Image-gen-capable tools (Codex environments with image generation access, Gemini, v0, Lovable, bolt) can generate it directly; otherwise retain the brief or use fetch-only fallback. Pure text, no shipped files — the most portable form.
   - For visible device/mockup/photo assets, match the reference's raster image rather than rebuilding the subject in CSS. Code may add live overlay text/nav, but the laptop/phone/hand/card/scene itself should be generated as a bitmap when the reference is photographic.
   - Do not default device screens to blank. If the screenshot shows a laptop/phone screen with UI, describe the screen UI layout in the generation brief; reserve `blank screen` only for truly blank references or for explicitly planned live perspective overlays.
3. **OPTIONAL fallback → one real free-stock URL per generated asset** for tools that fetch but don't generate (e.g. plain Claude Code): a verified `images.unsplash.com` / `videos.pexels.com` direct link. Do not include by default for image-gen-capable targets; add only when the target is fetch-only.
4. **Only for screenshot pixel-exact 1:1 (must be the original photo) → crop from the screenshot** (sips/ImageMagick, saved to the project's `public/`). This is a fallback, not the default.
5. **Icons:** prefer `lucide-react` named icons (`ArrowUpRight`, `Menu`, `X`, `Check`, `Play`); inline raw SVG `path d` only when you have/derive the geometry. Avatars → DiceBear/Pravatar.
- Emit a **"素材清单 / Asset manifest"** at the top of the prompt: each asset = stable original URL for authorized/internal use, `replace before production` original reference, or a generation brief (+ optional fallback URL). No `REPLACE-ME` entries.
- Make "**palette matched to this page** + **no text/watermark**" a habit in every brief — that's what makes generated assets sit seamlessly inside the cloned design.

---

## 5. Ask vs. infer — the decision rule

**Infer/resolve it yourself (don't ask)** for anything stylistic or sourceable:
- exact motion timings, easing, stagger ms; exact hex within a clearly-readable family; responsive breakpoint ladder; font weights; z-index order; hover micro-interactions; the target stack.
- **the concrete font** (match + source it yourself — §1.3 / font-matching.md), and **all assets** (write generation briefs yourself; extract stable originals or add fetch-only fallbacks only when appropriate — §4 / asset-sourcing.md). Never ask the user to supply fonts or media — that defeats the point of a clone.

**Ask a short clarifying question (max 2–3, batched) only when** a wrong guess is expensive and unrecoverable from the input:
- **Scope/section count is ambiguous and user intent does not resolve it** — e.g. a tall screenshot with no wording like "landing page/site" or "hero only": *"Is this the whole page, or just the hero — should I build only what's shown or scaffold full sections below?"* If the user says page/site/landing page, do not ask; infer the below-fold page.
- **Multiple screenshots** given — *"Are these separate sections of one page (in this order), or alternatives of the same section?"*
- **Real brand vs. fictional** — if you can't read a wordmark: *"What's the brand/product name and one-line tagline?"* (Otherwise invent a plausible name and flag it.)
- **Interactive behavior not visible** — a search bar/form/menu: confirm the on-submit/on-toggle behavior only if it materially changes structure.
- **(Optional, not blocking) the real source** — if the user happens to have the live URL, mention that giving it lets you pin the *exact* original fonts/colors/assets. But never gate delivery on it; ship a fully-sourced prompt regardless.

Default bias: **infer, source, and proceed**, listing what you used in an "素材与字体清单 / Asset & font manifest" block at the top of the emitted prompt, rather than stalling. One round of questions max; never interrogate.

---

## 6. Emission rules (so the inferred prompt stays deterministic)

When you write the final clone prompt, keep the house conventions even though values were inferred:
- **Lead with the one-sentence identity line:** STACK → PRODUCT NAME → SECTION MAP → KEY LIBS → AESTHETIC. Add `"Match every detail below exactly."` as a precision oath (ref 3).
- **Tokens before sections:** Fonts block (concrete families + **real load URLs**), Color-system block (each hex with its role + application method), Custom-CSS-utility blocks (`.liquid-glass`, noise, gradient-text) — full verbatim CSS, not prose.
- **Assets are zero-user-work** (§4): URL mode pins stable original URLs first for authorized/internal use; third-party public release marks originals as `replace before production`; screenshot mode writes generation briefs (palette-matched, `no text/watermark`); optional stock fallback URL only for fetch-only; crop only for screenshot pixel-exact 1:1. No `REPLACE-ME`. Lead the prompt with a "素材与字体清单" manifest of original URLs/briefs + the font load URLs.
- **Sections in DOM order**, each with: container layout → background → named sub-elements (`Navbar:`, `Hero content:`, `CTA "Label":`) → verbatim copy → exact Tailwind class string (with arbitrary `[..]` values + full responsive ladder) → numeric motion spec.
- **Hoist repeated behavior into named components** (`FadeIn`, `BlurText`, `Magnet`, `FadingVideo`) defined once with prop + algorithm, referenced by name.
- **Every value is a literal**, never a vibe: exact hex, exact ms, exact `cubic-bezier`, exact Tailwind utilities, exact copy.
- **Add negative constraints** to suppress wrong defaults: `"No dark overlay on the video"`, `"loop attribute behavior"`, `"No purple, no indigo"`, `"No other UI libraries"`.
- **Close with a guardrail block** ("Key Design Principles" / "Tech Stack recap") restating invariants — color, glass recipe, typography rule, responsive collapse.
- **Flag inferred-vs-known**: anything you measured (URL mode) is presented as fact; anything you guessed (a hex within a readable family, motion timing, a font match) gets a quiet `[inferred]` marker so the user knows what to verify. Assets are never flagged as TODO — they're real and working; the manifest just notes their origin.

---

## 7. Worked mini-example (screenshot → filled slots)

**Described screenshot (what you see):** A full-viewport dark frame. A cinematic, slightly-blurred photo of a foggy mountain ridge fills the background, undimmed. At the very top, a translucent frosted pill bar spans the width: left a small white circular logo + the word **"Vantyr"**; center three links **"Approach", "Work", "Studio"**; right a white pill button **"Get in touch"**. Content is pushed to the **bottom-left**: a small uppercase eyebrow **"DESIGN STUDIO"**, then a large italic serif headline on two lines **"We build / quiet interfaces"**, then a one-line grey subtitle **"Calm products for ambitious teams."**, then a frosted-glass pill CTA **"See our work"** with a small right-arrow. Type is white; the only non-white accent is the warm-amber arrow glyph. No other sections visible.

**Filled slots (inferred):**

- **Build sentence:** *"Create a React + Vite + TypeScript + Tailwind CSS landing page for a design studio called \"Vantyr\". The page is a single full-viewport hero section with a looping background video and overlaid glassmorphism chrome. Use Framer Motion for animations and lucide-react for icons. The design is dark and cinematic with white type and a single warm-amber accent. Match every detail below exactly."*
- **Section inventory:** 1 — `Hero` (single full-screen section; fixed glass nav layered on top). `min-h-[100svh]`, content bottom-left anchored (`flex flex-col justify-end items-start`).
- **Fonts (concrete + sourced):** heading `Cormorant Garamond` italic (Google Fonts, high-contrast elegant serif — `[inferred match]`); body `Inter` 300/400/500/600 (Google Fonts). Real `<link>` URLs emitted for both. Roles: serif-italic = headline; Inter = eyebrow/subtitle/nav/buttons. (If the headline were an ornate swash face, source one from Fontshare/onlinewebfonts instead — never leave it unresolved.)
- **Colors (with roles):** bg media undimmed over `#000000`; text `#FFFFFF`, secondary `text-white/70`; accent (arrow) `#E8A33D` `[inferred]`; glass tint `rgba(255,255,255,0.01)` + `border-white/10`.
- **Custom CSS utility:** `.liquid-glass` (frosted nav + CTA): `backdrop-filter: blur(8px)`, masked `::before` gradient-stroke border. Named, referenced by nav and CTA.
- **Background (generation brief, default):** looping autoplay muted `playsInline` video, `object-cover`, **no overlay**. Brief: *"6–10s seamless looping drone clip of a slow foggy mountain ridge, cold cinematic mood, dark desaturated palette to match the page, subtle slow push-in, no text/watermark."* Optional fetch-fallback: a verified `videos.pexels.com/video-files/…-hd_1920_1080_30fps.mp4`.
- **Nav (z-50, top, glass pill):** left logo = small inline SVG mark we draw (`[drawn]`) + "Vantyr" `text-lg font-medium`; center (`hidden md:flex gap-8 text-sm text-white/80`) "Approach", "Work", "Studio"; right white pill "Get in touch" `bg-white text-black px-5 py-2 rounded-full`; mobile hamburger `md:hidden` lucide `Menu`/`X`.
- **Hero copy (verbatim):** eyebrow "DESIGN STUDIO" (`text-xs tracking-[0.25em] uppercase text-white/60 mb-4`); headline "We build\nquiet interfaces" (`font-heading italic text-white text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-[-0.02em]`); subtitle "Calm products for ambitious teams." (`text-white/70 text-lg mt-5`); CTA "See our work" + lucide `ArrowRight` amber (`.liquid-glass rounded-full px-6 py-3 mt-8`).
- **Motion (inferred):** Framer Motion blur-rise: `initial {filter: blur(10px), opacity:0, y:20} → easeOut`, stagger eyebrow `0.3s` → headline `0.5s` → subtitle `0.8s` → CTA `1.1s`; easing `[0.16,1,0.3,1]`; CTA `hover:gap-3 group-hover:translate-x-1` on arrow.
- **Responsive:** padding `px-6 md:px-12 lg:px-16 pb-12 lg:pb-20`; nav center `hidden md:flex`; headline ladder above; `h-[100dvh]`.
- **Page title:** "Vantyr — Design Studio".
- **素材与字体清单 (emitted at top):** brand name read from screenshot; fonts `Cormorant Garamond` + `Inter` (both Google Fonts, load URLs given) — serif match is `[inferred]`; amber accent `#E8A33D` `[inferred]`; hero video = a generation brief (palette-matched, no text) + an optional verified Pexels `.mp4` fallback; logo = simple inline SVG mark we drew. Single section only (asked nothing — scope unambiguous from a full-viewport composition).

That filled set is then rendered into the house-style master template (identity sentence → Fonts → Colors → `.liquid-glass` → SECTION 1: Hero with per-element specs → shared `FadeIn`/`BlurText` components → Responsive → Key Design Principles recap).
