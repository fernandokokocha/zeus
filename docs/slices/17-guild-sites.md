# Slice 17: Guild sites Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Planning help for the Traders' Guild. A house near the Main Road says in the
inspector that it is a possible guild site and what its block still lacks. A new **Guilds**
map mode shades the area within guild range of the Main Road and highlights the blocks a
guild could be placed on right now. The first time a block becomes placeable, a notice says
so.

**Architecture:** One rule decides whether a block can take a guild. `guild.ts` gets
`surveyGuildSite`, which looks at a 4×4 block and reports each of its four quarters
(Townhouse or not), whether it is within range of the Main Road, whether a permit is held,
and its appeal. `siteObstacle` turns a survey into the first reason it fails, in the order
placement has always used, and placement, the overlay, the inspector and the notice all go
through it. `guildRange` marks the tiles within 4 of the Main Road; both the placement check
and the overlay's shading read it.

**Spec:** `docs/superpowers/specs/2026-10-25-elite-housing-design.md`, "Guild sites
(slice 17)".

## Global Constraints

- **Same rule as placement:** exact 4×4 block of Townhouses, nearest tile within **4** of
  the Main Road, appeal ≥ **25**, a permit. No second copy of it.
- **The guild's look is final** (redesigned on main in 91f165f). This slice doesn't touch
  its model.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **Which block a house reports.** A 2×2 house is a quarter of up to four 4×4 blocks. The
   inspector looks at those inside the map and within guild range, and reports the one with
   the fewest things missing. On a tie, the block already made of more houses wins, then
   the block that starts at the house.
2. **Vacant lots count.** A vacant lot in range also shows the line, since it is where a
   player would start building toward a guild.
3. **Wording:** "Possible guild site at 3, 12: not a Townhouse yet, 2 of the other 3 houses
   not Townhouses, no permit, appeal 25 (has 22)", or "Guild site at 3, 12: a Traders'
   Guild can be placed now". The coordinates are the block's corner, where the guild goes.
4. **Shaded area:** tiles within 4 of the Main Road, the Main Road itself left clear. A
   guild has to reach into it. Placeable blocks are coloured over all 16 tiles.
5. **One notice per block, ever.** A block is named by its corner. Once announced, it is
   not announced again, even if it stops and starts qualifying or a guild there demotes.
   The notice is clickable to the block.
6. **The check runs every tick while a permit is held.** Without a permit nothing
   qualifies, so the check is skipped.
7. **The map mode is called "Guilds",** titled "Traders' Guild sites".

## Review Focus

1. **The refactor keeps placement's behaviour,** the order of its reasons included: the
   guild tests stay green unmodified. Task 2.
2. **One rule for four readers:** placement, inspector, overlay and notice all use
   `surveyGuildSite` and `siteObstacle`. Tasks 3–5.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Survey a guild site (refactor)

**Files:** Modify `src/sim/guild.ts`.

- [x] **Step 1:** Replace the block, range, permit and appeal checks in `guildObstacle` with
  `surveyGuildSite` + `siteObstacle`, and the Main Road distance check with `guildRange`.
  `tests/sim/guild.test.ts` stays green without changes.

### Task 3: Inspector

**Files:** Modify `src/sim/guild.ts`, `src/sim/inspect.ts`. Tests in
`tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a ready Townhouse block says it can be placed; each
  blocker is named (not a Townhouse yet, the others, no permit, appeal); a house out of
  range shows no line; a vacant lot in range shows it; the block with fewest blockers wins.
- [x] **Step 2:** Implement `guildSiteOf` and the line.

### Task 4: Overlay

**Files:** Modify `src/sim/guild.ts`, `src/sim/overlays.ts`, `src/render/overlay-layer.ts`,
`src/render/palette.ts`. Tests in `tests/sim/overlays.test.ts`.

- [x] **Step 1:** Write failing tests: tiles within 4 of the Main Road read 0, the Main Road
  and tiles at 5 read nothing, a placeable block reads 1 on all 16 tiles, a block without a
  permit reads 0.
- [x] **Step 2:** Implement `placeableGuildSites`, the readings and the scale.

### Task 5: Notice

**Files:** Modify `src/sim/guild.ts`, `src/sim/state.ts`, `src/sim/tick.ts`. Tests in
`tests/sim/notices.test.ts`.

- [x] **Step 1:** Write failing tests: a notice with the block's corner when a block first
  qualifies; none again for that block; none without a permit.
- [x] **Step 2:** Implement `announceGuildSites`.

### Task 6: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** The smoke test counts 11 map modes and opens Guilds.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshots, the Guilds overlay included.

### Task 7: Docs and ship

- [x] **Step 1:** Tick slice 17 in `docs/roadmap.md`. Record the notice rule in zeus-numbers.
- [x] **Step 2:** Squash onto `main`, push, wait for CI and Pages.
