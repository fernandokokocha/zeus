# Elite housing and trade: design

Extends `2026-10-11-zeus-clone-design.md`. Everything there still holds: the working
agreement, the architecture, the code rules. This document replaces its slice 12 and adds
slices 12–17. Trade is designed in `2026-10-27-trade-design.md`.

## Intent

Original Zeus has a separate kind of elite housing for soldiers. We don't copy that.
Instead, ordinary houses at the top level grow into **elite houses**, and there are several
types. Each type has its own conditions, its own upkeep and its own bonus.

Two ideas make this worth doing:

- **Elites are a goal the player plans toward.** The player sees a Big Bonus, works the
  whole city toward it, and rebuilds parts of the city to meet its conditions. Getting one
  is never an accident.
- **Conditions are about place.** An elite type needs a particular neighbourhood, so
  cities built toward different elites look different. One neighbouring building is too
  easy. The condition should shape the layout.

Elites are **sparse** by design. Their conditions are hard and their places are limited.

## How every elite type works

All types follow the same shape and differ in the details.

- **Source:** four top-level houses (Townhouses) forming an exact 4×4 block. The elite
  house replaces them.
- **Placed by the player.** "Elite" is a build-menu group of 4×4 buildings, and each one
  can only be placed over a block that qualifies. Elites have downsides, so they never
  appear on their own.
- **Neighbourhood:** a location condition specific to the type.
- **Charter:** a city-wide achievement specific to the type. Completing it grants a
  **permit**, and placing an elite uses one permit.
- **Upkeep:** a luxury good specific to the type, on top of the Townhouse needs.
- **Residents work there.** An elite house is housing and workplace at once, and its
  residents are its staff. It never draws from the shared labor pool or adds to it, so
  later employment priorities don't affect it. Four Townhouses hold 240 people and an
  elite holds far fewer, so building one costs the city workers. That is the trade-off.
- **Demotion:** if an elite house loses any need for a whole month (as house level
  changes work now), it breaks back into **four vacant 2×2 lots**. Its residents leave,
  its bonus stops, and its permit is gone.
- **Warnings before trouble:** the inspector shows what an elite is missing, the same
  way houses show "needs: oil".

**Deferred, maybe later:** elite levels (one type evolving into a stronger version, for
example Hoplites → Horsemen) and a prestige meter that grows over time. Neither is in the
first version.

## The Main Road (slice 12)

The pre-built entry road becomes the **Main Road**, a long, generated road that is the
spine of the city and the future route of traders.

- It enters at the middle of the west edge, where settlers arrive now, and runs east (since
  slice 32 the finished map is rotated or mirrored at random, so any edge). How far is up
  to the seed, on a spectrum: some maps end it inland after about 25 tiles,
  some far east, and about a third reach the coast. Its length sets how many guild sites
  the map has. Only a road that reaches the shore leaves room for a later harbour.
- **Shape:** long straight runs joined by right-angle turns. A tight staircase leaves no
  straight edge for a 4×4 to sit along, and a straight line is boring. Specifically:
  - It alternates horizontal and vertical runs: 2–3 horizontal runs, eastward.
  - The vertical runs all go the same way, up or down, chosen per map. It never doubles
    back, so it doesn't snake like a river.
  - **Every run is at least 12 tiles long**, room for two 4×4 blocks side by side.
  - The whole road stays within the middle half of the map's height.
- **Robust on every seed.** The road is laid out first, and its tiles are then forced to
  grass over whatever terrain was generated (the entry road works this way now). Turns
  happen far enough west that the final run is 12 or more tiles, whether it ends inland or
  at the coast. A test generates 100 seeds and checks that the road:
  - starts at the west edge;
  - reaches the water or ends inland short of it;
  - never crosses itself and never doubles back;
  - has every run at 12 tiles or longer;
  - leaves room for at least 8 placements of a 4×4 within guild range;
  - reaches the coast on some seeds and ends inland at varied lengths on others.
- **It can't be demolished,** and it is drawn differently from ordinary roads (paved
  stone).
- Ordinary roads connect to it as usual. Settlers still walk in along it.

## Fine cloth (slice 13)

- A **Weaver** (2×2) takes fleece from a storehouse and weaves **fine cloth**, which it
  sends back to a storehouse. Cloth is a new good with its own storehouse slots.
- Houses don't use cloth. The Traders' Guild does.
- Numbers follow the Olive Press pattern (1 load fleece → 1 load cloth, about 6 a year).
  The slice session sets them and records them in `zeus-numbers.md` as **ours**.

## Notices (slice 14)

- A **message feed** for events. Short lines appear and fade, and recent ones can be
  reopened.
- This slice wires it to events that already exist: a fire breaks out, a building
  collapses, a house devolves, a sanctuary is finished.
- Later slices add their own notices: a charter completed, an elite demoted, a trade route
  opened.

## Charters (slice 15)

- A **Charters panel**, opened from the top bar, lists every charter with its progress.
  It is the city's report on what it is working toward.
- First charter: **Well fed.** No house in the city goes without food for **24 months
  in a row**.
  - Only houses that eat count (Shack and up). A house goes without food when it has to
    eat and its food stock is empty. That is the moment the streak resets.
  - The panel shows the count and what last reset it, for example
    "Well fed: 14 / 24 months, reset 3 months ago (Hovel at 52,40 went hungry)".
  - Completing it grants one Traders' Guild permit and posts a notice. The counter then
    restarts from zero, so another 24 months earns another permit.
