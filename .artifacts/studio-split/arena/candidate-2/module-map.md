# Module map

```text
AppShell.vue
  ├─ OutputDock.vue
  ├─ theme/index.ts
  └─ studio/location.ts
       │
       ├─ ImagePage.vue ─┐
       └─ VideoPage.vue ─┼─ studio/workspace.ts
                         │    ├─ studio/image.ts
                         │    ├─ studio/video.ts
                         │    └─ studio/persistence.ts
                         │
                         └─ studio/export.ts
                              └─ existing ui/capture + bannerExport + engine
```

## `studio/workspace.ts`

The only public feature boundary. Exposes `useStudioPage('image' | 'video')`; wires one page-scoped repository, reducer, preview session, and export assembler. It never creates a root mutable state object containing both workspaces.

## `studio/image.ts`

Owns `ImageWorkspaceState`, `ImageCommand`, defaults, parser migration, and pure reducer. Knows still-specific invariants and has no montage imports.

## `studio/video.ts`

Owns `VideoWorkspaceState`, `VideoCommand`, defaults, parser migration, pure reducer, and playback session. Adapts the existing Timeline into a controlled view; only this module imports montage operations.

## `studio/persistence.ts`

Creates one repository per literal area and maps it to one versioned storage key. Parses unknown JSON into domain state behind the repository boundary. It does not expose raw storage records.

## `studio/export.ts`

Accepts a complete typed Image or Video document plus one export request and performs the operation end to end. It adapts to existing capture/banner APIs and owns abort controllers, progress, source selection, filename derivation, and the fixed BLANC matte.

## `studio/location.ts`

Owns the `?studio=` schema, History API writes, `popstate`, and fallback to Image. Components receive only `StudioArea`.

## `theme/index.ts`

Owns preference persistence, system resolution, complete palette selection, document token application, and live-stage avatar paper. It cannot configure export or banner paint.

## `OutputDock.vue`

Renders the two file-shaped destinations from `StudioShell.activeArea`. It emits one `open(area)` intent and contains no routing or workspace logic.

## Page components

`ImagePage.vue` and `VideoPage.vue` compose the shared presentational Avatar/picker components around their respective page handles. They do not import storage, engine export functions, or each other.

## Dependency rules

- Domain page modules may import immutable engine types and catalogue functions.
- Existing engine and export modules never import studio workspace or theme modules.
- Theme may supply `avatarPaper` to the live preview only; export receives no theme object.
- Image cannot import cycles, Timeline, or video commands.
- No module above `workspace.ts` sees persistence keys or raw JSON.
