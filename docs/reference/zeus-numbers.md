# Zeus numbers

Gameplay numbers from the original *Zeus: Master of Olympus*, Beginner difficulty,
collected from HeavenGames. Use these as defaults. Where a number is marked **ours**,
the original value was not found and we chose it.

Units: 1 cartload in a granary/storehouse = 100 units in an agora or a house.
Costs are drachmas (dr). "wk" = workers needed. Sizes are in tiles.

## Housing

Source: https://zeus.heavengames.com/gameinfo/housinglevels/

All common housing is 2×2. A vacant lot costs 10 dr.

| Level | Pop | Food | Water | Fleece | Oil | Culture pts | Appeal devolve | Appeal evolve | Tax mult. | Fire risk |
|---|---|---|---|---|---|---|---|---|---|---|
| Hut | 8 | | | | | 0 | -99 | -10 | 1 | 8 |
| Shack | 16 | ✓ | | | | 0 | -12 | 0 | 1 | 8 |
| Hovel | 24 | ✓ | ✓ | | | 15 | -2 | 10 | 1 | 8 |
| Homestead | 32 | ✓ | ✓ | ✓ | | 15 | -2 | 10 | 2 | 8 |
| Tenement | 40 | ✓ | ✓ | ✓ | | 35 | 5 | 20 | 2 | 8 |
| Apartment | 48 | ✓ | ✓ | ✓ | ✓ | 35 | 15 | 30 | 2 | 8 |
| Townhouse | 60 | ✓ | ✓ | ✓ | ✓ | 45 | 25 | 100 | 2 | 8 |

- A house *has* a level's goods/services columns to stay at it; it evolves when it meets
  the next level's requirements and its appeal reaches its own "evolve" value. It devolves
  when it loses a requirement or its appeal falls to "devolve".
- Consumption: food 0.25 units per occupant per month (Shack and up). Fleece 2 units per
  house per month (Homestead and up). Oil 2 units per house per month (Apartment and up).
- Religion is not a housing requirement.

## Labor, wages, taxes

Sources: https://zeus.heavengames.com/gameinfo/worker-percentages/ ·
https://zeus.heavengames.com/gameinfo/taxation/

- Share of population that works (Beginner, Normal wages): **52%**.
- Wages: 3 dr per worker per year (Normal).
- Tax per house per month = tax multiplier × occupants × 0.09 (Normal rate).
  Needs a Palace and a Tax Office clerk passing the house.

## Walkers

Source: https://zeus.heavengames.com/units/

Roaming range (tiles walked before turning home by the shortest route):

| Walker | From | Range |
|---|---|---|
| Water carrier | Fountain | 27 |
| Tax clerk | Tax Office | 35 |
| Philosopher, athlete, actor | Podium, Gymnasium, Theater | 35 |
| Peddler | Agora vendor | 44 |
| Superintendent | Maintenance Office | 44 |

- Speed: 54.4 tiles per month for ordinary walkers. Sheep 54.4. Gods 68.
- Exit tile: first road tile touching the building, searching clockwise from north.

## Buildings

Source: https://zeus.heavengames.com/buildings/building-model-data/ (and the category
pages under https://zeus.heavengames.com/buildings/)

Appeal is listed as values by distance in tiles (ring 1, ring 2, ...); see
https://zeus.heavengames.com/gameinfo/appeal/. Fire/collapse are risk increments;
"—" means the building never burns / never collapses.

| Building | Size | wk | Cost | Appeal by distance | Fire | Collapse |
|---|---|---|---|---|---|---|
| Palace | 9×6 | 0 | 125 | 18,18,18,15,15,15 | — | — |
| Tax Office | 2×2 | 8 | 25 | -4,-3 | 5 | — |
| Fountain | 2×2 | 4 | 16 | 4,4,2,2 | — | 8 |
| Maintenance Office | 2×2 | 5 | 10 | 0 | — | — |
| Wheat Farm (on meadow) | 3×3 | 10 | 20 | -3,-2,-1 | 5 | — |
| Granary | 4×4 | 18 | 50 | -12,-10,-8,-6 | 8 | 8 |
| Storehouse | 3×3 | 12 | 25 | -2,-2,-2,-2 | 5 | — |
| Agora (common) | 3×6 | — | 25 | 12,12,10,10,8,8 | — | 6 |
| Agora vendor (food/fleece/oil), placed on an agora | 2×2 | 4 | 10 | — | — | — |
| Carding Shed | 2×2 | 8 | 16 | -5,-3,-1 | 5 | — |
| Sheep (placed animal) | 1×1 | — | 4 | — | — | — |
| Olive tree (on meadow) | 1×1 | — | 3 | 1 | — | — |
| Growers' Lodge | 2×2 | 12 | 25 | -3,-2 | 5 | — |
| Olive Press | 2×2 | 12 | 45 | -4,-4,-2,-2 | — | 8 |
| Timber Mill | 2×2 | 12 | 35 | -5,-4,-3,-2 | 10 | — |
| Masonry Shop (marble) | 2×2 | 15 | 75 | -6,-5,-4,-3 | — | 10 |
| Foundry (bronze) | 2×2 | 15 | 60 | -10,-9,-8,-7,-6,-5 | — | 10 |
| Sculpture Studio | 2×2 | 12 | 100 | -2,-1 | — | 10 |
| Artisans' Guild | 2×2 | 25 | 35 | -6,-6,-5 | 5 | — |
| College | 3×3 | 12 | 30 | -5,-8 (worse farther out) | — | 6 |
| Podium | 2×2 | 4 | 15 | 3,2,1 | — | — |
| Gymnasium | 3×3 | 7 | 30 | 0 | — | — |
| Drama School | 3×3 | 10 | 16 | 0 | — | — |
| Theater | 5×5 | 18 | 60 | 6,5,4 | — | — |
| Park | 1×1 | — | 6 | 3,2,1 | — | — |
| Column | 1×1 | — | 8 | 4,2,0 | — | — |
| Flower Garden | 2×2 | — | 20 | 8,7,6 | — | — |
| Any sanctuary | see below | | | 20,18,16,14,12,10 | — | — |

