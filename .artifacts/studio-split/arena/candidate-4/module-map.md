# Module map — Diptych Latch (candidate 4)

Seven modules across three layers. Arrows show primary data flow, not file imports.

```
┌─────────────────────────────────────────────────────────────────┐
│  shell                                                          │
│  main.ts ──► diptych/mount.ts                                   │
│              diptych/DiptychShell.vue                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌────────────────┐ ┌───────────────┐ ┌────────────────┐
│ studio/chrome  │ │ studio/ledger │ │ studio/latch   │
│ theme.ts       │ │ WorkshopLedger│ │ LatchRail.vue  │
│ tokens.css     │ │ persistence   │ │ glyphs.ts      │
└───────┬────────┘ └───────┬───────┘ └────────┬───────┘
        │                  │                   │
        │    ┌─────────────┴─────────────┐     │
        │    ▼                           ▼     │
        │  StillDesk.vue            MotionDesk.vue
        │    │                           │     │
        │    ├─ pickers (reuse)          ├─ pickers (reuse)
        │    ├─ StillExportBar         ├─ MotionExportBar
        │    └─ Avatar (stage)         ├─ Avatar (stage)
        │                              └─ Timeline.vue
        │                                       │
        └───────────────────┬───────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │ studio/exportBridge │
                 │ exportWorkshop()    │
                 └──────────┬──────────┘
                            ▼
              ┌─────────────────────────────┐
              │ existing (unchanged core)   │
              │ ui/capture.ts               │
              │ ui/bannerExport.ts          │
              │ ui/intent.ts                │
              │ ui/export.ts (BLANC)        │
              │ components/Avatar.vue       │
              │ engine/*                    │
              └─────────────────────────────┘
```

## Module responsibilities

| Module | Path | Owns | Public surface |
| --- | --- | --- | --- |
| **mount** | `src/studio/diptych/mount.ts` | Bootstrap, provide/inject wiring | `mountDiptychStudio` |
| **ledger** | `src/studio/ledger/` | Both workshops, namespaced `localStorage`, `?desk=` sync, legacy migration | `createWorkshopLedger`, `useDiptych` |
| **chrome** | `src/studio/chrome/` | Theme preference, token sets, `documentElement` attrs, `stagePaper` policy | `useChromeTheme`, `applyChromeToDocument` |
| **latch** | `src/studio/latch/LatchRail.vue` | Desk switch UX, inactive-chamber glyph | `LatchRail` component + `latchGlyphFor` |
| **still-desk** | `src/studio/desks/StillDesk.vue` | Still preview, look pickers, still export bar, no Timeline | `DeskProps<'still'>` |
| **motion-desk** | `src/studio/desks/MotionDesk.vue` | Motion preview, look + pose pickers, Timeline mount, motion export | `DeskProps<'motion'>` |
| **exportBridge** | `src/studio/exportBridge.ts` | `Workshop` + `ExportIntent` → existing capture/banner paths | `exportWorkshop`, intent helpers |

## Retire or shrink

| Current | Fate |
| --- | --- |
| `src/customise.ts` | Replaced by ledger; keep `rechargerApparence` shim one release or delete with migration |
| `src/fond.ts` | Absorbed into per-workshop `banner` on ledger |
| `src/App.vue` pose/export/hash | Pose hash → `ledger/bindMotionHash.ts`; export → desks call `exportBridge` |
| `PhantomStudio.vue` | Split into `StillDesk` + `MotionDesk`; extract shared picker chrome to `studio/pickers/` |
| Header `SECTIONS` nav | Settings/About move to footer or latch-adjacent menu; studio scroll nav removed |

## Storage key migration

| Legacy `NomStocke` | New keys |
| --- | --- |
| `forme` | `forme:still` (seed both on first run) + `forme:motion` |
| `couleur` | `couleur:still`, `couleur:motion` |
| `expression` | `expression:still`, `expression:motion` |
| `fond`, `fondCopy` | `fond:still`, `fondCopy:still`, `fond:motion`, `fondCopy:motion` |
| `cycles` | `cycles:motion` only |
| — | `chromeTheme` (new) |

`src/i18n/stockage.ts` `NOMS` tuple grows; only ledger imports typed keys.

## Test touchpoints

| Test file | Change |
| --- | --- |
| `persistence.spec.ts` | Ledger independence: patch still shape, assert motion unchanged |
| `App.spec.ts` | Mount `DiptychShell`, scope selectors to `[data-desk]` |
| `frictionProbe` | Pass `desk: WorkshopKind` into `probeFriction` |
| `visual/__golden__/` | No change — export path still uses BLANC / DEFAULT_PAPER |

## CSS contract

- `[data-chrome-theme="light|dark"]` on `<html>` — chrome tokens
- `[data-desk="still|motion"]` on `.diptych` — layout padding (no 14rem bottom on still)
- Stage `Avatar` receives `:paper="stagePaper"` from chrome composable
- Banner components ignore chrome; read `plate.encre` only
