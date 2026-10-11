# Grok_bot studio chrome: menus, buttons, theme, and the colour system

## Overview

The studio has exactly **three** independent pieces of chrome, and confusing them is the main hazard in a redesign:

1. **The verb band** (`Shape` / `Face` / `Aura` / `Motion`) — four toggle buttons inside `Stage.vue` that open one of two always-mounted picker panels. Per-desk, in-memory only, never persisted, never in the URL.
2. **The top nav** (`Rollup` / `Settings` / `About`) — three anchors in `App.vue` that do nothing but `scrollIntoView`. There is no modal, drawer, or open/close state anywhere in Settings. Sitting next to them in the same `<header>` is a *different* nav, `OutputDock`, which owns the Image/Video desk switch and `?desk=`.
3. **The paint layer** — six themed CSS custom properties in `src/assets/main.css`, plus three deliberately *un-themed* stage tokens. There is no `--accent`, no `--brand`, no Tailwind, no colour library. Selection is expressed as "ink border + paper fill" everywhere; the primary CTA is an ink/paper inversion. The only chromatic palette in the codebase is `COLORS` in `src/engine/skins.ts` — the bot's body colours — and chrome borrows from it in exactly one place (the OutputDock file-icon tint).

The redesign surface is large because chrome is almost entirely monochrome stone and almost entirely local to five files. The redesign *risk* is narrow and concentrated: the stage well and the delivery matte must not follow the theme, and one test reads `main.css` from disk to enforce that structurally.

## Key Concepts

**Desk.** A `desk` is one document: a look, a pose, an artifact pipeline, and (video only) a montage plus transport. There are exactly two, `image` and `video` (`DeskKind`), created by `createDesk` in `src/studio/desk.ts`. Each holds its *own* `openPanel`, `peek`, and `look`. `App.vue` renders one `Stage` keyed by `focus`, so switching desks remounts the stage and re-attaches the export SVG.

**Band.** `PickerBand = 'shape' | 'expression' | 'colour' | 'pose' | null` (`src/studio/types.ts:37`). One band open at a time, per desk. This is *not* persisted (`StudioDoc` has no band field) and *not* in the URL (`location.ts` carries focus, pose, playing).

**Three names for the same thing.** This trips up every grep:

| Visible label | `data-mode` attribute | `PickerBand` value | Opens |
|---|---|---|---|
| Shape | `shape` | `'shape'` | `CustomisePanel` shapes, as an orbital ring |
| Face | `expression` | `'expression'` | `CustomisePanel` expressions, orbital ring |
| Aura | `colour` | `'colour'` | `CustomisePanel` colour swatches, **as a floating panel, not a ring** |
| Motion | `state` | `'pose'` | `AnimationsPalette`, orbital ring |

`data-mode="state"` vs band `'pose'` is the sharpest edge. Test selectors use `data-mode`, so they read `shape|expression|colour|state`.

**Facet.** `LookFacet` is one picker interaction *and* the unit of hover preview: `{ field: 'shape' | 'colour' | 'expression' | 'banner' | 'pose', value }`.

**Peek vs config vs frame.** Three distinct states, and the split is the reason hover preview works without dirtying the document:
- `config` — the committed truth. **Pickers bind to this**, so `.selected` / `aria-checked` never lie.
- `peek` — one optional `LookFacet`, the hover preview.
- `frame` (`DeskFrame`) — a computed that folds peek and the playback playhead into a fully-resolved render spec. **The hero avatar binds to this.** `Stage.vue` derives nothing itself.

**Theme choice vs resolved theme.** `ThemeChoice = 'light' | 'dark' | 'system'` is persisted; `Theme = 'light' | 'dark'` is derived. `'system'` never lands on the DOM — `applyChrome` only ever writes `light` or `dark` to `document.documentElement.dataset.theme`.

**Two "ink"s and three "paper"s.** Chrome `--ink` is `#1c1917`/`#f5f5f4`; the bot's `ink` colour is `#0a0a0c`. CSS `--paper` is themed (`#ffffff`/`#211d1a`); `DEFAULT_PAPER` / `--stage` is pinned `#f5f5f4`; the export matte `BLANC` is `#ffffff`. Any redesign that "unifies the whites" will break eye cut-outs or exports.

## How It Works

