# Candidate 1 — the desk

## Problem

The studio has no Image mode and no Video mode. It has one bot, one set of pickers, and a fork that happens the instant you press an export button. Every value the user picks is a module-level Vue ref — `shape`/`colour`/`expression` in `customise.ts`, `bannerId` in `fond.ts`, `animationState` in `App.vue`, `cycles` inside `Timeline.vue` — so the PNG and the MP4 are necessarily the same bot. Splitting them means unpicking three tangles at once: configuration ownership, a navigation layer that is really `scrollIntoView` with `@click.prevent`, and a theme layer that does not exist. Four constraints shape the answer. Twenty-seven committed goldens pin `DEFAULT_PAPER` to `#f5f5f4`, so the avatar's default paper cannot move. The bloub parity budgets measure eye geometry, not colour, so a theme cannot break them but a golden can. `NomStocke` is a literal tuple, so every new storage key is a type edit — two desks × five values would be ten. And `Timeline.vue` already writes `App.vue`'s pose ref, which is why `PhantomStudio` has to emit `stop-playing` on every click; that second writer must not be duplicated per desk.

## Usage (caller's view)

A **desk** is one output kind and everything needed to produce it. There are two, they share nothing they should not, and each one exports itself.

```ts
// main.ts
import { createStudioSession, STUDIO } from './studio'

const session = createStudioSession()   // loads the doc, migrates legacy keys, applies the theme
app.provide(STUDIO, session)
```

```vue
<!-- ImageDesk.vue — the still page -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDesk } from '../studio'
import Avatar from './Avatar.vue'

const desk = useDesk('image')
const svg = ref<SVGSVGElement | null>(null)
onMounted(() => desk.attachStage(() => svg.value))
</script>

<template>
  <Avatar ref="svg" v-bind="desk.frame.value" :label="t('app.botAria')" />

  <ShapeOrbit
    :selected="desk.config.value.look.shape"
    @hover="desk.preview($event && { field: 'shape', value: $event })"
    @pick="desk.commit({ field: 'shape', value: $event })"
  />

  <ExportBar :status="desk.delivery.value" @deliver="desk.deliver($event)" />
</template>
```

Three things the caller no longer does. It does not compute `previewShape ?? shape` — `desk.frame` already folded that in. It does not assemble an export payload from three stores — `desk.deliver('png')` does. And it cannot ask the image desk for an MP4: `FormatFor<'image'>` is `'png' | 'svg' | 'banner-png'`, so `desk.deliver('mp4')` fails to compile.

```vue
<!-- VideoDesk.vue — the motion page -->
<script setup lang="ts">
const desk = useDesk('video')
</script>

<template>
  <Avatar v-bind="desk.frame.value" />           <!-- pose derives from the playhead -->
  <Timeline
    :montage="desk.montage.value"
    :transport="desk.transport"
    @edit="desk.editMontage($event)"
  />
  <button @click="desk.clipCurrentPose()">{{ t('video.justThisPose') }}</button>
</template>
```

```ts
// what independence looks like in a test
const s = createStudioSession()
s.image.commit({ field: 'shape', value: 'droplet' })
expect(s.video.config.value.look.shape).toBe(DEFAULT_SHAPE)   // untouched

// and the type layer, checked by tsc rather than at runtime
s.video.commit({ field: 'shape', value: 'cloud' })
const stolen: Look<'video'> = s.image.config.value.look        // ts error: owner 'image' vs 'video'
```

```vue
<!-- Settings.vue — theme -->
<script setup lang="ts">
const { theme } = useStudio()
</script>
<template>
  <ThemeChoice :choice="theme.choice.value" @choose="theme.choose($event)" />
  <!-- 'light' | 'dark' | 'system'; theme.resolved is derived, never stored -->
</template>
```

Navigation is one control, the **lens switch**, sitting where the dead `<h1>` + tagline pair sits today, directly above the hero:

