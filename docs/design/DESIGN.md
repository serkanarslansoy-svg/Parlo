---
name: Warm Mediterranean Editorial
colors:
  surface: '#effdf6'
  surface-dim: '#cfddd7'
  surface-bright: '#effdf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e9f7f0'
  surface-container: '#e3f1eb'
  surface-container-high: '#deebe5'
  surface-container-highest: '#d8e6df'
  on-surface: '#121e1a'
  on-surface-variant: '#3e4943'
  inverse-surface: '#27332f'
  inverse-on-surface: '#e6f4ed'
  outline: '#6e7a73'
  outline-variant: '#bdc9c1'
  surface-tint: '#006c4e'
  primary: '#00694c'
  on-primary: '#ffffff'
  primary-container: '#188462'
  on-primary-container: '#f5fff7'
  inverse-primary: '#79d9b1'
  secondary: '#904c2e'
  on-secondary: '#ffffff'
  secondary-container: '#fea682'
  on-secondary-container: '#78391d'
  tertiary: '#755700'
  on-tertiary: '#ffffff'
  tertiary-container: '#917016'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#95f5cc'
  primary-fixed-dim: '#79d9b1'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#00513a'
  secondary-fixed: '#ffdbce'
  secondary-fixed-dim: '#ffb598'
  on-secondary-fixed: '#370e00'
  on-secondary-fixed-variant: '#733519'
  tertiary-fixed: '#ffdf9b'
  tertiary-fixed-dim: '#ebc162'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#effdf6'
  on-background: '#121e1a'
  surface-variant: '#d8e6df'
typography:
  headline-xl:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Epilogue
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: DM Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system crafts an inviting, sophisticated, and culturally attuned sanctuary for Turkish-speaking adults building a life in Italy. The visual narrative combines the tactile, architectural elegance of contemporary Milanese design with warm Mediterranean warmth: sun-bleached terracotta tiles, limestone piazzas, and lush cypress groves. 

Rejecting the patronizing gamification, cartoon owls, and juvenile rewards typical of mass-market language apps, the aesthetic honors the dignity of adult expatriates navigating bureaucracy, civic life, career transitions, and social integration. The interface balances tactile physical metaphors (fine stationery, debossed editorial cards, and subtle warm tints) with fluid, understated conversational AI interactions. The visual atmosphere is calm, welcoming, and reassuringly deliberate—instilling genuine conversational confidence rather than addictive urgency.

## Colors

The palette grounds the interface in sunlit Tuscan mornings and timeless Milanese cafes, anchored against high-legibility surfaces.

- **Primary (`#238B68` - Italian Green):** The commanding focal point for major actions, active conversation states, and success indicators. Evokes classic Italian transit signage and cypress foliage.
- **Secondary (`#D98765` - Terracotta):** Used selectively for warmth, phonetics/pronunciation triggers, secondary badges, contextual cultural notes, and interactive micro-cues.
- **Tertiary / Accent (`#F3C969` - Pastel Sunshine Yellow):** Reserved for vocabulary highlights, contextual hints, saved flashcard tags, and quiet moments of accomplishment.
- **Neutral Dark (`#25312D` - Charcoal Dark Slate):** High-contrast primary typographic tone enriched with subtle botanical undertones to eliminate harsh sterile black.
- **Neutral Muted (`#6E7D77` - Muted Sage / Warm Grey):** Secondary metadata, grammatical categorization, pronunciation transcripts, and Turkish contextual translations.
- **Canvas (`#FAF9F6` - Warm Ivory):** The primary viewport background, preventing screen glare and evoking soft, non-reflective warm Italian paper stock.
- **Elevated Surfaces (`#FFFFFF` & `#F5F3EF`):** Crisp pure white reserved for conversational dialogue bubbles and hero prompt cards; warm cream for grouped exercise structures and ambient backdrops.
- **Subtle Sand (`#E8E4DC`):** Delicate, non-intrusive structural divider line and outline token.

## Typography

The type system blends Mediterranean warmth with razor-sharp editorial discipline.

- **Display & Headline Voice (Epilogue):** Chosen for its sculpted geometric forms, rhythmic editorial presence, and humanist warmth. It delivers authoritative yet warm headers that feel cultured and artisanal.
- **Body & Functional Labels (DM Sans):** Provides neutral, low-contrast, crystal-clear readability across dense dialog scenarios, phonetics, and dual-language instructional copy.

### Bilingual Typographic Hierarchy
To reduce cognitive strain for Turkish learners reading Italian:
- Italian dialogue, vocabulary items, and exercises always render in primary contrast (`#25312D`), either in semibold or italicized when embedded inline.
- Turkish UI labels, explanations, linguistic cues, and cultural hints appear in regular weight (`#6E7D77`), establishing instant visual clarity between target language practice and Turkish native direction.

## Layout & Spacing

Engineered exclusively around an ergonomics-first, mobile-native screen envelope (optimized for standard iPhone widths of 390px–402px) while remaining fluid across varied devices.

