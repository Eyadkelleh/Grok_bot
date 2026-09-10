# Arena FRAME: OutputDock Image/Video chooser redesign

## Artifact each candidate produces

A design package under its output path:

1. `DESIGN.md` — rationale shaped per architect `rationale-template.md` (Problem, Usage, Shape, Tradeoffs, Alternatives, Open questions, Next step). Leave Synthesis decision as "filled by arena".
2. `module-map.md` — files touched, what stays untouched.
3. `types.ts` — any new view-model types / props signatures with `not implemented` bodies if needed. Prefer keeping `DeskKind` and session API unchanged.
4. `prototype.html` — a single self-contained HTML+CSS(+minimal JS) mock of the chooser interaction at ~desktop topbar width and a mobile bottom-bar note. Use studio tokens: `--ink #1c1917`, `--muted #57534e`, `--line #d6d3d1`, `--paper #ffffff`. No purple glow AI look. Motionful selection. Distinct glyphs for Image vs Video.

## Rubric (picker only; candidates do not see this)

1. **Delight & distinctiveness** — Feels like a creative studio desk switch, not a settings segmented control clone. Motion and glyphs make Image vs Video instantly readable.
2. **Fit to Grok_bot chrome** — Works in the topbar beside brand + Settings/About; mobile bottom bar; monochrome + desk colour tint; does not steal attention from the hero avatar.
3. **Invariant safety** — Preserves anchors, `data-*`, a11y, props/emit, DOM order constraints from grounding/HOW.md.
4. **Interface depth** — Public surface stays small (`focus` + colours + duration in, `focus` out). Complexity lives in presentation, not session/API churn.
5. **Implementability** — Can land as a surgical `OutputDock.vue` (+ maybe tiny CSS tokens / SVG) without redesigning Stage or session.
6. **Clarity of formats** — User still sees PNG·SVG vs GIF·MP4·duration without clutter.

## Runners

| N | Model | Output path |
| --- | --- | --- |
| 1 | claude-opus-5-thinking-high | `.artifacts/export-mode-ux/arena/candidate-1/` |
| 2 | gpt-5.6-sol-medium | `.artifacts/export-mode-ux/arena/candidate-2/` |
| 3 | cursor-grok-4.6-high | `.artifacts/export-mode-ux/arena/candidate-3/` |
| 4 | composer-2.5 | `.artifacts/export-mode-ux/arena/candidate-4/` |

## Shared prompt contract

See runner prompt in the Task messages. Each must commit to one structurally distinct interaction concept and name rejected alternatives in DESIGN.md.
