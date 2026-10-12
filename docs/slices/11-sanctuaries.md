# Slice 11: Sanctuaries Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The city builds sanctuaries to Demeter, Athena and Hephaestus. Placing one costs
drachmas and its initial marble, taken from the storehouses. The rest of its marble, wood
and sculptures arrive by cart from the storehouses, and artisans from an Artisans' Guild
build it in five visible stages. A finished sanctuary radiates +20 appeal and hires its
60 workers.

**Architecture:** A new sim module `sanctuaries.ts` holds the sanctuary table, the
construction rules and the artisans. A sanctuary keeps the materials delivered to it in
its `marble`, `wood` and `sculptures` fields, which only ever grow, and the artisan work
done in `production`. Each stage takes a fifth of every material and a fixed number of
artisan visits. Storehouses gain three supply carts, one per material, that follow the
existing carrier rules with the sanctuaries under construction as their stores. Artisans
are destination walkers like trainees.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 11.

## Global Constraints

- **Sanctuaries** (zeus-numbers): Garden of Demeter 18×12, 840 dr, 27 initial marble,
  110 marble, 20 wood, 10 sculptures. Arbor of Athena 16×12, 2160 dr, 24 / 67 / 22 / 8.
  Forge of Hephaestus 13×8, 760 dr, 13 / 48 / 14 / 6. 60 workers each. Appeal
  20,18,16,14,12,10 once finished. They never burn or collapse.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **The marble column is the total**, the initial marble included: placing the Forge of
   Hephaestus takes 13 marble, and carts bring the other 35.
2. **Initial marble comes from any storehouses**, staffed or not, fullest first. Without
   enough the sanctuary cannot be placed, and the preview says how much is missing.
3. **One sanctuary per god**, as in Zeus.
4. **Storehouses supply the site.** A staffed storehouse sends a cart pusher with up to
   4 loads of each material a site still needs. Workshops keep sending their goods to
   storehouses; nothing goes straight to a site.
5. **Five stages** (**ours**): ground broken, platform, columns, roof, finished with the
   god's statue. Each stage needs a fifth of every material on site (rounded up) and
   **4 artisan visits** (**ours**).
6. **Artisans:** a staffed guild sends one artisan at a time, a quarter month apart at
   full staff (like other walkers' rest), to the nearest site that has materials for
   work not yet claimed by other artisans. His arrival is one visit.
7. **A site hires nobody and radiates no appeal** until finished. A finished sanctuary
   hires 60 workers; they serve the god from slice 12.

## Review Focus

1. **Initial marble** taken across several storehouses. Task 2.
2. **Site room** counts carts on the way, so carts never over-deliver. Task 3.
3. **Artisans and a changing world:** site demolished, guild demolished. Task 4.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Sanctuaries and placement

**Files:** Create `src/sim/sanctuaries.ts`, `tests/sim/sanctuaries.test.ts`. Modify
`src/sim/buildings.ts`, `src/sim/commands.ts`, `src/sim/appeal.ts`, `src/sim/labor.ts`,
`src/sim/overlays.ts`.

- [x] **Step 1:** Write failing tests: placing a sanctuary costs its drachmas and takes
  its initial marble from storehouses (across several); it fails without enough marble
  and says how much is missing; one per god; a site hires nobody and radiates nothing; a
  finished one hires 60 and radiates 20,18,16,14,12,10.
- [x] **Step 2:** Implement. Tests pass.

### Task 3: Supply carts

**Files:** Modify `src/sim/carriers.ts`, `src/sim/state.ts`. Extend
`tests/sim/sanctuaries.test.ts`.

- [x] **Step 1:** Write failing tests: a staffed storehouse sends marble, wood and
  sculptures to a site, up to 4 loads a cart; carts stop when the site has all it needs,
  counting carts on the way; an unstaffed storehouse sends nothing.
- [x] **Step 2:** Implement. Tests pass.

### Task 4: Artisans and stages

**Files:** Modify `src/sim/sanctuaries.ts`, `src/sim/state.ts`, `src/sim/tick.ts`,
`src/sim/commands.ts`. Extend `tests/sim/sanctuaries.test.ts`.

- [x] **Step 1:** Write failing tests: a staffed guild sends an artisan to a site with
  materials; each visit is work; a stage completes after 4 visits with its materials on
  site; no artisan goes where materials are missing; after five stages the sanctuary is
  finished. A demolished site sends its artisans elsewhere or away; a demolished guild
  takes them with it.
- [x] **Step 2:** Implement. Tests pass.

### Task 5: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Write failing tests: a site shows its stage, each material delivered of
  needed, and what it waits for; a finished sanctuary shows its workers; a guild says
  where its artisan is going or what it waits for; an artisan and a supply cart describe
  their errand.
- [x] **Step 2:** Implement. Tests pass.

### Task 6: UI and rendering

**Files:** Modify `src/ui/tools.ts`, `src/render/models.ts`, `src/render/palette.ts`,
`src/render/walker-layer.ts`.

- [x] **Step 1:** Tools for the three sanctuaries under Mythology.
- [x] **Step 2:** Models in stages: staked ground with material piles, a stepped marble
  platform, a ring of columns, the entablature and pediment roof, and finally the god's
  statue and precinct: Demeter's wheat beds, Athena's olive trees, Hephaestus' anvil and
  forge fire. Walkers: artisan (hammer), supply carts as the workshop carts.

### Task 7: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** Extend the smoke test: try to place a sanctuary without marble and see
  the reason.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Look at the stages in a throwaway render and the screenshot.

### Task 8: PR

- [x] **Step 1:** Tick slice 11 in `docs/roadmap.md`. Record the new **ours** numbers in
  zeus-numbers.
- [x] **Step 2:** Open the PR `Slice 11: Sanctuaries`. Wait for CI and Pages.
