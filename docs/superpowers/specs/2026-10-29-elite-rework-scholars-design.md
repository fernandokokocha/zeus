# Elite rework and the Scholars' House: design

Extends `2026-10-11-zeus-clone-design.md`, `2026-10-25-elite-housing-design.md` and
`2026-10-27-trade-design.md`. Everything there still holds unless this document changes it.
It covers the roadmap's first two elite milestones, as seven slices. Agreed with the
owner on 2026-10-29.

## Intent

The Traders' Guild was the first elite house. Five more types are planned (`docs/roadmap.md`),
and they all share one shape. This document first moves the guild onto that shape, then adds
the second type, the **Scholars' House**.

The shared shape:

- An elite replaces four Townhouses in an exact 4×4 block. It is placed by the player with a
  **permit** from its type's **charter**, a 24-month city-wide achievement.
- **It keeps the city's people.** An elite houses what its four Townhouses housed and
  consumes what they consumed. On top of that, each type has **one additional consumption**
  (cloth for traders, scrolls for scholars). Building an elite never shrinks the city.
- **An annex across a road.** Each type comes with a building on the other side of a road
  (Trade Yard, Library). The annex is staffed from the labor pool like any workplace, and it
  is where the type's bonus is made. Its workers are the cost of the elite.
- **Taxes are the type's variable.** Traders pay low taxes, because trade is how they earn.
  Every other type pays a Townhouse's taxes.
- **Placement is about place.** Each type has its own location rule, so different types
  sit in different parts of the city.

### Goals

- The guild follows the shared shape, and its charter becomes **Well dressed**.
- Elite sites (the inspector line, the map mode, the notice) work for every type, not only
  for the guild.
- A Scholars' House can be planned for, placed, supplied and kept. It produces **Works of
  Art**, the currency for a future upgrade tree.

### Non-goals

- The upgrade tree itself. Works of Art accumulate and are shown, but buying anything with
  them waits for a later spec (see Upgrades).
- Other sources of Works of Art (buying, Great People, plunder). Scholars' Houses are the
  only source for now.
- Elite levels.

### Anti-goals

- An elite that costs the city population. That was the old model, and the owner rejected it.
- Scrolls that are easy to get. They are meant to be the hard part of keeping scholars.

## Elite rework

Changes to the Traders' Guild that is already in the game.

- **Residents:** placing a guild keeps **all** the residents of the four Townhouses (up to
  4 × 60 = 240), instead of keeping 20. Its capacity is 240.
- **Consumption:** food per resident, as now. Fleece and oil become **four houses' worth**
  (8 units each a month), since it houses four Townhouses' families. Cloth stays **8 units a
  month**.
- **Labor:** its residents join the labor pool like any house's (52% work).
- **Merchants become yard staff.** The 20 merchants are no longer residents set apart.
  The Trade Yard employs **28** workers from the labor pool: **8 cart pushers** (as now) and
  **20 merchants**. Caravans still take **5** merchants each, so a fully staffed yard has at
  most **4** caravans out. A yard short of workers fills its 8 cart-pusher posts first; the
  number of merchants it has, divided by 5 and rounded down, caps its caravans. A merchant
  away with a caravan still counts as employed.
- **Taxes:** the guild now pays tax, at a **tax multiplier of 1**: half of a Townhouse's 2
  (**ours**). A tax clerk has to pass it, as for houses.
- Everything else stands: the blueprint, needs, culture 45, appeal 25, cost, demotion, routes.
- **Demotion still leaves four vacant lots**, so up to 240 people leave at once. The owner
  chose to keep it that way.
- Old saves aren't migrated. A guild placed before this slice keeps its 20 residents until
  it is rebuilt.

## Well dressed

Replaces Well fed as the Traders' Guild charter.

- **Well dressed:** for **24 months in a row**, the city has at least one Townhouse, and no
  Townhouse goes without fleece or oil.
  - A Townhouse goes without when it has to use fleece or oil and its stock is empty, the
    same test Well fed uses for food.
  - A month with no Townhouse at all also resets the count.
  - Elite houses count as Townhouses, as in Learned city: a guild running out of oil resets
    the count, and a city whose Townhouses all became elites still qualifies.
  - The Charters panel shows it the way it showed Well fed, for example
    "Well dressed: 9 / 24 months, reset 2 months ago (Townhouse at 40,22 ran out of oil)".
- Completing it grants one Traders' Guild permit and posts a notice. The count restarts.
- **Well fed is removed.** The Warriors' milestone brings its own charter (Healthy and well
  fed) and builds it then.
- **Permits are per type.** The city holds a separate permit count for each elite type, and
  the Charters panel lists them by type.

## Papyrus and the Scriptorium

- **Papyrus** is a new good. Nobody in the city makes it. **Corinth** sells it, re-sold from
  Egypt through its port. Caravan load **4**, "we pay them" **60** dr a load (**ours**). Nobody
  buys papyrus from us. Importing it needs a Traders' Guild with a route to Corinth.