### Verb band → preview → commit

`Stage.vue` renders four buttons in a `role="toolbar"` (`.verbs`, ~197–234). Each carries `data-mode`, `:aria-pressed="band === …"`, `:class="{ on: … }"`, and `@click="setField(…)"`. `setField` delegates straight to the desk:

```207:210:src/studio/desk.ts
    openBand(next: PickerBand) {
      peek.value = null
      openPanel.value = openPanel.value === next ? null : next
    },
```

Two consequences: clicking the open verb **closes** it (toggle, not radio), and opening or switching a band **clears any hover preview**.

Both picker panels stay mounted at all times. Opening a band only flips classes; `.field` closed state is `opacity: 0; pointer-events: none`. `appearanceOpen` is true for shape/expression/colour and drives `.open`; `orbital` is added only for shape/expression; `.skins` / `.faces` select which group is visible. Motion gets `.open.orbital.orbits` when `band === 'pose'`.

Hover preview is a single delegated `@pointerover` on the open field. `onChooserPointer` (`Stage.vue:113–130`) walks `closest('[data-shape]' | '[data-expression]' | '[data-state]')`, validates the id with the engine's type guard, and calls `desk.preview(facet)`. `@pointerleave` calls `preview(null)`.

Commit goes through a `facet()` writable computed whose getter reads `config` and whose setter calls `desk.commit`:

```49:60:src/components/Stage.vue
/** Pickers show the committed value; the hero shows the preview. */
function facet<T>(read: () => T, field: LookFacet['field']): WritableComputedRef<T> {
  return computed({
    get: read,
    set: (value) => props.desk.commit({ field, value } as LookFacet),
  })
}
```

```mermaid
flowchart TD
  V["`.verbs` button<br/>data-mode, aria-pressed"] -->|click| OB["desk.openBand(next)<br/>toggle · clears peek"]
  OB --> BAND["openPanel ref<br/>per desk, in-memory"]
  BAND --> CLS["Stage classes<br/>.open / .orbital / .skins / .faces / .orbits"]
  CLS --> P["CustomisePanel + AnimationsPalette<br/>always mounted"]

  P -->|"pointerover [data-shape|expression|state]"| PV["desk.preview(facet)<br/>ignored for pose while playing"]
  PV --> PEEK["peek ref"]
  P -->|"click (v-model)"| CM["desk.commit(facet)<br/>clears peek · pauses transport if pose+video"]
  CM --> CFG["config (persisted StudioDoc)"]

  PEEK --> FR["frame = computed<br/>peek ∪ playhead ∪ config"]
  CFG --> FR
  CFG -->|"aria-checked / .selected"| P
  FR -->|"shape, expression, colour, pose, playhead, blocks"| AV["Avatar.vue<br/>hero SVG"]
  AV --> EX["attachStage(svgCourant)<br/>→ ExportBar delivery"]
```

The load-bearing detail: **pickers read `config`, the hero reads `frame`.** Hovering hexagon while circle is selected leaves circle `aria-checked` and morphs the avatar to hexagon until you click or leave.

### Playback interaction

While the video transport runs, `frame.pose` is derived from the playhead (`blockAt(blocks, at)`), and nothing writes `config.pose`. Pose *preview* is refused outright during playback (`desk.ts:197`). Shape, expression, and colour commits still land, and they do **not** stop playback — only a pose commit calls `transport.pause()` (`desk.ts:203`). The file header comment states this is by construction: shape and pose arrive from independent sources so changing one mid-playback cannot clobber the other. That is the invariant behind "changing shape mid-preview must keep correct live animation."

In `Avatar.vue`, shape and pose changes are watched and animated through `morphTo` (`DEFAULT_MORPH_MS = 400`, or `0` under `prefers-reduced-motion`, computed in `Stage.vue:62–66`). Expression and colour have no morph watcher; they apply immediately via `engine.sample`.

### Top nav and Settings

`App.vue` has `SECTIONS = ['rollup', 'settings', 'about']` rendered as `<a :href="#{id}" :data-nav="id" @click.prevent="aller(id)">`. `aller` is the whole implementation:

```28:33:src/App.vue
function aller(id: (typeof SECTIONS)[number]) {
  const cible = document.getElementById(id)
  if (!cible) return
  const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  cible.scrollIntoView({ behavior: calme ? 'auto' : 'smooth', block: 'start' })
}
```

