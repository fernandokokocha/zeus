# Slice 27: Guild yard Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The Traders' Guild is placed as one 4×7 blueprint: the guild over its four
Townhouses, a straight 4-tile stretch of Main Road along its front, and a 4×2 **Trade
Yard** across the road. The yard comes and goes with its guild, has no appeal and does
nothing yet. Guild sites, the Guilds map mode and the "can now be placed" notice follow the
new rule, and the Main Road generator test counts blueprints.

**Architecture:** `src/sim/guild.ts` owns the blueprint. The guild's placement stays its
own 4×4 origin; its rotation names the side the road is on, in the guild's own frame (the
model's front is its local south, so rotation 0 puts the road south, 1 west, 2 north,
3 east), and `guildBlueprint(placement)` returns the road tiles and the yard's placement.
`tradeYard` is a new 4×2 building type, placed with the guild's rotation. `removeBuildings`
takes a doomed guild's yard with it (as it does an agora's vendors), and `demolish` never
dooms a yard on its own. A `GuildSite` gains its rotation and whether the yard's ground is
clear; sites are only surveyed for rotations whose road tiles are all Main Road.

**Spec:** `docs/superpowers/specs/2026-10-27-trade-design.md`, "The guild blueprint".

## Decisions (closest to Zeus, recorded in the commit)

1. **The placement origin stays the guild's corner,** so it still has to land exactly on
   the Townhouse block; the cursor holds the guild, and the road and yard hang off it.
2. **Rotation 0 puts the road south** of the guild (the side its model faces); `R` turns
   the blueprint a quarter at a time as for every other building.
3. **The yard is a 4×2 building** that faces the road: in the blueprint drawn in the spec
   (`EEEERYY`) the road runs north–south, which is rotation 3 here.
4. **The yard can't burn or collapse** and has no workers this slice: it holds nothing yet.
   A guild that burns takes its yard with it.
5. **The Guilds map mode** shades the guild band along every straight 4-tile stretch of
   Main Road (both sides), and a placeable site lights up its guild and its yard.
6. **Old reason "within 4 tiles of the Main Road"** becomes "A Traders' Guild must line a
   straight 4-tile stretch of Main Road".

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The blueprint and the yard

**Files:** `src/sim/guild.ts`, `src/sim/buildings.ts`, `src/sim/commands.ts`,
`src/sim/housing.ts`, `src/sim/inspect.ts`, `tests/sim/guild.test.ts`,
`tests/sim/helpers.ts`.

- [x] **Step 1:** Failing tests: the blueprint's road and yard for each rotation; placing
  a guild places its yard across the Main Road for 100 dr in all; the front must lie along
  Main Road (wrong side, plain road, off by one all fail); the yard's ground must be clear
  (building, road, unbuildable terrain); the yard has no appeal; it can't be demolished
  alone; it goes when the guild is demolished, demotes or burns; the yard's inspector.
- [x] **Step 2:** Implement.

### Task 3: Guild sites

**Files:** `src/sim/guild.ts`, `src/sim/overlays.ts`, `src/sim/inspect.ts`,
`src/ui/map-modes.ts`, `tests/sim/inspect.test.ts`, `tests/sim/overlays.test.ts`,
`tests/sim/notices.test.ts`.

- [x] **Step 1:** Failing tests: the inspector names a yard whose ground isn't clear;
  sites only along straight stretches; the overlay band and the placeable yard.
- [x] **Step 2:** Implement.

### Task 4: Main Road generation

**Files:** `tests/sim/main-road.test.ts`.

- [x] **Step 1:** Rewrite the placement count for the blueprint; if seeds fall short of 8,
  lower it to what the generator reliably gives (at least 4) and record it in the spec.

### Task 5: Preview and model

**Files:** `src/ui/preview.ts`, `tests/ui/preview.test.ts`, `src/render/models.ts`,
`src/render/trade-yard-models.ts`, `docs/redesign-backlog.md`.

- [x] **Step 1:** Failing test: the guild preview covers guild, road column and yard.
- [x] **Step 2:** Implement; a placeholder yard model (paved court, crates, awning, a rail
  facing the road); backlog entry for the Trade Yard and the Storehouse together.

### Task 6: Ship

- [x] **Step 1:** Typecheck, tests, build. (Live session: the owner smoke-tests.)
- [x] **Step 2:** Tick the roadmap, squash onto `main` as `Slice 27: Guild yard`.
