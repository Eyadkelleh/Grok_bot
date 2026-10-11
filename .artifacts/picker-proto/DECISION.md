# Picker prototype decision

## Recommendation

Ship **Variant B — Trait filmstrip** for Shape, Face, and Aura.

## Why

Orbit fails because Face tiles are tiny full-body bots. The body silhouette wins. Expressions disappear. Filmstrip uses trait-specific glyphs (silhouette / eye crop / fat swatch), one grammar for all three bands, and keeps the hero large and empty.

Focus dial is readable but hides comparison. Worse for Face (16 options) and Aura (12 colours).

## Evidence

Screenshots under Cursor screenshot cache from `http://127.0.0.1:8765/`:
- A + Face. Ring of mini-bots. Expressions illegible.
- B + Face. Eye crops labeled. Instantly scannable.
- C + Face. One large candidate. Clear but sequential.
- B + Aura. Fat named swatches. Same strip grammar.

## Next

Hand to Feature playbook. Replace Stage orbital CSS for appearance bands with a filmstrip of trait glyphs. Keep hover-preview → commit. Motion can stay orbital or join later.