```vue
<LensSwitch
  :focus="session.focus.value"
  @focus="session.focusDesk($event)"
  @peek="session.peekDesk($event)"
/>
```

Two segments, Image and Video. Hovering or focusing the inactive one calls `peekDesk`, and the hero bot **morphs into the other desk's bot** through the existing morph engine, then morphs back on leave. The switch is a live preview of the other artifact rather than a label on a tab.

## Shape

**Data structures first.** `Look<K extends DeskKind>` is an immutable value carrying an `owner: K` field. That single field does the work three ways: it brands the type so a commit cannot land on the wrong desk through a generic helper, it survives JSON so a corrupted doc is detectable, and it reads as documentation at every call site. `readonly` on every field means a Look is a value, never a cell — two desks holding the same reference still cannot observe each other's edits. And `customise.ts`'s exported computeds are deleted, so there is no global appearance to reach for. Independence is not enforced by review; it is unreachable, per encode-lessons-in-structure.

`DeskConfig` is a discriminated union: `ImageConfig` has a look and a pose, `VideoConfig` adds a non-optional `Montage`. That non-optionality deletes the over-broad `if (!cycle) throw new Error('no montage')` guard in `App.vue`, which fires today whenever `Timeline` is unmounted even for pose exports that never read the cycle.

**One document, one key, one writer.** `StudioDoc` holds `focus`, `theme`, `shared.bannerCopy`, and the two configs under a single `studio` key. `NOMS` grows by one entry, not ten, and the six legacy keys become a read-only `LegacyKey` type so `ecris('forme', …)` stops compiling. Migration seeds both desks from the same legacy look, so nobody's bot changes on upgrade; it writes `studio` before dropping the legacy keys, so a crash between the two is a no-op on the next load, per make-operations-idempotent.

**Derive instead of sync, which is where the pose bug dies.** `DeskFrame` is one computed carrying exactly what `<Avatar>` needs: shape, colour, expression, pose, banner, paper, playhead, blocks. Hover preview, playback, and theme all resolve inside it. On the video desk, `frame.pose` is `playing ? blockAt(blocks, at).state : (preview ?? config.pose)` — the transport never *writes* the pose, so there is no second writer, no `stop-playing` emit chain, and changing shape mid-playback keeps the correct animation because shape and pose arrive from independent sources. Per separate-before-serializing-shared-state, the two desks are per-actor state and the doc is the merge at the write boundary.

**The three paint layers stay in three owners, deliberately not behind one enum.** Chrome is `applyChrome(theme)` setting `documentElement.dataset.theme`, with CSS owning the token values — the same shape as the existing `documentElement.lang` watcher. Stage paper is `stagePaper(theme)`, the only theme-dependent paper in the system, reaching exactly one place: `DeskFrame.paper` on the mounted stage avatar. The delivery matte stays `BLANC` in `ui/export.ts` and `DEFAULT_PAPER` is not touched, so the goldens hold. A single `paintFor(layer, theme)` would have been tidier to look at and would have been the "public options expose internal stages" red flag — it invites a caller to pass `'delivery-matte'`. Instead `runDelivery` has no `paper` parameter at all. The invariant is encoded by absence, which is the cheapest encoding there is.

Dark mode's real problem is the eye holes, not the chrome: the mask punches the eyes through to reveal `paper`, which reads as invisible today only because `#f5f5f4` coincidentally equals the page background. `stagePaper` is what fixes that, and its blast radius is one prop on one component.

**Interface depth.** A desk's public surface is nine members. Behind them it hides the storage schema and every key, the preview-versus-commit rule, playback-derived pose, montage reduction, format availability policy (`banner-*` only with a plate, `mp4` only when `videoPossible()`), export payload assembly across four different export entry points, and the theme-derived paper. What stays exposed is `Block`, `Cycle`, `Montage`, `AnimationState`, and the id types — engine domain types the design is required to reuse, not transport types. `App.vue`'s 90-line `surExport` switch and the `{ action, videoSource }` event payload both disappear; the call chain from a click to a downloaded file is button → `desk.deliver` → `ui/capture`, three files.

