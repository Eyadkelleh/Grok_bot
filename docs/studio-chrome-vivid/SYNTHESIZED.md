# Studio chrome vivid — synthesized design

Parent issue: https://github.com/Eyadkelleh/Grok_bot/issues/55  
Branch: `feature/studio-chrome-vivid` (base `dev`)

## Synthesis decision

**Base:** Candidate 2 — Aura Spectrum Rail (`base-spectrum-rail.md`, `sketch-base.ts`).  
**Why:** Distinctive wayfinding, clear hover vs open vs focus, one stable picker shelf, narrow public surface (`resolveChromeAccent` + CSS tokens), preserves peek/config/frame and playback invariants. Cross-judge scored it 30/30.

**Grafts**

| From | Keep |
|---|---|
| Candidate 1 | Typed `VERBS` table mapping label ↔ `PickerBand` ↔ `data-mode` ↔ peek attribute. English-first language lead: English always visible; active non-English promoted beside it. |
| Candidate 3 | Reuse `layout="compact"` / `layout="strip"` for the shelf. Delete `setField`; call `desk.openBand` from the template. |
| Candidate 4 | Small redundant mode glyphs next to English labels. Explicit CSS split: idle hover ≠ open ≠ focus-visible. |

**Rejected this pass**

- Living facet miniatures / shared Chip renderer (too wide).
- Settings drawer/sheet (follow-up issue only).
- In-well constellation and fixed per-mode hues (collision + not bot-colour-driven).
- `chromeAccentStyle` if it only forwards `cssVars` (delete on implement).

## Domain shape

```ts
// Single naming authority — model the domain, do not scatter conditionals
type VerbId = 'shape' | 'expression' | 'colour' | 'pose'
type VerbDataMode = 'shape' | 'expression' | 'colour' | 'state' // Motion = state

const VERBS: Record<VerbId, {
  dataMode: VerbDataMode
  labelKey: string
  railIndex: 0 | 1 | 2 | 3
  peekAttr: 'data-shape' | 'data-expression' | 'data-colour' | 'data-state'
}> 
```

Accent module: `src/ui/chromeAccent.ts` exports only `resolveChromeAccent(colour)`.  
Reads `COLOR_BY_ID` / `resolveColour`. Returns `{ sourceHex, displayHex, rgb, contrastHex, cssVars }`.  
App applies `cssVars` on the studio shell from **committed** desk colour. Stage bead uses committed colour; hero still reads `frame`.

## Visual contract

1. Verb landmarks above one chromatic rail built from `COLORS` stops.
2. Open: luminous bead + accent band under that verb (`aria-pressed`).
3. Hover: neutral tick only. Never shares the open rule.
4. Focus: ink outline for contrast.
5. Closed band: no bead; faint centred accent glint.
6. Picker shelf under the rail (not orbital overlay). Aura uses the same shelf. Closed pickers: `inert` + `aria-hidden`.
7. Nav: short accent trace + optional `aria-current` via IntersectionObserver. Keep `@click.prevent`.
8. Settings theme: tinted wells + arrow keys. Language: English-first disclosure. GitHub: quiet card with accent rule.

## Invariants (do not break)

- Pickers ↔ `config`; hero ↔ `frame`; peek for hover only.
- Colour peek: add `data-colour` branch in pointer handler; bead stays committed.
- Pose preview refused while playing; only pose commit pauses transport.
- `--stage*` stays outside theme blocks; export never reads theme/accent tokens.
- Test hooks: `data-mode`, `data-nav`, `data-theme-choice`, `data-locale`, `#settings`, `#about`.
- New copy in en/fr/zh; `Cle` typed from `fr.ts`.

## Implementation order (cloud)

1. **Blocking:** `chromeAccent.ts` + tokens in `main.css` + `VERBS` table.
2. **Stage:** spectrum rail, shelf, glyphs, colour peek, delete `setField`.
3. **Settings + nav:** English-first language, theme wells, nav accent / `aria-current`.
4. Verify: unit/friction tests + visual studio smoke on the matching surface.

## Follow-ups (not this PR)

- Settings/About as sheet drawer (Candidate 3).
- Living facet chips if the rail proves insufficient uniqueness after ship.
