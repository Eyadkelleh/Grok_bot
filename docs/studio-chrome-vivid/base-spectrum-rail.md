# Aura Spectrum Rail

## 1. Design thesis

The bot's colour becomes the studio's wayfinding system. A slim chromatic rail runs beneath Shape, Face, Aura, and Motion. The selected verb is marked by a traveling bead and a short luminous band tinted from the committed bot colour. No pill border pretends that hover and selection are the same state.

The rail is one visual system across Stage, top navigation, and Settings. It stays vivid without colouring the stage well, export matte, or every control.

## 2. Stage verbs

### Form

The four verbs sit as plain text landmarks above one continuous rail:

`Shape — Face — Aura — Motion`

Each landmark has a fixed quarter of the rail. The rail uses a low-chroma spectrum derived from the twelve `COLORS` values, blended into a continuous gradient. It is not a hue wheel: the source stops are the product's actual bot colours.

The committed bot hex drives `--bot-accent`. A bead sits under the open verb:

- **Open:** solid luminous bead, 8 px core, 22 px soft bloom, plus a 44–64 px accent band in the direction of travel.
- **Hover:** a small neutral tick appears under the hovered verb. The bead does not move.
- **Focus:** a two-line focus marker straddles the rail and uses `--ink` for reliable contrast.
- **Idle:** text uses `--muted`; the rail remains visible at low opacity.
- **Closed:** no bead. The rail keeps a faint, centred accent glint to connect it to the bot colour without implying an open panel.

The bead animates along the rail when the user switches verbs. It stretches into a soft comet while moving, then settles into a circle. Under reduced motion, it jumps with no stretch or glow animation.

### Interaction

The toolbar keeps `role="toolbar"`. Each button keeps `aria-pressed` and its existing `data-mode`:

- Shape → `shape`
- Face → `expression`
- Aura → `colour`
- Motion → `state`

Clicking the open verb closes it. Opening or switching a verb clears hover preview. Arrow Left/Right moves focus among verbs; Enter or Space toggles the focused verb. This keyboard layer belongs in Stage because it owns the toolbar state.

Picker content opens below the rail in a stable **selection shelf** that overlaps neither the avatar nor the verb band. Desktop uses a shallow arc of tiles around the lower edge of the hero; narrow screens use a horizontal snap strip. Aura follows the same shelf geometry as the other verbs instead of opening a separate floating panel.

The shelf header uses the verb label, so Aura never leaks the internal name “Colour.” Tiles keep their radiogroup roles, roving tabindex, and existing data attributes. Closed, always-mounted pickers receive `inert` and `aria-hidden="true"`; the open picker receives neither.

### Preview and commit

Visual polish must not flatten state:

- Tile selection reads committed `config`.
- The avatar reads resolved `frame`.
- Pointer preview writes only `peek`.
- Leaving the shelf clears `peek`.
- Colour tiles gain the same hover preview path as shape, expression, and motion.
- Pose preview remains disabled during playback.
- Only a pose commit pauses playback.
- Shape, face, and aura commits keep playback running.

The bead colour reads the committed colour, not the preview colour. This avoids a flickering navigation anchor while the avatar previews swatches.

## 3. App top navigation

Rollup, Settings, and About become a sparse **accent trace nav**. Text sits above a 1 px baseline. The active section gets a short `--bot-accent` trace and a 4 px bead, echoing the Stage rail at smaller scale. Hover draws a neutral tick; focus uses an ink outline offset from the text.

An IntersectionObserver may set `aria-current="location"` and the active trace. It is display state only. Nav clicks still call `scrollIntoView`, retain `@click.prevent`, and never write `location.hash`; pose share links remain the fragment owner.

`OutputDock` stays a separate desk switch. A hairline gap and label grouping prevent the section nav from reading as Image/Video peers. It may consume `--bot-accent` for the existing file-icon tint, but it does not own the accent.

## 4. Settings

### Theme

Theme choices become three soft tinted wells, not pills:

- **Light:** warm paper well with a small white canvas sample.
- **Dark:** charcoal well with a warm dark canvas sample.
- **System:** split dawn/dusk well with a small system glyph.

The selected well uses an inner accent wash and one luminous corner bead. Hover raises the sample by 1 px; focus adds an ink ring. The group keeps `role="radiogroup"`, radios keep `data-theme-choice`, `aria-checked`, and roving tabindex. Arrow keys wrap and select.

The wells preview chrome only in their miniature samples. They never recolour the real pinned stage well.

### Language