**Only the focused desk mounts.** State lives outside the component tree, so unmounting costs nothing and remounting restores everything including which picker band was open. That keeps `#studio`, `#customise`, `#animations` unique, keeps `App.spec`'s "exactly one `svg[role=img]`" assertion true, and keeps `probeFriction`'s unqualified `first match wins` selectors pointing at the right desk. The lens-switch peek reuses the *same* mounted avatar rather than a second one, so the invariant survives the one feature that looks like it would break it.

**What this deliberately does not do.** No Vue Router: the fragment is already app-owned, so `location.ts` takes the whole of it (`#video/orbit?play`) and gets deep links with no dependency and no dev-server history fallback. No Pinia: two desks provided once are not a store problem. No second renderer. No per-desk banner *copy* — the plate is per desk because it is composition, the words are shared because they are one event's content. No theme-aware banner ink: plates own `encre` and the exported banner is the artifact. No pose-versus-cycle radio: it was decorative, and `clipCurrentPose()` replaces it with state you can see on the track.

## Synthesis decision

Base is Candidate 1 (desk ownership). Grafted from the arena:

- Primary menu is Candidate 2's **Output Dock** (file-shaped Image/Video), not the lens switch. Lens peek is deferred.
- Dark theme uses Candidate 3's **canonical-light stage well** (`DEFAULT_PAPER`), not theme-derived avatar paper.
- Desk deep links use `?desk=image|video`. Legacy `#etat=` pose share stays. Candidate 1's new fragment grammar is deferred until tested.

Full record: `SYNTHESIS.md`.

## Tradeoffs accepted

- We accept a one-time migration path and a version field in exchange for one storage key instead of ten and a single persistence writer.
- We accept that `Look` is immutable, so every picker click allocates a new object, in exchange for cross-desk mutation being physically impossible rather than merely discouraged.
- We accept an `owner` field that is redundant at runtime in exchange for `tsc` catching a mis-routed commit, and for a corrupted doc being detectable rather than silently wrong.
- We accept that switching desks unmounts the other one, losing its DOM and any in-flight CSS transition, in exchange for unique DOM ids, a working friction probe, and one live avatar.
- We accept `desk.attachStage()` as a small imperative seam — the desk needs the on-screen SVG that still export serialises — in exchange for not rewriting still capture to an off-screen deterministic render in this change.
- We accept that `App.spec.ts`'s "nav does not touch the hash" assertion is deliberately inverted, because the fragment is now the routing surface and pose-only share links must still resolve.
- We accept that theme adds `--shadow` and `--wash` tokens to replace roughly eight literal `rgb(0 0 0 / …)` values across four components, which is mechanical churn with no behaviour change, because black alpha over a dark surface is invisible.

## Alternatives considered

**Two singleton store modules (`image.ts`, `video.ts`) mirroring `customise.ts`.** The smallest diff and the shallowest interface. It exposes ten writable computeds instead of hiding anything, grows `NOMS` by nine entries, and leaves every caller assembling its own export payload from whichever module it happened to import — exactly today's problem with a prefix. Nothing stops a component importing the wrong one, so independence stays a review convention. Lost on interface depth and on the rubric's "encoded in types, not convention."

**A generic look-store factory, `createLook(namespace)`.** Solves duplication and nothing else. It hides persistence but exposes the same bag of refs, so callers still coordinate a look store, a pose ref, a montage ref, and an export function to produce one file. It also cannot express "video has a montage and image does not" — the factory is uniform where the domain is not — so the `no montage` guard and the decorative source radio both survive. This is the middle the desk shape deliberately walks past.

