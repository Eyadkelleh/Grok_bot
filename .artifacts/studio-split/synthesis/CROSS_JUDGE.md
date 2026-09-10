# Arena cross-judge

Candidate 1 is the best base. Candidate 2 is close and has the strongest navigation concept, but Candidate 1 encodes more of the hard invariants and preserves the full export surface.

## Scores

| Criterion | Candidate 1 — Desk + lens | Candidate 2 — Cartridge + Output Dock | Candidate 3 — Sealed desks + pebble | Candidate 4 — Diptych Latch |
| --- | ---: | ---: | ---: | ---: |
| 1. Independent configs | 5 | 5 | 4 | 2 |
| 2. Handy menu | 4 | 5 | 4 | 4 |
| 3. Large preview preserved | 5 | 4 | 5 | 4 |
| 4. Theme depth | 5 | 4 | 5 | 3 |
| 5. Interface depth | 5 | 5 | 4 | 3 |
| 6. Fit to existing engine | 5 | 5 | 3 | 4 |
| **Total / 30** | **29** | **28** | **25** | **20** |

## Candidate assessments

### Candidate 1 — Desk + lens switch

This candidate gives each output a branded, immutable `Look<K>`, its own pose, and a discriminated config; Video alone has a non-optional montage. It also removes the Timeline pose stomp by deriving the rendered pose from transport state. The desk API hides previews, persistence, format policy, and export assembly while keeping all current still, motion, and banner formats typed by desk. Its single versioned document, sole persistence writer, legacy migration, exclusive mount, and explicit three-paint treatment form the most complete design. The cost is breadth: seven modules, a nine-member desk interface, a new fragment grammar, and an ambitious lens hover that temporarily replaces the hero with the other desk's bot. The lens is distinctive but less immediately legible than Candidate 2's Output Dock and needs a prototype before adoption.

### Candidate 2 — Cartridge + Output Dock

This is the cleanest runner-up. Separate repositories and separately branded command unions make sibling mutation structurally difficult, and `useStudioPage(area)` gives callers a small `state`, `preview`, `dispatch`, and `export` boundary. Query navigation fits the no-router baseline, controlled Timeline playback removes the second pose writer, and the file-shaped Output Dock is the clearest mobile-ready menu in the arena. However, the type sketch omits `banner-png` and `banner-mp4` even though the prose promises banner exporters. It also places `exportMatte` inside `PaintLayers`, which weakens the claim that export BLANC sits outside theme ownership, and it leaves persistence behavior for `video/play`, `pause`, and `seek` commands ambiguous. `PreviewFrame` contains pose and paper but not previewed look values, so page components may still need to combine `state` and `preview`.

### Candidate 3 — Sealed desks + occupancy pebble

The canonical-light stage well is a coherent answer to dark chrome: it preserves eye cut-outs, engine defaults, export BLANC, and banner ink without letting theme cross paint boundaries. The single mounted `PhantomStudio`, derived playback pose, independent desk blobs, freeze pose, and occupancy pebble all fit the product well. But the public snapshots and patch objects remain broadly mutable, and `Studio` publicly exposes both desk handles. More importantly, `ExportRequest` is not correlated with the `Desk` argument: `planExport(stillDesk, motionRequest)` compiles and requires a runtime refusal despite the design's claim that cross-kind requests are unrepresentable. Its `/video` History API route also needs server history fallback even without Vue Router, contrary to the stated tradeoff. The pebble is original, but “Still/Motion” is less direct than the required “Image/Video.”

### Candidate 4 — Diptych Latch

The latch is distinctive, query navigation is pragmatic, exclusive mounting avoids duplicate IDs, and the export bridge reuses the existing engine. Yet the design misses the first rubric invariant: `StillWorkshop.previewPose` is fixed to `Idle`, so Image does not own a selectable pose. The type sketch also claims cross-workshop export safety while accepting an uncorrelated `Workshop` plus `ExportIntent`; callers even pass the active cycle into `motionIntent`, leaking export assembly back into the page. `WorkshopKind` is branded as an intersection, but `StillWorkshop extends WorkshopBase<'still'>` and the analogous motion declaration do not satisfy that constraint as written. Theme persistence exists, but the stage-paper policy remains undecided, so the three-layer behavior is not fully specified.

## Recommended base

Use **Candidate 1** as the base.

It wins on the hardest requirement: future code cannot quietly collapse Image and Video back into shared state. Branded immutable looks, discriminated configs, a Video-only non-optional montage, per-desk format types, and derived playback pose protect the boundary at compile time. It also covers the existing banner export surface, centralizes migration and persistence, keeps one avatar mounted, preserves existing engine and export paths, and removes the current Timeline/App dual-writer bug. Candidate 2 has a smaller-feeling page API, but its missing banner formats and less complete preview contract leave more policy for implementers to invent.

Keep Candidate 1's document, desk, delivery, and derived-frame boundaries. Treat the lens-switch hover as optional presentation, not part of the architecture.

## Graft shortlist

1. **Candidate 2's Output Dock:** port the two file-shaped destinations, Video duration readout, sticky mobile placement, and explicit `aria-current`. It is clearer than the lens switch while staying non-generic.
2. **Candidate 3's canonical-light stage well:** consider it as the default dark-theme policy if visual tests show that theme-derived avatar paper harms the bloub cut-out effect.
3. **Candidate 4's inactive-workshop glyph:** add a small silhouette/colour cue to the Output Dock only if it stays legible and does not mount a second `Avatar`.

## Shipping blockers

- **All candidates:** none can ship from the design alone. The implementation needs migration, corrupted-storage, cross-desk independence, playback-plus-shape-change, theme persistence, paint-layer isolation, deep-link, exclusive-mount, and every export-format test.
- **Candidate 1:** do not ship the new hash grammar until legacy `#etat=` links and browser back/forward behavior have tests. Do not ship lens hover without usability and reduced-motion checks.
- **Candidate 2:** restore typed banner still/video exports; separate export BLANC from the theme return type; specify that transport commands do not persist playhead state; resolve previewed look assembly.
- **Candidate 3:** replace `/video` with query/hash navigation or add a verified history fallback; correlate desk and export request in the type signature; remove mutable public snapshots and overly broad patches.
- **Candidate 4:** add an Image-owned pose; fix the invalid workshop branding; correlate workshop kind with export intent; move cycle selection and payload assembly behind `exportWorkshop`; choose one stage-paper policy before implementation.
