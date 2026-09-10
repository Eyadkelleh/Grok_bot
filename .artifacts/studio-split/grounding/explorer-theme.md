# How explorer: theme and CSS

Agent: 2a8fad41-abf2-4797-a7ae-c6442b54a3a6

## Summary

Studio is light-only. Five CSS tokens on `:root`, `color-scheme: light`, Settings is language/about only. Banner plates already have independent light/dark ink. Dark mode must retokenize chrome (and black-alpha shadows) without touching avatar paper, export white, SVG mask luminance, or banner `encre`.

## Key constraints for redesign

- Tokenize page canvas separately from `--paper` (`#f5f5f4` vs white surfaces).
- Keep three layers distinct: chrome tokens, avatar `DEFAULT_PAPER`, export `BLANC`.
- Banner `encre` / wordmarks stay plate-owned.
- Theme persistence parallel to `langue` on `document.documentElement` + `stockage`.
- Prefer `--shadow` tokens over hardcoded `rgb(0 0 0 / …)`.
- One token sheet for all pages; do not fork palettes per Image/Video.
