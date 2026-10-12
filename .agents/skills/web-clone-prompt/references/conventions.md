# CONVENTIONS & PRECISION RULES

*The shared "house style" that makes site-clone prompts reproduce a target 1:1.*

This reference distills the recurring patterns across 11 real clone prompts (motionsites.ai / higgs-style). It is a checklist for writing a clone prompt that a coding agent will reproduce **deterministically** — i.e., two implementers reading it produce visually identical output, with no taste, no defaults, no invention.

The governing principle: **every visual/behavioral decision is pre-made and stated as a literal, not left to the implementer.** When a value can be copy-pasted, it is. When it can only be described, it is described as a contract (props + algorithm + exact numbers), never as a vibe.

Authorization boundary: exact clone prompts are for user-owned pages, authorized work, internal research, or local visual regression. For third-party pages intended for public release, treat copied brand names, copy, trademarks, proprietary media, and proprietary fonts as internal reference evidence only; replace them with user-owned or licensed equivalents before publication.

---

## 1. The Opening Sentence (the "lock")

Open with **one imperative sentence that front-loads the global invariants** before any detail block. Order is near-fixed:

```
BUILD VERB → PAGE TYPE/SCOPE → PRODUCT NAME (quoted) → [one-line positioning] → TECH STACK (inline) → KEY LIBS (anim/icons) → DOMINANT AESTHETIC → [signature mechanic] → [precision oath]
```

Examples of the shape:
- `Create a React + Vite + TypeScript + Tailwind CSS landing page for a creative studio called "Prisma". The page has 3 sections: Hero, About, and Features. Use framer-motion for animations and lucide-react for icons. The design is dark, moody, and cinematic with a warm cream color palette.`
- `Build a full-screen, dark-themed hero section for a geology brand called **Lithos** using **React 18 + TypeScript + Vite + Tailwind CSS** and **lucide-react** for icons. The signature feature is a **cursor-following spotlight that reveals a second image**... Match every detail below exactly.`
- `Build a single-page React + Vite + TypeScript + Tailwind CSS site with exactly two full-screen sections (Hero and Capabilities).`

**Rules:**
- Quote the product name (`"Prisma"`, `"SynapseX"`, `"Aurai"`).
- Pin the **section count and names** up front (`3 sections: Hero, About, Features` / `exactly two full-screen sections`). "exactly two" is a hard cardinality constraint — the agent can't add or drop sections.
- State the stack **inline** as a `+`-joined list, so there's zero framework freedom.
- If there's a signature interaction (spotlight reveal, mouse-scrubbed video, liquid-glass), name it in sentence one.
- A precision oath (`Match every detail below exactly.` / `Recreate this hero section exactly. Here are the complete specifications:` / `use exactly these`) sets a global fidelity contract.

---

## 2. Default Tech Stack (and when it varies)

### The canonical stack
```
React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + lucide-react
```
This is the default for full pages and most heroes. Pin it inline in sentence one.

### Known variations (choose deliberately, then state it)
| Variation | When it appears | What changes |
|---|---|---|
| **CDN / no-bundler** | In-browser JSX demos | React/ReactDOM UMD builds + `@babel/standalone` via `<script type="text/babel">`, Tailwind via `cdn.tailwindcss.com`, components export `window.X = X`, mounted on `#root`. **Pin exact versions + SRI integrity hashes + crossorigin** on every `<script>`. |
| **No framer-motion** | Light SaaS / static heroes | All motion is hand-written CSS `@keyframes` + Tailwind `animate-*` utilities + inline `[animation-delay:Xms]`, with **one shared easing** `cubic-bezier(0.22, 1, 0.36, 1)`. |
| **No animation lib at all** | Premium "static" heroes | Motion limited to CSS `transition-colors` + looping `<video>`; `useState` only for menu toggle. |
| **No icon library** | When glyphs must be byte-exact | Hand-specify inline SVG `path` data (lucide-style strokes / Material fills) instead of importing icons. Declare it: `no external icon library needed for these`. |
| **lucide declared but unused** | Heroes that hedge | `Icons from lucide-react if needed (none currently used)`. |

