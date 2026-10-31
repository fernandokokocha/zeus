# Warriors' House: design

Extends `2026-10-11-zeus-clone-design.md`, `2026-10-25-elite-housing-design.md` and
`2026-10-29-elite-rework-scholars-design.md`. Everything there still holds unless this
document changes it. Written on 2026-10-30; the owner opted out of questions, so every
choice not in the roadmap's sketch is listed under "Decisions taken without the owner".

## Intent

The third elite type. It follows the shared elite shape (a 4×4 house over four Townhouses,
placed with a permit from a 24-month charter, keeping the city's people, one extra
consumption, an annex across a road, a location rule). Its parts:

- **Sickness** comes into the game, with the **Infirmary** and its healers against it.
- **Healthy and well fed** is its charter.
- **Armor**, made from bronze at the **Armory**, is its extra consumption.
- **The Drill Ground** is its annex, where **hoplites** are trained for the city's **army
  roster**.

Warriors don't care about appeal. This is the elite to put next to ugly industry: an
Armory or a Foundry may stand beside it.

### Goals

- Houses can fall sick, and an Infirmary keeps a city healthy.
- A Warriors' House can be planned for, placed, supplied with armor and kept.
- Its Drill Ground fills a company of hoplites, shown on the army roster.

### Non-goals

- Battles, invasions, commanding soldiers, or anything else the hoplites do. The roster is
  the bonus for now; a military milestone gives it a use.
- Trading armor. No partner buys or sells it.
- Elite levels (Horsemen). The roadmap's "Elite levels" item covers them.
- Warriors eating more than ordinary residents (an idea from the elite-housing horizon). The
  shared shape allows one extra consumption, and armor is it.

### Anti-goals

- Sickness that wipes out a city before the player can react: it builds up slowly in good
  houses, warns in the inspector and the map mode first, and an Infirmary nearby stops it.
- A Warriors' House that costs the city population (the shared-shape rule).

## Models first

The milestone starts with a redesign round with the owner (`docs/model-redesign.md`) for
the three buildings it is about: the **Infirmary**, the **Warriors' House** and the **Drill
Ground**. The picks go into `src/render/<thing>-models.ts` and stay in the gallery until the
slice that adds each building wires them in. That slice uses the chosen model, not a
placeholder.

Direction, on top of `model-redesign.md`:

- **Infirmary** (4×4): a healing sanctuary of Asclepius rather than a hospital: a white
  colonnaded hall, a courtyard with a well or basin, herb beds, the snake-entwined staff as
  its emblem. States: no workers / with workers (a healer in a pale robe with a herb basket).
- **Warriors' House** (4×4): grows out of the chosen Townhouse cluster like the other elites,
  but austere: fewer ornaments, bronze and red accents instead of blue cloth, shields hung on
  the walls, a rack of spears and crested helmets. Its silhouette must read differently from
  the Traders' Guild and the Scholars' House at default zoom. States: supplied, missing a
  need, burning.
- **Drill Ground** (4×2): an open sand yard with a low wall, wooden practice posts, a rack of
  shields and spears. States: no workers / with workers (hoplites drilling in bronze helmets
  with round shields).

The Armory, the Arms Vendor and the healer and hoplite walkers get placeholders and
backlog entries in their slices, as usual.

## Sickness and the Infirmary

Sickness works like fire: a risk that fills, a walker that resets it, and a bad state that
spreads to neighbours.

- **Disease risk.** Every occupied house gains disease risk each month by its level's
  increment (Zeus, Beginner): Hut **20**, Shack and Hovel **15**, Homestead and Tenement
  **10**, Apartment and Townhouse **5**. An elite house gains **5**, a Townhouse's. The risk
  is full at **60**, like fire.
- **Falling sick.** A house at full disease risk falls sick at random, **once a month on
  average**. A house at full risk next to a sick one falls sick at once.
- **A sick house** (plague):
  - loses **a quarter of its residents** (rounded up) at each month end, who die;
  - takes no settlers;
  - adds **60** disease risk a month to every house within **1 tile**;
  - stays sick until a healer passes, or until it is empty.
  Its residents keep working and its needs are counted as usual.
- **The Infirmary** (Zeus): 4×4, **11** workers, **35** dr, appeal **-2** out to **4**
  tiles, fire **5**, collapse **5**. It sends a **healer** who roams **27** tiles like a
  water carrier, resting a quarter month between walks at full staff. A healer passing a
  house (the usual 2-tile reach) resets its disease risk to zero and cures it if sick.
- **Seen by the player:**
  - inspector: "Disease risk 40%", and "Sick with plague" on a sick house;
  - map mode: **Disease**, beside Fire and Collapse, coloured the same way, with sick houses
    marked;
  - notice: "Plague at 31,18", once per outbreak per house;
  - the Ledger's Population chapter counts deaths by plague per year.

## Healthy and well fed

The Warriors' House charter. Well fed (removed in slice 34) comes back as half of it.

