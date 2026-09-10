# Candidate 1 — The Gate: one plate, one run

Concept name: **Still Plate ↔ Running Strip**.

One sentence: the chooser is a single film-gate housing two *physically different*
carriers — a photographic plate (one wide frame, crop marks) and a film run (five
narrow frames, sprocket perforations, playhead) — and picking a desk is threading
that carrier through the gate, not sliding a thumb across two identical cards.

## Problem

`OutputDock` today is two bordered "sheet" cards. Both draw the *same* document
icon with a tinted circle in it; the only difference between Image and Video is
the word underneath and the format hint. Selection is a thicker border. Three
consequences:

1. **The glyphs carry no information.** A user scanning the topbar cannot tell
   which desk is which without reading. The one thing that actually distinguishes
   the desks — one frame versus many frames over time — is nowhere in the visual.
2. **Selection is inert.** A border thickening is not a transition. The rest of
   the studio (shape picker, face picker, Stage verb pills) moves; the dock does
   not, so it reads as settings chrome bolted onto a creative tool.
3. **It costs hero space for nothing.** Two equal bordered cards with two-line
   text each occupy a lot of topbar for a binary that is already legible from a
   single well-drawn object.

The measured failure against product prefs: not unique, not motionful, and the
"monochrome + desk tint" budget is spent on a decorative circle inside a
stationery icon rather than on desk identity.

## Usage (caller's view)

`App.vue` does not change. That is the point of the whole candidate: everything
below is presentation inside one component.

```vue
<OutputDock
  :focus="focus"
  :image-colour="studio.image.config.value.look.colour"
  :video-colour="studio.video.config.value.look.colour"
  :video-duration="video.transport.total.value"
  @focus="studio.focusDesk($event)"
/>
```

Props in, one `focus` emit out. `studio.focusDesk` remains the sole writer of
focus to the doc and the URL. No new props, no store reads from inside the dock,
no injection of `STUDIO`, no local format policy. The rendered markup keeps two
real `<a :href="hrefForDesk(kind)">` children of a `<nav data-output-dock>`, image
first, each carrying `data-desk`, `aria-label`, and `aria-current="page"` only
when focused.

Adding the concept to the codebase is a rewrite of `OutputDock.vue`'s template and
`<style scoped>` block plus about fifteen lines of its `<script setup>`. Nothing
else in `src/` is touched.

## Shape

### The object

A single rounded housing (the **gate**) with one hairline border, `--paper`
ground, `21rem × 3rem` in the topbar. Inside it, two carriers sit side by side,
separated by one hairline splice line. Each carrier is one `<a data-desk>`.

Each carrier is: a **theater** (the carrier drawing) followed by a two-line text
stack (`name`, `hint`).

### Identity is the frame count, permanently

The two theaters are drawn from the same primitive — a `frame` box with an orb in
it — at different counts, and this never animates away:

- **Image**: exactly **one** frame, wide (roughly 4:5), one large tint orb centred.
  A single exposed plate.
- **Video**: **five** narrow frames in a row, five smaller orbs at staggered
  vertical offsets so the run reads as a pose sequence.

So even when a desk is *not* focused, its glyph says what it is. This is the fix
for the current control's biggest failure and it costs no motion budget.

### Selection is a *choreography per desk*, not a shared thumb

This is the structural commitment. A segmented control moves one indicator
between two symmetric slots. Here each desk has its own physical "engage"
behaviour drawn from its own craft vocabulary:

**Engaging Image — an exposure.**
1. The carrier grows (`flex-grow` 1 → 2.15, 320ms, `cubic-bezier(.2,.9,.2,1)`).
2. Four **crop marks** (corner Ls, hairline, `currentColor`) scale in at the frame
   corners, staggered 40ms clockwise.
3. The orb blooms: `scale(.4) → 1` with the tint going from 55% to full opacity,
   and a one-shot 260ms highlight sweep crosses the frame like a light table
   passing under it.

**Engaging Video — a thread-up.**
1. The carrier grows the same way, so the housing width is conserved.
2. **Sprocket perforations punch in** along the top and bottom edges of the
   carrier, revealed left to right by an animating `clip-path` over a repeating
   dot gradient (420ms). The strip literally grows the holes that let it run.
