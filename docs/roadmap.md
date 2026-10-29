# Roadmap

Everything still to build, in order: milestones and ad-hoc requests mixed.

- A **milestone** is a heading. Once its spec is written, its slices are listed under it.
  A milestone with nothing listed still needs its spec.
- An **ad-hoc request** is an item of its own, placed where it should happen.
- The next thing to build is the first item. It gets its slice number when work starts, and
  it is deleted from here in the commit that delivers it.

- **Map generation fix** (ad-hoc):
  - **Deposits:** one marble deposit and one copper deposit per map, and neither within reach of the Main Road. No deposit tile may fall where a Traders' Guild blueprint could go, so deposits never take guild space.
  - **Road direction:** the Main Road always runs west to east today, entering at the west edge with the sea in the east. Its vertical runs already go up or down at random. Keep the road monotonic (it never doubles back), but at the end of generation rotate or mirror the whole map at random. Then the entry edge, the coast and the road's direction vary from map to map.
  - **Test:** the 100-seed tests check all of the above on every orientation.

## Elite rework

Every elite keeps the population and consumption of the four Townhouses it replaces, adds
one consumption of its own, and comes with an annex across a road. The annex is staffed
from the labor pool and is where the bonus is made.

Spec: `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`.

- Elite rework
- Well dressed

## Scholars' House

Spec: `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`.

- Papyrus and the Scriptorium
- Learned city
- Scholars' House and Library
- Elite sites
- Upgrades (needs its own design first)

## Warriors' House

Near a Hospital. Charter: Healthy and well fed (24 months), which brings sickness. Consumes
armor (bronze → Armory). Annex: Drill Ground. Bonus: hoplites on the army roster.

## Athletes' House

Near a Stadium. Charter: full Gymnasium coverage with a Stadium built (24 months). Consumes
double oil. Annex: Bathhouse, which raises appeal. Bonus: the city enters the Olympics
every 4 years, with its chance of winning in the Ledger.

## Merchant Mariners

Near the shore. Charter: Watching the Waves (fishermen at sea, 24 months), which brings
fishing. Consumes wood and cloth to build the ship, then for repairs. Low taxes. Annex:
Dock. Bonus: a sea route.

## Trireme Crew

Near the shore. Charter: the Warriors' one, and its permit fits either house. Consumes wood
and armor. Annex: Dock. Bonus: a warship on the roster.

## Later

Elite levels (Horsemen), Nobles' Court near the Palace.
