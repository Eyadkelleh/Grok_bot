# Module map — sealed desks + occupancy pebble

Ownership, not call order. Engine (`Avatar`, clock, `poseCycle`, capture, banner plates) is reused, not forked.

## `src/studio/` (new, public)

| File | Owns |
| --- | --- |
| `desks.ts` | `Look`, `Freeze`, `LiveMotion`, `StillDesk`, `MotionDesk`, patches, `shownState`, `avatarSpecFor`. Hydrate/persist of the two blobs. Legacy key copy. |
| `occupancy.ts` | `Occupancy`, `parseLocation`, `writeLocation`, `occupy`. Path `/` vs `/video`. Hash `#etat=` only as a motion mirror. |
| `theme.ts` | `ThemeChoice`, `ResolvedTheme`, `ChromeTokens`, `STAGE_WELL`, `chooseTheme`, `applyTheme`. |
| `commit.ts` | `ExportRequest`, `planExport`, `commitExport`, `requestFromAction`. The only assembly of `ReglagesBot` + `poseCycle` + filename. |
| `index.ts` | `openStudio`, `deskView`. Re-exports the public surface. |

App, PhantomStudio, Timeline, ExportBar, OccupancyPebble, Settings import from `src/studio`. They do not import `customise.ts` or `fond.ts`.

## `src/components/` (adapted)

| File | Change |
| --- | --- |
| `OccupancyPebble.vue` | New. Two wells + sliding colour stone. Replaces scroll-nav. |
| `PhantomStudio.vue` | Binds `DeskView`. Field set is `freeze` xor `live`, never both. Timeline chrome from the view. One instance. |
| `Timeline.vue` | View of `MotionDeskHandle`. No local `cycles` source of truth. Sampler does not write pose. |
| `ExportBar.vue` | Renders `DeskView.exports`. Drops the decorative `videoSource` radio. Emits `ExportRequest`. |
| `Settings.vue` | Theme wells beside language. Same pebble grammar. |
| `Avatar.vue` | Unchanged renderer. Stage passes `paper: STAGE_WELL`. Off-screen capture still overrides to `BLANC`. |

## `src/` shell

| File | Change |
| --- | --- |
| `App.vue` | Thin: `openStudio`, pebble, one studio, conditional Timeline, `commitExport`. No look refs, no `SECTIONS`/`aller`. |
| `customise.ts` | Deleted after migrate. |
| `fond.ts` | Banner type (`BannerCopy`) may stay; singleton refs go. Each desk stores `BannerSelection`. |
| `i18n/stockage.ts` | `NOMS` gains `theme`, `occupancy`, `desk:still`, `desk:motion`. |
| `assets/main.css` | `[data-theme=light\|dark]` maps. `--canvas`, `--shadow`, `--wash`, `--stage`. No hardcoded `rgb(0 0 0 / …)` in chrome. `--chrome` is 0 on still occupancy. |
| `engine/avatar.ts` | `DEFAULT_PAPER` stays `#f5f5f4`. Do not retint. |
| `ui/export.ts` | `BLANC` stays `#ffffff`. |
| `ui/plates.ts` | `encre` untouched by theme. |
| `ui/intent.ts` | Kept; `commit.ts` is the only caller wrapping `poseCycle`. |
| `ui/frictionProbe.ts` | Score the occupied desk. Still has no montage flags. Do not reuse `flow.*` copy. |

## Data flow

```
localStorage desk:still / desk:motion
        │
        ▼
   openStudio.hydrate ──► StillDesk   MotionDesk
                              │            │
                              └─────┬──────┘
                                    ▼
                              occupy(cursor)
                                    │
                    deskView(occupied) + commitExport
                                    │
                    PhantomStudio / Timeline / ExportBar
                                    │
                    Avatar (paper = STAGE_WELL)
                    capture / bannerExport (matte = BLANC)
```

Theme writes `documentElement[data-theme]` only. It never enters `Look`, `AvatarSpec.paper` (stage), or `BLANC`.

## Invariants encoded in types

- `StillDesk.kind` vs `MotionDesk.kind` — occupancy is the discriminant, not a flag on shared look.
- `Freeze` vs `LiveMotion` — pose cannot be copied across desks by assignment.
- `StillExportRequest` vs `MotionExportRequest` — GIF/MP4 cannot be requested from Image; PNG/SVG (except `grab-png`) cannot be requested from Video.
- `STAGE_WELL` and `EXPORT_MATTE` are distinct branded literals in the sketch so a theme token cannot sneak into capture.
- `shownState` is a read of montage + playhead; its signature returns `AnimationState` and does not accept a pose setter.
