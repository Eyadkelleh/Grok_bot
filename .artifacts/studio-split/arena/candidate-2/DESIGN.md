# Cartridge studio

## Problem

The current studio has one singleton look, one App-owned pose, one Timeline-owned montage, and one export-time still/video fork. A page split would therefore be cosmetic unless ownership changes first. The redesign must keep the existing `Avatar` and export engines, preserve bloub geometry parity and the 27 `DEFAULT_PAPER` goldens, give Image and Video independent appearance and pose, keep montage exclusively in Video, and add dark chrome without recolouring exported artwork or plate-owned banner ink.

## Usage (caller's view)

The app shell knows only which destination is open and which app theme is active:

```ts
const shell = useStudioShell()
shell.open('video')
shell.theme.setPreference('dark')
```

Each page asks for its own cartridge. Commands are page-branded, so an Image command cannot be dispatched to Video and neither page can access the other's state:

```ts
const image = useStudioPage('image')
image.dispatch({ type: 'image/set-shape', shape: 'pebble' })
image.dispatch({ type: 'image/set-pose', pose: 'Idle' })
await image.export({ format: 'png' })
```

```ts
const video = useStudioPage('video')
video.dispatch({ type: 'video/set-expression', expression: 'attentive' })
video.dispatch({ type: 'video/play' })
await video.export({ format: 'mp4', source: 'montage' })
```

The primary menu is the **Output Dock**: two file-shaped destinations, not a tab strip. Image has a folded-corner frame; Video has a perforated film edge and a tiny live duration readout. The active file visually docks to the preview with one short connector motion. It remains two labelled buttons with `aria-current="page"` and keyboard navigation. On narrow screens it becomes a compact, sticky two-file dock above the export action; the preview remains first and largest.

## Shape

The load-bearing structure is two independently persisted, discriminated documents: `ImageWorkspaceState` and `VideoWorkspaceState`. Both contain a complete `Look`, pose, and scene; only Video can contain montage. Their command unions are separately branded (`image/*`, `video/*`). Pure reducers receive one document—not a root object containing both—so a transition has no sibling reference to mutate. Each repository is permanently scoped to `grok_bot:workspace:image:v1` or `grok_bot:workspace:video:v1`; one page save cannot rewrite stale data from the other. This is separate-before-serializing-shared-state and makes independence structural rather than a naming convention.

`useStudioPage(area)` is the page boundary. It loads and validates one document, owns preview/playback transients, persists committed commands, and assembles exports through existing `exporte`, `exporteMontage`, and banner exporters. Callers do not coordinate look, pose, Timeline refs, DOM capture, storage, or filenames. The small `state + dispatch + export + cancelExport` surface hides that policy, giving the module depth without a deep call chain. Validation occurs while parsing each versioned JSON document; reducers and export assembly trust domain types afterward, per boundary-discipline.

Navigation uses `?studio=image|video` through a tiny History adapter. Query navigation gives reload-safe deep links without adding Vue Router or competing with the legacy `#etat=` fragment. During migration, the hash pose may seed the Video cartridge once; it is not a continuing second source of truth. App shell, Image page, and Video page each cross at most the workspace boundary before reaching the existing engine.

Video playback is moved behind the Video cartridge. Timeline becomes a controlled view over `VideoWorkspaceState.montage` and `PreviewFrame`, rather than a second writer to an App pose ref. Playback sampling may change the transient preview pose, but it does not persist a new selected pose. Shape and expression commits during playback update Video's look and the same mounted Avatar keeps sampling the current playhead, preventing frozen or mismatched poses.

Theme has three explicit paint layers:

1. **Chrome** resolves complete light/dark token sets, including shadow and wash—not only the five existing variables.
2. **Avatar paper** is derived from the resolved theme and passed only to the live stage `Avatar`.
3. **Export BLANC** remains fixed `#ffffff` and never derives from theme.

`ThemePreference` persists `light`, `dark`, or `system`; `resolved` mirrors the effective value onto `document.documentElement.dataset.theme` and `color-scheme`. Banner backgrounds and their plate-owned ink remain scene data. `DEFAULT_PAPER` and engine goldens remain untouched.

The design deliberately does not keep both pages mounted. The active destination mounts one page, avoiding duplicate IDs, ambiguous friction probes, two animation clocks, and excess memory. State survives page changes in its cartridge. Shared engine catalogues remain shared because they are immutable knowledge, not user configuration.

## Synthesis decision

filled by arena later

## Tradeoffs accepted

- We accept two versioned persistence documents and two reducers in exchange for eliminating cross-page writes and stale whole-studio saves.
- We accept query-based destination URLs instead of clean `/image` and `/video` paths in exchange for deep links with no router dependency or server fallback requirement.
- We accept remounting the inactive page in exchange for one SVG, one clock, unique DOM IDs, and unambiguous probes.
- We accept explicit page-branded command names in exchange for compile-time rejection of cross-cartridge commands.
- We accept theme-derived live avatar paper in exchange for keeping engine defaults and exported pixels canonical.

## Alternatives considered

- **One root Pinia store with `image` and `video` branches:** simpler devtools inspection, but its public surface exposes shared-store coordination and permits actions to rewrite both branches. It hides less ownership policy than scoped cartridges.
- **Two routed copies of the current component tree:** visually separates pages but leaves module singletons and Timeline/App dual writers intact. The route hides almost no state complexity, so it is a shallow boundary.
- **Keep both workspaces mounted and toggle visibility:** makes switching instant, but duplicates IDs, clocks, SVG probes, and export targets. Callers and tests must know which hidden tree is authoritative, which is information leakage.

## Open questions and risks

- Should the existing singleton values migrate into both cartridges on first launch, or seed only the destination first opened?
- Is banner scene configuration intentionally independent per destination, as proposed, or should it become a separately named shared asset library selected by each cartridge?
- Should choosing an explicit light or dark theme disable later system changes until the user selects System again?
- Do static hosts and analytics preserve the `?studio=` query during redirects and campaign links?
- Should Image expose every animation state as a still pose, or a curated subset with the same underlying `AnimationState` type?

## Next implementation step

Build and test the two versioned repository parsers plus pure page-specific reducers before changing any Vue component.
