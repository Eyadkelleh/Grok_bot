# How explorer: UI shell navigation

Agent: 3585a92d-84bc-41a6-ac6a-6113bb3589fe

## Summary

One scroll page: field toolbar (shape/face/aura/backdrop/motion) plus always-on timeline. Not Image vs Video pages. Hash is reserved for pose sharing (`#etat=`). Theme is light-only. Leftover `flow.*` strings are unused three-step video wizard copy.

## What Image/Video menu must do

- Replace nav IA (scroll anchors), not flatten `data-mode` pickers.
- Keep per-page field toolbar / orbital wrapper CSS.
- Conditional chrome: Timeline + cycle export on Video; stills on Image.
- Do not reuse `flow.*` as Image/Video labels.
- Theme stays orthogonal (Settings/header), off banner plates and export `BLANC`.
- Compose with `#etat=` or use path/state without stealing the hash.
