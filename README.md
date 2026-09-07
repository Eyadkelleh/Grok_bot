# Grok_bot

Grok_bot is an SVG avatar studio. You customise a circle-based avatar, animate it, and export PNG, GIF, or MP4.

The product aims for feature parity with [bloub](https://github.com/jeremy-prt/bloub) (MIT), a Vue app by jeremy-prt. See the live demo at [bloub.vercel.app](https://bloub.vercel.app). This repo is an independent recreation. It is not affiliated with, endorsed by, or connected to xAI.

The app is Vite + Vue 3 + TypeScript. The home page shows a circle avatar stub. Later work adds morphing states, the editor, and export.

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
