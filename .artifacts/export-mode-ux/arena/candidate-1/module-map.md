# Module map — candidate 1 (Still Plate ↔ Running Strip)

## Files changed

| File | Change | Size |
| --- | --- | --- |
| `src/components/OutputDock.vue` | Rewrite template + `<style scoped>`; reshape the `desks` computed into `DeskPlate[]` (split duration out of the hint, add `frames` / `carrier`). Props, emits, imports, `hex`, `hrefForDesk` untouched. | ~+180 / −95 lines, almost all CSS |

That is the whole change. One file.

## Files deliberately untouched

| File | Why it stays |
| --- | --- |
| `src/App.vue` | Public contract is unchanged: same four props in, same `focus` emit out. The dock stays the second child of `.topbar`, so the DOM-order invariant (dock before `#studio`) holds by construction. |
| `src/studio/session.ts` | `focusDesk` remains the sole writer of focus to doc + URL. The dock never writes. |
| `src/studio/location.ts` | `hrefForDesk` is still the only source of the `href`. Real links, so middle-click / new tab / Back keep working. |
| `src/studio/types.ts` | `DeskKind` unchanged. No new union members, no widening. |
| `src/studio/delivery.ts` | No local format policy in the dock. The hint strings stay i18n keys; deriving them from `desk.delivery` is a separate future change and is explicitly out of scope. |
| `src/components/Stage.vue` | Untouched. It keeps its own `data-desk` on `#studio`; the dock stays earlier in the document so unscoped `[data-desk="video"]` lookups still resolve to the dock. |
| `src/components/ExportBar.vue` | Formats still come from `desk.delivery`. |
| `src/i18n/locales/{en,fr,zh}.ts` | No new keys. `dock.image`, `dock.video`, `dock.imageHint`, `dock.videoHint`, `dock.imageAria`, `dock.videoAria`, `dock.label` all keep their current roles. The duration still comes from `secondesCourtes(videoDuration)`, only rendered in its own `<span>` so it can collapse. |
| `src/assets/main.css` | No new global tokens. Everything is built from `--ink`, `--muted`, `--line`, `--paper` plus the per-desk tint passed as a scoped `--tint` inline style, exactly as the current component passes `fill`. |
| `src/__tests__/App.spec.ts` | Must pass unchanged: `[data-output-dock] [data-desk="image"]` still contains `dock.image`, `[data-desk="video"]` still contains `dock.video`, in `en` and `fr`. |
| `src/__tests__/friction.spec.ts` | Must pass unchanged: `[data-output-dock] [data-desk="video"]` is still a clickable node whose click emits focus. |

## Internal structure of the rewritten component

No new modules. The component stays one file because every added concept is
presentation with no reuse surface:

```
OutputDock.vue
├─ script  DeskPlate[] computed  (label, aria, hint, duration, tint, frames, carrier)
└─ template
   nav.gate            [data-output-dock]  — the housing, one hairline, one ground
   ├─ a.carrier        [data-desk="image"] — plate carrier
   │  ├─ span.theater  aria-hidden          — 1 wide frame + orb + 4 crop marks
   │  └─ span.text                          — .name, .hint
   └─ a.carrier        [data-desk="video"] — run carrier
      ├─ span.theater  aria-hidden          — 5 narrow frames + orbs, .perf ×2, .head
      └─ span.text                          — .name, .hint > .dur
```

## What was considered and rejected as a new module

- **A `DeskTheater.vue` child component.** Rejected as a shallow module: it would
  take five props and contain only markup that exists once per desk in one
  parent. Splitting it buys no reuse and adds a boundary to reason across.
- **A `useDeskPlates` composable.** Same reason. It would be a `computed` with a
  wrapper around it.
- **New CSS tokens in `main.css`** (e.g. `--sprocket`, `--gate-h`). Rejected as
  global surface for one component's private geometry; they live as local custom
  properties on `.gate`.
- **A `frames` or `carrier` field on `DeskKind` / the session.** Rejected: those
  are drawings, not domain state. Keeping them inside the component is what keeps
  the public interface as small as it is today.
