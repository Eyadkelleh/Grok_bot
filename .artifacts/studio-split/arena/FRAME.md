# Arena frame: studio Image/Video split + theme

## Artifact each candidate produces

One design package under its output path:

- `DESIGN.md` shaped per architect rationale template (Problem, Usage, Shape, Tradeoffs, Alternatives, Open questions, Next step). Synthesis decision left blank for the graft phase.
- `types.ts` with core TypeScript types and function signatures. Bodies throw `new Error('not implemented')` or use `// TODO` pseudocode only.
- Optional `module-map.md` if the design spans more than three modules.

## Rubric (picker grades these)

1. **Independent configs.** Image and Video each own appearance + pose (and video owns montage). Changing one never mutates the other. Encoded in types, not convention.
2. **Handy menu.** Primary navigation makes Image vs Video obvious in one glance, stays simple on mobile, and does not bury export or preview. Prefer unique non-generic UX over a default tab strip clone.
3. **Large preview preserved.** Central bot preview stays the hero. Pickers stay attractive and motionful (shape/face vibe).
4. **Theme depth.** Light and dark are first-class token sets with persistence. No hard-coded light-only chrome left as the only path. Banner art independence from app theme is acknowledged.
5. **Interface depth.** Small public surface hides store dualism, persistence keys, and export payload assembly. Callers do not coordinate three stores to export.
6. **Fit to existing engine.** Reuses Avatar/engine/export. Does not invent a second renderer. Honors no-Pinia/no-router baseline unless the design justifies introducing one with a clear gain.

## Runners

1. `claude-opus-5-thinking-high` → `.artifacts/studio-split/arena/candidate-1/`
2. `gpt-5.6-sol-medium` → `.artifacts/studio-split/arena/candidate-2/`
3. `cursor-grok-4.6-high` → `.artifacts/studio-split/arena/candidate-3/`
4. `composer-2.5` → `.artifacts/studio-split/arena/candidate-4/`

## Shared grounding path

`.artifacts/studio-split/grounding/` (HOW.md after explainer lands; PRELIMINARY.md until then)

## Synthesis output

`.artifacts/studio-split/synthesis/` (DESIGN.md + types.ts + SYNTHESIS.md)
