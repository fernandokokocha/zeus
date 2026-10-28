# Slice 28b: Map of Greece Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The World panel draws a real, flat map of Greece. Our city is Athens; the four
partners become Thebes, Corinth, Argos and Sparta at their real places, joined to Athens by
a small network of ancient roads. A route's round trip comes from its road's length.

**Architecture:** `src/sim/greece.ts` owns `PLACES` (real towns and passes with longitude
and latitude) and `roadKm`. In `src/sim/trade.ts` each partner is a place and names its
**road**, the places from Athens to it; `roundTripMonths` turns the road's length into
months with one constant, `CARAVAN_KM_PER_MONTH`. Roads sharing a stretch list the same
places, so they share its line. `src/ui/greece-land.ts` is the coastline: Natural Earth
1:10m land and minor islands, clipped to the Aegean, projected and simplified once by a
throwaway Ruby script into one SVG path. `src/ui/world.ts` projects the places the same
way and draws sea, land, roads and cities.

**Spec:** `docs/superpowers/specs/2026-10-27-trade-design.md`, "Map of Greece".

## Decisions (closest to Zeus, recorded in the commit)

1. **Partners and goods.** Melanthos → **Thebes** (green: buys fleece, olives; sells food,
   wood: Boeotian grain). Argyra → **Corinth** (red: buys oil, cloth, sculptures; sells
   bronze, wood: Corinthian bronze). Kerynthos → **Argos** (ochre: buys food, wood, marble;
   sells olives, oil, sculptures: the Argive school of sculptors). Halikeia → **Sparta**
   (purple: buys cloth, bronze, oil; sells marble, fleece: Laconian marble, Arcadian
   pasture). The same goods are bought and sold overall; only who sells what moved.
2. **The road network:** Athens – Eleusis (the Sacred Way); Eleusis – Eleutherae (the
   Cithaeron pass) – Thebes; Eleusis – Megara – Isthmus – Corinth; Corinth – Mycenae –
   Argos; Argos – Tegea – Sparta. A partner's road is written out as its list of places
   rather than searched for: four roads, written once.
3. **Distance** is the great-circle length of each straight segment.
4. **Round trip:** a caravan covers **40 km a month**; round trip = 2 × road length ÷ 40,
   rounded to whole months: Thebes 3, Corinth 4, Argos 6, Sparta 9.
5. **Map bounds:** 21.0–24.6° E, 36.3–38.7° N, equirectangular at 37.5° N: the whole
   Peloponnese, Attica, Boeotia, southern Euboea and the western Cyclades.
6. **Drawing:** sea and land in two flat colours; roads dashed; each partner a disc in its
   colour labelled with its name and round trip; Athens a blue disc; the places along the
   roads small dots with small names.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Places, roads and round trips

**Files:** `src/sim/greece.ts`, `src/sim/trade.ts`, `src/sim/guild.ts`,
`src/sim/inspect.ts`, `tests/sim/greece.test.ts`, `tests/sim/trade.test.ts`,
`docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Failing tests: every road starts in Athens along the Sacred Way and ends
  at its partner; roads through the same place share the way there; round trips 3, 4, 6, 9;
  the partners' names and goods.
- [x] **Step 2:** Implement; update the trade table in `zeus-numbers.md`.

### Task 3: The map

**Files:** `src/ui/greece-land.ts`, `src/ui/world.ts`, `src/style.css`.

- [x] **Step 1:** Generate the coastline path.
- [x] **Step 2:** Draw sea, land, roads, places and partners; clicking a partner works as
  before.

### Task 4: Ship

- [x] **Step 1:** Typecheck, tests, build. (Live session: the owner smoke-tests.)
- [x] **Step 2:** Tick the roadmap, squash onto `main` as `Slice 28b: Map of Greece`.
