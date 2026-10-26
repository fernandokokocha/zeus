# Map modes and the Ledger: design

Reworks two pieces of UI before trade: the map modes (slices 18–19) and a reporting
system, the Ledger, that replaces the Charters panel (slices 20–24). Agreed with the owner
on 2026-10-26 from clickable mockups; the Ledger is option 3 of those mockups.

## Intent

Map modes today tint the ground under each building from a fixed colour scale, so they
need a legend, and they sit as a row of eleven buttons along the bottom of the screen.
Zeus reads better: a mode flattens the city and stands a column on each building that
grows with the value, and hovering gives the exact number. The city also has no way to
answer "how is it going over time": no population history, no treasury breakdown, no
production figures, and no way to steer workers. The Ledger is that place.

## Map modes (slices 18–19)

### The Map button

- The bottom bar goes. A **Map ▾** button in the top bar, next to Notices, opens a
  dropdown of the modes. The button's label names the mode that is on ("Map: Water"),
  or "Map: Off". The dropdown also has **Off**.
- `O` still toggles the last chosen mode.
- The corner legend goes. A column needs no legend; a tile mode (Appeal, Guilds) shows
  a one-line colour ramp under the Map button instead.

### The Zeus view

While a mode is on:

- Every building the mode reports on is drawn as a **flat base**, its footprint at
  ground height, with the mode's marks standing on it.
- Buildings that **serve** the mode stay drawn normally: fountains for Water; colleges,
  podiums, gymnasiums, drama schools and theaters for Culture; maintenance offices for
  Risk; tax offices and the palace for Tax; granaries, storehouses, the agora and its
  vendors for Supplies.
- Every other building is faded. Terrain, roads, trees and walkers are unchanged.
- **Hover** over a reported building shows a small tooltip with its name and the exact
  values behind its marks.

### Columns

A column is a short base that means zero, with a shaft that grows to a fixed full
height. The base is always drawn, so "nothing" is visible as a stub rather than as
absence.

### The modes

Eight modes, down from eleven. **Houses** is removed. **Food** and **Supply** merge into
Supplies. **Fire** and **Collapse** merge into Risk.

| Mode | Reports on | Marks | Full height |
|---|---|---|---|
| Water | occupied residences | column: time left before water runs out | the 4-month service memory |
| Supplies | occupied residences | one bar per good (food, fleece, oil, cloth), height = stock | the most the house holds of that good |
| Culture | occupied residences | one column in three coloured parts: philosophy, athletics, drama | the culture points of the highest house level |
| Appeal | tiles | ground tint, unchanged | n/a |
| Risk | buildings that can burn or collapse | column: the higher of fire and collapse risk, coloured by which one it is; turns red near the limit; hover shows both | the risk limit |
| Tax | occupied houses | column: tax the house paid in the last 12 months | the biggest payer currently on the map |
| Staff | workplaces | column: share of jobs filled | fully staffed |
| Guilds | tiles | ground tint, unchanged | n/a |

**Tax paid** is new state: each house keeps what it paid in each of the last 12 months.
A rolling 12 months, not the calendar year, so the columns don't all reset in January.
A house the collector never reaches shows only its base.

### Slices

- **18 · Map button and columns.** The Map button and dropdown, the Zeus view
  (flatten, keep servers, fade the rest), columns and hover. Water, Culture, Risk and
  Staff become columns; Appeal and Guilds keep their tint; Houses is removed. Food,
  Supply and Tax keep their current tint until slice 19.
- **19 · Supplies and tax paid.** Supplies replaces Food and Supply. Houses record tax
  paid, and Tax becomes a column of the last 12 months.

## The Ledger (slices 20–24)

### The window

- A **Ledger** button in the top bar replaces Charters, and `L` toggles it. The Charters
  panel and its `C` key go.
- A large window over the city, with chapters down its left side: **Population,
  Production, Priorities, Treasury, Charter**. One chapter shows at a time; the Ledger
  remembers the last one opened.
- Slice 20 builds every chapter's screen on sample data, so the owner can judge the
  whole Ledger early. Each sample chapter is visibly marked "sample data" until its own
  slice replaces it with real data.

### Chapters

- **Population.** A line graph of population, one point a month since the founding.
  Below it, housing: houses and people per level, then the most common reasons houses
  are not evolving, with how many houses each one holds back (the same check the
  inspector runs for one house). No summary figures above the graph.
- **Production.** One row per good: made in the last 12 months as a solid bar, drawn
  over a hatched bar of what the buildings could make fully staffed and supplied; used
  against wanted in the last 12 months; current stock in granaries and storehouses; and
  a status (surplus, enough, short, idle). Real figures, not theoretical ones: the gap
  between made and possible is the point.
- **Priorities.** Workers against jobs, then one row per industry (building type that
  makes goods): buildings, workers have/need, a priority (none, 1, 2, 3) and an
  Open/Closed switch.
- **Treasury.** Treasury now; then income and spending by category for this year so far
  and for last year: taxes, wages, construction, sheep, and the net.
- **Charter.** What the Charters panel shows today: Well fed progress, its goal and last
  reset, and permits held.

### The priorities rule (slice 24)

This is a game rule, not only a report. Workers fill priority 1 industries first, then
2, then 3, then everything without a priority, in today's order within each group. A
closed industry gets no workers, takes no goods and makes nothing; opening it again
restores it. Services and houses are not industries and keep today's assignment.

### Slices

- **20 · Ledger.** The window, all five chapters on sample data, Charter on real data,
  Charters panel removed.
- **21 · Ledger: Treasury.** Record income and spending by category per year.
- **22 · Ledger: Population.** Record population monthly; housing counts and blockers.
- **23 · Ledger: Production.** Record made, used and wanted per good over 12 months;
  capacity; stock.
- **24 · Production priorities.** The rule above and the Priorities chapter on real
  data.

## Non-goals

- No new map modes beyond the eight.
- No per-building production controls; priorities are per industry.
- No trade, gods or military chapters until those systems exist.

## Decisions taken without the owner

- Tax counts a rolling 12 months; the Tax column is scaled to the biggest payer on the
  map, because tax per house varies too much by level for a fixed scale.
- Risk shows the higher of the two risks rather than two columns.
- The Zeus view's list of which buildings "serve" each mode is the table above.
- The Ledger slices land before trade, so trade moves to slices 25–26.