English leads as a full-width primary row: `English · Default interface language`. A compact `Other languages` disclosure nests Français and 简体中文. Stored or browser-detected non-English remains selected and visible in the disclosure summary; the design does not force English over valid locale detection.

Every locale remains a radio with `data-locale`, `aria-checked`, and roving tabindex. The nested list preserves arrow-key navigation across all language radios. “English-first” is visual hierarchy and copy order, not a change to locale resolution or persistence.

### GitHub

GitHub is a single quiet repository card at the end of About: icon, `View source on GitHub`, and an external-link mark. Its leading rule uses `--bot-accent`; the body stays neutral. This prevents a second heavy CTA from competing with export.

## 5. Colour and token model

Add a small chrome token surface:

```css
--bot-accent: #0a0a0c;
--bot-accent-rgb: 10 10 12;
--accent-contrast: #ffffff;
--accent-soft: color-mix(in srgb, var(--bot-accent) 14%, var(--paper));
--accent-glow: color-mix(in srgb, var(--bot-accent) 42%, transparent);
--spectrum: linear-gradient(90deg, /* ordered COLORS stops */);
```

`--bot-accent` comes from `COLOR_BY_ID` for catalogue colours and accepts resolved custom hex values. A single accent resolver returns safe CSS values and contrast metadata. App owns the resolved accent and exposes tokens on the studio shell. Stage, nav, Settings, and OutputDock consume tokens directly.

Do not add wrapper components whose only job is to forward the hex. Do not copy colour resolution into each component. Do not create separate modules for bead position, rail animation, or theme-well paint: these are local presentation details.

Dark or near-black accents need a visible glow against dark chrome. The resolver supplies contrast and a minimum-luminance display tint for chrome only; it never alters the bot's rendered colour.

## 6. Ownership and interface depth

Keep the public surface small:

1. `chromeAccent.ts` owns colour validation, RGB conversion, contrast choice, and CSS token creation.
2. `App.vue` resolves the committed desk colour once and applies the token map to the shell.
3. `Stage.vue` owns verb geometry, toolbar keyboard behaviour, bead position, and picker visibility.
4. `Settings.vue` owns theme and locale interactions.
5. `main.css` owns shared chrome tokens and theme-neutral rail primitives.

Avoid temporal decomposition such as `beginMove()`, `updateMove()`, and `finishMove()`. CSS transitions derive from the current and previous selected index; Stage stores only the open band already required by product state.

Avoid information leakage. Components receive an accent token set, not `COLORS`, desk internals, or theme persistence APIs. Settings calls the existing theme and locale owners directly. Stage calls the desk's existing preview, commit, and open-band operations directly.

## 7. Responsive behaviour

- **≥ 900 px:** four evenly spaced landmarks; shelf follows the hero's lower arc.
- **640–899 px:** flat two-row shelf under the rail; verb labels remain one row.
- **< 640 px:** rail stays full width; labels use 13–14 px type; picker becomes a horizontal snap strip with edge fades.
- The bead position uses logical inline coordinates, so RTL support can mirror later without rewriting geometry.
- Minimum hit area is 44 × 44 px even though the visible verb is plain text.
- The picker never overlays the verb band or blocks the avatar's empty areas.

## 8. Accessibility and motion

- Preserve all required toolbar, radiogroup, radio, and pressed/checked semantics.
- Add `inert` and `aria-hidden` to closed picker regions.
- Announce no decorative bead movement; the bead is `aria-hidden`.
- Keep text contrast independent of accent colour.
- Use accent as a redundant position cue, never the only state cue.
- Under `prefers-reduced-motion`, remove travel, stretch, lift, and glow pulse; keep state changes immediate.
- Under increased contrast, replace glow with a solid marker and stronger neutral rail.

## 9. Grounding invariants

The redesign does not touch:

- `--stage`, `--stage-ink`, or `--stage-muted`, including their single non-themed declaration.
- The always-light `#f5f5f4` stage well.
- `BLANC = '#ffffff'` or any export-path paint.
- Engine IDs, hex values, parity budgets, or required test hooks.
- `Stage` keyed by focused desk or `attachStage` resolution.
- Desk-local, in-memory open-panel state.
- Preview/config/frame separation.
- Playback rules for pose preview and commits.
- Nav fragment ownership.
- Existing theme and language persistence rules.
- i18n key parity across English, French, and Chinese.

## 10. Why this direction wins

The rail makes four controls feel like one instrument without turning them into another segmented pill bar. The bot colour guides the eye across the studio, but committed state remains stable during preview. One accent resolver and local component behaviour keep the architecture as disciplined as the visual system.