`@click.prevent` matters: pose share links own `location.hash` as `#etat=…`, so a primary nav click must not write the fragment. Middle-click still follows `href="#about"`, and the session's location writer would then replace it.

`<main>` unconditionally stacks `Stage` → `RollupPanel` → `Settings` with `gap: 2.5rem`. **About is not a section** — it is `<h3 id="about">` *inside* `Settings.vue` (line 92). Nav "Settings" scrolls to the section top (theme pills); nav "About" scrolls to that heading. Nav links have hover/focus colour only — no `aria-current`, no active styling, no scroll-spy.

### Theme

`Settings.vue` renders `THEME_CHOICES` as `role="radio"` buttons with `data-theme-choice`, `aria-checked`, roving `tabindex`, and `@click="theme.choose(choice.id)"`. `choose` does three things in order: set `chosen`, `applyChrome(resolved.value)`, `persist(next)`. Persistence goes `session.ts` → `patch({ theme })` → `saveDoc` → `localStorage['grok_bot:studio']`. Default is `'system'`, and a fresh `loadDoc()` does **not** write storage — the first `choose` is the first write.

An OS `matchMedia` listener stays attached even for explicit choices; `resolved` just ignores `systemDark` when the choice is not `'system'`.

### Language

i18n is a hand-rolled module singleton, not vue-i18n. `t(cle)` plus a `langue` computed with a validating setter. Catalogue is `LANGUES` in `src/i18n/langues.ts` — English first, then Français, then 简体中文 (`tag: 'zh-Hans'`). Type source is **French**: `Cle` is `typeof fr`, so `en.ts` and `zh.ts` must match its shape.

Be precise about "English primary": `LANGUE_PAR_DEFAUT = 'en'` is the *fallback*, not a hard default. `choisirLangue(stored, navigator.languages)` returns a stored id if valid, else the first navigator tag whose `Intl.Locale(tag).language` is in the catalogue, else `'en'`. A `zh-CN` browser with no stored key gets Chinese. Detected locale is **ephemeral** — `grok_bot:langue` is written only on explicit assignment. Tests pin `langue.value = 'en'`.

Language uses its own storage key (`grok_bot:langue`), separate from the theme's JSON blob. `Settings.vue` pulls only `theme` from `useStudio()`; `langue` comes straight from the i18n module.

### The colour system

`src/assets/main.css` is the only global stylesheet (`main.ts:3`); everything else is `<style scoped>`. Six themed tokens, three pinned stage tokens, two layout tokens:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--canvas` | `#f5f5f4` | `#14110f` | page background |
| `--ink` | `#1c1917` | `#f5f5f4` | text, selected borders, inverted CTA fill |
| `--muted` | `#57534e` | `#a8a29e` | secondary text, idle verb text, hover borders |
| `--line` | `#d6d3d1` | `#3a3532` | default borders |
| `--paper` | `#ffffff` | `#211d1a` | `.surface`, selected fills |
| `--wash` | `0 0 0` | `255 255 255` | an **RGB triple**, consumed only as `rgb(var(--wash) / α)` so shadows invert |
| `--stage` | `#f5f5f4` | *same* | avatar well background — **outside every theme block** |
| `--stage-ink` | `#1c1917` | *same* | foreground inside the well |
| `--stage-muted` | `#57534e` | *same* | cavity stroke mix, lock pill text |
| `--rail` | `16rem` | — | panel max-width (layout, not paint) |
| `--chrome` | `11rem` | — | subtracted in `min-height: calc(100svh - var(--chrome))` |

Light values are Tailwind stone-100/900/600/300; the dark values are custom.

The chromatic palette lives in the engine, not the design system:

```108:121:src/engine/skins.ts
export const COLORS: BotColor[] = [
  { id: 'ink', hex: '#0a0a0c' },
  { id: 'brown', hex: '#8b5e3c' },
  { id: 'red', hex: '#e8483f' },
  { id: 'orange', hex: '#f08a24' },
  { id: 'amber', hex: '#f0b429' },
  { id: 'green', hex: '#3ecf8e' },
  { id: 'turquoise', hex: '#2fbfa0' },
  { id: 'blue', hex: '#3b93f0' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'pink', hex: '#e152b0' },
  { id: 'grey', hex: '#a3a3a3' },
  { id: 'cream', hex: '#f1efe9' },
]
```

