# Picker prototype — decision scope

## Decision

Which interaction pattern makes Shape, Face, and Aura selection scannable and delightful while keeping the large central bot preview?

## Why the current orbital ring fails

- Face band still mounts full-body mini Avatars. At ~orbital tile size the body silhouette dominates. Expressions are nearly identical dots.
- Shape tiles compete with the same problem. Similar blobs at small size.
- Aura uses a different side-rail pattern, so muscle memory breaks across the three appearance traits.
- Orbit geometry burns space on empty stage and keeps thumbs tiny.

## Moodboard directions (prior art)

1. Modular avatar makers (AvatarLab, profile generators). Category tabs + item grid with trait-specific previews, live hero.
2. Game character creators. Large preview + trait-specific glyphs, not miniature full characters for every facet.
3. Color picker patterns. Named swatches, large hit targets, immediate feedback on the subject.

## Variants to build (structurally distinct)

| ID | Name | Idea |
| --- | --- | --- |
| A | Orbit (baseline) | Today's ring of mini-bots |
| B | Trait filmstrip | Large horizontal cards under hero; Shape = silhouette, Face = eye crop, Aura = fat swatch |
| C | Focus dial | One oversized candidate beside the hero; arrows / swipe cycle; Enter commits |

Scratch: `.artifacts/picker-proto/`
