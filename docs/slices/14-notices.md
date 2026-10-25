# Slice 14: Notices Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A message feed. When a fire breaks out, a building collapses, a house devolves
or a sanctuary is finished, a short line appears under the top bar and fades after a few
seconds. A Notices button in the top bar reopens the recent ones, and clicking one moves
the camera to where it happened.

**Architecture:** The sim posts notices into `state.notices`, plain data
(`{ id, tick, text, at }`), from the four places the events already happen:
`ruin` in `safety.ts`, `setLevel` in `housing.ts` and `arrive` in `sanctuaries.ts`. A new
sim module `notices.ts` owns posting and the log limit. The UI (`src/ui/notices.ts`)
reads the list each frame: new ids go into the feed, which fades them out in real time;
the log panel lists them newest first. The camera controls gain `focus(point)`.

**Spec:** `docs/superpowers/specs/2026-10-25-elite-housing-design.md`, "Notices".

## Global Constraints

- **Log** (**ours**): the 50 most recent notices are kept.
- **Feed** (**ours**): a line stays 8 s of real time, then fades over 1 s; at most 4 at
  once, newest at the bottom. Real time, not game time, so a line can be read at 4×.
- **No look-key change:** no building is added and no model reads anything new.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **One notice per building that catches fire**, spread fires included, as Zeus posts a
   "Fire!" message per blaze. Collapses likewise.
2. **Every house that devolves posts its own notice**, with both levels:
   "Hovel at 9,48 devolved to a Shack". Evolving is silent.
3. **Text names the place** in the spec's "Hovel at 52,40" style, using the building's
   top-left tile, so the coordinates match the inspector's.
4. **Clicking a notice in the log centres the camera** on that tile, like Zeus's
   "go to" on messages. Feed lines are clickable too.
5. **Notices don't pause the game.** Zeus pauses for big events only; none of these are.

## Review Focus

1. **Posting at the event, not by diffing state:** each notice is posted by the code that
   changes the state, so a fire is never missed between frames. Task 2.
2. **The feed shows each notice once**, including ones posted while paused or in a burst
   of more than 4. Task 3.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: The sim posts notices

**Files:** Modify `src/sim/state.ts`, `src/sim/safety.ts`, `src/sim/housing.ts`,
`src/sim/sanctuaries.ts`. Create `src/sim/notices.ts`, `tests/sim/notices.test.ts`.

- [x] **Step 1:** Write failing tests: a fire posts "Fire! The Tax Office at 4,4 is burning" with
  its tile and tick; a spread fire posts its own; a collapse posts "The Fountain at 4,4
  collapsed"; a devolving house posts "Hovel at 4,4 devolved to a Shack", an evolving one
  posts nothing; a finished sanctuary posts "The Forge of Hephaestus is finished" once;
  the log keeps the 50 newest with rising ids.
- [x] **Step 2:** Implement. Tests pass.

### Task 3: Feed and log

**Files:** Create `src/ui/notices.ts`, `tests/ui/notices.test.ts`. Modify `index.html`,
`src/style.css`, `src/main.ts`, `src/render/camera-controls.ts`.

- [x] **Step 1:** Write failing tests for the feed's pure part: which notices are shown at a
  given time, given when each was first seen (fresh, fading, gone; at most 4; unseen
  notices posted in a burst all enter).
- [x] **Step 2:** Implement the feed, the Notices button and log panel, and camera focus.

### Task 4: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [x] **Step 1:** The smoke test opens the log ("No notices yet" before anything happens)
  and closes it.
- [x] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshots and check them.

### Task 5: Docs and ship

- [x] **Step 1:** Tick slice 14 in `docs/roadmap.md`. Record the **ours** numbers in
  zeus-numbers.
- [ ] **Step 2:** Push the branch, open the PR, wait for CI and Pages.
