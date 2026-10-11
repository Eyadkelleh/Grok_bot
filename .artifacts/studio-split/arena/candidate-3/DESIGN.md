## Problem

Grok_bot is one studio, one look singleton, one pose, and an export-time fork. Image and Video must become two rooms whose shape, colour, expression, and (for Video) pose plus montage never write each other, with a menu that makes the rooms obvious, and with first-class light and dark chrome. The engine, bloub goldens, and three paints (chrome, avatar paper `#f5f5f4`, export `BLANC`) stay. There is no router and no Pinia; `#etat=` already owns the hash; `customise.ts` is a process-global trio of refs; Timeline both owns montage and stomps App's pose. Dark chrome cannot retint `DEFAULT_PAPER` or the eyes become grey holes.

## Usage (caller's view)

App talks to one handle. It does not import `customise`, `fond`, or Timeline's cycle as sources of truth. Occupancy is a pebble in the header, not a tab strip and not a Vue Router route.

```ts
import { openStudio, deskView, commitExport, chooseTheme } from './studio'

const studio = openStudio(window)
// first paint: path `/` or `/video`, plus `#etat=` only as a motion share mirror
studio.hydrate()

deskView(studio.occupied)
// still → { fields: shape|face|aura|fond|freeze, timeline: 'hidden', exports: png|svg|banner-png }
// motion → { fields: shape|face|aura|fond|live, timeline: 'docked', exports: gif|mp4|banner-mp4|grab-png }

studio.still.setLook({ shape: 'round', colour: 'orange', expression: 'neutral' })
studio.motion.setLook({ shape: 'hex', colour: 'black', expression: 'wink' })
// still.look.colour is still 'orange'

await commitExport(studio, { kind: 'still', format: 'png' }, svgOnStage)
await commitExport(studio, { kind: 'motion', format: 'mp4', source: 'montage' })
```

```vue
<OccupancyPebble
  :occupancy="studio.occupancy"
  :still-ink="studio.still.look.colour"
  :motion-ink="studio.motion.look.colour"
  @occupy="studio.occupy"
/>
<PhantomStudio v-bind="deskView(studio.occupied)" />
<Timeline v-if="studio.occupancy === 'motion'" :desk="studio.motion" />
```

```ts
chooseTheme(studio.theme, 'dark')
// html[data-theme=dark] retokens chrome only; stage well stays DEFAULT_PAPER
```

## Shape

Two sealed desks, not two copies of one store. `StillDesk` holds `look` + `freeze` (a catalogue still, no clock, no hash). `MotionDesk` holds a separate `look` plus `live` (pose, playing, playhead) plus `montage` plus its own banner. `Look` is a shared *shape*; freeze and live are different types, so a motion pose cannot be assigned onto the still desk without an explicit map. Persistence is one JSON blob per desk (`desk:still`, `desk:motion`). Old `forme` / `couleur` / `expression` / `cycles` / `fond` keys copy once into *both* desks, then go unread.

Occupancy is a cursor, not a mode flag on shared state. `occupy('still' | 'motion')` mounts one PhantomStudio against the occupied desk. The other desk stays in memory and storage; it is never on screen, so `#studio` / `#customise` stay unique and the friction probe sees one export bar. No Vue Router: `history.pushState` writes `/` or `/video`, and `#etat=` remains a motion-only mirror of `live.pose` while Video is occupied. A named `#etat=` on first load occupies Video and canonicalizes to `/video#etat=…`. Still occupancy drops the hash without dropping the motion blob.

The menu is an occupancy pebble: two wells (Still as a square polaroid, Motion as a sprocket) and a colour-filled stone that FLIPs into the occupied well. The stone uses the occupied desk's aura; the empty well shows a dim dot of the *other* desk's aura so both looks are glanceable. Keyboard radiogroup, 48px on mobile. It replaces the fake scroll nav (`studio` / `customise` / `settings` / `about`). Settings is a header mark that reveals the existing section; theme wells live there, same pebble grammar.

