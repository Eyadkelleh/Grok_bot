## Learned User Preferences

- Prefer `/poteto-mode` for feature work, usability loops, and animation/quality iteration.
- Merge feature tickets into `dev`; keep `main` as the stable/universal branch.
- Treat visual parity with the bloub reference as mandatory; prefer automated shape×animation UI/visual loops over manual spot-checks.
- Studio UX priority: large central bot preview and easy, attractive selection of shape, color, and animation.
- Face/expression picking should match the shape-picker interaction vibe, including motionful transitions between choices.
- While play/export preview is active, changing shape must keep correct live animation behavior (not a frozen or wrong pose).
- Agent-facing export should work over HTTP without a local CLI, aimed at Hetzner VPS hosting.
- Prefer unique, non-generic UX ideas when improving shape/color/animation selection.

## Learned Workspace Facts

- Grok_bot is a Vue + Vite studio for Grok-style avatar animations, stills, and GIF/MP4/PNG/SVG export; package manager is pnpm.
- Visual/behavior reference is https://bloub.vercel.app; parity tests live under `src/testing/visual/parity/` and must not casually loosen L0 MAE budgets.
- Avatar rendering centers on `Avatar.vue` plus `src/engine/` (clock, face, morph, decor, export).
- Default integration branch for parity/feature units is `dev`; work is often scoped as M*/K*/E*/D* units with verify reports under `orchestrate/bloub-parity/reports/`.
- Planned remote agent surface is an HTTP API (`/v1/still`, `/v1/animation`, artifacts, health) for VPS deploy; stdio MCP is secondary.
- Figma GrokBot-Banner-2x6ft designs are intended as selectable stage/video backgrounds for the bot.
- Export and stage geometry in the engine is largely square-centric (still/GIF/MP4 canvas assumptions).
