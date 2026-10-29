# Slice 32: Map generation fix Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** One marble and one copper deposit per map, both well clear of the Main Road and
of any ground a Traders' Guild blueprint could take. The map is then rotated or mirrored at
random, so the entry edge, the coast and the road's direction vary from map to map.

**Architecture:** `generateTerrain` in `src/sim/map.ts` keeps building the map in one
canonical frame (entry west, sea east), but lays the Main Road before the deposits, so
each deposit is placed by retrying random spots until its whole disc keeps
`DEPOSIT_ROAD_CLEARANCE` tiles from every road tile. A last draw picks one of the eight
`ORIENTATIONS` (optional transpose, then optional flips) and `orientMap` applies it to the
terrain and the road. The 100-seed tests turn each map back into the canonical frame and
run every existing check there.

**Spec:** the roadmap item "Map generation fix".

## Decisions (closest to Zeus, recorded in the commit)

1. **"Within reach of the Main Road" means within 8 tiles** (Chebyshev) of any Main Road
   tile. A guild blueprint reaches at most 4 tiles from the road, so this also keeps every
   deposit off guild space.
2. **All eight symmetries of the square** are drawn, not just the four rotations. Mirrors
   only change which way the road turns, which is already random, but they cost nothing.
3. **The start view looks inward from the entry,** whichever edge it is on.
4. **A caravan stuck at its yard says "Waiting: no road out of the city"**, since the
   entry is no longer always west.
5. **Generation that finds no room for a deposit throws.** The 100-seed tests prove it
   never does on those seeds.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Deposits

**Files:** `src/sim/map.ts`, `tests/sim/main-road.test.ts`.

- [x] **Step 1:** Failing tests: exactly one marble and one copper deposit per seed; no
  deposit tile within 8 tiles of the Main Road; none on any tile a guild blueprint could
  take.
- [x] **Step 2:** Implement.

### Task 3: Orientation

**Files:** `src/sim/map.ts`, `tests/sim/main-road.test.ts`, `tests/sim/map.test.ts`,
`src/main.ts`, `src/sim/inspect.ts`, `src/sim/trade-ledger.ts`.

- [x] **Step 1:** Failing tests: every seed's map, turned back to the canonical frame,
  passes the existing road and coast checks; across 100 seeds the entry lies on all four
  edges.
- [x] **Step 2:** Implement, and point the start view inward from the entry.
