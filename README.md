# Grok_bot

Grok_bot is an SVG avatar studio. You customise a circle-based avatar, animate it, and export PNG, GIF, or MP4.

The product aims for feature parity with [bloub](https://github.com/jeremy-prt/bloub) (MIT), a Vue app by jeremy-prt. See the live demo at [bloub.vercel.app](https://bloub.vercel.app). This repo is an independent recreation. It is not affiliated with, endorsed by, or connected to xAI.

The app is Vite + Vue 3 + TypeScript. `Avatar` is the reusable SVG: pass `size`, `shape`, `expression`, `gaze`, and `colour`. The studio morphs that avatar, offers a right-rail palette of the 14 animation states, and a bottom timeline to order those states into a looping montage. Export downloads the current frame as SVG or PNG, and the montage as GIF or MP4. The video encoder loads only when you ask for an MP4.

## Run it

```sh
pnpm install
pnpm dev
```

Open the URL Vite prints, usually http://localhost:5173. Share a pose with `#etat=idle`, `#etat=thinking`, `#etat=orbit` — the same slugs as bloub. Add `&stop` to open it paused.

```sh
pnpm test
pnpm build
```

`pnpm test` runs Vitest once. `pnpm build` type-checks with `vue-tsc` and writes `dist/`. `vercel.json` rewrites every path to `index.html`, so a Vercel deploy keeps those hashes working.

## Visual correctness

Avatar pictures are locked by one `VISUAL_CASES` table in `src/testing/visual/`. Add a row with the props you would pass to `<Avatar>`, a `rendAt` seek if the frame is mid-morph, and the claim (eye count, dot count, silhouette oracle). Then run `pnpm test`.

If the picture change is intentional, update goldens with `pnpm test:visual:regen` and review the JSON diff.

`pnpm test:ui-avatar` runs the visual specs and the full shape × animation integrity matrix. The matrix checks every shape and state, face expressions, and morph midpoints for valid paths, frame bounds, glyph eye rules, and eye containment. This automated loop replaces manual clicking for Avatar integrity.

Settled Idle eye centres are compared to a committed [bloub](https://github.com/jeremy-prt/bloub) dump in `src/testing/visual/__parity__/`. `pnpm test` fails if radius-normalized centre or radius MAE exceeds the locked budgets in `src/testing/visual/parity/idle.spec.ts`. Refresh the dump from a local bloub clone with `pnpm dump:parity`; tests do not need that clone.

Shape changes and face-state transitions keep the customiser silhouette throughout the live morph. `pnpm test` covers both paths.

For an optional human pass, start `pnpm dev --port 5174` and print studio URLs with `node scripts/ui-avatar-loop.mjs --urls`. Dump standalone SVG from the same mounted cases with `node scripts/ui-avatar-loop.mjs --dump /tmp/grok-bot-visual`. That dump uses Vitest, jsdom, and `svgAutonome`, not a headless browser.
