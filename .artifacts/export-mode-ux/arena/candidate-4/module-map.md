# Module map — Split-Flap Rail (candidate 4)

## Touch

| File | Change |
| --- | --- |
| `src/components/OutputDock.vue` | **Primary.** Replace `.sheet` card grid with `.flap-rail` chassis + hinged `.flap` links. Keep script block (props, `desks` computed, emit) intact. Swap leaf SVG for glyph components. New scoped CSS for 3D hinge, tint stripe, mobile bottom bar. |
| `src/components/desk/DeskGlyphStill.vue` | **New (optional).** Crop-frame still glyph; `aria-hidden`, accepts `--glyph-tint` or `tint` prop. |
| `src/components/desk/DeskGlyphMotion.vue` | **New (optional).** Sprocket film cell + scrub bar; `.is-forward` ancestor enables CSS keyframes. |
| `src/components/desk/DeskFlapLink.vue` | **New (optional).** Thin wrapper if `OutputDock` template grows — renders `<a>` with `data-desk`, `aria-*`, flap classes. |

## Untouched

| Area | Reason |
| --- | --- |
| `src/studio/*` (`focusDesk`, `hrefForDesk`, `DeskKind`) | Session remains sole focus writer |
| `src/components/Stage.vue` | Hero preview; no dock coupling |
| `src/components/ExportBar.vue` | Formats come from `desk.delivery`, not dock UI |
| `src/i18n/locales/*` | Existing `dock.image`, `dock.video`, hints, aria keys |
| `src/assets/main.css` | Studio tokens sufficient; no new global tokens required |
| `src/__tests__/App.spec.ts`, `friction.spec.ts` | Selectors unchanged (`[data-output-dock]`, `[data-desk]`, visible text) |

## DOM / test contract (must hold)

```html
<nav data-output-dock aria-label="…">
  <a data-desk="image" href="…" aria-current="page"? @click.prevent>…Image…PNG · SVG…</a>
  <a data-desk="video" href="…" @click.prevent>…Video…GIF · MP4…</a>
</nav>
```

- `image` anchor precedes `video`.
- `aria-current="page"` only on focused desk.
- Visible text includes locale labels and hints.

## CSS surface

All new rules scoped to `OutputDock.vue` unless glyphs need micro-styles:

- `.flap-rail` — trough, `perspective`, monochrome inset
- `.flap` / `.flap.is-forward` / `.flap.is-edge` — hinge transforms (desktop `rotateY`, mobile `rotateX`)
- `.flap-tint` — leading edge colour from desk tint
- `.glyph-scrub` — `@keyframes scrub` gated by `.is-forward`
- `@media (max-width: 40rem)` — fixed bottom bar + safe-area (parity with today)
- `@media (prefers-reduced-motion: reduce)` — disable transitions and scrub

## Prototype reference

Interactive behaviour spec: `prototype.html` in this directory.