- **Why Well fed:** a city only trades with other cities once it can feed itself.
- Before slice 16 exists, the panel shows the permit as "Traders' Guild permit: 1",
  with nothing to spend it on yet.

## The Traders' Guild (slice 16)

| | |
|---|---|
| Size | 4×4, placed over four Townhouses forming an exact 4×4 block |
| Neighbourhood | its nearest tile is **4 tiles or closer** to the Main Road |
| Charter | Well fed (one permit per guild) |
| Residents | 20 merchants, who are also its staff |
| Needs | everything a Townhouse needs (food, water, fleece, oil, culture 45) plus **fine cloth** |
| Appeal | moderate: it needs appeal at or above the Townhouse's devolve value (25) |
| Taxes | **none**. It earns through trade instead (`2026-10-27-trade-design.md`). |
| Bonus | one trade route (trade design, slice 28). Until then the inspector shows "trade route: not yet available". |
| Cost | 100 dr (**ours**) plus one permit |
| Demotion | any need missing for a month → four vacant lots |

- **Placing it:** the four Townhouses are replaced at once. 20 of their residents stay as
  the merchants and the rest leave. The guild then keeps the stocks the four houses had.
  The one-month demotion clock starts at placement, so cloth has to arrive within a month.
  The player should arrange a cloth vendor first.

- **Why cloth:** traders have to look classy to sell.
- **Cloth vendor:** a new agora vendor, placed on an agora like the food, fleece and oil
  vendors. Its buyer fetches cloth from a storehouse, and the agora's peddler sells it. Only elite
  houses take cloth from it.
  - An agora still has three vendor slots, so a cloth vendor takes the place of one of the
    others. An agora serving a guild gives up something else. That is a trade-off the
    player makes on purpose, as in Zeus, where elite goods compete for agora slots.
- The guild's other goods and services arrive the way they arrive at houses (peddlers,
  water carriers, culture walkers).
- **Consumption:** food per resident as for houses. Fleece and oil per house as for
  houses. Cloth **8 units a month** (**ours**, tune at playtest). Cloth has to be a real
  cost.
- Fire and collapse risk work as they do for a house.
- The Main Road's capacity is a natural limit on how many guilds a city can ever have.

### The model

The guild is the first 4×4 house and the reward for a long plan, so its model matters as
much as its rules.

- **Slice 16 ships a placeholder model** that is good enough to playtest: it reads as one
  4×4 building, clearly richer than a Townhouse.
- **The real model is designed with the owner** in a redesign round right after slice 16
  (`docs/model-redesign.md`). Slice 16 adds it to `docs/redesign-backlog.md` with these
  states:
  - occupied and fully supplied;
  - missing a need (the warning state before demotion);
  - burning.
- **Direction for that round,** on top of the general direction in `model-redesign.md`:
  - It grows out of the chosen Townhouse model, so the player sees four Townhouses become
    one house. Blue-tiled roofs, white walls.
  - Rich, and it shows its trade: a colonnaded front facing the road, an upper floor, a
    courtyard, blue cloth awnings and bolts of fine cloth on display. Amphorae and crates
    hint at the trade route to come.
  - Its silhouette must read as different from a Townhouse block at default zoom.
- Slice 12's paved Main Road, slice 13's Weaver, and slice 16's cloth vendor also get placeholder models and backlog entries.

## Guild sites (slice 17)

Planning help, so the player can build toward a guild deliberately.

- **Inspector:** a house within guild range of the Main Road shows "possible guild site"
  and what is still missing:
  - not a Townhouse yet;
  - the other three houses of a 4×4 block are not Townhouses;
  - no permit;
  - appeal too low.
- **Overlay:** a new map mode showing where a guild could go: in range of the Main Road,
  with the blocks that qualify right now highlighted.
- **Notice** the first time a block becomes placeable: "A Traders' Guild can now be placed
  at …".

## Trade

Replaced by `2026-10-27-trade-design.md` (slices 27–31): no Trading Post, no quotas;
the guild is placed with a Trade Yard across the Main Road, and caravans carry the goods.

## Horizon (not planned)

These guide how the elites are built so they stay alike. None of them is scheduled.

- **Warriors' House.** Warriors don't care about appeal, so this is the elite to put next
  to ugly industry.
  - **Neighbourhood:** near a Gymnasium and a Foundry.
  - **Upkeep:** armor. They also eat more than ordinary residents.
  - **Bonus:** hoplites the player commands, like Zeus's elite housing.
  - **Levels:** this is the type that wants them. Hoplite House (armor) → Horsemen's
    House (armor + horses): stronger units, more upkeep, more time.
  - **Needs first:** an armor chain, horses, and a military slice with something to fight.
- **Philosophers' House.** Needs high appeal and culture venues nearby. Its bonus is
  hosting games or contests.
- **Priests' House.** Needs high appeal and a sanctuary nearby. Its bonus works through
  the gods.
- **Sailors' Harbour.** Builds where the Main Road reaches the shore: sea trade, only on
  maps whose road gets there.

## Decisions taken without the owner

These are calls made while writing this down. Slice sessions treat them as decided:

- The Main Road never runs past the coast, because the east edge is sea.
- At most 3 horizontal runs: with every vertical run going the same way and the road
  inside the middle half of the map, there is room for only two 12-tile vertical runs.
- Every completed Well fed streak grants a permit, and the counter restarts. A permit is
  lost when its guild demotes.
- "Within 4 tiles" means the guild's nearest tile.
- The guild's appeal requirement is the Townhouse devolve value (25).
- Slices are numbered from 12, since the old slice 12 (God favors) is dropped.
