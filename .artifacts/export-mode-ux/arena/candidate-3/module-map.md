# Module map — Split-flap desks

Surgical. Presentation only. Session remains the sole writer of focus.

## Touched

| File | Change |
| --- | --- |
| `src/components/OutputDock.vue` | Replace the two `.sheet` cards with one `.board` housing and two flap windows. Distinct polaroid / film-gate SVGs. `dropped` / `cocked` from `props.focus`. Keep the `v-for` over `desks`, `hrefForDesk`, `@click.prevent`, `data-*`, `aria-*`, locale labels and hints. Mobile bottom-bar rules stay on `.dock`; restyle the inner board, not the positioning. |

## Untouched (do not open)

| File | Why |
| --- | --- |
| `src/App.vue` | Props and `@focus="studio.focusDesk"` already match. Dock stays first in the header, before `#studio`. |
| `src/studio/session.ts` | Sole writer of focus + URL. |
| `src/studio/location.ts` | `hrefForDesk` / `?desk=` unchanged. |
| `src/studio/types.ts` | `DeskKind` stays `'image' \| 'video'`. |
| `src/components/Stage.vue` | Hero, verbs, orbital pickers. Remount via `:key="focus"` is enough. |
| `src/components/ExportBar.vue` | Formats still come from `desk.delivery`. Dock hints may keep today’s i18n strings. |
| `src/assets/main.css` | No new tokens. Flap colour is `color-mix` of the desk hex onto `--paper`. |
| `src/i18n/locales/*` | `dock.image`, `dock.video`, hints, aria, nav label stay. |
| Tests (`App.spec.ts`, `friction.spec.ts`) | Anchors and visible locale text are invariants. |

## Data flow

```
session.focus ──► OutputDock props.focus
                      │
                      ▼
              flapAttitude per desk
              (dropped | cocked)
                      │
click <a data-desk> ──► emit('focus') ──► session.focusDesk
                                              │
                                              ▼
                                        ?desk= + history push
```

No local focus ref. No second URL writer. Glyph loops (video playhead) are CSS, not `Avatar`.
