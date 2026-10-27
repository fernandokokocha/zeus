# Trade: design

Extends `2026-10-11-zeus-clone-design.md`, `2026-10-25-elite-housing-design.md` and
`2026-10-27-appeal-design.md`. Everything there still holds. Replaces the elite-housing
design's "Trade (slices 25–26)" section and its Trading Post, and adds slices 27–31.
Agreed with the owner on 2026-10-27.

## Intent

Land trade only. Sea trade waits for a future elite (the Sailors' Harbour).

Trade is the Traders' Guild's bonus, and it is physical. There is no Trading Post and no
yearly quota. Goods leave and arrive on **caravans** the player can watch and click, and
the **caravan is the limit**: how many there are and how long their trips take. Money from
our exports exists only once a caravan has carried it home to the Palace, because caravan
safety may become a mechanic later (bandits, escorts). Nothing for that is built now, but
nothing should make it hard to add.

## The guild blueprint (slice 27)

The Traders' Guild is now placed as one **7×4 blueprint**:

```
EEEERYY
EEEERYY      E = Traders' Guild (4×4)
EEEERYY      R = Main Road (1×4)
EEEERYY      Y = Trade Yard (2×4)
```

- **R is the Main Road.** The guild's whole long side lies along a straight 4-tile stretch
  of Main Road, and the yard sits across the road from it. A stretch that turns a corner
  does not qualify.
- This replaces the guild's old neighbourhood rule ("nearest tile 4 tiles or closer to the
  Main Road"). Everything else about the guild stands: four Townhouses in an exact 4×4
  block, the permit, the needs, appeal 25, no taxes.
- **The yard's ground** must be clear when the guild is placed: buildable land with no
  building and no road on it.
- **Rotation:** the player rotates the blueprint as usual. The preview always draws the
  road column, so it is clear the R must land on the Main Road. Along a horizontal run the
  guild sits north and the yard south, or the other way round; along a vertical run, west
  and east.
- Placing the guild places the yard with it. There is never a guild without a yard or a
  yard without a guild. The yard can't be demolished on its own; when the guild demotes
  (or is demolished), the yard goes too, with whatever it holds.
- **Guild sites (slice 17) follow the new rule:** the inspector's "possible guild site",
  its list of what is missing (now also "the yard's ground across the Main Road isn't
  clear"), the Guilds map mode and the "can now be placed" notice.
- **Main Road generation:** its test that every seed leaves room for at least 8 guild
  placements is rewritten for the blueprint. If seeds now fall short of 8, the slice lowers
  the number to what the generator reliably gives (at least 4) rather than reshaping the
  road, and records it.
- **The yard has no appeal** (`[]`) and no cost of its own; it is part of the guild's
  100 dr. A yard sits two tiles from its guild, and negative appeal there would demote the
  guild it serves.
- **The yard does nothing yet** in this slice. Its inspector says "Trade Yard: trade opens
  with a route" and the guild's still reads "Trade route: not yet available".
- Old saves are not migrated. Guilds placed before this slice may be left without a yard.

### Models

- The yard gets a placeholder that reads as an open market yard with crates.
- **Redesign round right after slice 27:** the **Trade Yard and the Storehouse together**,
  since the yard looks like an agora crossed with a storehouse and the current storehouse
  is to be replaced. Slice 27 adds one backlog entry covering both:
  - yard states: empty; slots holding goods to export; slots holding imports; a caravan
    loading or unloading in front of it;
  - storehouse: a new design, all its current states (stock by bay, staffed or not);
  - direction: the yard is an open, paved market court with stacked goods, awnings and
    pack-animal rails facing the road. The guild and the yard frame the Main Road between
    them, so either model may dress its side of that stretch (the road itself stays Main
    Road in the simulation).
- The owner thinks the field across the road may become the shape of every elite house
  (each elite with its own counterpart). Not decided; nothing here depends on it.

## The world map and routes (slice 28)

### Partner cities

Four fictional Greek cities. Each has a colour, a distance, and goods it buys from us and
sells to us at fixed prices. All of it is **ours**.

| city | colour | round trip | buys from us | sells to us |
|---|---|---|---|---|
| Melanthos | green | 3 months | fleece, olives | food, wood |
| Kerynthos | ochre | 5 months | food, wood, marble | fleece, olives, oil |
| Argyra | red | 5 months | oil, cloth, sculptures | marble, bronze |
| Halikeia | purple | 8 months | cloth, bronze, oil | sculptures, wood |

- Every good the city makes can be sold to someone, and cloth can never be bought: the
  guild's luxury has to be made at home.
- No partner uses blue, which is ours.
- **Round trip** is the time a caravan spends off the map between leaving at the west edge
  and coming back.
- **Caravans:** each partner owns **2** caravans (**ours**). They carry our imports (slice
  30).

### Prices and loads

Fixed for now, in drachmas per load (**ours**, tune at playtest). Every partner pays and
charges the same price for a good.

| good | caravan load | they pay us | we pay them |
|---|---|---|---|
| food | 8 | 10 | 15 |
| olives | 8 | 12 | 18 |
| fleece | 6 | 20 | 30 |
| wood | 6 | 15 | 22 |
| marble | 6 | 25 | 38 |
| oil | 4 | 25 | 38 |
| bronze | 4 | 35 | 52 |
| cloth | 4 | 45 | — |
| sculptures | 2 | 120 | 180 |

**Caravan load** is the most one caravan carries of that good, in loads: plenty of bulk
goods, very few precious ones. It is also the size of a yard slot holding that good.

### The World panel

- A **World** button in the top bar opens a panel with a stylised map: our city on the
  west-flowing road, and the four partners in their colours, each linked to us by a road
  labelled with its round trip.
- Clicking a partner shows what it buys and sells with prices, its caravans (home or on
  the road), and its route: open (to which guild), or available.

### Routes

- Each guild opens **one route**, to a partner of the player's choice, at no cost. The
  guild pays for it by existing.
- **Opening:** a guild without a route has an **Open route** button in its inspector. It
  opens the World panel in a choosing state; clicking an available partner opens the route.
  A notice says "Trade route to Kerynthos opened". The **first** route ever opened to each
  partner earns a monument (`2026-10-27-appeal-design.md`), so trade earns at most four.
  Reopening a route to the same partner earns nothing.
- **One route per partner.** With four partners, at most four routes. A fifth guild's
  inspector says no partner is left.
- **Opening a route needs a Palace** that roads connect to the Main Road. Caravans bring
  the money there. If that connection is later broken, a returning caravan waits just
  inside the west edge ("Waiting: no road to the Palace") and carries on once a road
  exists again. Its drachmas are never lost. While any route is
  open, the Palace can't be demolished ("Trade caravans deliver to the Palace").
- **When the guild demotes,** its route closes and the partner becomes available again.
  Caravans already on their way finish what they are doing: ours still deliver their
  drachmas, foreign ones turn back without charging.

## Exports (slice 29)

### The yard's slots

- A yard has **4 slots**. In the yard's inspector each slot is set to **off**, **export a
  good** or **import a good** (slice 30), in any mix: four exports, two and two, the same
  good in two slots. The goods offered are the ones the route's partner buys (or sells).
- A slot holds up to one caravan load of its good.
- The yard employs **8 workers** (**ours**) from the labor pool, like a storehouse, and its
  cart pushers move goods between the yard and the storehouses (granaries for food).
  Without workers, nothing moves.

### Our caravans

- The guild's **20 merchants** travel with our caravans, **5 per caravan** (**ours**), so
  at most **4 of our caravans** are out at once. Merchants away still count as the guild's
  residents; its needs don't change.
- **Filling:** the yard's cart pushers fetch the good from storehouses until the export
  slot holds a full caravan load.
- **Setting off:** when an export slot is full and 5 merchants are home, a caravan forms at
  the yard, loads the slot's goods (the slot starts refilling), walks the Main Road west and
  leaves the map.
- **Away:** it spends the route's round trip off the map.
- **Coming home:** it re-enters at the west edge and walks the roads to the **Palace**. Only
  there are the drachmas (load × "they pay us") added to the treasury, with a notice:
  "Caravan back from Argyra: +180 dr". The merchants then walk back to the guild and are
  home again.
- A slot can't send a second caravan while short of merchants; the four-caravan cap is
  shared by all slots, so a busy slot can use merchants an idle one isn't using.
- Our caravans are drawn in white and blue, merchants with laden pack donkeys
  (placeholder models, plus a backlog entry: caravan going out laden, coming back with a
  money chest, foreign variant in each partner's colour).

### Caravans on the map

- Every caravan, ours and foreign, is **clickable**. Its inspector shows the partner, the
  direction, the goods and amount, the value, and where it is in its trip ("heading out to
  Argyra", "back in about 2 months", "taking 180 dr to the Palace").
- Caravans off the map are listed in the yard's inspector and in the Ledger's Trade
  chapter (slice 31) with time remaining.

### Treasury

- The Treasury chapter gets a **Trade** income line.

## Imports (slice 30)

- An import slot is set to a good the partner sells, and an **amount**, up to one caravan
  load.
- **A caravan sets off** from the partner when all of these hold: the slot is empty, no
  caravan is already on its way to it, the partner has a caravan at home, and the treasury
  can cover the amount at "we pay them".
- It spends half the round trip coming, enters at the west edge in the partner's colour,
  walks the Main Road to the yard, and unloads into the slot. Only then is the treasury
  charged. It walks back west and spends the other half of the round trip off the map
  before the partner has it home again.
- The yard's cart pushers empty the import slot into storehouses (granaries for food). When
  it is empty, the next caravan can set off.
- No notice for an arrived import (they would be constant). A caravan that can't set off
  for lack of money is shown in the yard's inspector: "Waiting: the treasury can't pay
  for 6 marble (228 dr)".
- The Treasury chapter gets an **Imports** spending line.

## Ledger: Trade (slice 31)

A **Trade** chapter in the Ledger, alongside Treasury and the others:

- routes: guild, partner, round trip;
- caravans: every caravan on the road or away, with goods, value and time remaining;
- this year and last year: exports by good (loads, drachmas) and imports by good (loads,
  drachmas).

## Decisions taken without the owner

- The four partners, their colours, distances, goods, prices and caravan loads above, all
  **ours**.
- One route per partner, so four routes at most, and one monument per partner at most.
- The yard has no appeal, so trade never costs the guild its appeal.
- A caravan cut off from the Palace waits at the west edge with its money.
- Opening a route needs a Palace, and the Palace can't be demolished while a route is open.
- The yard's 8 workers come from the labor pool; the merchants only crew caravans.
- Our caravans free their merchants when they are back at the guild, not at the Palace.
- Import caravans are paid on unloading, checked against the treasury when they set off.
- Exports have no safety floor: an export slot will take the city's last food. The player
  controls it by switching the slot off.
- When a guild demotes, the yard and its contents are lost, and caravans already out
  finish their trips.
