# Throughput checkpoint

## Blocking first steps

1. Branch from `dev` as `feat/studio-image-video-split` (or equivalent). Do not pile onto unrelated `feat/banner-backgrounds` work unless already on the right base.
2. Scaffold `src/studio/doc.ts` (`StudioDoc`, parse, migrateLegacy, load/save) with unit tests (fresh, legacy upgrade, crash between write and legacy delete, corrupted doc). Gate before UI.
3. Theme tokens (`--canvas`, `--shadow`, `--wash`, `--stage`) + `data-theme` + Settings control. Verify light/dark chrome without touching goldens.

## Independent workstreams (after doc lands)

- Desk session API (`createStudioSession`, branded Look, commit/preview/frame).
- Output Dock chrome + `?desk=` location adapter (keeps `#etat=`).
- Image desk wiring (pickers, still ExportBar, no Timeline).
- Video desk wiring (pickers, Timeline as view, motion ExportBar).
- i18n (en/fr/zh) for Image/Video, theme, dock labels. Drop unused decorative `videoSource` radio.

Shared writes serialize: `StudioDoc` is the sole persistence writer.

## Shared mutable state

Default split already applied. Two desk configs inside one doc with one writer. Timeline must not write pose. Theme orthogonal. No dual Timeline instances. No dual `#studio` mounts.

## Smallest safe decomposition

One Claude feature owner owns the full implementation after this checkpoint, sequencing units below. Fan-out only if a unit is blocked and another is ready (e.g. i18n strings while desk tests run). Prefer one owner for coherence of the desk boundary.

## Verifiable units (ordered)

1. `doc.ts` + migration tests green
2. Theme tokens + Settings toggle + persistence green
3. Session + desk commit independence tests green
4. Output Dock + `?desk=` without breaking `#etat=` tests
5. Image page mount + still export
6. Video page mount + Timeline derived pose + motion export
7. Friction/App.spec updates; browser verify both desks + both themes
