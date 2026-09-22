---
version: alpha
name: Techa-Tools-design-analysis
description: A small, single-maintainer utility marketplace built on warm cream paper (#FAF7F1) rather than pure white, running two accents with distinct jobs instead of one brand voltage — Hydrangea Blue (#6E82A6) for trust, navigation and focus, Mood-lamp Amber (#EFB054) for every call-to-action. Headings pair a serif display face (Gowun Batang) against a Pretendard sans body, a craft/workshop pairing rather than a single neutral system font. The site is framework-free static HTML/CSS/JS with no build step, no dark mode, and one soft shadow tier total — every surface either floats or it doesn't. Cards round at 14px, buttons and inputs at 10px, and small pill links and category chips go fully round; there is no fine-grained radius scale, reflecting a handful of tool pages maintained by one person rather than a multi-team design system.

colors:
  blue: "#6E82A6"
  blue-soft: "#eef1f6"
  amber: "#EFB054"
  amber-soft: "#fbeecf"
  amber-cta-ink: "#4a3410"
  amber-strong-ink: "#5c4a1f"
  amber-border: "#f0dca8"
  amber-muted-ink: "#8a7a54"
  green: "#7C8B6F"
  canvas: "#FAF7F1"
  surface-card: "#fffdf9"
  ink: "#3A322B"
  body-text: "#4a4137"
  muted: "#857c70"
  muted-soft: "#a89e8f"
  hairline: "#e7e1d6"
  on-accent: "#ffffff"

typography:
  display-hero:
    fontFamily: "'Gowun Batang', 'Pretendard', serif"
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  display-page:
    fontFamily: "'Gowun Batang', 'Pretendard', serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  display-result:
    fontFamily: "'Gowun Batang', 'Pretendard', serif"
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  heading-section:
    fontFamily: "'Gowun Batang', 'Pretendard', serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0
  heading-sub:
    fontFamily: "'Gowun Batang', 'Pretendard', serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0
  logo:
    fontFamily: "'Gowun Batang', 'Pretendard', serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  lead:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-md:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  body-article:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: 0
  nav-link:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  breadcrumb:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  field-label:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  hint:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  button-md:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  button-sm:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0
  card-title:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  caption:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  micro:
    fontFamily: "'Pretendard', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0

rounded:
  sm: 10px
  md: 12px
  lg: 14px
  pill: 20px
  full: 9999px

spacing:
  xxs: 4px
  xs: 6px
  sm: 8px
  md: 10px
  base: 12px
  lg: 16px
  xl: 18px
  xxl: 22px
  xxxl: 26px
  section: 40px

components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-cta-ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 12px 20px
  button-ghost:
    backgroundColor: "{colors.blue-soft}"
    textColor: "{colors.blue}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: 12px 20px
  button-sm:
    typography: "{typography.button-sm}"
    rounded: "{rounded.sm}"
    padding: 8px 14px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px 14px
    borderColor: "{colors.hairline}"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 22px
    shadow: "{elevation.soft}"
  result-box:
    backgroundColor: "{colors.blue-soft}"
    textColor: "{colors.blue}"
    typography: "{typography.display-result}"
    rounded: "{rounded.md}"
    padding: 20px
  chip-number:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.full}"
    size: 46px
  chip-bonus:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-cta-ink}"
    rounded: "{rounded.full}"
    size: 46px
  chip-filter:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 6px 13px
  chip-filter-active:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
  flip-card:
    backgroundColor: "{colors.blue-soft}"
    backgroundColorBack: "{colors.amber-soft}"
    rounded: "{rounded.md}"
    padding: 20px
  app-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.lg}"
    padding: 16px
    shadow: "{elevation.soft}"
  related-pill:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 7px 14px
  ad-slot:
    backgroundColor: "#fbf9f4"
    textColor: "#b6ac9c"
    typography: "{typography.micro}"
    rounded: "{rounded.sm}"
    border: "1px dashed #d8d0c2"
  note-callout:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-strong-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 12px 16px
  shop-cta:
    backgroundColor: "{colors.amber-soft}"
    textColor: "{colors.amber-strong-ink}"
    rounded: "{rounded.md}"
    padding: 18px 20px
    border: "1px solid {colors.amber-border}"
  site-header:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    height: 60px
    border: "1px solid {colors.hairline}"
  site-footer:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
    padding: 24px 0
