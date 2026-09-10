# Deep search: Image vs Video mode chooser

Date: 2026-09-10. Sources: design-system articles, creative-tool docs, 60fps.design motion shots, Grok_bot studio prefs.

## Problem with the current control

`OutputDock.vue` renders two side-by-side "sheet" cards (file icon + tint circle + label + format hint). Selected state is a thicker black border. Icons are identical for both desks. The control reads as a utilitarian nav, not a studio mode switch. Measured against product prefs, it fails "unique, non-generic UX" and does not match the motionful shape/face picker vibe.

## Pattern taxonomy (what industry uses)

| Pattern | When it wins | Risk for this product |
| --- | --- | --- |
| Segmented control / sliding pill | 2 equal-weight alternatives that change local view | Page-wide desk switch is heavier than a local filter; can feel generic if only a pill |
| Tab list (underline / raised) | Persistent scope, desktop chrome | Easy to look like settings chrome, not creative |
| Icon + label rail (sidebar tabs) | Multi-mode AI studios | Too heavy for a topbar with brand + nav |
| Compact Image/Video toggle beside prompt | ElevenLabs Creative playground | Hides format hints unless expanded |
| Morphing button ↔ sheet | Lumy / Edits (60fps) pickers | Strong delight; more motion work; mobile bottom-sheet already exists for dock |
| Dual preview tiles (still frame vs looping scrub) | Creative tools that sell the difference | Needs live bot preview miniatures; costlier |

Consensus from segmented-control guidance (Eleken, Groto, VA.gov): Image vs Video are equal alternatives with no on/off hierarchy, so a switch/`role=switch` is wrong. A radiogroup or tablist of mutually exclusive options is right. Persistent page-wide focus argues for more presence than a tiny pill, but not for two large bordered cards.

## Distinctive directions worth prototyping

1. **Sliding-pill desk track** with living glyphs (still frame vs play-scrub), format chips inside the active segment, springy thumb.
2. **Mode capsule with morphing glyph** (document → filmstrip) and a single expanding surface that rewrites the hint line; closer to ElevenLabs density without losing desk identity.
3. **Orbital twin** echoing Stage shape/face orbital pickers: two orbiting mini-bots or tinted orbs; selection pulls one to center. Highest uniqueness; must stay accessible.
4. **Desk flip / flipboard** where the control itself flips between Still and Motion faces with shared colour tint from each desk.

Avoid: purple glow AI aesthetic, generic document icons for both, border-only selection, on/off toggle metaphor.

## Constraints from product prefs

- Large central bot preview stays hero; dock must not grow into a dashboard.
- Motionful transitions between choices (match shape/face picker energy).
- Monochrome studio tokens (`--ink`, `--paper`, `--line`, `--muted`) plus per-desk colour tint already available.
- Prefer unique ideas over another generic segmented control clone.
