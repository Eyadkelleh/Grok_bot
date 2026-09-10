# Throughput checkpoint — rollup section

## Blocking first steps

1. Drop `'banner'` from `PickerBand` and Stage verbs/overlay.
2. Add `RollupPanel` section in App (`#rollup`) hosting FondPanel, nav link, i18n.

## Independent workstreams

n/a: one owner. Stage + App + i18n + tests share the placement change.

## Shared mutable state

Banner plate still commits through desk `Look.banner`. Copy stays `studio.bannerCopy`. No new store. UI move only.

## Smallest safe decomposition

One worker. Touching Stage, App, types, locales, and App.spec together.
