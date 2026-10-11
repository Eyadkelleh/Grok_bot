# Synthesis note

## Base

**Candidate 1 (desk + lens)** — [Claude design](794adf35-e473-434b-8100-4cb4912b0bad). Cross-judge [Cross-judge](97f0b0b5-239e-470e-8519-7f639b70b235) scored 29/30. Parent agrees.

Why: branded immutable `Look<K>`, discriminated configs, Video-only non-optional montage, `desk.deliver` interface depth, derived playback pose (kills Timeline stomp), one `StudioDoc` writer, exclusive mount, three paint layers without a leaky `paintFor` enum.

## Grafts

1. **From Candidate 2 — Output Dock as primary menu.** File-shaped Image / Video destinations, sticky mobile dock, `aria-current="page"`, Video duration cue. Replaces lens-switch as the *primary* navigation. Lens peek stays optional later, not required for v1.
2. **From Candidate 3 — canonical-light stage well.** Dark chrome keeps `--stage` / live `Avatar` paper at `DEFAULT_PAPER` (`#f5f5f4`). Eyes stay cut-outs. Export `BLANC` and goldens untouched.
3. **From Candidate 2/4 — query desk navigation.** Use `?desk=image|video` (or `?studio=`) for desk focus. Keep legacy `#etat=` pose share intact. Do **not** ship Candidate 1's new fragment grammar in v1 (cross-judge shipping blocker).

## Rejected

- Candidate 2 as base: missing typed banner formats in sketch; `exportMatte` inside theme paint layers.
- Candidate 3 as base: uncorrelated `ExportRequest` vs `Desk`; `/video` History fallback contradiction.
- Candidate 4 as base: Image pose fixed to Idle; workshop branding / export correlation broken in types.
- Lens hover as architecture: delightful but optional; needs prototype. Output Dock ships first.
- Theme-derived avatar paper: rejected for v1 in favour of canonical-light stage well.
- Vue Router / Pinia: not earned.

## Product calls made (reversible; do not block)

| Question | Decision |
| --- | --- |
| Still PNG path | Keep live on-screen SVG capture (`attachStage`) for v1 |
| Theme choice | `light \| dark \| system`, persist explicit choice |
| Stage in dark mode | Canonical-light well (`DEFAULT_PAPER`) |
| Banner | Plate per desk; copy shared |
| Labels | Image / Video (not Still / Motion) |
| Desk URL | `?desk=image\|video`; `#etat=` remains pose-only |
| Decorative ExportBar radio | Delete |

## Verification of synthesis

- Independence encoded in types (branded Look, FormatFor).
- Menu is Output Dock (handy, non-tab).
- Preview stays one hero Avatar.
- Theme tokens + stage well + BLANC separated.
- Engine/export reused; no router.
- Cross-judge blockers for C1 addressed by dropping new hash grammar and deferring lens.
