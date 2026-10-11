# Slice 5: Culture Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Shacks become Hovels. A College trains philosophers who walk to a Podium and
lecture from it; a Drama School trains actors who walk to a Theater and perform from
it; a Gymnasium sends athletes out on its own. Each of these roaming walkers gives the
houses he passes culture points for two months: philosopher 15, athlete 20, actor 25.
A Shack with food, water, 15 culture points and appeal 10 becomes a Hovel of 24.

**Architecture:** As in slice 4. A new sim module `schools.ts` holds trainees: walkers
that go from a school to a venue and vanish there, setting the venue performing.
`roamers.ts` gains three culture roamers whose service is a culture coverage; a venue
only sends its roamer while performing. `culture.ts` scores a house's culture points.
`housing.ts` gains the Hovel, the water need and a culture threshold. The walk loop
shared by settlers and carriers is extracted first so trainees can use it too.

**Spec:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, roadmap slice 5.

## Global Constraints

- **Buildings** (zeus-numbers): College 3×3, 12 workers, 30 dr, appeal -5,-8. Podium
  2×2, 4 workers, 15 dr, appeal 3,2,1. Gymnasium 3×3, 7 workers, 30 dr, appeal 0.
  Drama School 3×3, 10 workers, 16 dr, appeal 0. Theater 5×5, 18 workers, 60 dr,
  appeal 6,5,4.
- **Roamers:** philosopher (Podium), athlete (Gymnasium), actor (Theater), range 35.
- **Culture points per pass:** philosopher 15, athlete 20, actor 25. A house's points
  are the sum over the kinds that passed it within the service memory (2 months).
- **Hovel:** 24 residents, needs food, water and 15 culture points. Evolves at appeal
  10, devolves at appeal -2. Tax multiplier 1.
- Code rules from `CLAUDE.md` apply.

## Decisions (closest to Zeus, recorded in the PR)

1. **A trainee keeps a venue performing for 2 months** (**ours**, the same as the
   service memory). The venue only sends its roamer while performing.
2. **Schools train like service buildings send walkers:** a quarter month of rest at
   full staff, slower when understaffed, one trainee out at a time.
3. **A trainee goes to the staffed venue whose performances end soonest**, nearest by
   road on a tie, so one school keeps several venues going. With no staffed venue
   within reach, the school waits with its trainee ready.
4. **A trainee whose venue is demolished or cut off** heads to another venue, or gives
   up and vanishes.
5. **Culture coverage works like water:** a pass lasts 2 months. Points of the same
   kind do not stack; two podiums give 15, not 30.
6. **The Hovel's water need is water-carrier coverage** within the last 2 months.
7. **Schools and venues need a road** and stand on any buildable ground.

## Review Focus

1. **Hysteresis:** a Hovel at appeal -1 stays, at -2 falls back to a Shack. Task 5.
2. **Trainees and a changing world:** venue demolished, road cut, school gone. Task 3.
3. **Venues only roam while performing**, and stop when the performance ends. Task 4.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Shared walk loop

**Files:** Modify `src/sim/walking.ts`, `src/sim/settlers.ts`, `src/sim/carriers.ts`.

- [ ] **Step 1:** Refactor: settlers and carriers walk their path through a shared
  `walkPath` that calls back to replan or arrive. No behavior change; tests untouched.

### Task 3: Schools, venues and trainees

**Files:** Modify `src/sim/buildings.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/sim/tick.ts`. Create `src/sim/schools.ts`, `tests/sim/schools.test.ts`.

- [ ] **Step 1:** Write failing tests: a staffed College sends a philosopher to a
  staffed Podium after a quarter month, slower at half staff, never without workers or
  without a staffed podium; one out at a time; on arrival he vanishes and the podium
  performs for 2 months; the next goes to the venue whose performance ends soonest;
  a trainee whose podium is demolished heads to another or vanishes; he vanishes with
  his school and when the road under him goes. The Drama School does the same for the
  Theater.
- [ ] **Step 2:** Add the five buildings to `BUILDING_SPECS`. Implement. Tests pass.

### Task 4: Culture roamers and points

**Files:** Modify `src/sim/roamers.ts`, `src/sim/state.ts`. Create `src/sim/culture.ts`,
`tests/sim/culture.test.ts`.

- [ ] **Step 1:** Write failing tests: a performing podium sends a philosopher roaming
  35 tiles; a podium that is not performing sends nobody; a gymnasium sends athletes
  with no school; passing houses get 15 / 20 / 25 culture points for 2 months, summed
  over kinds, not stacked within a kind.
- [ ] **Step 2:** Implement. Tests pass.

### Task 5: Hovel

**Files:** Modify `src/sim/housing.ts`, `tests/sim/housing.test.ts`.

- [ ] **Step 1:** Write failing tests: a Shack with food, water, 15 culture and appeal
  10 becomes a Hovel and takes 24 residents; without water, culture, or at appeal 9 it
  stays a Shack; a Hovel keeps its level at appeal -1 and falls back at -2, or when it
  loses water or culture, sending away residents above 16.
- [ ] **Step 2:** Implement. Tests pass.

### Task 6: Inspector

**Files:** Modify `src/sim/inspect.ts`, `tests/sim/inspect.test.ts`.

- [ ] **Step 1:** Write failing tests: a house shows its culture points and what they
  come from, and what blocks the Hovel ("needs for Hovel: water, culture 15 (has 0),
  appeal 10 (has 3)"); a school shows its trainee; a venue shows whether it performs
  and for how long; trainees describe their errand.
- [ ] **Step 2:** Implement. Tests pass.

### Task 7: UI and rendering

**Files:** Modify `src/ui/tools.ts`, `src/render/models.ts`, `src/render/palette.ts`,
`src/render/walker-layer.ts`.

- [ ] **Step 1:** Tools for the five buildings.
- [ ] **Step 2:** Models: Hovel (two-roomed plaster house with a terracotta roof and a
  walled yard), College (colonnaded hall with scroll racks), Podium (stepped stone
  platform with a lectern), Gymnasium (sand running track inside a colonnade), Drama
  School (hall with masks over the door), Theater (semicircle of tiered seats facing a
  stage building). Venues show a figure on stage while performing. Walkers:
  philosopher (white robe, scroll), athlete (bare-chested, discus), actor (bright
  robe, mask).

### Task 8: Smoke test and look

**Files:** Modify `e2e/smoke.spec.ts`.

- [ ] **Step 1:** Extend the smoke test: place a college, podium, gymnasium, drama
  school and theater, screenshot.
- [ ] **Step 2:** Run `npm run typecheck`, `npm test`, `npm run build` and
  `npm run test:e2e`. Open the screenshot and check it.

### Task 9: PR

- [ ] **Step 1:** Tick slice 5 in `docs/roadmap.md`. Record the new **ours** numbers in
  zeus-numbers.
- [ ] **Step 2:** Open the PR `Slice 05: Culture`. Wait for CI and Pages.
