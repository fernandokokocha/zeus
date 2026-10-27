# Slice 24: Production priorities Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The player steers workers per industry. Priority 1 industries are staffed
first, then 2, then 3, then everything without a priority, in placement order within
each group. A closed industry gets no workers, takes no goods and makes nothing. The
Ledger's Priorities chapter shows this on real data.

**Architecture:** `src/sim/industries.ts` is a leaf module: the nine industries, their
priority and open switch (`state.industries`), and `isClosed`. `src/sim/labor.ts` orders
buildings by priority group when it assigns workers, offers no jobs at closed industries,
and owns the two commands (`setIndustryPriority`, `setIndustryOpen`, which reassign
workers at once so the change shows while paused) and `prioritiesReport`. Production
stops booking what closed industries could make or would take in. The Ledger's last
sample goes, and with it the "sample data" badge.

**Spec:** `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md`, "The priorities
rule".

## Decisions (closest to Zeus, recorded in the commit)

1. **Closing works through jobs.** A closed industry offers no jobs, so it has no workers;
   with no workers a building already sends no carts, buys nothing and takes no
   deliveries. Goods it holds stay inside until it is opened again. Walkers already out
   finish their trip.
2. **Closed industries drop out of "could make" and "wanted"** in the Production
   chapter: a deliberate closure is not a shortfall.
3. **Settings belong to the industry, not to buildings**, so they survive demolishing
   the last building of a type and apply to new ones at once.
4. **The chapter's summary** is the city's workforce against the jobs on offer (closed
   industries offer none). An industry row shows its workers against its full staff,
   closed or not, so the player sees what opening it would take.
5. **The inspector** of a building in a closed industry says "Closed in the Ledger: does
   not work".
6. Every industry is listed, built or not, as in the Production chapter.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The rule

**Files:** `src/sim/industries.ts`, `src/sim/labor.ts`, `src/sim/state.ts`,
`src/sim/production.ts`, `src/sim/inspect.ts`, `tests/sim/labor.test.ts`,
`tests/sim/production.test.ts`, `tests/sim/inspect.test.ts`.

- [x] **Step 1:** Failing tests: priority groups are staffed in order; services and
  houses stay in the no-priority group; a closed industry gets no workers and opening
  restores them; a closed press takes no olives; closed industries book no capacity;
  the commands reassign at once; the report; the inspector line.
- [x] **Step 2:** Implement.

### Task 3: The chapter

**Files:** `src/ui/ledger.ts`, `src/ui/ledger-chapters.ts`, `src/ui/ledger-samples.ts`,
`index.html`, `src/style.css`.

- [x] **Step 1:** Priorities on `prioritiesReport`, wired to the commands, re-rendered only
  when the report changes so its buttons stay clickable; the sample and the badge go.
