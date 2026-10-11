# Preliminary grounding (pre-how-synthesis)

Source: explore pass on Grok_bot studio ownership. How explorers will refine this.

## Product ask

1. Separate image (still) and video (animation) generation into distinct areas/pages.
2. Each area owns its own shape, colour, expression, and related pickers. No shared singleton look.
3. Handy, simple menu for switching and discovering these areas.
4. Light and dark app themes integrated cleanly.

## Current shape (constraints)

- No Vue Router, no Pinia. `App.vue` mounts one studio shell.
- Appearance singleton in `src/customise.ts` (localStorage).
- Pose singleton in `App.vue` (`animationState`), stomped by Timeline playback.
- Banner singleton in `src/fond.ts`.
- Still vs video only forks at ExportBar / export paths.
- Theme is light-only (`main.css` `color-scheme: light`). No dark tokens.
- Nav is hash-scroll links: studio, customise, settings, about.
- PhantomStudio has exclusive field toolbar: shape | expression | colour | fond | state.
- Timeline is always-on fixed bottom bar.
- Engine (`Avatar.vue`, clock, export) can be instantiated twice; catalogues stay shared.

## Redesign must honor

- Bloub visual parity budgets stay intact for avatar rendering.
- Studio UX priority: large central bot preview; easy attractive pickers.
- Face picking should match shape-picker motionful vibe.
- While play/export preview is active, shape changes must keep correct live animation.
- Prefer unique non-generic menu UX.
- Merge target branch preference: `dev`.
- Package manager: pnpm.

## Open product forks for design (not human-blocked if prototype settles)

- True routes vs in-app mode switch with two stores.
- Shared banner vs per-mode banner.
- Whether video page always shows Timeline; image page never does.
- Theme persistence and system preference follow.
