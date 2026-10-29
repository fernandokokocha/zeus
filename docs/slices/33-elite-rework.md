# Slice 33: Elite rework Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The Traders' Guild follows the shared elite shape. It keeps every resident of
its four Townhouses (up to 240), who join the labor pool; it uses four houses' worth of
fleece and oil; it pays tax at multiplier 1. Its 20 merchants stop being residents set
apart and become 20 of the Trade Yard's 28 workers, after its 8 cart pushers, and the
merchants the yard has cap the caravans it can send.

**Architecture:** `TRADERS_GUILD` in `src/sim/housing.ts` loses `merchants` and gains
`capacity: 240`, `houses: 4` and `taxMultiplier: 1`. `houseCapacity` and `houseTax`
answer for a guild from it, `workforce` and `collectTaxes` take every residence, and
settlers top a guild up like a house. `food.ts` multiplies fleece and oil by the guild's
houses. The yard's `workers` becomes 28 in `BUILDING_SPECS`; `exports.ts` gets
`YARD_CART_PUSHERS = 8` and `yardMerchants(yard)`, and `merchantsHome` reads the yard.

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`, "Elite rework".

## Decisions (closest to Zeus, recorded in the commit)

1. **Settlers fill a guild up to 240,** as they do a house below capacity: Zeus's elite
   housing takes settlers too.
2. **The Tax map mode shows guilds** now that they pay, scaled with the houses.
3. **The yard's inspector splits its staff:** "Workers 28/28: 8 cart pushers, 20 merchants".
   The guild's inspector shows residents, its tax and "Caravans out N of M", where M is
   what the yard's merchants allow right now.
4. **A yard that loses workers recalls nobody.** Caravans already out finish their trips;
   no new one forms until the merchants at home cover five.
5. **A guild's fleece and oil stock target scales too:** 3 months of 8 units, 24 each.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Residents, labor and taxes

**Files:** `src/sim/housing.ts`, `src/sim/guild.ts`, `src/sim/labor.ts`,
`src/sim/economy.ts`, `src/sim/settlers.ts`, `src/sim/overlays.ts`, `tests/sim/guild.test.ts`.

- [x] **Step 1:** Failing tests: placing a guild keeps every resident (240); settlers top
  it up to 240; its residents join the workforce; it pays 1 × residents × 0.09 a month
  once a tax collector passed; it shows in the Tax map mode.
- [x] **Step 2:** Implement.

### Task 3: Consumption

**Files:** `src/sim/food.ts`, `tests/sim/guild.test.ts`, `tests/sim/helpers.ts`.

- [x] **Step 1:** Failing test: a guild uses food per resident, 8 fleece, 8 oil and 8 cloth
  a month, and is stocked to 24 fleece and oil.
- [x] **Step 2:** Implement.

### Task 4: Merchants on the yard

**Files:** `src/sim/buildings.ts`, `src/sim/exports.ts`, `tests/sim/exports.test.ts`.

- [x] **Step 1:** Failing tests: the yard employs 28; with 8 or fewer it has no merchants
  and sends no caravan; with 18 it sends at most 2; with 28, 4.
- [x] **Step 2:** Implement.

### Task 5: Inspector and docs

**Files:** `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`, `src/gallery/main.ts`,
`docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Failing tests for the guild's and the yard's inspector lines.
- [x] **Step 2:** Implement; update the numbers reference and the gallery caption.
