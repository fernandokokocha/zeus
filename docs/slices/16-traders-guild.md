# Slice 16: Traders' Guild Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The first elite house. A **Traders' Guild** (4×4) is placed from a new "Elite"
build group over four Townhouses forming an exact 4×4 block within 4 tiles of the Main
Road, for 100 dr and one Well fed permit. 20 merchants live and work there. It needs
everything a Townhouse needs plus **fine cloth**, which a new **Cloth Vendor** on an agora
brings. If any need is missing for a month it breaks back into four vacant lots, posts a
notice, and its permit is gone.

**Architecture:** A new building type `tradersGuild` and a new sim module `guild.ts` own
the guild's rules: where it can go, placing it over the four houses, what it is missing,
and the one-month demotion clock (`pendingTicks`, as for house level changes). Houses and
guilds are both *residences*: roamers serve them, they eat, and the Well fed charter counts
them. `residentNeeds` gives a residence's needs (a house's level needs, or the guild's
list), and `monthlyUse` reads it, so eating and peddler stocking work for both without a
second copy. Cloth joins food, fleece and oil as a *peddled good*; its monthly need is 0
for an ordinary house, so a cloth peddler only stocks guilds. Guild residents are left out
of the workforce. The cloth vendor follows the food, fleece and oil vendors exactly
(`clothBuyer` carrier, `clothPeddler` roamer).

**Spec:** `docs/superpowers/specs/2026-10-25-elite-housing-design.md`, "The Traders'
Guild (slice 16)" and "How every elite type works".

## Global Constraints

- **Guild:** 4×4, 100 dr + 1 permit, 20 merchants, within **4** tiles of the Main Road
  (nearest tile), needs food, water, fleece, oil, culture 45, cloth and appeal ≥ 25. No
  taxes, no jobs from the pool. Fire risk 8 like a house, never collapses (spec).
- **Cloth:** 8 units a month (spec, **ours**). Stocked to 3 months like other goods.
- **Cloth vendor:** like the other vendors: 2×2, 4 workers, 10 dr, stock 8 loads, peddler
  range 44.
- **Look keys:** the guild and the cloth vendor are new models; their `LOOKS` entries hold
  everything the models read.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the commit)

1. **Appeal blocks placement.** A block whose average appeal is below 25 can't take a
   guild, because it would demote a month later. Slice 17 lists "appeal too low" among the
   site blockers, so it is part of qualifying.
2. **"At or above 25"** is read literally: the guild is fine at 25 (a Townhouse devolves at
   25).
3. **Stocks carry over:** the guild gets the four houses' food, fleece and oil summed, and
   their latest water and culture coverage. Fire risk starts at 0, as for any new building.
4. **Merchants:** 20, or all the residents if the four houses had fewer.
5. **The permit is spent at placement,** so any end of the guild (demotion, fire,
   demolition) leaves it spent. The panel counts the unspent ones.
6. **Demotion lots are vacant** (residents 0) and keep the guild's rotation. The stocks go
   with the merchants.
7. **The guild counts for Well fed:** it eats, so a hungry guild resets the streak
   ("Traders' Guild at 12,30 went hungry").
8. **A burning guild becomes ruins,** as every building in this game does, so "burning" is
   the ruins' look. The guild model reads only occupied and missing a need.
9. **The demotion notice** names what is missing: "The Traders' Guild at 12,30 broke up for
   lack of cloth. Its permit is lost". It is clickable to the guild's place.
10. **Overlays:** water, food, supply and culture include the guild. House level shows
    only common houses, since the guild is not on the level ladder.
11. **Inspector:** "Merchants 20/20", appeal, "Pays no tax: earns through trade", "Trade
    route: not yet available", and either "Fully supplied" or "Missing cloth: breaks up in
    0.6 months". Meters for food, water, fleece, oil, culture and cloth.
12. **Build menu:** a new "Elite" group holds the guild, labelled "Traders' Guild (100 dr +
    permit)". The cloth vendor goes in Distribution beside the other vendors.

## Review Focus

1. **One needs table for houses and guilds** (`residentNeeds` → `monthlyUse`), so eating,
   stocking and the charter don't fork. Task 3.
2. **Workforce excludes guild residents** while population includes them. Task 4.
3. **Demotion bumps `state.version`** when the clock starts and stops, so the warning look
   is drawn. Task 5.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Cloth vendor