---

> ⛔ **폐기 (2026-09-22)** — 생활 도구 사이트 시절의 분석이다. 파랑·호박색 강조색, 알약 버튼, 3단 대시보드는
> 꽃공방 브랜드와 맞지 않아 메인 개편의 원인이 됐다. 새 규칙은 **`docs/DESIGN-kkotgongbang.md`**, 색 값은
> `techa-brand-rules.md` §3 을 따른다. 이 파일은 기록으로만 남긴다.

## Overview

Techa Tools (테차 툴즈) is a free Korean utility marketplace — calculators, date tools, and small "fun/random" toys (lottery number generator, ladder game, dad-joke draw, menu roulette) — built as **framework-free static HTML/CSS/JS** with no build step, no bundler, and no client-side router. Every page is a self-contained `.html` file that pulls in one shared stylesheet and one shared script for header/footer/related-links wiring. Where Airbnb's system is built to scale across dozens of product teams, Techa's is built to be edited by one person in a text editor, and that constraint shows up everywhere in the visual language: fewer tokens, fewer states, one shadow tier, no dark mode.

The base canvas is **not pure white** — it's a warm cream paper (`{colors.canvas}` — #FAF7F1), with card surfaces sitting one shade warmer still (`{colors.surface-card}` — #fffdf9, an off-white "warm ivory" rather than #ffffff). Text runs in a soft near-black brown (`{colors.ink}` — #3A322B) rather than true black or Airbnb's cool #222222 grey — the whole palette leans warm, which the CSS source itself names explicitly: *수국 블루 (Hydrangea Blue) · 무드등 앰버 (Mood-lamp Amber) · 크림 페이퍼 (Cream Paper) · 공방 브라운 (Workshop Brown) · 잎사귀 그린 (Leaf Green)*.

Unlike Airbnb's single-voltage accent system (one red carrying every CTA, badge, and brand moment), Techa deliberately runs **two accents with separate jobs**: Hydrangea Blue (`{colors.blue}` — #6E82A6) is the *trust* color — logo mark, links, focus rings, number chips, result displays; Mood-lamp Amber (`{colors.amber}` — #EFB054) is the *action* color — reserved almost entirely for primary buttons, bonus chips, and callout boxes. A visitor never sees amber except where they're meant to click or where the system wants to draw the eye to a highlighted result.

Typography also splits along a line Airbnb doesn't: headings (from the hero H1 down to in-article H2/H3) render in **Gowun Batang**, a Korean serif, while all running text, buttons, labels, and UI chrome render in **Pretendard**, a Korean sans. This serif/sans pairing is a small but real point of character — it reads closer to an independent print zine or a neighborhood workshop sign than to a neutral SaaS system, which fits the "공방(workshop)" naming in the brand palette.

