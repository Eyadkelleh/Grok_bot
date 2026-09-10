# Module map — candidate 1

Seven new or changed non-component modules, plus a component reshuffle. Nothing under `src/engine/` changes except one addition; nothing in the export layer changes at all.

## New: `src/studio/`

| Module | Owns | Exports | Depends on |
| --- | --- | --- | --- |
| `doc.ts` | The storage schema, validation, and legacy migration. Sole writer of `localStorage`. | `loadDoc`, `saveDoc`, `parseStudioDoc`, `serializeStudioDoc`, `defaultStudioDoc`, `migrateLegacy`, `type StudioDoc` (`@internal`) | `engine` (id guards, `parseMontage`), `i18n/stockage` |
| `desk.ts` | One desk's behaviour: preview vs commit, playback-derived pose, `DeskFrame` assembly, montage editing, delivery dispatch. | `createDesk`, `type ImageDesk`, `type VideoDesk`, `type DeskFrame`, `type Look`, `type LookFacet`, `type DeskConfig`, `type MontageEdit`, `type Transport` | `engine`, `theme.ts`, `delivery.ts` |
| `session.ts` | Two desks, focus, peek, shared banner copy, the fragment projection. Composition root. | `createStudioSession`, `STUDIO`, `useStudio`, `useDesk`, `useFocusedDesk` | `doc.ts`, `desk.ts`, `theme.ts`, `location.ts` |
| `theme.ts` | Theme choice, resolution, and paint layers 1 and 2. | `createTheme`, `applyChrome`, `stagePaper`, `type Theme`, `type ThemeChoice`, `type ThemeController` | `doc.ts` (choice only) |
| `location.ts` | The whole URL fragment, including the legacy `#etat=` reader. | `readLocation`, `writeLocation`, `type LocationState` | `engine/hash` (`STATE_SLUGS`, `slugOf`, `stateFromSlug`) |
| `delivery.ts` | Format availability policy and export payload assembly. Private to `desk.ts`. | `runDelivery`, `offerableFormats`, `type FormatFor`, `type DeliveryStatus`, `type Delivery`, `StageUnavailable` | `ui/capture`, `ui/bannerExport`, `ui/export` (unchanged) |
| `index.ts` | Barrel. Re-exports the public surface; `StudioDoc` and `runDelivery` stay out of it. | — | above |

## Changed

| File | Change |
| --- | --- |
| `src/engine/cycles.ts` | Add `applyMontageEdit(montage, edit)` beside `blocksWith` / `moveBlock` / `uniqueName` / `nextCycleId`. Pure, total, no new dependencies. |
| `src/i18n/stockage.ts` | `NOMS` gains one entry, `studio`. Legacy names move to a separate `LEGACY_NOMS` tuple readable by `lis` but not `ecris`. |
| `src/assets/main.css` | Tokens move to `[data-theme='light']` / `[data-theme='dark']` blocks. Adds `--shadow` and `--wash` to replace the literal `rgb(0 0 0 / …)` values in `Timeline.vue`, `TimelineTrack.vue`, `PhantomStudio.vue`, `CustomisePanel.vue`. `--chrome` becomes per-desk (video reserves timeline clearance, image does not). |
| `src/App.vue` | Loses `animationState`, `playing`, `surExport`, `SECTIONS`, `aller`, `cycleActif` and friends — roughly 120 lines. Becomes shell + `LensSwitch` + the focused desk. |
| `src/components/Timeline.vue` | Stops owning `cycles` / `activeId` / the rAF clock. Becomes a view over `VideoDesk.montage` + `VideoDesk.transport`, emitting `MontageEdit`. Mounted only on the video desk. |
| `src/components/ExportBar.vue` | Reads `DeliveryStatus` and emits a format. Loses the `videoSource` radiogroup and the `videoPossible()` check. |
| `src/components/Avatar.vue` | Unchanged. Receives `paper` from `DeskFrame` on the stage, exactly as `ouvreCycle` already overrides it for GIF/MP4. |
| `src/ui/friction.ts`, `frictionProbe.ts` | Probe takes a `DeskKind`; video-only flags fall out of scope on the image desk. |

## Deleted

| File | Why |
| --- | --- |
| `src/customise.ts` | Its three exported computeds are the shared-look problem. Deleting the module is what makes cross-desk mutation unreachable rather than discouraged. |
| `src/fond.ts` | Plate moves into `Look`, copy into `StudioDoc.shared`. `BannerCopy` moves to `studio/types`. |
| `i18n` `flow.*` blocks (en/fr/zh) | Dead copy from a deleted three-step video wizard. Reusing `flow.video` as a desk label would be wrong in three languages at once. |

## Components

```
App.vue
├── LensSwitch.vue          Image | Video. Hover peeks the other desk's bot on the hero.
├── ImageDesk.vue           mounted when focus === 'image'
│   └── Stage.vue           hero Avatar + BannerBackdrop + orbital pickers
│       ├── ShapeOrbit / FaceOrbit / AuraSwatches / BannerPanel   (facet emitters)
│       └── ExportBar.vue
├── VideoDesk.vue           mounted when focus === 'video'
│   ├── Stage.vue           same component, video desk's frame
│   │   └── PoseOrbit + ExportBar.vue
│   └── Timeline.vue        view over montage + transport
└── Settings.vue            language, theme, about
```

`Stage.vue` is `PhantomStudio.vue` minus its state: the previews, the `field` ref, and `svgCourant` all move into the desk, so the component binds `desk.frame` and emits `LookFacet`. Both desks render it; only one is mounted, so `#studio` stays unique and the friction probe keeps finding one avatar.

## Reading order for a reviewer

`doc.ts` → `desk.ts` → `session.ts`. Everything else is a leaf. Tracing a picker click to a persisted byte touches two files; tracing an export button to a downloaded file touches three.