### Always pin
- **Dependency versions** caret-pinned (`framer-motion ^12.40.0`, `lucide-react ^0.344.0`, `react ^18.3.1`) — either inline or in a verbatim `package.json` fragment / Dependencies block. This fixes the runtime so APIs behave identically.
- **Build tooling + language** (Vite + TypeScript) even when obvious.
- A negative lock when relevant: `No other UI libraries.` / `No extra UI libraries needed.`

---

## 3. Exact-Value Rules

The single biggest determinism lever. **No prose where a literal will do.** "large rounded corners" is forbidden; `rounded-2xl md:rounded-[2rem]` is required.

### 3.1 Colors — always exact, always role-attached
- **Exact hex everywhere**, never named colors: `#0C0C0C` (global bg), `#101010` (About card), `#212121` (Features cards), `#e8702a` (accent), `#202A36` (brand near-black). Each hex carries the surface it paints.
- **rgba for translucency**, exact alphas: `rgba(255,255,255,0.01)` (glass fill), `rgba(225, 224, 204, 0.8)` (translucent nav link), `rgba(0,0,0,0.4)`.
- **Off-palette colors as Tailwind arbitrary brackets**: `bg-[#e8702a] hover:bg-[#d2611f]`, `bg-[#1a1a1c]`, `text-[#febc2e]/80`.
- **Tailwind opacity slashes** for text/borders: `text-white/80`, `text-white/70`, `border-white/10`, `bg-black/20`.
- **Disambiguate near-identical values AND their application method.** If two creams differ by one digit, say so and say how each is applied: `#DEDBC8 (used for utility classes like text-primary)` vs `#E1E0CC (applied via inline style, slightly different from Tailwind primary)`.

### 3.2 Tailwind utility strings — verbatim, with full responsive ladders
- Quote the **complete className string** per element, including arbitrary `[..]` values and every responsive prefix:
  - `text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]`
  - `absolute bottom-10 sm:bottom-24 left-5 right-5 sm:left-auto sm:right-10 md:right-14 max-w-full sm:max-w-[260px]`
  - `rounded-2xl md:rounded-[2rem]`, `leading-[0.85] tracking-[-0.07em]`, `w-9 h-9 sm:w-10 sm:h-10`
- **Responsive prefix ladder is always spelled out**, never described: `sm/md/lg/xl/2xl`. Add `(desktop only)` / `hidden on mobile, visible md+` gating notes where breakpoint visibility matters.
- Use **arbitrary values** for anything Tailwind's scale can't hit: `text-[13px]`, `min-h-[100svh]`, `leading-[1.05]`, `top-[4.5rem]`, `max-w-[700px]`.
- Note the **shorthand convention** some prompts use for responsive: `px-5 (sm:px-8)`, `pt-12 (sm:pt-16, md:pt-24)` — base value + parenthetical overrides. Either form is fine; be consistent.

### 3.2b Layout alignment is an exact value too
- Every section with inferred layout must carry an explicit **alignment contract**, not just a grid class: column ratio, `items-*`, child heights, vertical distribution, and edge alignment.
- For two-column media/text sections, prevent the common failure mode where one column ends early and leaves a large blank gutter. Use exact utilities such as `md:grid-cols-2 md:items-stretch`, media `md:h-full md:min-h-[520px]`, and text `flex h-full min-h-[520px] flex-col justify-between`.
- Small labels (`EST.`, years, section indexes, side captions) align to their visual anchor, not the entire section. If a label sits on a title's midline, define it inside that title wrapper with `top-1/2 -translate-y-1/2`.
- Long display words, especially Cyrillic/uppercase labels, must fit their column at every breakpoint. If needed, reduce the text ladder or widen the grid column; do not let headings crop against a grid boundary.
- Rounded media must not reveal accidental blank bands at the top/bottom. If the generated image has too much sky/negative space, specify `h-[120%]`/`h-[125%]` plus `object-position`, or regenerate with a tighter composition brief.

