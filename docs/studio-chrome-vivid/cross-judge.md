# Chrome redesign cross-judge

Scores are 1–5; total is out of 30.

| Candidate | Unique UX | Bot-color accents | Ease | English-primary | Invariants | Interface depth | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1. Living Facet Chips | 5 | 5 | 4 | 5 | 4 | 3 | 26 |
| 2. Aura Spectrum Rail | 5 | 5 | 5 | 5 | 5 | 5 | **30** |
| 3. Magnetic Mode Dock + Sheet Settings | 5 | 4 | 5 | 5 | 4 | 4 | 27 |
| 4. Mode Constellation | 5 | 2 | 3 | 4 | 3 | 2 | 19 |

## Recommended BASE: Candidate 2 — Aura Spectrum Rail

Candidate 2 is the strongest base because it improves recognition and state clarity without relocating ownership. The rail is distinctive, the committed bot colour becomes a stable wayfinding cue, hover/open/focus use separate channels, and one stable shelf gives all four pickers the same predictable geometry. Its proposal is also the easiest to extend safely: Stage retains toolbar, band, preview, commit, and playback behavior; Settings retains theme and locale behavior; App retains nav and committed accent state.

Most importantly, Candidate 2 states the operational invariants rather than merely listing them. It keeps selection on `config`, the avatar on `frame`, pose preview disabled during playback, pose as the only commit that pauses playback, and nav clicks hash-neutral. Its shared surface is appropriately narrow: one real policy module for accent resolution plus CSS tokens, while interaction details remain with their current owners.

## Graftable ideas from the losers

### From Candidate 1

- Adopt the typed `VERBS` authority so label, `PickerBand`, `data-mode`, and picker target attributes cannot drift independently.
- Consider its English-first tuple rule: English is always visible, while the active non-English locale is promoted beside it.

Do not graft the generic living-chip renderer or frame-sampled miniatures as part of the base implementation; they add substantial type and rendering surface before the rail has proven that complexity necessary.

### From Candidate 3

- Reuse the existing compact/strip picker layouts and the explicit desktop-to-horizontal-snap responsive fallback.
- Delete Stage's `setField` pass-through and call `desk.openBand` directly.

Do not graft the Settings drawer in the first pass. It changes page structure, navigation semantics, focus management, and test reachability at the same time as the chrome redesign.

### From Candidate 4

- Use small mode glyphs as redundant recognition cues alongside the rail's English labels.
- Reuse the explicit split between `.idle:hover`, `.open`, and `.idle:focus-visible`.

Do not graft the in-well constellation geometry, fixed per-mode hues, DOM sync helper, or hidden idle labels.

## Red flags

### Candidate 1

- **Shallow/over-wide surface:** nine exported functions, multiple exported tables/token maps, a seven-variant glyph union, and two generic components are too much public machinery for four controls and three destinations.
- **Leakage:** presentation-resolved SVG geometry, eye transforms, animation samples, test hooks, CSS tokens, navigation state, and language policy all flow through the shared `Chip` vocabulary. The abstraction centralizes more unrelated knowledge than a maintainer should need to understand.
- **Invariant risk:** binding chip miniatures to `frame` is technically honest because they do not expose `aria-checked`, but it creates a second preview-reactive surface and extra per-frame sampling that can diverge from picker/config semantics.
- **Layout risk:** moving twelve Aura swatches into the existing orbit is explicitly unresolved and may crowd pose geometry at short heights.

### Candidate 2

- **Minor pass-through risk:** `chromeAccentStyle(accent)` appears to adapt an already-produced `cssVars` field into `CSSProperties`; keep one representation and remove this helper if implementation confirms it only forwards values.
- **Minor abstraction risk:** `bindStageChrome` and `bindSectionNav` are acceptable only as component-local organization. Do not extract them into public composables that wrap existing desk or DOM calls.
- No material temporal decomposition or information leakage is proposed.

### Candidate 3

- **Information leakage/duplication:** `sketch.ts` copies every colour id and hex into a private `HEX` table instead of deriving from the existing skin catalogue. That can silently drift from parity-owned `COLORS`.
- **Pass-through:** `bleedVars(id)` merely repackages `chromeAccent(id)`. Component style binding can do this directly.
- **Structural scope risk:** moving Settings/About into an always-mounted sheet changes scroll targets, focus restoration/trapping, inert behavior, mobile layout, and `aria-current` precedence together.
- **Accessibility/test tension:** locale controls are described as behind a disclosure yet intentionally remain directly reachable to tests. The implementation must not leave visually hidden radios keyboard-focusable.
- No material temporal decomposition is proposed.

### Candidate 4

- **Information leakage:** bot palette values are mirrored into CSS tokens while TypeScript separately maps mode/nav meanings to colour ids. Chrome now owns a second semantic palette.
- **Pass-through:** the design retains `setField`, while `syncConstellationAccent` mostly forwards `constellationStyle` into DOM setters.
- **Low cohesion:** `constellationAccent.ts` combines colour lookup, mode vocabulary, SVG strings, nav glyphs, orbit geometry, theme accents, and DOM mutation.
- **Concrete sketch defect:** `nodeStyle()` supplies the polar-placement `transform`, but `.mode-node.open` also sets `transform`; the open rule would replace the placement transform and can pull the active node out of orbit.
- **Rubric miss:** fixed blue/pink/violet/green mode colours come from `COLORS`, but they do not reuse the current bot colour. This is catalogue-coloured chrome, not bot-colour-driven chrome.
- **Ease risk:** idle labels are hidden, so first-time users must decode unfamiliar glyphs and compass positions before hovering.
- The claim that a “single cohesive swap” avoids temporal decomposition is not itself an architectural argument, though no explicit phase machine is introduced.

## Risks to invariants

1. **Peek/config/frame:** Keep Candidate 2's bead on committed colour. Allow the hero and picker preview to remain frame/peek-driven without making global navigation flicker. If colour preview is added, it must write only `peek`; selected tile state must remain `config`.
2. **Playback commits:** Preserve the existing distinction exactly: pose preview is blocked while playing and pose commit may pause; shape, face, and aura commits must not pause. Test all four bands while playback is active.
3. **`data-mode` hooks:** Preserve `shape`, `expression`, `colour`, and `state` even though internal bands are `shape`, `expression`, `colour`, and `pose`. Candidate 1's typed mapping is the safest graft.
4. **Stage tokens/export:** Do not redeclare or theme `--stage`, `--stage-ink`, or `--stage-muted`; do not route chrome accent tokens into `BLANC`, export matte, SVG/PNG/GIF/MP4 rendering, or parity-owned colour values.
5. **Nav fragment ownership:** Keep real `href`s and `@click.prevent`; section activation and `scrollIntoView` must never write `location.hash`.
6. **Mounted picker semantics:** If closed pickers gain `inert` and `aria-hidden`, verify current tests and pointer transitions against always-mounted DOM. Do not make hidden content keyboard-focusable merely to preserve test convenience.
7. **Responsive geometry:** The shelf must not overlap the avatar, verb targets, or other rings at short viewport heights. Prefer Candidate 2's flat/snap fallbacks over another hand-positioned orbit.
8. **Accent contrast:** Resolve a separate chrome display tint for `ink`, `cream`, and custom colours while retaining the exact source hex for the bot. Accent must be a redundant cue; text and focus indicators need independent contrast.

## Decision

Build Candidate 2 as the base. Graft Candidate 1's typed verb mapping and English-first active-locale promotion, Candidate 3's existing compact/strip layouts and direct `openBand` call, and Candidate 4's small redundant glyph cues. Reject the drawer and constellation geometry for this pass.