**Key Characteristics:**
- Two-role accent system: `{colors.blue}` for trust/navigation/read-only results, `{colors.amber}` for action — never mixed on the same element.
- Serif/sans display pairing: Gowun Batang for every heading level, Pretendard for everything else — a single rule applied globally via `h1, h2, h3, .serif`.
- Warm off-white card surface (`{colors.surface-card}` — #fffdf9) floating on warm cream canvas (`{colors.canvas}` — #FAF7F1) — never pure white-on-white.
- One shadow tier total (`{elevation.soft}`), applied to cards at rest and slightly deepened on `.app-card:hover` — no progressive elevation scale, no modal/scrim layer (the site has no modals).
- A coarse, five-step radius scale (10 / 12 / 14 / 20 / full) rather than a fine-grained one — cards, buttons and inputs each get exactly one radius value, with no intermediate steps.
- `{component.ad-slot}` — a dashed, muted placeholder box reserved for AdSense units. This component has no Airbnb equivalent; it exists because the site is ad-monetized and every tool page budgets visual space for it up front rather than inserting ads after the fact.
- Long-form FAQ/"how this works" article sections ship on *every* tool page (SEO-driven), set at a generous 1.65 line-height — the system optimizes for a visitor reading two or three paragraphs of explanation, not for marketplace card density.
- No dark mode, no login/account surfaces, no map or gallery components — the site's entire surface area is single-purpose utility pages plus a home grid.

## Colors

### Brand & Accent
- **Hydrangea Blue** (`{colors.blue}` — #6E82A6): The trust/navigation accent. Logo "차" mark, links, focus ring, result-display numbers, chip backgrounds, and the PWA `theme_color`. Never used for a button fill.
- **Hydrangea Blue Soft** (`{colors.blue-soft}` — #eef1f6): Tint used behind result boxes and as the `button-ghost` fill.
- **Mood-lamp Amber** (`{colors.amber}` — #EFB054): The action accent. Every primary CTA (`{component.button-primary}`), the lottery bonus-number chip, and highlighted callouts. Paired with a dark amber ink (`{colors.amber-cta-ink}` — #4a3410) for text-on-amber, never white.
- **Mood-lamp Amber Soft** (`{colors.amber-soft}` — #fbeecf): Tint used for note callouts, the section-heading underline rule, and the shop cross-sell box.
- **Leaf Green** (`{colors.green}` — #7C8B6F): Reserved as the "confirmed state" token in the source CSS but not yet wired into any shipped component — the system's equivalent of Airbnb's Luxe/Plus sub-brand accents: named and tokenized, not yet in production use.

### Surface
- **Canvas** (`{colors.canvas}` — #FAF7F1): The page floor on every page, and the PWA `background_color`. Warm cream, not white.
- **Surface Card** (`{colors.surface-card}` — #fffdf9): Card, header, and footer surface. One shade warmer than pure white — the palette never touches #ffffff.

### Hairlines
- **Hairline** (`{colors.hairline}` — #e7e1d6): The single border tone in the system — card borders, header bottom rule, form input outlines, footer top rule. There is no second, lighter hairline tier the way Airbnb splits `hairline` / `hairline-soft`.

### Text
- **Ink** (`{colors.ink}` — #3A322B): Primary text — body copy default, headings, card titles.
- **Body Text** (`{colors.body-text}` — #4a4137): A very slightly lighter running-text tone used specifically inside `.article p` / `.article li` — the long-form FAQ copy — so dense explanatory paragraphs read a touch softer than headings and UI labels.
- **Muted** (`{colors.muted}` — #857c70): Secondary text — nav links, breadcrumbs, hints, card descriptions, footer links.
- **Muted Soft** (`{colors.muted-soft}` — #a89e8f): The lightest text tone, used once, for the footer disclaimer line.
- **On Accent** (`{colors.on-accent}` — #ffffff): White text/icon fill on the blue number-chip and blue ghost-button hover states.

### Semantic (amber sub-tones)
- **Amber CTA Ink** (`{colors.amber-cta-ink}` — #4a3410): Text on amber buttons and the bonus-number chip.
- **Amber Strong Ink** (`{colors.amber-strong-ink}` — #5c4a1f): Text inside amber-tinted callout boxes (note, shop CTA) — darker than the CTA ink for readability on the lighter `{colors.amber-soft}` background.
- **Amber Border** (`{colors.amber-border}` — #f0dca8): Border on the shop cross-sell box.
- **Amber Muted Ink** (`{colors.amber-muted-ink}` — #8a7a54): The "coming soon" sub-line inside the shop CTA when no shop URL is configured — a rare example of a documented disabled/placeholder text state.

There is no dedicated error/validation color in the system yet — form inputs have no failure state defined, which is listed under Known Gaps below.

## Typography

### Font Family
Two families carry the whole system, split by role rather than by size the way a single-family system like Airbnb's would be:
- **Gowun Batang** (Korean serif) — every heading level, the logo wordmark, and result/display numbers. Falls back to `Pretendard, serif`.
- **Pretendard** (Korean sans, loaded from a CDN) — body copy, buttons, labels, navigation, captions. Falls back to `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`.

The base body size is 16px at a generous **1.65 line-height** — noticeably looser than Airbnb's 1.5, because most pages carry two or three paragraphs of plain-language explanation beneath the tool itself (a "how to use this" section, an FAQ, sometimes a short educational aside) and the system prioritizes that copy being easy to read over content density.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display-hero}` | 34px | 700 | 1.3 | Home hero H1 ("테차 툴즈") |
| `{typography.display-result}` | 34px | 700 | 1.2 | Big result number/word (`.result .big`) — lottery numbers, D-Day count, calculator output |
| `{typography.display-page}` | 28px | 700 | 1.3 | Per-tool page H1 (breadcrumb + title block) |
| `{typography.heading-section}` | 20px | 700 | 1.35 | Article section heads ("사용법", "자주 묻는 질문") |
| `{typography.logo}` | 20px | 700 | 1.2 | Header wordmark |
| `{typography.heading-sub}` | 16px | 700 | 1.35 | Article sub-heads |
| `{typography.body-md}` | 16px | 400 | 1.65 | Base body copy |
| `{typography.lead}` | 15px | 400 | 1.5 | Page-head lead paragraph under the H1 |
| `{typography.body-article}` | 15px | 400 | 1.65 | Long-form article/FAQ paragraphs |
| `{typography.card-title}` | 15px | 700 | 1.3 | Home grid tool-card name |
| `{typography.button-md}` | 15px | 700 | 1.2 | Primary/ghost button labels |
| `{typography.field-label}` | 14px | 600 | 1.3 | Form field labels |
| `{typography.nav-link}` | 14px | 400 | 1.4 | Header nav, note/callout text |
| `{typography.button-sm}` | 13px | 700 | 1.2 | Small buttons (copy, retry) |
| `{typography.breadcrumb}` | 13px | 400 | 1.4 | Breadcrumb trail |
| `{typography.caption}` | 13px | 400 | 1.4 | Card descriptions, footer links, chip-filter labels |
| `{typography.hint}` | 12px | 400 | 1.3 | Field hints, disclaimer |
| `{typography.micro}` | 12px | 400 | 1.3 | Ad-slot placeholder label |

### Principles
Where Airbnb reserves its single loud typographic moment (64px rating display) for a trust signal, Techa's loudest moment — `{typography.display-result}` at 34px/700 in Hydrangea Blue serif — is reused across *every* tool as the answer itself: a lottery number set, a D-Day countdown, a calculated total. It's the one place every page agrees to be visually loud, because for a utility site the computed answer *is* the product.

Headings never appear in the sans body face, and body copy never appears in the serif — the split is a hard rule (`h1, h2, h3, .serif { font-family: Gowun Batang… }`) rather than a per-component choice, which keeps a small, single-maintainer codebase consistent without a component library enforcing it.

### Note on Font Substitutes
Gowun Batang and Pretendard are both open, freely-licensed Korean webfonts (unlike Airbnb Cereal, which is proprietary) — there is no substitution concern; both load directly from Google Fonts / jsDelivr CDN with no self-hosting or licensing step required.

## Layout

### Spacing System
- **Base unit:** roughly 2px, but expressed as an organic, hand-picked set of values rather than a strict 4/8pt grid — a smaller reflection of the site's single-maintainer, no-design-tool workflow.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 6px · `{spacing.sm}` 8px · `{spacing.md}` 10px · `{spacing.base}` 12px · `{spacing.lg}` 16px · `{spacing.xl}` 18px · `{spacing.xxl}` 22px · `{spacing.xxxl}` 26px · `{spacing.section}` 40px.
- **Card padding:** `{spacing.xxl}` (22px) for the main tool `.card`; `{spacing.xxxl}` (26px, roughly) for the shop cross-sell box.
- **Page container:** capped at `{layout.maxw}` 760px, centered, with 18px horizontal padding — noticeably narrower than Airbnb's ~1280px, because there's no multi-column marketplace grid to fill; every tool is a single centered form-and-result column.
- **Home grid gutters:** 12px between tool cards (`.grid` uses `repeat(auto-fill, minmax(200px, 1fr))`), collapsing to as many columns as fit rather than snapping to fixed breakpoint counts.

### Grid & Container
- **Max content width:** 760px on every page — tool pages, the home hub, and article/FAQ content all share the same single-column container. There is no separate wider "marketplace" container the way Airbnb splits homepage (1280px) from listing detail (1080px).
- **Home hub:** one long scroll of category sections (`{component.app-card}` grids, one per `{cat}` key — 날짜·시간, 계산·변환, 금융·재테크, 건강, 운세·감성, 텍스트 도구, 재미·추첨, 생활), each headed by an emoji + Korean title.
- **Tool page:** vertically stacked — breadcrumb, H1 + lead, ad slot, the tool `.card` itself, a second ad slot, the FAQ article, then a "related tools" pill row. No sidebar, no sticky rail.

### Whitespace Philosophy
Where Airbnb contrasts an airy hero against a dense card grid, Techa is uniformly moderate — no section pushes past `{spacing.section}` (40px) of vertical breathing room, and the single-column layout means there's no card-density trade-off to manage. The effect is closer to a well-set blog post or a workshop's product sheet than a marketplace: one thing at a time, explained, then the next tool linked at the bottom.

## Elevation

The system has exactly **one shadow tier**, applied even more sparingly than Airbnb's:

- **Flat (no shadow):** header, footer, page background, article text, ad-slot placeholder — the large majority of the page.
- **Soft card float** (`{elevation.soft}` — `0 2px 14px rgba(58, 50, 43, 0.07)`): applied at rest to every `.card` and `.app-card`, and deepened further on `.app-card:hover` (`0 6px 18px rgba(58,50,43,.1)` plus a 2px lift) — the only documented hover state in the system. Techa documents this hover explicitly, where the Airbnb source notes hover states as "intentionally not documented."
- **No scrim, no modal layer:** the site has no dialogs, drawers, or overlays of any kind — every interaction happens inline on the page (a card flips, a result updates, a button relabels itself briefly on copy).

## Components

### Buttons
**`button-primary`** — Amber fill, dark amber-ink text (never white), 10px radius, 15px/700 label. The only button style used for the primary action on a page: "번호 뽑기", "돌리기", "테스트 시작".

**`button-ghost`** — Blue-soft fill, blue text, same radius/type scale. Used for secondary actions: "전체 복사", tab-switch buttons in their inactive state.

**`button-sm`** — Either primary or ghost coloring at a smaller 13px/700 size and tighter padding — copy buttons, retry buttons, quiz self-score buttons.

### Form Controls
**`text-input`** — Cream canvas fill (not white — inputs sit slightly recessed relative to the white card around them), 1px hairline border, 10px radius. On focus, the border flips to blue with a soft `0 0 0 3px {colors.blue-soft}` ring — the system's only focus treatment, and its only glow/ring effect anywhere.

### Result & Chip Display
**`result-box`** — Blue-soft background, the big serif blue number/word (`{typography.display-result}`) centered, with a smaller muted sub-line beneath. This is the component every tool converges on: the "answer" surface.

**`chip-number` / `chip-bonus`** — 46px circular chips (lottery numbers). Default chips are blue-filled with white text; the bonus-number chip flips to amber-filled with amber-cta-ink text — the two accent colors sitting side by side is the one place in the system they're allowed to touch directly.

**`chip-filter`** — Pill-shaped (20px radius) topic/category toggle buttons (dad-joke topic filter, menu-roulette category strip). Inactive state is a bordered white pill with ink text; active state fills solid blue with white text — a simpler two-state version of Airbnb's `category-tab-active` underline treatment.

### Cards
**`card`** — The generic tool container: warm-white surface, 14px radius, one soft shadow, 22px padding. Every tool's form controls and result live inside exactly one of these per page.

**`app-card`** — Home-grid tool card: emoji, bold 15px title, 13px muted description, same 14px radius and shadow as `card`, with the deepened hover-lift state. A `.soon` variant dims to 55% opacity and disables pointer events for tools not yet shipped, appending a "· 준비중" (in progress) label to the description in amber.

**`flip-card`** *(dad-joke tool)* — A signature interactive component, absent from the base style sheet's original scope but built on the same tokens: a 3D-flip card (CSS `perspective` + `rotateY(180deg)`) with a blue-soft question face and an amber-soft answer face. It's the system's playful counterpart to `result-box` — instead of a computed answer appearing instantly, the user taps to reveal it.

### Navigation & Chrome
**`site-header`** — White-ish card surface, sticky, 60px height, 1px bottom hairline. Wordmark left ("테<b>차</b> 툴즈", with "차" in blue), a single "전체 도구" nav link right — far simpler than Airbnb's three-product tab nav, because the site has one product surface (the tool grid), not several.

**`breadcrumb`** — Muted 13px trail (홈 › category › tool name) sitting just above the page H1.

**`related-pill`** — White pill-bordered links (20px radius) listing 2–3 related tools at the bottom of every tool page — the system's internal-linking/SEO backbone, functionally similar to Airbnb's footer link columns but rendered as inline pills rather than a list.

### Content
**`note-callout`** — Amber-soft box, amber-strong-ink text, 10px radius — used for one-line caveats ("본 도구는 재미 목적입니다", "당첨을 보장하지 않습니다").

**`shop-cta`** *(`#techa-cta`)* — A cross-sell box injected on select pages (e.g. birth-flower, birth-stone) linking to the site owner's external gift shop. Amber-soft with a bordered edge and a small primary button — the one place the static-site "product" reaches outside the tool set itself.

**`ad-slot`** — A dashed, muted placeholder box reserved for AdSense units, present on nearly every tool page (usually twice: above and below the tool card). Unstyled beyond a border and centered micro-label until an ad network is approved and wired in.

## Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 520px | Hero H1 drops 34px → 27px; result display drops 34px → 28px; page H1 drops 28px → 24px. Home grid and form `.row` groups collapse to single column via `flex-wrap`. |
| Desktop | ≥ 520px | Full type scale; home grid auto-fills as many 200px-minimum columns as the 760px container allows (typically 3); form `.row` groups lay out side by side. |

There is no dedicated tablet breakpoint or wide (>1440px) tier — the 760px container cap means the layout is effectively "mobile" or "one fixed-width column," with a single type-scale breakpoint handling the difference.

### Touch Targets
- Primary/ghost buttons: 40–48px effective height depending on padding — meets standard touch guidance but isn't held to a strict 48px minimum the way Airbnb documents.
- Number/bonus chips: 46px circular — comfortably tappable though chips are display elements, not inputs.
- Chip-filter pills and related-tool pills: roughly 32–36px effective height — the smallest tap targets in the system, acceptable given they're secondary/optional controls.

### Collapsing Strategy
- Single breakpoint at 520px — below it, type scales down and flex rows wrap; above it, nothing further changes up to very large screens (no wide-format layout was designed, since the 760px container never grows).
- The home grid relies on CSS `auto-fill`/`minmax` rather than explicit per-breakpoint column counts — it always fits as many 200px cards as the container allows, with no JavaScript involved.

## Known Gaps

- **Dark mode:** not implemented. `prefers-color-scheme` is not referenced anywhere in the stylesheet — this is a scope decision for a small static site, not an oversight to extract around.
- **Form validation/error states:** no error color, no invalid-input outline, no helper-text-on-failure pattern exists yet in any shipped tool.
- **Loading/skeleton states:** limited to plain "불러오는 중…" (loading…) text where a page fetches JSON data (e.g. the dad-joke and menu-roulette tools) — no skeleton shimmer or placeholder shapes.
- **Modal/dialog styling:** undefined — the site has no dialogs, drawers, or overlays of any kind, so there's no scrim token or modal surface to document.
- **Leaf Green (`{colors.green}`):** named and tokenized in source as the "confirmed state" color but not wired into any component yet — the system's equivalent of a reserved-but-unused sub-brand accent.
- **Analytics/consent UI:** a GA4 scaffold exists in the shared script but renders no visible UI element — no cookie-consent banner or privacy-preferences surface is styled.
