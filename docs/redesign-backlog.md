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
| 28 | Main Road | straight, corner, the shore end, under a roadblock | Pale slabs in `pavingMeshes` (`src/render/world-layer.ts`). Paved stone that reads as grander than dirt roads, which join it at T-junctions. The future route of traders. |

## Buildings

Old models live in `src/render/models.ts`, each wired in `MODELS`.

| # | thing | size · workers | states | notes |
|---|---|---|---|---|
| 5 | Granary | 4×4 · 18 | no workers / with workers; stock from empty to full | Counted sacks or bins. Negative appeal: utilitarian. |
| 7 | Carding Shed | 2×2 · 8 | no workers / with workers; fleece stock | Takes fleece from sheep. Pair with the shepherd look. |
| 8 | Growers' Lodge | 2×2 · 12 | no workers / with workers; olive stock | Sends growers to olive trees (redesigned: gnarled and twin-trunk). |
| 9 | Olive Press | 2×2 · 12 | no workers / with workers; olives in, oil out | The press beam and jars carry it. |
| 29 | Weaver | 2×2 · 12 | no workers / with workers; fleece in, cloth out (0–4 bolts) | Placeholder in `src/render/weaver-models.ts`: workshop, blue lean-to, an upright loom with blue weave, bolts by the road. Fine cloth is the Traders' Guild's luxury, so it should look precious, not like the Carding Shed. Also redo the stored-cloth load in storehouse bays (`clothBolts` in `src/render/kit/cloth.ts`). |
| 34 | Scriptorium | 2×2 · 12 | no workers / with workers; papyrus or fleece in, scrolls out (0–4) | Placeholder in `src/render/scriptorium-models.ts`: a whitewashed hall with a columned porch, a writing desk, a papyrus bundle or fleece by the door, scrolls by the road. Scrolls are what the scholars read, so it should look learned, not industrial. Also redo stored papyrus and scrolls in storehouse bays (`storedPapyrus`, `storedScrolls` in `src/render/kit/scrolls.ts`). |
| 37 | Scroll Vendor | 2×2 · 4 | no workers / with workers; scroll stock 0–8 loads | Placeholder: the agora emblem stall (`src/render/agora-models.ts`, `src/render/kit/market.ts`) in scholars' purple, with scrolls on the stand and as stock, and a gold scroll on the emblem. Keep the emblem-tent look of the other stalls. |
| 31 | Cloth Vendor | 2×2 · 4 | no workers / with workers; cloth stock 0–8 loads | Placeholder: the agora emblem stall (`src/render/agora-models.ts`, `src/render/kit/market.ts`) in dyed blue, with folded cloth on the stand and bolts as stock. Keep the chosen emblem-tent look of the other stalls, but make it look precious beside them. |
| 38 | Carrot Farm | 3×3 · 10 | growth stages 0–3; no workers / with workers | Placeholder in `src/render/farm-models.ts` and `carrotRow` in `src/render/kit/farm.ts`: the Wheat Farm's farmhouse with rows of green leaf boxes, orange crowns when ripe. Keep the chosen Wheat Farm's farmhouse, but make the beds read as a vegetable garden, not a cornfield. |
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
| 21 | Peddlers | food, fleece, oil and cloth peddlers |
| 22 | Culture walkers | philosopher, athlete, actor, philosopher trainee, actor trainee |
| 23 | Cart pushers | cart pusher, and the fleece, olive, oil, wood, marble, bronze, sculpture, cloth, scroll and papyrus carts and supplies |
| 24 | Buyers | food, fleece, olive, oil, cloth and bronze buyers, the Weaver's fleece buyer, the Scriptorium's papyrus and fleece buyers, and the Scroll Vendor's buyer |
| 25 | Gatherers | lumberjack (with log), quarryman (with block), miner (with ore), olive grower |
| 26 | Townsfolk | settler, artisan, shepherd |
| 27 | Sheep | shorn, half-grown, woolly |
| 33 | Trade caravans | ours going out laden, coming home with a money chest, merchants walking back unladen; foreign caravans in each partner's colour, laden coming in and bare walking back. Placeholder in `src/render/walker-layer.ts`: one merchant in white with a cloak (blue for ours, the partner's colour for theirs) beside a pack donkey |

Workers already standing in redesigned buildings fix some of these looks: the water carrier
(Fountain), athlete (Gymnasium), axeman in the lumberjack's olive tunic (Timber Mill),
superintendent (Maintenance Office). Match them.

## Suggested batches

- **Easy:** 7, 8, 9, 15, 19, 28, 29, 31, 34 — small, few states.
- **Medium:** 5, 1, 2.
- **Hard:** 17, 18 (big footprints, many stages), and the walker groups 20–27, which need the
  walker gallery set-up first.
