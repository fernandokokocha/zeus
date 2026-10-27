# Road upgrades and the Monument: design

Extends `2026-10-11-zeus-clone-design.md` and `2026-10-25-elite-housing-design.md`.
Everything there still holds. Adds slices 25–26. Agreed with the owner on 2026-10-27.

## Intent

Four Townhouses side by side are the hardest thing in the game to get, and the reason is
appeal: an Apartment needs appeal 30 to become a Townhouse, and a guild needs 25 to stay
one. The tiles around a block are spent on parks and gardens to get there. Before trade
asks for even more of that land, the player gets two new appeal tools:

- **Road upgrades.** A road is no longer finished once it is built. Upgrading it is a
  decision: a **Ornate** road for a housing street, or a **Fast** road for a working route.
  A street is one or the other.
- **The Monument.** A large appeal building that is earned, never bought, as Zeus's
  commemorative monuments are.

## Road upgrades (slice 25)

### The tiers

| road | how it comes | what it does |
|---|---|---|
| Main Road | generated with the map | unchanged; it can't be upgraded |
| Regular | the road tool | unchanged |
| Ornate | upgrade of a regular road where appeal ≥ **25** | radiates appeal |
| Fast | upgrade of any regular road | walkers move **1.5×** faster on it |

- Each upgrade costs **1 load of marble**, taken straight from storehouse stock when the
  upgrade is placed, the way drachmas are spent. No cart delivers it. Without marble in any
  storehouse, the upgrade can't be placed.
- **Ornate** is gated by the appeal of the road tile itself, at least the Townhouse devolve
  value (25). **Fast** has no gate, because working routes run through ugly industry.
- **Upgradable hint:** a regular road tile that qualifies for Ornate right now is drawn
  with a faint border, so the player sees where Ornate can go before choosing the tool.
- **Ornate Road appeal:** `[2, 1]` per tile (**ours**). Appeal adds up, so a street of them
  lifts its houses noticeably; an Ornate Road can make the next tile qualify, and a street
  can be upgraded outward from its best end.
- **Fast Road speed:** a walker's progress per tick is multiplied by **1.5** (**ours**)
  while the tile it is on is Fast. Every walker that uses roads benefits: cart pushers,
  buyers, peddlers, service and culture walkers. Paths don't change: walkers do not seek
  Fast Roads, they just move quicker when their usual path uses one.
- **Permanent:** an Ornate Road stays Ornate if appeal later drops. Demolishing an upgraded
  road removes it entirely; the marble is lost. To turn Ornate into Fast, demolish and
  rebuild.
- **Tools:** **Ornate Road** in the Aesthetics group and **Fast Road** in Distribution
  (renamed from Pretty and moved out of the quick row after the slice 25 playtest). Each is
  dragged over existing road like the road tool. Tiles that can't take the upgrade (Main
  Road, already upgraded, Ornate without the appeal) are skipped, and the drag preview
  shows which tiles will take it and the marble it will cost. The drag stops taking tiles
  when marble runs out.
- **Inspector:** a road tile says which kind it is. A regular tile shows its appeal and
  whether it can be made Ornate.

### The looks

No redesign round: the slice session builds the final looks, from these references taken
from the original game.

- **Regular:** pale paving stones with a light edge (unchanged in spirit).
- **Upgradable hint:** the regular look with a faint pale border.
- **Ornate:** white flagstones with an ornate border, in the white-and-Aegean-blue
  direction; the street that elite houses line.
- **Fast:** grey stone with two clear wheel grooves, like the Greek cart rut-roads (the
  Diolkos). Functional, no decoration.
- **Main Road** stays as it is: a working road, never the prettiest one.

## The Monument (slice 26)

| | |
|---|---|
| Size | 3×3 |
| Workers | none |
| Road | not needed |
| Appeal | `[20, 20, 18, 16, 14, 12]` (**ours**, a little above the Palace) |
| Cost | free, but needs an earned monument |
| Fire, collapse | none |

- **Earned, never bought.** The city keeps a count of monuments earned and not yet placed.
  The Monument tool is enabled only while that count is above zero; placing one uses one.
- **First one:** the first time the population reaches **1,000**, the city earns a monument
  and a notice says so: "The city has grown to 1,000 citizens. A monument can be raised."
  It is earned once, even if the population later drops and climbs back.
- **More later:** the first route opened to each trade partner earns one (the trade
  design, slice 28).
- Demolishing a monument loses it; it is not returned to the count.
- The build menu shows the count on the tool ("Monument (1)").
- **Model:** a placeholder good enough to playtest, plus an entry in
  `docs/redesign-backlog.md`. Direction for its round: a commemorative monument in white
  marble and blue, close to the ones in Zeus, readable at default zoom as "the city's
  pride". One state: built.

## Decisions taken without the owner

- Upgrades take marble directly from storehouse stock rather than by cart.
- The Ornate gate reads the road tile's own appeal.
- Ornate appeal `[2, 1]`, Fast ×1.5, Monument appeal `[20, 20, 18, 16, 14, 12]`, all
  **ours** and recorded in `zeus-numbers.md`.
- The 1,000-citizens monument is earned once per game.
