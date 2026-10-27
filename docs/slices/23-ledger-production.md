# Slice 23: Ledger: Production Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The Ledger's Production chapter shows real figures: per good, what was made in
the last 12 months against what the buildings could make, what was used against what was
wanted, the stock in granaries and storehouses, and a status.

**Architecture:** `src/sim/flows.ts` is a leaf module that books goods as they move:
`recordFlow(state, 'made' | 'possible' | 'used' | 'wanted', good, units)` into
`state.flows.thisMonth`. Producers and consumers call it where goods appear or vanish.
`src/sim/production.ts` owns the industry rates, closes each month (books every
industry's full-rate output and input, then keeps the last 12 months) and builds
`productionReport(state)`. The UI's sample goes; the chapter re-renders from the report
while the Ledger is open.

**Spec:** `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md`, "Production".

## Decisions (closest to Zeus, recorded in the commit)

1. **The last 12 months are the last 12 finished months.** The figures change once a
   month, when the month is settled, like Zeus's monthly reports. In the first year they
   cover the months so far.
2. **"Could make" is each building's full-staff rate**, booked a twelfth at a time for
   every month the building stood, so a farm built in March counts from March: farm 8
   loads of food, carding shed 8 fleece, growers' lodge 20 olives, olive press 6 oil,
   weaver 6 cloth, timber mill 13 wood, masonry shop 12 marble, foundry 13 bronze,
   sculpture studio 6 sculptures a year.
3. **Used** is what houses and the Traders' Guild consume, what presses, weavers and
   studios take in, and what sanctuaries receive, the initial marble included.
4. **Wanted** is what houses needed each month, what workshops would take in at full
   rate (presses 6 olives, weavers 6 fleece, studios 24 bronze a year), and for wood,
   marble and sculptures what sanctuaries received plus what they still need now.
5. **Status:** idle when nothing was made or wanted; short when less was used than
   wanted; surplus when more was made than wanted; enough otherwise.
6. **Figures are in loads**, as in the inspector, to one decimal.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The records

**Files:** `src/sim/flows.ts`, `src/sim/production.ts`, `src/sim/state.ts`,
`src/sim/tick.ts`, the producers, `tests/sim/production.test.ts`.

- [x] **Step 1:** Failing tests: each producer books what it makes; houses, workshops
  and sanctuaries book what they use and want; a month closes into the 12-month window
  with every industry's full-rate output; stock sums granaries and storehouses; status.
- [x] **Step 2:** Implement.

### Task 3: The chapter

**Files:** `src/ui/ledger.ts`, `src/ui/ledger-chapters.ts`, `src/ui/ledger-samples.ts`.

- [x] **Step 1:** Production on `productionReport`, live while the Ledger is open, no
  sample badge, in loads; the sample goes.
