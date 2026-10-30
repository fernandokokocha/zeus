# Slice 41: Sickness and the Infirmary Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Occupied houses build up disease risk and can fall sick with plague, which kills a
quarter of the residents a month and spreads to neighbours. The Infirmary's healer resets the
risk and cures. The player sees it in the inspector, a Disease map mode, a notice and the
Ledger's Population chapter.

**Architecture:** `src/sim/sickness.ts` holds `DISEASE_RISK_INCREMENTS` (per house level, plus
the elite one), `tickSickness` (risk, onset, spread) and `plagueMonth` (deaths at month end),
and `heal`. Buildings gain `diseaseRisk` (in the fire risk's units) and `sick`. The healer is a
roamer (`healer`, home `infirmary`, range 27, service `health`). Deaths by plague are kept per
year next to the treasury's books and closed with them in January.

**Spec:** `docs/superpowers/specs/2026-10-30-warriors-house-design.md`, "Sickness and the
Infirmary".

## Decisions (recorded in the commit)

1. **Disease** is its own map mode after Risk (the spec's "Fire and Collapse" were merged into
   Risk in slice 18). A column of disease risk on occupied houses, red near the limit like Risk;
   a sick house's column is full and drawn in a plague colour.
2. **"Next to a sick house"** means within 1 tile of its footprint, the same reach as the spread.
3. **An emptied house** is cured and its disease risk goes back to zero, so resettling it does
   not restart the outbreak at once.
4. **Settlers already on their way** to a house that falls sick still arrive; only new settlers
   skip it.
5. **Deaths by plague** in the Ledger: "this year so far" and "last year", as the Treasury does.
6. **The healer** walker is a placeholder (pale robe, herb basket) with a backlog entry.
7. **Houses don't look sick** on the map; the Disease mode shows it.

---

### Task 1: Plan
- [x] **Step 1:** This plan.

### Task 2: Disease risk and plague (sim)
- [x] **Step 1:** Failing tests: risk per level and for elites; none for vacant lots; random
  onset at full risk, once a month on average; instant onset next to a sick house; spread of 60
  a month within 1 tile; a quarter of residents die each month end, rounded up; no new settlers;
  cured when empty; notice once per outbreak.
- [x] **Step 2:** Implement `sickness.ts` and wire it into `tick`.

### Task 3: Infirmary and healer
- [x] **Step 1:** Failing tests: Infirmary spec numbers; healer range and reach; passing resets
  risk and cures.
- [x] **Step 2:** Implement building, roamer, tool, model, walker figure, look key.

### Task 4: What the player sees
- [x] **Step 1:** Failing tests: inspector lines; Disease map mode columns and hover; plague
  deaths per year in the Population report.
- [x] **Step 2:** Implement, with the Ledger section.

### Task 5: Docs and ship
- [x] **Step 1:** Delete the roadmap item; backlog entry for the healer; typecheck, test, build;
  look at the game.
- [x] **Step 2:** Squash onto `main` as `Slice 41: Sickness and the Infirmary`.
