# Studio Shuttle

## Problem

The current chooser makes Image and Video look like two files in a settings panel. Repeated document icons hide the difference between a still and a timeline, while borders do all the selection work.

The chooser should feel like moving the same bot between two equal studio desks. It must stay compact enough to leave the avatar as the hero.

## Usage

The user sees two named stops joined by a thin rail:

- **Image** uses a square aperture with a single captured dot.
- **Video** uses a three-frame filmstrip with a moving playhead.

A tinted carriage rests behind the focused stop. Choosing the other stop sends the carriage across the rail, changes the active glyph, and reveals that desk's delivery line: `PNG · SVG` or `GIF · MP4 · 4s`.

Both stops remain full anchor targets. Browser navigation, middle-click, open-in-new-tab, Back, keyboard focus, and `aria-current="page"` keep their existing behavior. Motion stops under `prefers-reduced-motion`.

## Shape

The control is one **transport rail**, not two cards and not a segmented capsule.

Each anchor owns half of the rail but has no enclosing border. A shared hairline joins two circular stops. The selected stop gains:

1. a desk-color wash behind its glyph;
2. a dark center mark;
3. a delivery line that rises into view;
4. the travelling carriage, animated with a short overshoot.

The inactive stop stays legible and clickable. Its glyph keeps enough structure to explain the destination, but its delivery line folds away. Image and Video carry equal visual weight because their stops, labels, and hit areas are symmetric.

Desktop uses a compact horizontal shuttle beside the brand and site links. Mobile fixes the same control to the bottom, adds safe-area padding, and stretches both anchor targets without changing their order.

## Synthesis decision

filled by arena

## Tradeoffs

- The shared carriage needs one CSS custom property or focus class on the container. This is presentation state derived from `focus`, not a second focus writer.
- The rail metaphor is less conventional than tabs. Clear labels, distinct glyphs, and visible format text offset that learning cost.
- Hiding the inactive delivery line reduces clutter but makes its formats less prominent. The prototype keeps the text in the DOM and reveals it on hover or keyboard focus.
- The overshoot must stay restrained. The avatar remains the only large moving object.

## Alternatives considered

### Rejected: sliding segmented pill

It is efficient but reads like a generic filter. Its rounded thumb also competes with the existing `.verbs` pills.

### Rejected: flipboard face

A single face that flips between Image and Video hides the unselected destination and weakens direct navigation.

### Rejected: orbital twins

Orbiting mini-bots match the picker language but steal motion and attention from the hero avatar.

### Rejected: dual preview tiles

Still and looping bot thumbnails explain the modes well, but duplicate the hero and restore the two-card footprint this redesign is meant to remove.

## Open questions

- Should the inactive delivery line appear only on hover/focus, or remain faintly visible at wider desktop widths?
- Should the carriage tint use the desk color at a fixed low alpha or clamp very light colors against `--paper`?
- Is `videoDuration` stable enough to animate number changes, or should only desk changes move?

## Next implementation step

Replace the two `.sheet` surfaces in `OutputDock.vue` with a shared `.shuttle` rail while preserving the current computed desk data, anchor attributes, `hrefForDesk`, and `focus` emit. Add a focused-container modifier derived from the existing `focus` prop, then verify anchor behavior, DOM order, mobile safe-area spacing, reduced motion, and the existing OutputDock tests.