**Vue Router with `/image` and `/video` routes, plus two Pinia stores.** The conventional answer, and it buys real deep links and per-route code splitting. It costs two dependencies, a dev-server history fallback, and a second source of truth for "which desk is focused" that must be kept in step with the doc's persisted focus. Hash routing gets the same deep links from a fragment the app already owns, and focus stays derived from one place.

**Keep one shared look and fork only pose/montage.** Cheapest of all, and it fails the ask outright: changing the image bot's colour would still repaint the video bot. Named here only because it is what the current code would drift into if the split were done at the export layer rather than the ownership layer.

## Open questions and risks

- Should a still export serialise the live on-screen SVG, as it does today, or re-render off-screen at the desk's pose and settle it? The second is reproducible and would delete `attachStage` entirely, but it changes what a PNG of `Idle` looks like, since live liveliness drift is currently baked in. Which do you want?
- Should the shared link carry the look? `#video/orbit` reproduces pose and desk but not shape, colour, or expression — which is already true today, and independent looks make the gap more visible. Extending the fragment to `#video/orbit?s=droplet&c=…` is cheap; is it wanted, and does a link that overwrites the recipient's saved look need a confirmation step?
- Does the lens-switch peek read as delightful or as the bot glitching? It morphs the hero into the *other* desk's bot on hover. It reuses the shape picker's existing preview vibe, but nothing in the app currently previews a whole page's worth of state, so this is the one interaction worth prototyping before committing.
- Should the bot invert with a dark theme, or stay canonical-light on a dark stage? `stagePaper` makes either a one-line answer, but nobody has made the product call, and it is the difference between eyes reading as cut-outs and eyes reading as pale blobs.
- Does `system` belong in the theme choice at launch? The language code sets a precedent for detect-but-don't-persist; theme has no equivalent decision, and adding `system` means a `matchMedia` listener that a plain two-way toggle would not need.
- `app.tagline` promises "download the video" and `frictionProbe`'s `taglineMentionsVideo` flag scores it at weight 1. A two-desk IA needs new copy in three languages, and the friction score will move. Is a scored regression there acceptable, or should the flag become desk-scoped alongside `montageLabeled`?

## Next implementation step

Write `src/studio/doc.ts` — `StudioDoc`, `parseStudioDoc`, `migrateLegacy`, `loadDoc`/`saveDoc` — with unit tests covering a fresh install, a legacy upgrade, a crash between the `studio` write and the legacy delete, and a corrupted doc; everything else in the sketch reads its state from that shape.

## Red-flag screen

**Shallow module.** A desk exposes nine members and hides the storage schema, the preview rule, playback-derived pose, montage reduction, format availability policy, and payload assembly across four export entry points. One call completes one operation: `desk.deliver('png')`, `desk.commit(facet)`. No public option names an internal stage.

**Information leakage.** Storage keys exist only in `doc.ts`; the fragment format only in `location.ts`; `videoPossible()` and the four export entry points only in `delivery.ts`. `StudioDoc` is marked `@internal` and stays out of the barrel. The types that do cross the boundary — `Block`, `Cycle`, `Montage`, `AnimationState`, `ShapeId` — are engine domain types the design is required to reuse, not transport or storage shapes.

**Temporal decomposition.** `doc.ts` is the one module that could be mistaken for a load/save stage. It is not split into load, validate, transform, and save; it owns the storage schema and its migration knowledge as one body, and it is the only writer. `desk.ts` groups by ownership rather than execution order: preview, commit, playback, and delivery all run at different times and all protect the same decisions about one desk's artifact.

**Pass-through.** Two candidates, both defended. `session.stageFrame` adds the peek-overrides-focus policy on top of `deskOf(focus).frame`. `session.deskOf` adds type-level dispatch that generic callers (the location codec, the friction probe) need. The genuine pass-throughs are the ones this design deletes: `App.vue` forwarding six `v-model`s into `PhantomStudio` which forwards them into `CustomisePanel`, and `ExportBar` emitting a payload that `App.vue` re-switches on.