3. Once threaded, the perforation gradient scrolls continuously
   (`background-position-x`, 900ms linear infinite) — a slow, low-contrast film
   transport, not a spinner.
4. A 1px ink **playhead** sweeps the five frames, 1.6s linear infinite, and the
   five orbs pick up a staggered bob.
5. The **duration chip** (`· 2.4s`) slides out from behind the format hint
   (`max-width` 0 → 4rem + opacity, 240ms). Unfocused video shows `GIF · MP4`;
   focused shows `GIF · MP4 · 2.4s`.

Disengaging is the same choreography reversed and faster (180ms), and the whole
housing takes a 4px **advance nudge** on any switch — a single translateX settle,
like a film advance lever clicking over.

### Colour

Monochrome tokens carry all structure: hairlines are `--line`, frames and text
are `--ink`/`--muted`, `--paper` is the ground. The per-desk tint appears in
exactly two places: the orb fill, and a 10% `color-mix` wash on the frame ground
of the focused carrier. Unfocused orbs keep their tint at 55% opacity so both desk
colours stay visible at a glance. No glow, no gradient, no shadow bloom.

### Width behaviour

Carriers share one housing width via `flex-grow`, so the dock never resizes and
never pushes the brand or `Settings`/`About` around. Focused ≈ 13rem, unfocused ≈
8rem. Both labels and both format hints stay fully readable in both states; only
the video duration chip collapses.

### Mobile

Same object. The housing becomes the fixed bottom bar: full width, `border-radius`
0, `border-top` only, `padding-bottom: calc(.5rem + env(safe-area-inset-bottom))`.
Carriers go 1 / 1.6 flex so the focused desk still reads as engaged. The splice
hairline and both theaters survive; only the highlight sweep is dropped for
thumb-scale rendering.

### Reduced motion

`prefers-reduced-motion: reduce` removes all transitions, the transport scroll,
the playhead sweep, the bob, the highlight sweep, and the advance nudge. The
*static* differences survive intact and still communicate state: frame count,
perforations present versus crop marks present, orb opacity, carrier width, tint
wash, duration chip. This is deliberate — no state in this control is
motion-only.

## Synthesis decision

filled by arena

## Tradeoffs accepted

- **Asymmetric choreography costs more CSS than a sliding thumb.** Two engage
  animations instead of one indicator transform. Accepted: symmetry is exactly
  what makes segmented controls feel generic, and the two desks are not the same
  kind of thing.
- **Five frames plus perforations is denser drawing than one icon.** At 3rem
  housing height the frames are ~9px wide. Accepted: they are hairline boxes with
  a dot, not detail, and the count reads pre-attentively even when individual
  frames do not resolve.
- **Ambient transport motion runs whenever video is focused**, regardless of
  whether the video transport is actually playing. Accepted rather than adding a
  `playing` prop: the motion means "this is the moving-image desk", not "playback
  is running", and widening the public surface to sync a decorative loop would be
  a bad trade against interface depth.
- **Film vocabulary applied to a GIF/MP4 web exporter is a metaphor, not a
  literal.** Accepted: it is the only vocabulary in which "one frame" and "many
  frames" are already visually codified, and it is natively monochrome.
- **No `role="radiogroup"` / `role="tablist"`.** Accepted, and deliberate — see
  open questions.

## Alternatives considered

Rejected, with reasons. I did not hedge toward any of these.

1. **Sliding-pill segmented control with living glyphs** (RESEARCH direction 1).
   The obvious answer and the one I most expect a sibling candidate to take. A
   thumb sliding between two symmetric slots is the single most reproduced
   control on the web; dressing it with better glyphs improves the glyphs, not the
   control. It also encodes Image and Video as interchangeable slots, which is
   precisely the framing the current design already fails at.
2. **Morphing capsule with a document → filmstrip glyph** (direction 2). Rejected
   because morphing the glyph destroys the *unfocused* desk's identity: at any
   moment only one glyph exists, so the user can never see what they are switching
   to. It also needs a second interaction (expand) to expose formats, which
   violates "clarity of formats" without clutter.