### 3.3 framer-motion — every number specified
Motion is reproducible math, not "a nice cascade":
- **Initial-state objects**: `initial: { filter: 'blur(10px)', opacity: 0, y: 20 }`.
- **Easing as exact cubic-bezier arrays**: `[0.16, 1, 0.3, 1]` (hero), `[0.22, 1, 0.36, 1]` (cards), `[0.25, 0.1, 0.25, 1]` (FadeIn), or named (`easeOut`).
- **Durations in decimal seconds**: `0.7s`, `0.8s`, `1.0s`, `1.2s`.
- **Per-element delays forming a timeline**: `Badge 0.4 → Subtext 0.8 → CTA 1.1 → Stats 1.3 → Trust bar 1.4`.
- **Stagger as a formula, written out**: `delay = (i * 100) / 1000s`, `each item delays by i * 0.1`, `delay 0.05 + index*0.06`, `i * 0.07` per char.
- **Triggers named**: `useInView (once: true)`, `useInView (once, margin "-100px")`, `whileInView ... { once, amount 0.3 }`.
- **Spring physics by stiffness/damping/mass**: `spring stiffness 350, damping 28`, `useSpring stiffness 15, damping 32, mass 1.8`.
- **whileHover/whileTap deltas**: `scale 1.02 / 0.98`, `bg rgba(255,255,255,0.22)`.

### 3.4 Hand-written CSS animation (no-framer variant)
- Full `@keyframes` with **exact percent stops + transform/opacity/filter**: `fade-up: opacity 0→1, translateY(24px)→0, filter blur(6px)→0`.
- Bind to `.animate-*` utility classes; state **duration, shared easing, fill-mode**: `animation: fade-up 0.9s cubic-bezier(0.22,1,0.36,1) both`.
- Stagger via **monotonic inline arbitrary props**: `[animation-delay:100ms]` → `220ms` → `340ms` → `460ms` → `620ms`.
- Include an **accessibility guard**: `@media (prefers-reduced-motion: reduce)` disables all animations (`animation: none; opacity: 1`).

### 3.4b URL-derived interaction exactness
When cloning from a URL, source-observed interaction systems are exact values too. They must be represented as named component contracts, not simplified into visual adjectives.

- **Opening/loader sequence:** capture first-paint/loading frames before stable hero; pin loader asset URLs, background colors/gradients, wordmark/logo geometry, stage order, from→to opacity/filter/height/clip transforms, durations/easing, and the exact exit behavior.
- **Canvas/WebGL:** record canvas count/rects, parent selector, z-index, shader/uniform colors, speed/frequency/amplitude, mouse-uniform mapping, DPR resize behavior, and cleanup. A source hero with a mouse-reactive canvas cannot become a static gradient.
- **Depth/parallax:** pin both the visible texture URL and depth-map URL when public; specify shader/offset strength, pointer mapping, transform-origin, opening scroll/position timeline.
- **Variable font pointer effects:** list axis names and ranges (`"wght" 300→900`, `"Wide" 0→10`), char splitting strategy, max distance, smoothstep/lerp factor, scroll offset handling, and rAF cleanup.
- **Custom cursor:** rest rect, expanded rect, label source, trigger selector, follower lerp, filter/backdrop CSS, and hover/open/close timing.
- **Opening and scroll timelines:** initial and captured/final states both matter. If media overlaps the title in the screenshot, define the pre-overlap initial state and the final occluding state with exact delay/progress values.
- **Verification evidence:** URL implementation must compare original and clone at identical viewport/pointer/scroll states, not only static screenshots.

### 3.4c Screenshot-frame exactness
When cloning from screenshots, the uploaded images replace source code as the evidence layer. Register each screenshot as a reference frame and require matching clone screenshots.

- Each uploaded screenshot gets a stable ID: `REFERENCE_FRAME_01`, `REFERENCE_FRAME_02`, etc.
- Record viewport/aspect ratio, visible section, crop boundaries, scroll position if inferable, and any state (hover/menu/modal/animation frame).
- Visible pixels are factual anchors; inferred below-fold sections cannot override or "improve" visible layout.
- Multi-screenshot inputs must be compared frame-by-frame after implementation. A perfect hero with a broken second screenshot is not a pass.

