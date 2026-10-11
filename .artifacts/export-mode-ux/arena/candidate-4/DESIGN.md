# Candidate 4 — Split-Flap Rail

## Problem

`OutputDock.vue` presents Image and Video as two identical bordered “sheet” cards with the same document-leaf SVG and a thicker black border for selection. The control reads as utilitarian file-picker chrome, not a studio desk switch. It fails product prefs for unique, motionful UX and does not echo the orbital energy of shape/face pickers. The redesign must make Still vs Motion instantly legible, feel like part of Grok_bot’s monochrome studio, and preserve every grounding invariant (anchor links, `data-*`, a11y, props/emit, DOM order, session ownership).

## Usage (caller's view)

Public contract stays unchanged — `OutputDock` remains a dumb chooser over `DeskKind`:

```vue
<OutputDock
  :focus="focus"
  :image-colour="imageColour"
  :video-colour="videoColour"
  :video-duration="videoDuration"
  @focus="studio.focusDesk($event)"
/>
```

Callers do not learn a new API. Internally, each desk link becomes a **hinged flap** on a shared rail chassis instead of a free-floating card. Click (or keyboard activate) still `emit('focus', kind)` after `@click.prevent`; `hrefForDesk` and middle-click behaviour are unchanged.

### What the user sees

- **Desktop (topbar):** A compact monochrome trough (~11rem wide) with two vertical split-flaps hinged on the inner spine. The focused desk’s flap swings forward (`rotateY`) to face the user; the other folds edge-on into the trough. Active flap shows label, format hint, and a desk-tint accent stripe fed by `imageColour` / `videoColour`.
- **Mobile (fixed bottom bar):** Same chassis, flaps hinge upward from the bottom safe-area bar. Inactive flap is a narrow peek tab; active flap rises with label + hint.

Glyphs are structurally different: Image uses **crop-frame marks** (still); Video uses **sprocket film cell** with a scrub playhead that animates only when that desk has `aria-current="page"`.

## Shape

### Interaction model — Split-Flap Rail (committed)

One structural concept: a **mechanical split-flap board** with two hinged panels on a shared rail, not two parallel cards.

```
Desktop (side view, spine at centre)

  edge-on          FACE USER
  [video]  |  [ IMAGE ]
           spine
```

- `<nav data-output-dock>` wraps a `.flap-rail` chassis (monochrome trough, `var(--line)` inset shadow, no purple glow).
- Each desk remains a real `<a :href="hrefForDesk(kind)" data-desk="image|video" @click.prevent>`.
- DOM order: `image` link first, then `video` (tests rely on first `[data-desk=video]`).
- Active flap: `class="flap is-forward"`, `aria-current="page"`, full label + hint visible.
- Inactive flap: `class="flap is-edge"`, muted, narrow sliver; label still in DOM for tests/i18n.
- Motion: `transform: rotateY(±72deg)` on desktop; `rotateX(±68deg)` on mobile; spring-ish `cubic-bezier(.34,1.56,.64,1)` over ~320ms. `prefers-reduced-motion`: instant snap, playhead frozen.
- Desk tint: 3px leading edge on the forward flap (`background: desk.tint`), not a filled card wash.

### Presentation components (implementation sketch)

| Piece | Role |
| --- | --- |
| `OutputDock.vue` | Shell: props, `desks` computed, emit wiring, layout CSS |
| `DeskFlapLink.vue` (optional extract) | Single `<a>` + glyph slot + flap classes |
| `DeskGlyphStill.vue` | Crop-frame SVG |
| `DeskGlyphMotion.vue` | Sprocket cell + scrub bar (CSS animation when parent `.is-forward`) |

No session, URL, or `focusDesk` changes.

### Synthesis decision

filled by arena

## Tradeoffs

| Upside | Cost |
| --- | --- |
| Structurally unique — reads as studio hardware, not generic segmented control | 3D transforms need careful `backface-visibility` and focus-ring clipping |
| Single chassis footprint smaller than two cards; hero avatar stays dominant | Inactive flap is narrow — label truncated visually but full text remains for a11y/tests |
| Distinct glyphs + motion playhead sell Image vs Video without dashboard tiles | Slightly more CSS than pill track; glyph components add ~2 small SVG files |
| All HOW invariants preserved on the `<a>` nodes | Must verify focus-visible outline on edge-on flap (use `:focus-visible` on chassis overflow visible) |

## Alternatives considered (rejected)

1. **Sliding-pill desk track** — Correct radiogroup semantics but reads as settings chrome; rejected as too generic per RESEARCH and product prefs.
2. **Mode capsule with morphing glyph** — Dense and elegant, but single-surface expansion hides the “two equal desks” metaphor; rejected in favour of a physically dual control.
3. **Orbital twin pickers** — Highest uniqueness but steals visual language from Stage shape/face orbitals and risks topbar height; rejected to keep dock compact beside brand.
4. **Dual live-preview tiles** — Best format storytelling but competes with the hero avatar; rejected on scope and render cost.
5. **Border-only / thicker-outline selection (status quo)** — Explicitly avoided.

## Open questions

- Should inactive flap show a one-letter abbreviation (`I` / `V`) on the edge sliver for faster scanning, or rely on glyph silhouette only?
- Extract glyphs to `src/components/desk/` or co-locate in `OutputDock.vue` until a second consumer appears?
- Video scrub animation: loop only when `document.visibilityState === 'visible'` to save battery on mobile?

## Next implementation step

1. Replace `.sheet` grid in `OutputDock.vue` with `.flap-rail` + `.flap` 3D hinge markup; keep identical props/emit and anchor attributes.
2. Add `DeskGlyphStill` / `DeskGlyphMotion` inline or as sibling components; wire `desk.tint` to `--flap-tint` custom property.
3. Port prototype spring timings; add `@media (prefers-reduced-motion: reduce)` block mirroring current dock.
4. Run `App.spec.ts` + `friction.spec.ts` (text content, `aria-current`, `[data-desk=video]` click) — no selector changes expected.
5. Visual pass beside `Stage.vue` `.verbs` pills to confirm monochrome + tint harmony.