- **Healthy and well fed:** for **24 months in a row**, the city has at least one Townhouse,
  no house goes without food, and no house falls sick. (Widened from Townhouses only after the
  slice 45 playtest; Huts neither eat nor fall sick, so they never reset it.)
  - "Goes without food" is the old Well fed test: it has to eat and its stock is empty.
  - Elite houses count as Townhouses, as in the other two charters.
  - A month with no Townhouse resets the count.
  - The Charters panel shows it like the others, with what last reset it: "Townhouse at
    40,22 ran out of food" or "Townhouse at 40,22 fell sick".
- Completing it grants **one Warriors' House permit** and posts a notice. The count
  restarts.

## Armor and the Armory

- **Armor** is a new good, stored in storehouses. 1 load = 100 units.
- **The Armory** (Zeus): 2×2, **18** workers, **40** dr, appeal **-8,-7,-6,-5**, fire **8**,
  no collapse. It turns **1 load of bronze into 1 load of armor**, **6 loads a year** at full
  staff (Zeus). It holds **4** loads of bronze and **4** of armor. Its buyer fetches bronze
  from storehouses; its cart takes armor to a storehouse.
- Bronze now has two users. Foundries still send to a Sculpture Studio with room first; the
  Armory's buyer takes from storehouses only.
- **The Arms Vendor** (Zeus's agora stall): 2×2, **4** workers, **10** dr, holds **8** loads,
  its buyer fetches **4**, like the other vendors. The agora's peddler stocks a Warriors'
  House with **3 months** of armor (24 units). Ordinary houses take none.
- The Treasury, the Ledger's Production chapter and the storehouse pick up armor the way they
  picked up scrolls.

## The Warriors' House and the Drill Ground

| | |
|---|---|
| Blueprint | 4×4 house, a straight 4-tile stretch of road, 4×2 Drill Ground across it, the same 7×4 shape as the other elites |
| Road | any road |
| Neighbourhood | an **Infirmary** with its nearest tile within **6 tiles** of the house's block |
| Charter | Healthy and well fed |
| Residents | everyone from the four Townhouses (up to 240), in the labor pool |
| Needs | a Townhouse's needs ×4, culture 45, plus **armor**. **No appeal need** |
| Taxes | a Townhouse's (multiplier 2) |
| Cost | 100 dr + 1 permit |
| Demotion | any need missing for a month, once started → four vacant lots, and the Drill Ground and its hoplites are lost |

- **Placing it** works like the other elites: rotation, the preview, the Drill Ground's
  ground clear, the four houses' stocks and coverage carried over. There is no appeal test at
  placement.
- **No appeal need** is the type's trait. Once placed, ugly neighbours never demote it.
- **Armor:** it wears **8 units a month**, taken at month end with its other goods. A month
  without armor, once started, demotes it.
- **Unstarted until its first armor**, like the other elites.
- **The Drill Ground** (4×2, no appeal, no fire, **8** workers from the labor pool). It holds
  no armor and can't be demolished on its own.
- **Elite sites:** the inspector line ("possible Warriors' House site", with "no Infirmary
  within 6 tiles" among what is missing), the Elites map mode in **red**, and the notice "A
  Warriors' House can now be placed at …", the same as for scholars.

## Hoplites and the army roster

- **Training.** While its house is started and has armor in stock, the Drill Ground trains
  **one hoplite every 2 months** at full staff, in proportion to staffing. A house's
  **company** holds at most **8** hoplites; a full company stops training.
- Hoplites are counted among the house's residents, not added to them.
- **Lost with the house.** A demoted house takes its company with it.
- **The army roster** is a new chapter in the Ledger, **Army**: each Warriors' House with its
  company (for example "Warriors' House at 31,18: 5 / 8 hoplites"), and the city's total.
- Notice: "The Warriors' House at 31,18 has a full company".

## Slices

1. **Warriors' models.** The redesign round above. An interactive session, not a slice.
2. **Sickness and the Infirmary.**
3. **Healthy and well fed.**
4. **Armor and the Armory**, with the Arms Vendor.
5. **Warriors' House and Drill Ground**, with its elite sites.
6. **Hoplites and the army roster.**

## Decisions taken without the owner

- The building is named **Infirmary**, Zeus's name, not the roadmap's "Hospital".
- Sickness follows the fire model: risk to 60, random onset once a month on average,
  instant spread to a full-risk neighbour, 60 risk a month to houses within 1 tile.
- A sick house loses a quarter of its residents a month and takes no settlers; it stays sick
  until a healer passes or it is empty.
- Elite houses gain disease risk 5, a Townhouse's (Zeus gives elites 0 on Beginner), since
  they keep the Townhouses' families.
- The Infirmary's appeal is a flat -2 out to 4 tiles (Zeus gives -2 with range 4, no step).
- The charter counts sickness and hunger in Townhouses (and elites) only, like the others.
- 1 bronze makes 1 armor. Armor is not traded.
- The Warriors' House has no appeal need and no appeal test at placement.
- Its neighbourhood is an Infirmary within 6 tiles, the Scholars' range. The horizon's
  Gymnasium and Foundry are dropped.
- Armor is worn at 8 units a month, the other elites' amount.
- Drill Ground: 8 workers, one hoplite every 2 months at full staff, a company of 8.
- Hoplites are lost when their house demotes, unlike Works of Art.
- Warriors are red on the Elites map mode.
