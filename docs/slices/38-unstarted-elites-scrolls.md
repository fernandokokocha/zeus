# Slice 38: Unstarted elites and peddled scrolls Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A new elite house no longer races a one-month clock to its first special good: it
stands **unstarted** until its first cloth or scroll arrives, and only then do its needs
count. Scrolls reach scholars the way cloth reaches traders: a **Scroll Vendor** on the
Agora stocks the peddler, and the Scholars' House keeps its own scrolls. The **Library**
stops fetching scrolls and becomes the place where reading turns into Works of Art.

**Architecture:** `EliteHousing` names each type's special good (`cloth`, `scrolls`), which
is also its extra need. `Building.started` is false for a freshly raised elite, and
`tickElites` skips the need clock until the special good is in stock. Scrolls become a
`PeddledGood`: a `scrollVendor` with its buyer, a monthly use of 8 units for scholars (as
cloth for the guild), and 3 months of stock. `scholars.ts` turns the scrolls read each
month into pages at the Library's staffing, and 100 pages into a Work of Art.

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md` (amended in
this slice), roadmap item "Elites start unstarted, and scrolls are peddled".

## Decisions (recorded in the commit)

1. **Unstarted** holds the whole need clock, not only the special good's: an unstarted
   house never breaks up. Its families still live, work, pay taxes and use their goods.
   It starts on the first tick it holds any of its special good, and never goes back.
2. **Scroll Vendor:** 2×2, 4 workers, 10 dr, as every Agora vendor. Its buyer fetches up to
   4 scrolls from storehouses; it holds up to 8.
3. **Scholars read 8 units a month** (96 a year), taken at month end with the other goods,
   the same amount as the guild's cloth. The house stocks 3 months (24 units).
4. **The Library** holds no scrolls and has no buyer. Each unit read becomes a page at the
   Library's staffing (8 of 8 workers: a whole page); 100 pages make a Work of Art. An
   unstaffed Library makes no Works of Art but no longer ends the house.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Unstarted elites

**Files:** `src/sim/housing.ts`, `src/sim/elites.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/sim/inspect.ts`, tests.

- [x] **Step 1:** Failing tests: a guild placed with no cloth sits a year without breaking
  up; its first cloth starts it, and a month without cloth after that breaks it; the
  inspector says "Waiting for its first cloth".
- [x] **Step 2:** Implement.

### Task 3: Peddled scrolls

**Files:** `src/sim/buildings.ts`, `src/sim/carriers.ts`, `src/sim/food.ts`, `src/sim/state.ts`,
`src/sim/scholars.ts`, `src/sim/elites.ts`, `src/sim/inspect.ts`, `src/sim/overlays.ts`, tests.

- [x] **Step 1:** Failing tests: the Scroll Vendor's buyer fetches scrolls; the peddler stocks
  scholars with 24 units and Townhouses with none; scholars use 8 a month; reading at full and
  half staffing; a Work of Art at 100 pages; no scrolls in the house for a month breaks it;
  inspector meters and the Library's lines; supplies column.
- [x] **Step 2:** Implement; delete the Library's buyer and stock.

### Task 4: UI, models, start city, docs

- [x] **Step 1:** Scroll Vendor in the Distribution menu, the Agora model, its walker; the
  scholars start city gets a Scroll Vendor.
- [x] **Step 2:** Spec, numbers reference, backlog; typecheck and build.