### 3.5 clamp() fluid typography
When type scales fluidly, give the **full `clamp(min, vw, max)` triple** as a literal: `clamp(3rem, 12vw, 160px)`, `clamp(0.75rem, 1.4vw, 1.5rem)`, `clamp(120px, 30vw, 521px)`. Three explicit values, no "responsive heading."

### 3.6 Micro-typography & geometry
- **Letter-spacing/tracking** in explicit em (often inline style, since Tailwind rounds): `letterSpacing: '-0.05em'`, `tracking-[-4px]`, `0.25em` (mobile) / `0.3em` (desktop).
- **Line-height** exact: `leading-[0.8]`, `line-height: 1.08`.
- **Pixel values** for overlaps/pulls/icons: `negative margin-top: -12px for overlap`, `-mt-80 to pull up`, icon `size 22`, `bar height 1.5px`.
- **z-index ladders** stated numerically: `z-0 video / z-10 content / z-50 navbar`, `z-10 base / z-30 reveal / z-50 text / z-[100] nav`.

---

## 4. Asset Exactness

**Never leave an asset vague.** In original motionsites prompts that often means a full URL; in this skill it usually means a generation brief precise enough for an image-capable tool to materialize the asset with no user work. `REPLACE-ME`, `placehold.co`, and unsourced placeholders are failures.

> 🔴 **Clone-mode rule (our skill).** The original motionsites prompts pin their *own* CloudFront/proxy URLs. When **we** clone from a screenshot, "specify the asset exactly" means a **generation brief** precise enough for image-gen-capable tools (Codex environments with image generation access, Gemini, v0, Lovable) to materialize it with zero user work. When **we** clone from a URL, "specify the asset exactly" means **pin stable public original URLs first for authorized/internal use** (images, videos, fonts, SVG, Lottie/JSON, CSS backgrounds), then use generation briefs for gaps or for third-party public-release replacements. Optionally add one real free-stock fallback URL for fetch-only tools. Crop screenshot pixels only when screenshot-mode pixel-exact 1:1 is required. A `REPLACE-ME`/`placehold.co` blank is a **failure**, not a fallback. Full method + URL/license caveats: `references/asset-sourcing.md`.

### Generated media (screenshot default / URL fallback)
- Start screenshot asset blocks with `target_asset_mode=image-gen-capable`; start URL asset blocks with `target_asset_mode=url-extracted-assets-primary`.
- Each image/video brief includes: medium, camera angle, lens feel, subject, subject details, composition/crop, focal point, foreground/midground/background, live-text safe area, aspect ratio, palette locked to page hexes, lighting, texture/style, delivery (`object-fit/object-position`), and negative constraints (`no visible text, no watermark, no logo, no UI`).
- Alias generated assets to named constants referenced in sections: `HERO_BG_VIDEO`, `CARD_IMG_1`, `REVEAL_IMAGE`.
- For generated videos, still annotate playback semantics: `autoplay, muted, loop, playsInline, object-cover` — or the negation `Hero (mouse-scrubbed, NOT autoplay)`.
- For generated hero/background stills, specify code motion so the result does not feel dead: slow `scale/pan/rotate` Ken Burns, parallax layer drift, or masked reveal with exact duration/easing/repeat values. Example for aerial/drone stills: `scale 1.04→1.18`, `rotate -1.8deg→1.8deg`, `translate3d(-3%,-1.6%,0)→translate3d(3%,1.6%,0)`, `18–24s ease-in-out infinite alternate`, then verify the motion is perceptible.

### Original or fallback URLs
- URL mode should pin stable original media exactly as the primary path. Keep all query params verbatim: `https://images.higgs.ai/?default=1&output=webp&url=<encoded>&w=1280&q=85`, Cloudinary `q_auto/f_auto`, CloudFront `.mp4`, same-origin `.webm`, font files, SVG, Lottie/JSON, etc.
- `target_asset_mode=fetch-only` may add one verified free-stock fallback per generated asset. Prefix it as fallback, not as the primary path.
- When a section repeats images, enumerate every asset constant/URL and state the split: `Row 1: first 11 images; Row 2: remaining 10`.