**Files:** Modify `src/sim/buildings.ts`, `src/sim/state.ts`, `src/sim/roamers.ts`,
`src/sim/carriers.ts`, `src/sim/food.ts`, `src/sim/inspect.ts`. Tests in
`tests/sim/cloth.test.ts`.

- [x] **Step 1:** Write failing tests: a cloth vendor goes on an agora spot for 10 dr; its
  buyer fetches cloth from a storehouse; its peddler gives cloth to a guild but none to a
  Townhouse; the inspector shows its stock meter.
- [x] **Step 2:** Implement `clothVendor`, `clothBuyer`, `clothPeddler` and cloth as a
  peddled good.

### Task 3: The guild's needs and eating

**Files:** Create `src/sim/guild.ts`, `tests/sim/guild.test.ts`. Modify `src/sim/food.ts`,
`src/sim/housing.ts`, `src/sim/roamers.ts`, `src/sim/charters.ts`.

- [x] **Step 1:** Write failing tests: a guild eats 5 food, 2 fleece, 2 oil and 8 cloth a
  month; water carriers and culture walkers cover it; a hungry guild resets Well fed.
- [x] **Step 2:** Implement residences and `residentNeeds`.

### Task 4: Placing a guild

**Files:** Modify `src/sim/guild.ts`, `src/sim/commands.ts`, `src/sim/labor.ts`,
`src/sim/safety.ts`.

- [x] **Step 1:** Write failing tests: it goes only over four Townhouses forming an exact
  4×4 block (not three, not a Townhouse and an Apartment, not offset); within 4 tiles of
  the Main Road but not 5; needs a permit and spends it; needs appeal 25; costs 100 dr;
  keeps 20 merchants and the houses' stocks; its residents don't work in the pool; it pays
  no tax; it can burn.
- [x] **Step 2:** Implement.

### Task 5: Demotion

**Files:** Modify `src/sim/guild.ts`, `src/sim/tick.ts`. Tests in `tests/sim/guild.test.ts`
and `tests/sim/notices.test.ts`.

- [x] **Step 1:** Write failing tests: a guild without cloth breaks into four vacant lots a
  month after placement; cloth arriving in time stops the clock; it posts a notice with the
  guild's place naming the missing needs; the permit stays spent.
- [x] **Step 2:** Implement.

### Task 6: Inspector and overlays

**Files:** Modify `src/sim/inspect.ts`, `src/sim/overlays.ts`. Tests in
`tests/sim/inspect.test.ts`, `tests/sim/overlays.test.ts`.

- [x] **Step 1:** Write failing tests for the guild's lines and meters, and the water
  overlay reading.
- [x] **Step 2:** Implement.

### Task 7: Models, look keys, build menu, Charters panel

**Files:** Create `src/render/traders-guild-models.ts`. Modify `src/render/models.ts`,
`src/render/look-key.ts`, `src/render/agora-models.ts`, `src/render/walker-layer.ts`,
`src/render/palette.ts`, `src/render/kit/market.ts`, `src/ui/tools.ts`, `src/ui/icons.ts`. Tests in
`tests/render/look-key.test.ts`, `tests/ui/charters.test.ts`.

- [x] **Step 1:** Write failing look-key tests: the guild's key changes when it starts
  missing a need and when its merchants leave; the cloth vendor's when it is staffed and
  gains a load; a burning guild's tiles are ruins whose key reads burning. A charters test
  shows the permit count falling as a guild is placed.
- [x] **Step 2:** Placeholder models: the guild as one 4×4 house grown from the Townhouse,
  with an upper floor, a colonnade, blue awnings and cloth bolts (rolled up and gone when
  missing a need); the cloth vendor as a stall with a blue tent and bolts. Walker figures
  for the cloth buyer and peddler.
- [x] **Step 3:** The "Elite" group with its icon; the cloth vendor in Distribution.

### Task 8: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** The smoke test places a cloth vendor on a second agora, checks 13 toolbar
  buttons, and tries a guild where no Townhouse block stands.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshots and check them, and close-ups of the guild and the cloth stall.

### Task 9: Docs and ship

- [x] **Step 1:** Tick slice 16 in `docs/roadmap.md`. Record the guild and cloth numbers in
  zeus-numbers. Add the guild and the cloth vendor to `docs/redesign-backlog.md`.
- [ ] **Step 2:** Squash onto `main`, push, wait for CI and Pages.
