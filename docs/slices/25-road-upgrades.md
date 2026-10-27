# Slice 25: Road upgrades Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A regular road can be upgraded for one load of marble: **Ornate** (where its
tile's appeal is at least 25) radiates appeal `[2, 1]`, **Fast** makes walkers on it move
1.5× faster. Two new tools drag the upgrades over existing road, the preview shows which
tiles take it and the marble it costs, and the inspector names the kind of road.

**Architecture:** `src/sim/road-upgrades.ts` holds the rule: the two kinds, their numbers,
`upgradeObstacle`, `upgradePlan` (which tiles of a drag take the upgrade, counting Ornate
tiles already taken in the same drag toward the next one's appeal, and stopping when the
marble runs out) and the `upgradeRoads` command. State gains `roadUpgrades`, one entry
per tile. `appealMap` adds Ornate tiles. `walkPath` and roamers advance by
`walkerSpeed`, which reads the walker's tile. Taking marble from storehouses, fullest
first, moves out of the sanctuary code so both use it. The renderer draws four road
looks (regular, upgradable hint, Ornate, Fast).

**Spec:** `docs/superpowers/specs/2026-10-27-appeal-design.md`, "Road upgrades".

## Decisions (closest to Zeus, recorded in the commit)

1. **One drag plans in order.** Tiles are taken from the drag's start toward its end, and
   an Ornate tile taken earlier in the drag counts toward the next tile's appeal, so a
   street can be upgraded outward from its best end in one drag.
2. **The tools sit in the build menu:** Ornate Road in Aesthetics, Fast Road in
   Distribution (moved there from the quick row after the playtest).
3. **The preview's marble cost** is a status line while the tool is in hand
   ("Ornate Road: 3 tiles, 3 marble (12 in storehouses)"), as no other preview carries text.
4. **Speed is read from the tile the walker stands on**, the same tile the inspector uses.
5. **Ornate curbs:** the blue ornate border is drawn on the sides of a tile that face away
   from road, so an Ornate street reads as one white street with blue curbs.
6. **Fast grooves** run along the street; a junction tile gets both directions.
7. Demolishing an upgraded road tile removes the road and its upgrade; re-laying road
   there gives a regular road.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The rule

**Files:** `src/sim/road-upgrades.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/sim/appeal.ts`, `src/sim/walking.ts`, `src/sim/roamers.ts`, `src/sim/sanctuaries.ts`,
`tests/sim/road-upgrades.test.ts`.

- [x] **Step 1:** Failing tests: Ornate needs appeal 25, Fast doesn't; Main Road and
  upgraded tiles are skipped; each tile takes a load of marble, fullest storehouse first;
  no marble, no upgrade, and a drag stops when it runs out; an Ornate tile in the drag lets
  the next one qualify; Ornate radiates `[2, 1]` and stays Ornate when appeal drops;
  demolishing removes it; walkers cross Fast Road 1.5× faster.
- [x] **Step 2:** Implement.

### Task 3: Tools, preview and inspector

**Files:** `src/ui/tools.ts`, `src/ui/icons.ts`, `src/ui/tool-input.ts`,
`src/ui/preview.ts`, `src/style.css`, `src/sim/inspect.ts`, `tests/ui/preview.test.ts`,
`tests/sim/inspect.test.ts`.

- [x] **Step 1:** Failing tests: the preview marks taken and skipped tiles; the inspector
  names the road kind and, for a regular tile, its appeal and whether it can be Ornate.
- [x] **Step 2:** Implement, with the status line for the marble cost.

### Task 4: The looks

**Files:** `src/render/road-looks.ts`, `src/render/world-layer.ts`, `src/render/walker-layer.ts`,
`src/render/palette.ts`.

- [x] **Step 1:** Hint border, Ornate flagstones with blue curbs, Fast grey stone with wheel
  grooves; walkers' drawn lookahead uses their speed.

### Task 5: Ship

- [x] **Step 1:** `zeus-numbers.md`, roadmap tick, typecheck, tests, build; one commit.
