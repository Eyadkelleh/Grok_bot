# Grok_bot

Grok_bot is an SVG avatar studio. You customise a circle-based avatar, animate it, and export PNG, GIF, or MP4.

The product aims for feature parity with [bloub](https://github.com/jeremy-prt/bloub) (MIT), a Vue app by jeremy-prt. See the live demo at [bloub.vercel.app](https://bloub.vercel.app). This repo is an independent recreation. It is not affiliated with, endorsed by, or connected to xAI.

The app is Vite + Vue 3 + TypeScript. `Avatar` is the reusable SVG: pass `size`, `shape`, `expression`, `gaze`, and `colour`. The studio morphs that avatar, offers a right-rail palette of the 14 animation states, and a bottom timeline to order those states into a looping montage. Export downloads the current frame as SVG or PNG. Later work adds motion export.

## Run it

```sh
pnpm install
pnpm dev
```

Open the URL Vite prints, usually http://localhost:5173.

```sh
pnpm test
pnpm build
```

`pnpm test` runs Vitest once. `pnpm build` type-checks with `vue-tsc` and writes `dist/`.
