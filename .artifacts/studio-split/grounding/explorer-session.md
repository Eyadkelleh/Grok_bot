# How explorer: session state ownership

Agent: e304f557-ded4-4bc5-9413-893c90523a92

## Summary

Appearance, banner, language, and timeline cycles each persist through their own localStorage keys. Pose lives in App plus the URL hash. Still vs video only forks at export. A split Image/Video redesign cannot keep the current `customise.ts` singleton or hash-as-nav, and theme tokens must stay off the export canvases.

## Hard couplings

1. One look store (`customise.ts`) is process-global.
2. One pose in App; Timeline playback stomps it.
3. Hash owns `location.hash` for pose; path routes can coexist with `#etat=`.
4. Video/banner export gated on mounted Timeline cycle even for pose-as-video.
5. Live still (PNG clones stage) vs dated video (off-screen Avatar).
6. Theme ≠ export matte ≠ avatar paper (three paints).
7. New storage keys need `NomStocke` entries.
8. Hover stays off persistence.
9. No dual Timeline writers on one montage key.
10. Share URLs are pose-only today.