Chrome touches these hexes in exactly one place: `OutputDock.vue:16,55` tints the file-icon circle with `COLOR_BY_ID.get(id)?.hex`, fallback `#1c1917` (chrome light `--ink`, *not* the bot's `ink` `#0a0a0c`). `TimelineTrack` thumbnails use `currentColor`, so montage chips ignore the aura entirely. Primary actions are inversions, not hues: `ExportBar.vue:208–209` and `Timeline.vue:223–224` are both `background: var(--ink); color: var(--paper)`, with `filter: brightness(1.08)` on hover.

Two other chromatic sources exist and are unrelated to `COLORS`: the Burst/Comet decor rainbow (`src/engine/decor.ts` `wheel(hue, 0.55, 0.62)`, drawn on the avatar, never in CSS) and the Banner 01 Figma blob SVGs (`#9159FE`, `#FF9800`, `#FF309B`, `#97683D`, `#1084FE`) under `src/assets/banners/banner01/`. Those blob hexes are near-misses for `COLORS` violet/orange/pink/brown/blue but are not shared.

## Where Things Live

**Verb band and pickers**
- `src/components/Stage.vue` — `#studio` section, `.verbs` toolbar (~197–234), all band CSS including the orbital rings (~410–696), `onChooserPointer`, hero and `ExportBar` wiring, `attachStage`.
- `src/components/CustomisePanel.vue` — one `<aside class="rail surface">` with all three appearance groups: 8 shapes, 16 expressions, 12 colour swatches. Roving-tabindex radiogroups with arrow-key wrap.
- `src/components/AnimationsPalette.vue` — 14 pose tiles from `ANIMATION_STATES`, filled with the current aura hex.
- `src/studio/desk.ts` — `openBand`, `preview`, `commit`, `frame`, transport, delivery.
- `src/studio/types.ts` — `PickerBand`, `LookFacet`, `DeskFrame`, `ThemeChoice`.
- `src/components/Avatar.vue` — `frame` props → live SVG; `morphTo` watchers on shape and pose.

**Top nav, Settings, i18n**
- `src/App.vue` — shell, topbar, `SECTIONS`, `aller`, keyed `Stage`, nav CSS (`.nav a`, 112–121).
- `src/components/Settings.vue` — `#settings` section: theme pills, language list, `<h3 id="about">`, GitHub CTA, credits, disclaimer.
- `src/components/OutputDock.vue` — the *other* topbar nav; Image/Video desks, `?desk=`, aura tint.
- `src/components/RollupPanel.vue` + `FondPanel.vue` — `#rollup`; banner/backdrop picker, deliberately *not* a fifth verb.
- `src/studio/theme.ts` — `THEME_CHOICES`, `createTheme`, `applyChrome`.
- `src/studio/session.ts`, `doc.ts` — theme persistence into `grok_bot:studio`.
- `src/i18n/index.ts`, `langues.ts`, `stockage.ts`, `format.ts`, `locales/{en,fr,zh}.ts`.
- `src/brand.ts` — GitHub and bloub URLs only. No colours.

**Paint and export**
- `src/assets/main.css` — the entire CSS colour system.
- `src/engine/skins.ts` — `COLORS`, `COLOR_BY_ID`, `DEFAULT_COLOR = 'ink'`, `resolveColour` (passes `#…` through unchanged).
- `src/engine/avatar.ts:112` — `DEFAULT_PAPER = '#f5f5f4'`.
- `src/ui/export.ts:54` — `BLANC = '#ffffff'`; `src/ui/toile.ts`, `plates.ts`, `capture.ts`, `scene.ts` for banner/matte hexes.
- `src/components/ExportBar.vue`, `Timeline.vue`, `TimelineTrack.vue` — inverted CTAs.

**Tests that constrain chrome**
- `src/studio/__tests__/theme.spec.ts` — reads `main.css` from disk; pins the stage well.
- `src/__tests__/App.spec.ts` — `data-mode` / `data-nav` / `data-theme-choice` / `data-locale` behaviour, hover-vs-selected, per-desk isolation, `#studio [data-body-paper]` fill in dark mode.
- `src/__tests__/i18n.spec.ts`, `persistence.spec.ts`, `friction.spec.ts`, `CustomisePanel.spec.ts`, `src/studio/__tests__/session.spec.ts`, `doc.spec.ts`.
- `src/testing/visual/parity/` — `idle.spec.ts`, `ids.ts`, `mae.ts`, `sample-grok.ts`, `load-dump.ts`, `types.ts`. `ids.ts` is the bloub↔Grok id map, which makes every shape/expression/colour id a cross-repo contract.

## Gotchas

1. **Selected and hover look identical on the verb band.** `.verbs button.on`, `:hover`, and `:focus-visible` share one rule (`Stage.vue:372–378`). Hovering a closed verb while another is open makes two pills look active. `aria-pressed` is the only honest signal. This is the single most obvious thing to fix.

2. **Aura is the odd one out.** Shape, Face, and Motion become `position: absolute` chips around the hero (via `display: contents` on `.tiles`/`.swatches`); Aura stays a frosted left panel at `left: 0; top: 4.5rem; width: min(100%, 18rem)`. The `@media (max-width: 40rem)` rule only recentres `:not(.orbital)` fields, so on mobile Aura moves to the bottom while the rings do not.

3. **The "Colour" heading survives the Aura band.** The `data-open-band` `display: none` block hides `#customise-title` for all three appearance bands, and hides the *shape* heading under `.skins` and the *expression* heading under `.faces` — but nothing hides `#customise-colour`. So the verb says "Aura" and the panel says "Colour."

4. **No colour hover preview.** `onChooserPointer` has no colour branch (`isColorId` isn't even imported into `Stage.vue`). `DeskFrame` and `LookFacet` fully support colour and banner peeks, but `desk.preview` is only ever called with shape, expression, and pose — verified across the whole `src/` tree. Aura commits on click.

5. **Orbital tiles can cover the verb band.** Ring tiles are `z-index: 5`, `.verbs` is `z-index: 4`, and `.field.orbital` is `inset: 0` on `.stage` — so `top: 36%` is a percentage of the whole section, not of the hero well. On short viewports the bottom of the face/pose ring can land on the buttons.

6. **The orbital overlay is click-through by design.** `.field.orbital.open { pointer-events: none }` with `pointer-events: auto` on the tiles. Moving the pointer off a tile onto the avatar fires `pointerleave` on the field and clears the preview. Adding a backdrop or a hit-area to the overlay silently breaks that.

7. **Both pickers stay in the DOM when closed.** Closed panels are `opacity: 0` (and subsections `display: none`), so assistive tech can still reach hidden radiogroups. Any a11y rework should address this rather than assume unmounting.

8. **Theme pills only *look* like a keyboard radiogroup.** They have `role="radio"`, `aria-checked`, and roving `tabindex` but **no `@keydown`** (`Settings.vue:39–51`). Language, `CustomisePanel`, and `AnimationsPalette` all wire arrow keys via `auClavier`. The theme group is the outlier.

9. **`showCavity` / `skinLimited` follow the *preview*.** Both derive from the previewed hero sample (`Stage.vue:101–104`), so hovering `Play` can flash "This pose keeps its own outline" before anything is committed.

10. **Ring geometry is CSS custom properties, not JS.** 16 expressions at 22.5° steps from `--a: -90deg`; 14 poses at ~25.7° steps; 8 shapes hand-placed as percentages. Adding or removing a shape, expression, or pose means editing per-id CSS rules in `Stage.vue`.

11. **`layout="compact"` / `layout="strip"` are dead for the studio.** Both props exist with grid/strip CSS, and no caller passes them. Stage overrides everything with its own orbital CSS. They look like a pre-orbital rail.

12. **Picker thumbnails are Idle samples.** `CustomisePanel` calls `sampleAvatar` without `state`, so shape and face tiles never show the current motion. `AnimationsPalette` uses `sampleMorph(id, id, 1)` and renders path + dots only, no eyes.

13. **Nav gives no feedback about where you landed.** No `aria-current`, no active class, no IntersectionObserver. Combined with "Settings has no open/close," the only way to dismiss Settings is to scroll away.

14. **`#customise` and `#studio` still carry `scroll-margin`** (`main.css:70–76`) but are not in `SECTIONS` — residue from an older in-page nav.

### Redesign constraints

**Free to change.** The verb band's markup, layout, and visuals; whether it is a toggle band, a segmented control, a radial menu, or something else. Whether Aura becomes orbital like its siblings. Ring geometry and tile styling. Adding real hover/selected differentiation, arrow-key support on the theme group, `aria-current` on nav, scroll-spy, or turning Settings into a drawer (nothing depends on it being a page section except `scrollIntoView` and the `#settings`/`#about` ids). Adding new tokens — including an `--accent` and chromatic hover/selected states — to the themed blocks in `main.css`. Adding colour hover preview: `frame` already supports the `colour` facet end to end; you only need a branch in `onChooserPointer`. Reusing `COLORS` hexes as chrome accents. Motion, easing, and shadow work via `--wash`.

**Must not change.**

- **The three stage tokens.** `theme.spec.ts:97–105` parses `main.css`, finds every block whose body matches `/--stage(-ink|-muted)?\s*:/`, and asserts there is **exactly one**, that its selector does **not** contain `data-theme`, and that it declares `--stage: #f5f5f4`. Declaring `--stage`, `--stage-ink`, or `--stage-muted` in a second rule fails the suite even if the values are identical. New `--stage-something-else` tokens are fine — the regex won't match them.
- **The well stays light in dark mode.** Eye cut-outs are holes punched by a mask (`#fff` body, `#000` eyes) that reveal `DEFAULT_PAPER` behind the body. Theme the well and eyes become pale blobs. `App.spec.ts:455–462` asserts `#studio [data-body-paper]` is `#f5f5f4` while `data-theme="dark"`.
- **Chrome drawn *inside* the well uses `--stage-ink` / `--stage-muted`, never `--ink` / `--muted`.** The cavity stroke and lock pill already follow this. Note the `.verbs` band is a *sibling below* `.hero-wrap` on `--canvas`, so its use of theme tokens is correct — but orbital tiles do float over the always-light well, and they paint `color-mix(… var(--paper) 55% …)`. Dark-mode contrast over a light well is an existing wart worth fixing deliberately rather than inheriting.
- **`BLANC = '#ffffff'` is the delivery matte, and it is not `--paper`.** Nothing on the export path may read a theme token. `theme.ts:1–7` and `delivery.ts:3–5` both say so in comments; `theme.spec.ts:86–90` pins both constants.
- **`COLORS` ids and hexes, `SHAPES` ids, `EXPRESSIONS` ids, `ANIMATION_STATES`.** `src/testing/visual/parity/ids.ts` maps every one to a bloub French id; renaming or dropping one throws at parity-harness load. Do not loosen `IDLE_EYE_CENTRE_MAE_MAX = 0.05` / `IDLE_EYE_RADIUS_MAE_MAX = 0.01` or the two cell budgets in `idle.spec.ts:32–35`.
- **Test hook attributes.** `data-mode` (`shape|expression|colour|state` — *not* Face/Aura/Motion), `data-nav`, `data-theme-choice`, `data-locale`, `data-shape`, `data-expression`, `data-colour`, `data-state`, `data-output-dock`, `data-body-paper`, and the ids `#studio`, `#customise`, `#rollup`, `#settings`, `#about`. `App.spec.ts:311` asserts no `[data-mode="fond"]` exists inside `#studio` — the backdrop picker must stay out of the verb band.
- **Preview/commit semantics.** Pickers bind to `config`, the hero binds to `frame`. Pose preview stays refused during playback; pose commit stays the only commit that pauses the transport; shape/expression/colour commits must keep playback running. `attachStage` must keep resolving `svg[role="img"]` inside the focused desk's stage, and `Stage` must stay keyed by `focus`.
- **ARIA roles.** `role="toolbar"` + `aria-pressed` on the verbs; `role="radiogroup"`/`role="radio"` + `aria-checked` + roving `tabindex` in the pickers, theme pills, and language list.
- **Nav must not own the fragment.** Keep `@click.prevent` on section links; pose share links own `location.hash` as `#etat=…`.
- **i18n key parity.** New copy needs `en`, `fr`, and `zh` entries, and `Cle` is typed from `locales/fr.ts` — French is the shape source. Export filenames stay English regardless of UI locale.