### Fonts
- **Exact Google Fonts query string** with axes: `family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600`. List exact weights.
- For non-Google: full CDN URL with its hash (`https://db.onlinewebfonts.com/c/<hash>?family=Askan+Light`).
- Bind each font to a **role + Tailwind alias**: `font-heading → 'Instrument Serif', serif (always italic)`; `askan: ['"Askan Light"', 'serif']`. Give the **global font-family CSS** verbatim and (if applicable) mirror it in **both** `tailwind.config.js` and `index.css`.

### Icon CDNs / SVG logos
- Icon CDN URL verbatim when used: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css` + exact class `bi bi-apple`.
- **Brand mark = raw SVG geometry**: exact `viewBox`, `fill` (often `currentColor`), and full `path d` string, so the logo is byte-reproducible, not redrawn.

---

## 5. Custom Animation Components (specify as contracts)

Repeated behavior is **hoisted into a named component defined once** (DRY) and referenced by name inside sections. The definition is a **complete contract**: props + algorithm + exact numbers + edge cases. Never "a scramble effect."

A component spec includes:
1. **Name + prop signature** — `RevealLayer({ image, cursorX, cursorY })`, `BlurText (props: text, delay, triggered)`, `Magnet (padding 150, strength 3)`.
2. **Split/iteration rule** — `splits text by spaces, each word is a motion.span`; `splits text by \n into lines, then each line into characters`.
3. **Per-step motion** — keyframes/from-states with exact values: `blur(10px)→blur(0px)`, `opacity 0→0.5→1`, `y 50→-5→0`.
4. **Timing** — `duration 0.7 (0.35 × 2)`, `times: [0, 0.5, 1]`, per-index stagger `delay = (i*100)/1000s`.
5. **Trigger** — `IntersectionObserver threshold 0.1` / `useInView (once: true)`.
6. **Character set (for scramble/decode)** verbatim — `'ABC...xyz0123456789!@#$%^&*()_+~|}{[]:;?><'`, with reveal rate (`0.5 chars/frame`, `4 frames/char`), interval (`25ms`), direction (`left-to-right`), and edge cases (`spaces preserved`, `renders &nbsp; before triggered`, `instant reset on unhover`).
7. **Imperative lifecycle (for video/canvas)** with **named constants**: `FADE_MS = 500`, `FADE_OUT_LEAD = 0.55`; `On timeupdate: if duration - currentTime <= 0.55 ... fadeTo(0)`; `On ended: setTimeout(100ms) reset currentTime = 0`; `loop attribute is OFF`. Specify `cancelAnimationFrame` ordering and `requestAnimationFrame` lerp factors (`smooth.x += (mouse.x - smooth.x) * 0.1`).
8. **Cleanup** — `remove listener + cancel RAF on unmount`.
9. **Canvas/mask math** when relevant — full radial-gradient stop table (`0 → rgba(255,255,255,1), 0.4 → 1, 0.6 → 0.75, 0.75 → 0.4, 0.88 → 0.12, 1 → 0`), named radius constant (`SPOTLIGHT_R = 260`), and the apply step (`toDataURL → maskImage/webkitMaskImage, maskSize '100% 100%'`).

Common named components to know: `WordsPullUp`, `BlurText`, `ScrambleIn`/`ScrambleText`, `FadingVideo`, `Magnet`, `AnimatedText`/`AnimatedHeading`, `FadeIn`, `StaggeredFade`, `RevealLayer`, `ScaledDashboard`, `SquashHamburger`.

### Signature CSS utilities (same idea, CSS form)
The **liquid-glass / glassmorphism** system is defined as **named classes with full property lists**, then applied by name:
```css
.liquid-glass { background: rgba(255,255,255,0.01); backdrop-filter: blur(4px);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); }
/* ::before gradient-stroke border: linear-gradient(180deg, 0.45 0%, 0.15 20%, 0 40%, 0 60%, 0.15 80%, 0.45 100%)
   with padding: 1.4px and the mask cutout trick:
   -webkit-mask-composite: xor; mask-composite: exclude; */
