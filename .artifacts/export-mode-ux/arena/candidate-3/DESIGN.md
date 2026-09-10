# Candidate 3 — Split-flap desks

## Problem

Image and Video are two equal benches. The dock renders them as the same sheet twice: identical file icons, a tint dot, a thicker black border for “on.” That is a settings nav, not a studio desk switch. You cannot tell still from motion until you read the hint. The hero already carries the bot; this control only has to make the *kind of work* obvious, then get out of the way.

## Usage (caller’s view)

The public surface does not move. App keeps handing focus and tints in, and focus out. Session still owns the URL.

```vue
<OutputDock
  :focus="focus"
  :image-colour="studio.image.config.value.look.colour"
  :video-colour="studio.video.config.value.look.colour"
  :video-duration="video.transport.total.value"
  @focus="studio.focusDesk($event)"
/>
```

Inside the dock, each desk is still a real link. Middle-click, open-in-new-tab, and Back keep working. The new object is presentation: a flap attitude derived from `focus`, not a second writer.

```ts
flapAttitude(focus, kind) // 'dropped' | 'cocked'
// dropped === you are at this bench
// cocked  === the other bench, waiting to fall
```

## Shape

One **Solari board** in the topbar. Two windows in a single housing, not two bordered cards. Each window holds one `<a data-desk>`. The focused desk’s flap is **dropped** (full face, format chips open, glyph alive). The other flap is **cocked** (hinged back on its top edge, name still readable, chips collapsed). Clicking the cocked flap is the whole interaction: that flap *falls*, the outgoing flap *cocks*. Springy overshoot, then a hard stop — a mechanical tick, not a fade.

Glyphs are the tell, not labels:

- **Image** is a polaroid: square print, frozen bot (body + two eyes), a colour tick in the bottom margin from `imageColour`. No motion.
- **Video** is a film gate: sprocket holes, inner frame, the same bot, a playhead that only scrubs while that flap is dropped. Tint from `videoColour` on the hinge lip.

The housing is monochrome (`--paper` on `--canvas`, `--line` hairline). Desk colour never glows. It lives as a 3px hinge lip and an 8% paper wash on the dropped flap.

Mobile: the same board docks as the existing fixed bottom bar (safe-area, full width). Windows stay side by side so the two desks stay equal; the cocked/dropped attitude is the hierarchy, not a shrink-to-icon. Reduced motion: skip `rotateX`, swap attitude in one frame, freeze the video scrub.

DOM and a11y stay the current contract: `data-output-dock` on the nav, `data-desk="image"|"video"` on the anchors, `hrefForDesk`, `@click.prevent` → `emit('focus')`, `aria-current="page"` only on the dropped desk, visible `dock.image` / `dock.video` text, image-then-video order, dock still first in the page relative to `#studio`.

## Synthesis decision

filled by arena

## Tradeoffs

- A cocked flap is slightly harder to read at a glance than two full cards. We keep the name and glyph visible; only the format line condenses. That is the price of one housing and a physical switch.
- CSS 3D (`perspective` + `rotateX`) is more motion work than a border change. It is still local to `OutputDock.vue`. Stage, session, and location stay untouched.
- Overflow clipping in the window well is what makes the flap feel boxed-in and mechanical. Hit targets stay the full well, not the foreshortened face, so the cocked desk does not become a fiddly target.
- The video playhead is a CSS loop on a glyph, not a live `Avatar` clone. Cloning the hero into the dock would steal from the stage and couple the dock to the engine.

## Alternatives considered

- **Sliding-pill track.** Equal-weight and implementable. Also the default segmented control. Rejected: generic, and it does not make still vs motion readable without labels.
- **Morphing single capsule** (document → filmstrip, one expanding surface). Dense, ElevenLabs-like. Rejected: it hides the other desk and reads as an on/off switch, which HOW.md forbids.
- **Orbital twin** (two orbs, selection pulls to center). Highest novelty on paper, and it rhymes with Stage pickers. Rejected here: the dock lives in a topbar beside brand + Settings. An orbit either grows into a dashboard or shrinks into jewelry. Face-orbit already lost once for trait picking; do not spend that metaphor on two items in chrome.
- **Dual live preview tiles.** Honest about still vs loop. Rejected: they compete with the hero and require miniatures of `Avatar`.
- **See-saw / balance plates.** Fun physics, equal weight. Rejected: playground, not studio, and the vertical travel fights a calm topbar.
- **Today’s bordered sheets.** The problem.

## Open questions

- French and Chinese labels are longer than “Image” / “Video”. The dropped face must keep one line; confirm cocked width at `40rem` with `dock.video` in zh.
- Should the cocked hint stay in the accessibility tree as visible text (tests use `.text()`) even when the visual chips are height-collapsed? Yes — collapse with overflow, do not `display: none` the locale string.
- Dark chrome: hinge lip on `--paper` `#211d1a` needs `color-mix` so ink (`#0a0a0c`) does not vanish. Prototype shows the mix; confirm against `--wash` in `main.css`.

## Next implementation step

Restyle `OutputDock.vue` only. Wrap the existing `v-for` anchors in one `.board` housing. Add polaroid and gate SVGs, `dropped`/`cocked` classes from `focus`, and the 3D flap CSS plus `prefers-reduced-motion`. Do not touch `session.focusDesk`, `hrefForDesk`, Stage, or tests.
