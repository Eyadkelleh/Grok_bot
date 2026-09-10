## Why

Image and video exports shared one look and one pose, so picking a shape for a PNG also rewrote the MP4. This change makes Image and Video separate desks with their own `Look`, pose, and (for Video) montage, switched from an Output Dock in the header. Light and dark chrome land in the same pass, with the bot stage kept on the canonical light paper so eye cut-outs and export mattes stay stable.

## Scope

- `src/studio/` owns `StudioDoc`, branded `Look<K>`, desk session, theme, `?desk=` location, and `desk.deliver`
- `OutputDock.vue` replaces scroll-nav studio/customise links
- `PhantomStudio.vue` → `Stage.vue` binds one focused desk
- `Timeline.vue` mounts only on Video and derives shown pose from the playhead
- Settings gains Theme (`light` | `dark` | `system`)
- Deletes `customise.ts`, `fond.ts`, decorative `videoSource` radio, and `ui/intent.ts`

Out of scope: plural i18n for "1 animations", lens-switch hover peek, new `#etat=` fragment grammar.

## Tradeoffs

- One `StudioDoc` key instead of ten per-field keys, with crash-safe legacy migration
- Query `?desk=` instead of Vue Router so `#etat=` pose share links keep working
- Canonical-light stage well in dark chrome instead of theme-tinted avatar paper (protects goldens and mask punch-through)

## Blast Radius

Studio shell, persistence keys, export bar, and Timeline all move. Engine, parity goldens, and export `BLANC` stay. First load migrates legacy `forme` / `couleur` / `expression` / `cycles` / `fond` into both desks.

## Verification

- `pnpm test` → 40 files, 365 passed, 1 skipped
- `pnpm test:friction` → 0/18 (owner report)
- Browser on `http://localhost:5173`: Image hexagon+ink stays while Video shows cloud+blue; Timeline only on Video; Dark theme darkens chrome with light stage well; `#etat=` remains in the URL
- Design record: `.artifacts/studio-split/synthesis/`