- **Scrolls** are a new good, stored in storehouses. 1 scroll = 1 load = 100 units.
- **The Scriptorium** (2×2, **ours**: 12 workers, 50 dr, appeal -2,-1, fire 5) makes scrolls.
  It has two recipes:
  - **4 loads of papyrus → 1 scroll**: the expensive import route.
  - **40 loads of fleece → 1 scroll**: the home route. It is meant to be inhumane, since 40
    loads is about five Carding Sheds' yearly output.
  - Its buyer fetches papyrus first and fleece only when there is no papyrus in storage. It
    holds up to 4 loads of input at a time and keeps a running count toward the next
    scroll, so a fleece scroll is made from many deliveries. Papyrus and fleece loads add to
    the same count (a quarter of a scroll, or a fortieth).
  - **Pace:** at full staff it makes up to **6 scrolls a year** whichever recipe it uses, so
    it turns a papyrus load into progress in half a month and a fleece load in a twentieth of
    one. It never sets the pace. Supply does, and one Scriptorium can keep several houses
    reading.
  - Its cart takes finished scrolls to a storehouse.
  - The Weaver's rule of leaving 4 loads of fleece in every storehouse for fleece vendors
    applies to it too.
- The Treasury's Imports line and the Ledger's Trade chapter pick up papyrus with no extra work.

## Learned city

The Scholars' House charter.

- **Learned city:** for **24 months in a row**, the city has at least one Townhouse, and
  every Townhouse has **full culture**: philosophy, athletics and drama all passed recently
  (60 points). Elite houses count as Townhouses here.
- One permit per completion. The count restarts. It is shown in the Charters panel with what
  last reset it ("Townhouse at 31,18 missed drama").

## The Scholars' House and the Library

| | |
|---|---|
| Blueprint | 4×4 house, a straight 4-tile stretch of road, 4×2 Library across it, the same 7×4 shape as the guild |
| Road | **any** road, ordinary or Main Road |
| Neighbourhood | a **Theater**, a **Gymnasium** and a **Podium**, each with its nearest tile within **6 tiles** of the house's block (**ours**) |
| Charter | Learned city |
| Residents | everyone from the four Townhouses (up to 240), in the labor pool |
| Needs | a Townhouse's needs ×4 (as the reworked guild), culture 45, appeal 25, plus **scrolls** |
| Taxes | a Townhouse's (multiplier 2) |
| Cost | 100 dr + 1 permit |
| Demotion | any need missing for a month → four vacant lots, the Library and its scrolls are lost |

- **Placing it** works like the guild: rotation, a preview showing the road column, the
  Library's ground clear, the four houses' stocks and coverage carried over.
- **The Library** (4×2, no appeal, no fire, **8 workers** from the labor pool, **ours**)
  holds up to **4 scrolls**. Its cart pusher fetches scrolls from storehouses until it is
  full. It can't be demolished on its own, the same as the yard.
- **Reading:** the house reads **1 scroll a year**, taken steadily from the Library (about
  8 units a month). Each scroll finished becomes **1 Work of Art**, with a notice: "The
  scholars at 31,18 completed a Work of Art". At most one a year, as agreed.
- **Scrolls are a need.** If the Library holds no scroll to read from for a month, the house
  demotes, the same way a guild without cloth does. An unstaffed Library therefore ends the
  house in time. The inspector warns before that ("needs: scrolls").
- **No grace at placement,** as with the guild and its cloth: the one-month clock starts when
  the house is placed, so a scroll has to reach the Library within a month. The player
  stockpiles scrolls first. A possible site lists "no scrolls in storage" as a warning that
  does not block placement.
- **Works of Art** are a city count, not a stored good: a number in the top bar next to the
  treasury, and a line in the Ledger's Treasury chapter. They are kept when the house that
  made them demotes. Nothing spends them yet.
- **Models:** placeholders that read as a richer 4×4 house (white and ochre, a lecture
  porch) and a Library (a colonnaded hall with scroll racks). Both get backlog entries:
  supplied, missing a need, burning; Library empty / holding scrolls.

## Elite sites

The guild's site help (slice 17) becomes every elite type's.

- **Inspector:** a Townhouse shows each type it could become: "possible Scholars' House
  site", with what is still missing. For scholars that list adds "no Theater within 6 tiles"
  (likewise for the Gymnasium and the Podium) and "the Library's ground across the road isn't
  clear". A house can show both types.
- **Map mode:** **Guilds** becomes **Elites**. It shows qualifying blocks for every type, in
  the type's colour (traders blue, scholars purple). Where a type has a range (the guild's
  Main Road), it is shaded too.
- **Notice:** "A Scholars' House can now be placed at …", once per block per type.

## Upgrades

Placeholder slice, and the last of the seven. It needs its own design before it is built: the owner wants to choose
the upgrades when the time comes. Works of Art are its currency, and the first sketch
(ten upgrades in three branches, costing 1–4 each) is a starting point, not a decision.

## Decisions taken without the owner

- The guild's tax multiplier is 1, half a Townhouse's.
- The yard's 20 merchant posts come from the labor pool, filled after its 8 cart pushers.
- Fleece and oil for the guild are four houses' worth.
- Well fed is removed rather than kept unused until the Warriors' milestone.
- Papyrus comes from Corinth at 60 dr a load, caravan load 4.
- The Scriptorium's numbers (12 workers, 50 dr, 6 scrolls a year either recipe), and papyrus
  before fleece.
- Elites count as Townhouses in both charters.
- A Scholars' House gets no grace for its first scroll, the same as the guild's cloth.
- Learned city counts elites as Townhouses, and needs at least one Townhouse.
- The Scholars' House can use any road, not only the Main Road.
- Scholars' neighbourhood range: 6 tiles from the block.
- Scholars' appeal is 25, the same as the guild's. An earlier idea of 40 was dropped with
  the traits.
- The Library holds 4 scrolls and has 8 workers.
- Works of Art are a count, not a stored good, and survive demotion.
- Scholars are purple on the Elites map mode.
