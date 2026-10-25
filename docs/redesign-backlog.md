# Redesign backlog

What still runs on an old placeholder model. Pick items by number; a session runs them as a
bulk round (see "Bulk rounds" in `docs/model-redesign.md`). Delete an item once its pick is in
the game.

**States** lists the close-ups the gallery needs. **Variants** marks things that repeat a lot
on a map, where the owner may approve several options to be picked at random; those get 5
compatible options instead of 3 different ones.

## Terrain

Drawn in `src/render/terrain-layer.ts`; colours in `TERRAIN_COLORS` (`src/render/palette.ts`).

| # | thing | states | notes |
|---|---|---|---|
| 1 | Ground: grass and meadow | — | Flat coloured squares with a per-tile shade. Meadow must stay readable as "olive trees go here". Variants. |
| 2 | Water | — | Flat blue squares; no shore, no waves. |

## Buildings

Old models live in `src/render/models.ts`, each wired in `MODELS`.

| # | thing | size · workers | states | notes |
|---|---|---|---|---|
| 5 | Granary | 4×4 · 18 | no workers / with workers; stock from empty to full | Counted sacks or bins. Negative appeal: utilitarian. |
| 7 | Carding Shed | 2×2 · 8 | no workers / with workers; fleece stock | Takes fleece from sheep. Pair with the shepherd look. |
| 8 | Growers' Lodge | 2×2 · 12 | no workers / with workers; olive stock | Sends growers to olive trees (redesigned: gnarled and twin-trunk). |
| 9 | Olive Press | 2×2 · 12 | no workers / with workers; olives in, oil out | The press beam and jars carry it. |
| 15 | Podium | 2×2 · 4 | idle / performing (`isPerforming`) | Philosophers speak here. |
| 17 | Sanctuary building stages | 13×8 to 18×12 · 60 | stages 0–4 (`builtStages`), then finished | Shared by all three gods: staked outline, platform, columns, cella and beams, roof, scaffolding, material piles. |
| 18 | Sanctuary precincts | as above | finished | Each god's garden: Demeter, Athena, Hephaestus (`PRECINCT_GARDENS`). One agent per god. |
| 19 | Ruins and vacant lot | 1×1 / 2×2 | ruins smouldering / burning; vacant lot | Ruins are left by fire or collapse; the vacant lot is a house plot nobody has moved into. |

## People and animals

Drawn in `src/render/walker-layer.ts` as `Part` lists; see "Walkers and animals" in
`docs/model-redesign.md`. One agent per group.

| # | group | figures |
|---|---|---|
| 20 | Service walkers | water carrier, tax collector, superintendent |
| 21 | Peddlers | food, fleece and oil peddlers |
| 22 | Culture walkers | philosopher, athlete, actor, philosopher trainee, actor trainee |
| 23 | Cart pushers | cart pusher, and the fleece, olive, oil, wood, marble, bronze and sculpture carts and supplies |
| 24 | Buyers | food, fleece, olive, oil and bronze buyers |
| 25 | Gatherers | lumberjack (with log), quarryman (with block), miner (with ore), olive grower |
| 26 | Townsfolk | settler, artisan, shepherd |
| 27 | Sheep | shorn, half-grown, woolly |

Workers already standing in redesigned buildings fix some of these looks: the water carrier
(Fountain), athlete (Gymnasium), axeman in the lumberjack's olive tunic (Timber Mill),
superintendent (Maintenance Office). Match them.

## Suggested batches

- **Easy:** 7, 8, 9, 15, 19 — small, few states.
- **Medium:** 5, 1, 2.
- **Hard:** 17, 18 (big footprints, many stages), and the walker groups 20–27, which
  need the walker gallery set-up first.