```
Define variants **as a diff** to avoid restating: `.liquid-glass-strong { /* same but: */ backdrop-filter: blur(50px); ... }`. Distinguish blur radii exactly (`blur(4px)` vs `blur(50px)`).

---

## 6. Verbatim Copy

**Every visible string is quoted character-for-character for authorized/internal clone work.** Text is transcribed, never invented or paraphrased when the goal is evidence or local regression. If the target is a public release of a third-party page, visible third-party copy is treated as reference evidence and replaced with user-owned copy while preserving layout rhythm.

- Quote in full: headings (per-line), full body paragraphs, nav labels, button labels, placeholders, eyebrow/kicker text, stat values, card titles + numbers, footer/© line.
- Preserve **punctuation and separators**: em-dashes (`within reach—secure`), middots (`Aeon · Vela · Apex · Orbit · Zeno`), slash kickers (`// Capabilities`), trailing periods (`Shaping tomorrow\nwith vision and action.`).
- Preserve **casing quirks** and call out **encoding**: lowercase `"Hi, i'm jack"`, curly apostrophe via `&apos;`, `&nbsp;` for animated-text spaces.
- Call out **line breaks explicitly**: `Two lines — WITNESS THE and HIDDEN REALM`; `(literal line break between "tomorrow" and "with")`; `Line break <br> before the dash`; `subtitle break hidden on mobile, visible sm+`.
- Keep **ordered lists in fixed order** — order is load-bearing: `nav ["Work", "Studio", "Services", "Journal", "Contact"]`, `card tags ["React", "Next.js", "Headless CMS", "Edge-Ready"]`.
- Exact data values with grouping: `MAX REACH 3,156,200`, metrics `2.4ms / 99.7% / 140B`.

---

## 7. Document Structure (assemblable top-to-bottom)

Order the prompt so it can be built in one pass, DOM/visual order:

```
1. Opening lock sentence (stack + product + sections + libs + aesthetic + oath)
2. GLOBAL TOKENS — Fonts → Colors → Custom CSS utilities (.liquid-glass etc.)
3. ASSET MANIFEST / DEPENDENCIES (generation briefs by default, exact URLs only when stable/fetch-only)
4. INFERRED PAGE COMPLETION (only when a screenshot is truncated but the requested scope is a full landing page/site)
5. SHARED COMPONENTS — animation primitives defined as contracts
6. SECTIONS in render order — each top-to-bottom
7. RESPONSIVE BREAKPOINTS (if not inlined)
8. KEY DESIGN PRINCIPLES / TECH STACK recap (guardrail)
```

- **ALL-CAPS or `###` block headers**, often `---`-delimited.
- **Per-section sub-template** (apply consistently): `Sizing/Layout container → Background (video/color + overlays + z-index) → named sub-elements (Navbar:, Hero Content:, CTA:) → Verbatim copy → Typography → Animation → Responsive`.
- **Two-tier section blocks**: a layout container line, then named sub-element sub-headers ending in `:` with indented bullet specs.
- **Z-order / DOM-order flow lines**: `z-10 layer holds: Navbar → Hero content → Partners.`
- For **single-section (hero-only)** prompts: substitute a **z-index layer enumeration (1–5)** for the missing "Section N" list; organize by functional region (Video, Fonts, Nav, Mobile Menu, Hero Content, SVG, Global CSS).
- For **truncated screenshot → full landing page** prompts: keep visible sections exact, then add inferred below-fold sections from nav labels and visual grammar. Mark them `[inferred from visible design system]` but still provide literal colors, class strings, copy, assets, and motion. Do not let "inferred" become vague.
- **Closing guardrail block** (`Key Design Principles` / `Tech Stack` recap) restates cross-cutting invariants (pure-black bg, white text, italic tight-tracked headings, glass recipe) as a redundant consistency check + completeness assertion (`captures every element, style, animation, asset brief/URL, and font ... exactly`).

---

