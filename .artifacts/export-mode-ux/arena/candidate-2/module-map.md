# Module map

## Proposed production change

### `src/components/OutputDock.vue`

- Keep the `focus`, `imageColour`, `videoColour`, and `videoDuration` props.
- Keep the `focus` emit and `hrefForDesk` navigation path.
- Keep the `desks` computed view model and its localized labels, aria labels, hints, and tints.
- Replace the two bordered sheet cards with one shared shuttle rail.
- Give Image and Video distinct inline SVG glyphs.
- Derive carriage position and active styling from the existing `focus` prop.
- Preserve `data-output-dock`, both `data-desk` anchors, `aria-current`, `@click.prevent`, link order, mobile fixed positioning, safe-area padding, and reduced-motion behavior.

## Optional token change

### `src/assets/main.css`

No change is required. The design uses `--ink`, `--muted`, `--line`, `--paper`, and each desk's existing color tint. If implementation exposes shared motion values later, add only neutral duration/easing tokens.

## Explicitly untouched

### `src/components/Stage.vue`

The stage, hero avatar, `.verbs` toolbar, and desk remount behavior do not change.

### `src/studio/**`

`DeskKind`, `hrefForDesk`, desk delivery policy, session ownership, and URL synchronization do not change.

### `src/i18n/**`

Existing `dock.image`, `dock.video`, aria labels, hints, and duration formatting remain the source of visible copy.

### Export engine and delivery modules

Format availability and export execution stay owned by each desk's `delivery` state.

## Prototype artifact

### `.artifacts/export-mode-ux/arena/candidate-2/prototype.html`

Self-contained interaction study. It demonstrates the rail, travelling carriage, glyph motion, responsive bottom dock, keyboard-visible anchors, URL-safe anchor semantics, and reduced-motion fallback. It is not production code.