- Collapse timing: 60 ÷ risk increment = months until collapse without maintenance.
- Sculpture Studio workers: 12 on the industry page, 18 on the model-data page. Use 12.

## Production

Source: https://zeus.heavengames.com/gameinfo/industry-production/

| Building | Output per year | Notes |
|---|---|---|
| Wheat Farm | 8 loads | Harvest in July |
| Carding Shed | 7–8 loads fleece | Shears up to 8 sheep within 40 tiles |
| Growers' Lodge | 20 loads olives | Harvests nearby olive trees; whole year's output in a few months |
| Olive Press | 6 loads oil | 1 load olives → 1 load oil (**ours**) |
| Timber Mill | 13 / 10 / 7–8 loads | Trees adjacent / within 10 / within 20 tiles |
| Masonry Shop | 12 loads marble | Marble within 20 tiles |
| Foundry | 13 / 10 / 7–8 loads bronze | Ore adjacent / within 10 / within 20 tiles |
| Sculpture Studio | 6 sculptures | 4 bronze → 1 sculpture |

## Culture

Source: https://zeus.heavengames.com/gameinfo/housinglevels/

- College → philosopher → Podium: 15 points per pass.
- Gymnasium → athlete: 20 points per pass (no school).
- Drama School → actor → Theater: 25 points per pass.
- A house's culture points are the sum over venues whose walker passed it recently.

## Sanctuaries and gods

Sources: https://zeus.heavengames.com/gameinfo/sanctuaries/ ·
https://zeus.heavengames.com/gameinfo/gods/

| Sanctuary | Size | Workers | Cost | Initial marble | Marble | Wood | Sculptures |
|---|---|---|---|---|---|---|---|
| Garden of Demeter | 18×12 | 60 | 840 | 27 | 110 | 20 | 10 |
| Arbor of Athena | 16×12 | 60 | 2160 | 24 | 67 | 22 | 8 |
| Forge of Hephaestus | 13×8 | 60 | 760 | 13 | 48 | 14 | 6 |

| God | Sanctifies | Blessing | Curse |
|---|---|---|---|
| Demeter | farms | food delivered to granaries | land infertile, farms cursed, sheep killed |
| Athena | olive press, carding shed | oil and olives delivered | olive trees cursed |
| Hephaestus | sculpture studio | no fire risk while favorable | sets fires, studios cursed |

## Not found: our choices

- Granary and storehouse capacity: **32 loads each** (8 slots × 4 loads).
- Time scale: **1 month = 30 s at 1× speed** (one constant, tunable; slowed from 20 s after the slice 2 playtest).
- Road cost: **2 dr per tile** (re-laying an existing road tile is free).
- Settler arrival: **10 settlers per month** (one every 3 s at 1×) while a reachable lot has
  room. Each settler carries the lot's remaining room.
- Service memory: a house keeps water or tax coverage for **2 months** after a walker
  passes.
- Roamer rest: a service building sends its next walker **a quarter month** after the
  last one returns, at full staff.
- Roadblock cost: **6 dr**.
- Cart pusher load: **4 loads** (one granary slot). Buyer load: **4 loads**. Agora vendor stock: **8 loads**.
- House food stock: a peddler fills a house to **3 months** of eating (Huts are filled as if they ate).
- Wheat grows all year in proportion to staffing; a full year at full staff gives the 8-load harvest.
- Performance: a trainee (philosopher from a College, actor from a Drama School) keeps
  his Podium or Theater performing for **2 months**. Schools train one every **quarter
  month** at full staff, like the roamer rest.
- Culture memory: a house keeps a culture kind's points for **2 months** after its
  walker passes, like water.
