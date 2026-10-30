# Slice 42: Healthy and well fed Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Healthy and well fed, the Warriors' House charter. For 24 months in a row the city
has at least one Townhouse (elites count), no Townhouse goes without food and none falls
sick. Each completion grants a Warriors' House permit.

**Architecture:** `src/sim/charters.ts` gains a third charter definition beside Well dressed
and Learned city, sharing the counting routine. Its miss is "ran out of food" (the old Well
fed test) or "fell sick". Buildings gain `fellSickAt`, the tick of their last onset, so a
Townhouse cured within the month still resets the count. The Warriors' House building comes
in a later slice, so `permits` is keyed by a `PermitType` (the elite types plus
`warriorsHouse`) with its own name table until then. The Charter chapter shows all three.

**Spec:** `docs/superpowers/specs/2026-10-30-warriors-house-design.md`, "Healthy and well fed".

## Decisions (closest to Zeus, recorded in the commit)

1. **"Falls sick" counts any onset since the last tally**, even one a healer cured before
   month end, and a Townhouse still sick at month end counts too. Both read "fell sick".
2. **Food is checked before sickness** when a Townhouse misses both.
3. **No Townhouse resets a running count**, as the other two charters.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The tally

**Files:** `src/sim/charters.ts`, `src/sim/sickness.ts`, `src/sim/state.ts`,
`src/sim/commands.ts`, `src/sim/housing.ts`, `src/sim/tick.ts`, `tests/sim/charters.test.ts`.

- [x] **Step 1:** Failing tests: counts a healthy, fed month; grants a Warriors' House permit
  and a notice at 24, then restarts; resets on a Townhouse out of food, on one falling sick
  (even cured), and on one still sick; an onset before the last tally doesn't count; lower
  houses never reset it; an elite counts; no Townhouse resets a running count; tallied at
  month end.
- [x] **Step 2:** Implement.

### Task 3: Charter chapter and docs

**Files:** `src/ui/charters.ts`, `tests/ui/charters.test.ts`, `docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Failing tests for the progress line and the Warriors' House permit line.
- [x] **Step 2:** Implement; update the numbers reference; delete the roadmap item.
