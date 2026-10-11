# How: Image/Video desk focus (grounding)

Source: how-explainer 2026-09-10. Condensed for arena runners.

## Overview

Two long-lived desks (`image` | `video`). Exactly one `focus`. `OutputDock` is a dumb chooser; `session.focusDesk` is the sole writer of focus (doc + URL). Stage remounts on focus via `:key="focus"`. ExportBar formats come from `desk.delivery`.

## Must preserve in any redesign

- Selectors: `data-output-dock` on container; `data-desk="image"|"video"` on the clickable node; `@click.prevent` on that node.
- Real `<a :href="hrefForDesk(kind)">` (not buttons) so middle-click / open-in-new-tab / Back work.
- `aria-current="page"` only on focused desk; nav landmark `aria-label` from `dock.label`.
- Visible text still contains locale `dock.image` / `dock.video`.
- Dock stays first in DOM order relative to `#studio` (unscoped test looks up first `[data-desk=video]`).
- Props in / `focus` emit out. No second focus or URL writer.
- Mobile fixed bottom bar + safe-area + reduced-motion equivalents.
- Do not invent local format policy; hints may derive from delivery formats later but i18n keys exist today.

## Public contract today

```vue
<OutputDock
  :focus="focus"
  :image-colour="..."
  :video-colour="..."
  :video-duration="..."
  @focus="studio.focusDesk($event)"
/>
```

Data shape: `DeskKind = 'image' | 'video'`. Organizing structure: closed union driving one focused desk; UI is a presentation over that union (radiogroup / tablist / link nav), not a boolean switch.