## 8. Negative & Scope Constraints (forbid plausible-but-wrong defaults)

Models add reasonable-looking things that aren't in the target. Pre-empt them:
- **Overlay/dimming**: `No overlay. The video plays raw with no dimming whatsoever.` / `NO dark overlay, NO gradient overlay, NO semi-transparent layer.`
- **Palette**: `All text white; no green, no gradient backgrounds.` / `No purple, no indigo.`
- **Behavior**: `loop attribute is OFF (we implement looping manually via ended)`, `No CSS transitions on the videos`, `delta-based, not absolute position`, `NOT autoplay`.
- **Scope**: `No external state management, no routing, no database — pure single-page React app.` / `No other UI libraries.` / `exactly two sections`.
- **Flag global-scope rules**: `Typography (CRITICAL — must be applied globally)`, `place in global CSS`.
- **State rationale for non-obvious choices** so the implementer doesn't "fix" them: `100dvh so mobile browser chrome doesn't clip the section`; `object-top because focal point is top of frame`.

---

## 9. Do's and Don'ts

**DO**
- Front-load stack + product + section map + aesthetic in sentence one.
- Give exact hex/rgba with the surface it paints; distinguish near-identical values and their application method.
- Paste **complete** Tailwind className strings (with `[..]` and full responsive ladders) per element.
- Specify motion numerically: initial object, easing array, duration, per-element delay, stagger formula, trigger hook.
- Pin every asset to a generation brief or stable literal URL; alias media to named constants.
- Define repeated behavior once as a named component **contract** (props + algorithm + exact numbers + char set + cleanup).
- Quote all copy verbatim; preserve punctuation, casing, encoding, and explicit line breaks.
- Pin fonts to source + weights + role + Tailwind alias; mirror the font stack in config and CSS.
- State z-index numerically and narrate DOM order.
- Add negative constraints + a closing guardrail/recap.
- Caret-pin dependency versions (and SRI hashes in CDN builds).
- Include `prefers-reduced-motion` handling.

**DON'T**
- Don't use named colors (`orange`, `dark gray`) or "subtle border."
- Don't describe layout in prose ("large rounded corners", "big heading") — give the utility string / clamp triple.
- Don't say "a nice fade-in" / "smooth animation" — give y/delay/ease/duration/stagger.
- Don't say "a background video / placeholder image" — give a generation brief or a stable URL.
- Don't paraphrase or invent copy; don't drop the trailing period or the `<br>`.
- Don't leave the icon glyph or logo to interpretation — name the lib+icon or paste the SVG path.
- Don't omit responsive breakpoints or leave them as "responsive."
- Don't let the implementer pick the framework, add UI libs, or add/drop sections.

---

## 10. Anti-Patterns (the smell of a vague prompt)

| Anti-pattern | Symptom | Fix |
|---|---|---|
| Named colors | "dark gray background, orange button" | `#0C0C0C` bg, `bg-[#e8702a]` |
| Prose layout | "large rounded card, big centered heading" | `rounded-2xl md:rounded-[2rem]`, full className string |
| Unbalanced inferred split | short media beside tall text, leaving a large blank area in one column | state column ratio + `items-stretch`; media/text share `min-h`; text uses `justify-between` |
| Wrong anchor for side labels | `EST.` / year floats below or above the wordmark centerline | place labels inside the wordmark wrapper with `top-1/2 -translate-y-1/2` |
| Vibe animation | "smooth fade-in cascade" | initial `{opacity:0,y:20}`, ease `[0.16,1,0.3,1]`, delays `0.4/0.8/1.1s`, stagger `i*0.1` |
| Invisible pseudo-video | background has animation code but looks static | increase transform amplitude and verify transform/screenshots 3-5s apart |
| Missed opening sequence | URL clone starts at the final hero, but the original first shows loader/person/product/brand reveal | browser-capture timed first-paint/opening frames; define `OpeningSequence` with source assets and timing |
| Single-frame screenshot validation | user uploaded multiple screenshots but clone is only compared to the hero | register every screenshot as `REFERENCE_FRAME_N`; capture clone at matching viewport/state for each |
| Placeholder assets | "a looping background video", "hero image" | generation brief with palette/no-text constraints, or full stable URL with query params |
| CSS-only fake for photographic mockup | screenshot has a real laptop/phone/hand/product photo, but prompt says build it with divs/CSS for control | generate the bitmap subject with a reference-locked brief; use code only for live overlays and motion |
| Blank device screen drift | reference laptop/phone screen has visible UI, but brief asks for a blank white screen | describe the visible screen composition; use blank only when the reference is blank or live perspective overlay is specified |
| Static occlusion | final screenshot has image covering a title, so prompt places it there from first paint | specify initial unobstructed title state and final occluding captured state with exact scroll/entrance transform |
| Rectangular hero mask leak | foreground mountains/trees should cover a dashboard/mockup, but clone shows a black rectangle, dashboard tail, top strip, or gradient sliver during scroll | define a depth stack with DOM order/z-index/scroll transforms; foreground scenery above mockup; terminal black field below scenery only; verify early scroll micro-frames |
| Collapsed URL motion | original uses canvas/WebGL/custom elements/liquid cursor/variable-font mouse ripple, but prompt says "animated gradient", "subtle mouse effect", or omits it | inspect source scripts/rendered state; define named contracts like `AuroraCanvas`, `ParallaxDepth`, `VariableFontPointerText`, `LiquidCursor` with exact params |
| Static-only URL regression | clone looks close in one screenshot but original changes under mouse/scroll/hover | capture original and clone rest/mouse-left/mouse-center/mouse-right/scroll/hover JSON + screenshots; compare canvas count, fontVariationSettings, cursor rect, transforms |
| Percent-only URL scroll compare | clone and original are compared at 50% scroll but page heights differ, so screenshots show different sections | scroll by source anchors/text/selectors at identical viewport/DPR; record `scrollY`, selector hit, screenshots, and JSON state |
| Cached loader miss | original opening animation is skipped because the browser already stored localStorage/session/cache | capture with fresh profile, cache disabled, cache-busting URL, and timed frames before stable hero |
| Framework container drift | layout is inexplicably shifted/narrow; Tailwind `.container` or CSS defaults clamp the page | inspect computed `max-width`, rects, grid columns, body font/tracking; override `.container { max-width: none; }` or use a project-specific class |
| Mixed breakpoint evidence | source screenshot shows one-column cards but live comparison at another width has two-column stagger | record viewport/DPR for each frame and implement the breakpoint ladder; compare each state separately |
| Placeholder loop | clone repeats generic project cards or blank image placeholders that are not in the original home page | extract real data cardinality and image URLs; render only the source-visible subset or explicitly marked generated gaps |
| Synthetic readability overlay | clone adds footer/CTA dark veil or gray mask absent from source | remove it unless source evidence shows the overlay in the same timestamp/scroll state |
| Paraphrased copy | "a welcome headline and a tagline" | exact quoted strings incl. punctuation/casing/`<br>` |
| Loose responsiveness | "make it responsive" | `text-5xl sm:text-7xl md:text-8xl`, full sm/md/lg/xl ladder |
| Approximated type | "tight tracking, fluid heading" | `tracking-[-4px]`, `clamp(3rem,12vw,160px)` |
| "A scramble/glass effect" | named effect, no recipe | full component contract / full CSS class with rgba/blur/mask |
| Redrawn logo/icons | "add a logo and a menu icon" | raw SVG `viewBox`+`path d`; `lucide-react Menu/X` |
| Framework freedom | stack not pinned / "use any React setup" | exact `+`-joined stack in sentence one + caret-pinned deps |
| Missing z-order | overlapping layers, no stack | numeric `z-0/z-10/z-50` + DOM-order flow line |
| Unstated defaults | model adds overlay/dimming/extra libs | negative constraints: `No overlay`, `No other UI libraries` |
| Floating dep versions | "install framer-motion" | `framer-motion ^12.40.0` (+ SRI in CDN builds) |
| No guardrail | drift between sections | closing `Key Design Principles` recap + completeness assertion |