Montage moves out of Timeline.vue into MotionDesk. Timeline is a view: `seek`, `play`, `pause`, `editMontage` write the desk. The sampler derives `shownState`; it never writes `live.pose`. Clicking a live pose pauses and commits pose. Pose-as-video uses `live.pose` through existing `poseCycle`; cycle export uses `montage`. The decorative ExportBar `videoSource` radio is deleted. `commitExport` is the only export entry: it reads the occupied desk, refuses cross-kind actions at the type level, and calls today's `exporte` / `exporteMontage` / banner helpers. Image page unwinds timeline clearance (`--chrome`, page padding). Video keeps the docked bar.

Theme is orthogonal. `ThemeChoice` is `light | dark | system`; paint uses `ResolvedTheme`. Tokens live in one sheet as `[data-theme]` maps, including `--canvas`, `--shadow`, `--wash`, and `--stage`. `--stage` is always `DEFAULT_PAPER` (`#f5f5f4`). Chrome can go black; the bot sits in a stone-light well so mask-punched eyes stay cut-outs. Stage `Avatar` gets `paper: DEFAULT_PAPER`. `ouvreCycle` still mattes with `BLANC`. Banner `encre` stays plate-owned. Goldens and L0 MAE are untouched.

Interface depth: `openStudio`, `occupy`, `deskView`, `commitExport`, `chooseTheme`. Callers never coordinate three stores, never see storage keys, never wrap `poseCycle`. Hover previews stay inside PhantomStudio and never persist (per current App.spec).

## Synthesis decision

Filled by arena later.

## Tradeoffs accepted

- We accept a freeze picker on Image (catalogue still, no clock) in exchange for independent posed PNGs without giving Image a second Timeline or a hash writer.
- We accept History API occupancy without Vue Router in exchange for no new dependency and a hash that stays `#etat=`-owned.
- We accept one mounted shell (not keep-alive dual studios) in exchange for unique DOM ids and an honest friction probe; unoccupied desk state lives in the blob, not in a hidden Vue tree.
- We accept a canonical-light stage well in dark chrome in exchange for keeping `DEFAULT_PAPER` and export `BLANC` as separate paints; the bot does not invert with the app.
- We accept copying legacy keys into both desks on first hydrate in exchange for neither page inheriting the other's later edits.
- We accept Video-only PNG as `grab-png` (current pose frame) in exchange for Image remaining a still camera; GIF/MP4 never appear on Image.

## Alternatives considered

- **Two Pinia stores plus Vue Router `/image` `/video` plus a tab strip.** Loses on interface depth: App still wires two stores into one export function, and the menu is generic. Router earns little once occupancy is two values and the hash is already taken.
- **One `Look` record with a `mode` field.** Smaller surface, but Image edits mutate Video. Independent configs cannot be a convention on a shared record.
- **Keep-alive dual PhantomStudio trees.** Preserves hover/playhead in the DOM, and leaks duplicate ids, duplicate `#studio` SVGs, and a friction probe that scores the wrong page.
- **Theme-derived avatar paper.** Dark eyes match dark chrome, and 27 goldens plus mask luminance become colour-sensitive. The stage well is the smaller lie.
- **Image owns no pose at all.** Deeper split, and you cannot still-export Comet without occupying Video. Freeze is the narrower type that still satisfies independent posed stills.

## Open questions and risks

- Should a shared `/video#etat=orbit` also overwrite a persisted motion pose on every visit, or only when the hash is named and the desk was empty?
- Do we migrate banner copy into both desks, or leave banner shared until someone complains that a Video plate leaked into an Image PNG?
- Does `prefers-color-scheme` follow live after a `system` choice, or snapshot once (language today detects and does not persist the detection)?
- Friction `taglineMentionsVideo` is occupancy-specific once the still tagline stops saying video — is the probe split per desk, or do we drop that flag?

## Next implementation step

Replace `customise.ts` / `fond.ts` / Timeline-owned `cycles` with `openStudio` hydration and two desk blobs, then point a single PhantomStudio at `deskView(studio.occupied)` with the occupancy pebble in the header.