3. **Orbital twin — two orbiting mini-bots, selection pulls one to centre**
   (direction 3, the highest-uniqueness option). Rejected on chrome fit: an
   orbiting ornament in the topbar competes with the hero avatar for exactly the
   attention the product wants spent on the hero, and there is no honest place to
   hang `PNG · SVG` / `GIF · MP4 · 2.4s` off an orbit without it becoming a
   dashboard. Uniqueness that costs the hero is a bad buy here.
4. **Desk flip / two-card deck shuffle** (direction 4). Rejected on the same
   ground as (2) plus an invariant problem: with one card face-up and one tucked
   behind, the unfocused desk's label is a sliver, so `dock.video`'s visible text
   effectively depends on hover — dead on touch.
5. **Dual live bot preview tiles (still frame vs looping scrub).** Genuinely the
   most persuasive option and rejected on cost and hierarchy: two live Avatar
   miniatures in the topbar means two more render loops and a second thing on
   screen doing what the hero already does better.
6. **`role="switch"` / on-off toggle.** Rejected on semantics — two equal
   alternatives with no default-off state, as the segmented-control literature in
   RESEARCH says outright.
7. **Collapsing the unfocused desk to a vertical spine** (books-on-a-shelf).
   Rejected: `Image` rotated 90° does not fit a 2.4rem topbar height, so the
   locale label stops being visible and the App.spec assertion becomes a lie about
   what the user can read.

## Open questions and risks

- **Roles.** HOW pins a `<nav>` landmark with real links and `aria-current="page"`.
  RESEARCH argues for radiogroup or tablist. These conflict: `role="radio"` on an
  `<a href>` destroys the link affordance that middle-click and Back depend on. I
  keep links and treat `aria-current` as the selected signal. Worth a screen-reader
  pass to confirm "Image desk, current page" is understood as the active desk;
  the fallback is adding `aria-describedby` text, not changing roles.
- **Five frames at mobile scale.** Needs a device check. If the run smears, drop
  to four frames under `40rem` — a CSS-only change since the count is a static
  list.
- **Continuous transport motion and battery/CPU.** Two infinite CSS animations on
  cheap properties (`background-position-x`, `transform`) on a 3rem element. Low
  risk, but they should be paused when the tab is hidden if the app already has a
  visibility hook; otherwise leave to the browser.
- **Tint contrast.** A very pale desk colour (e.g. a near-white) makes the orb
  vanish against `--paper`. Today's control has the same exposure. Mitigation if
  it bites: keep a hairline `--line` stroke on the orb, which also reads better in
  dark theme.
- **Locale width.** `zh` labels are short; `fr` "Vidéo" is fine. A future long
  locale could crowd the unfocused carrier at 8rem. The text stack should
  `min-width: 0` and the hint should be allowed to truncate before the name does.

## Next implementation step

One commit, one file: rewrite `src/components/OutputDock.vue`.

1. In `<script setup>`, keep props/emits/`hex`/`hrefForDesk` exactly as they are.
   Change the `desks` computed to emit a `DeskPlate` per desk (`frames`,
   `carrier: 'plate' | 'run'`, `duration` split out of `hint` so the chip can
   collapse). No new imports beyond what is already there.
2. Replace the template: `<nav class="gate" data-output-dock>` wrapping two
   `<a class="carrier" data-desk>` with a `<span class="theater" aria-hidden="true">`
   (frames + orbs, plus `.marks` for image / `.perf` + `.head` for video) and a
   `<span class="text">` with `.name`, `.hint`, and `.dur`.
3. Replace `<style scoped>` with the housing/carrier/theater rules, the two engage
   choreographies, the mobile bottom-bar block, and a `prefers-reduced-motion`
   block that nulls every animation and transition introduced.
4. Run `pnpm test` — `App.spec.ts` (locale text in `[data-desk]`) and
   `friction.spec.ts` (click on `[data-output-dock] [data-desk="video"]`) must pass
   unchanged. If either needs editing, the change has broken an invariant and the
   diff is wrong.
5. Visual check both themes and both locales at desktop and `<40rem`.