- **Canvas Alignment:** 4-column fluid mobile grid anchored by a 20px (`1.25rem`) side margin to protect tap areas along phone boundaries. A 16px (`1rem`) gutter provides breathability between split response chips and audio trigger controls.
- **Vertical Ergonomics:** Spacing rhythm adheres strictly to 4px and 8px baselines. Interactive conversation controls, voice input triggers, and reply buttons are tethered within natural thumb reach in the lower 40% of the screen.
- **Tab Navigation & Safe Areas:** A 64px floating bottom navigation bar hovers above the device's bottom safe zone, maintaining an unobstructed breathing gap of 16px from surrounding UI cards.

## Elevation & Depth

Depth is established through soft, diffused daylight and tonal stratification rather than synthetic digital dropshadows.

- **Canvas & Surface Tiering:** The baseline layer rests on Warm Ivory (`#FAF9F6`). Primary conversational cards and exercise containers elevate via pure crisp white (`#FFFFFF`) with a warm, ambient tint: `box-shadow: 0 4px 20px -2px rgba(37, 49, 45, 0.04), 0 2px 6px -1px rgba(37, 49, 45, 0.02)`.
- **Borders as Architectural Structure:** Flat components employ a 1px solid hairline border in `#E8E4DC` (Subtle Sand), evoking the delicate edges of premium warm stationery.
- **Active Focus & Glass Overlays:** Sticky headers and persistent audio player modules utilize a frosted glass backdrop filter (`backdrop-filter: blur(16px); background: rgba(250, 249, 246, 0.85); border-bottom: 1px solid rgba(232, 228, 220, 0.6)`).
- **Floating Modals & Hint Sheets:** Interactive linguistic hint sheets pull forward using a warmer, deeper ambient wash (`box-shadow: 0 -8px 32px rgba(37, 49, 45, 0.08)`) with zero hard edge lines.

## Shapes

The geometric form language communicates warmth, touch-friendly precision, and organic architecture:

- **Corner Radii:** Standard cards, prompt modules, and conversation blocks use `rounded-md` (8px / `0.5rem`) to `rounded-lg` (16px / `1rem`), maintaining clean structure without appearing cartoonish.
- **Pill Geometry:** Dynamic chips, audio listening triggers, phonetic pills, and primary CTAs use complete pill rounding (`border-radius: 9999px`) to invite confident thumb interaction.
- **Speech Bubbles:** AI conversational interlocutors feature asymmetrical rounding (top-left, top-right, bottom-right at 16px, bottom-left at 4px) to subtly communicate directional speech origin while retaining minimalist geometry.

## Components

### 1. Buttons & Interaction Triggers
- **Primary CTA:** Italian Green (`#238B68`) filled pill, white semibold text, zero harsh shadow, subtle down-press scale transition (`scale(0.98)`). Used for key navigation: "Cümleyi Tamamla" or "Konuşmaya Başla".
- **Secondary Action:** Transparent base, 1.5px border in `#238B68`, Italian Green text.
- **Tertiary Action / Audio Trigger:** Crisp White base, 1px `#E8E4DC` border, Terracotta icon (`#D98765`), offering native audio playback without visual aggression.

### 2. Conversational Chat Bubbles
- **Interlocutor (Italian Native Persona / AI):** Pure Crisp White (`#FFFFFF`) card, 1px `#E8E4DC` border, high-contrast Italian script (`#25312D`), integrated subtle Terracotta speaker glyph to replay audio at natural or slowed cadence.
- **User (Learner Response):** Warm Creams (`#F5F3EF`) with an Italian Green hairline border, right-aligned, displaying speech recognition confirmations or drafted Italian phrases.
- **Inline Translation Peek:** Tap-to-reveal Turkish translation situated directly beneath the target phrase in muted regular type (`#6E7D77`).

### 3. Chips & Phonetic Pills
- **Vocabulary Badges:** Sunshine Yellow tint (`#FDF6E2`) with `#25312D` text, 9999px border radius, used to highlight key CEFR level keywords or grammatical gender (Maschile / Femminile).
- **Filter & Topic Chips:** Warm Ivory background, 1px `#E8E4DC` border; transitions to `#238B68` fill with crisp white text upon selection.

### 4. Interactive Hint Bottom Sheets
- Draggable bottom modal anchored in Pure White with an understated pill grab-handle (`#E8E4DC`).
- Houses deep cultural context written in natural, idiomatically rich Turkish (e.g., explaining the subtle real-life etiquette between *"Vorrei"* and *"Voglio"* at a local bar or post office).

### 5. Cards & Scenario Trackers
- Minimalist, border-grounded tiles featuring real Italian daily scenarios (e.g., *Comune Randevusu*, *Kira Sözleşmesi*, *Pazarda Alışveriş*).
- Clean completion status indicated by a muted Deep Olive indicator ring rather than childish level badges.