# Zeus clone: design

## Goal

A browser city-builder modeled on *Zeus: Master of Olympus*, built in slices by
unattended Claude cloud sessions. After each slice the owner playtests a deployed link,
gives feedback (or none), and the next session continues.

Success: each slice is fun to play on its own terms, and the game reaches as far down
the roadmap as the budget allows **without lowering the quality of earlier slices**.

## Constraints

- **Budget:** about $100 of cloud sessions, which is roughly 12 slices. This is a scale
  to aim at, not a hard stop. Quality beats quantity: running out partway through
  slice 7 with slices 1–6 done well is a good outcome.
- **No copyrighted assets.** All art is generated in code. It is inspired by Zeus, not
  derived from its files.
- **Desktop browser** with mouse and keyboard. Mobile is out of scope.
- **One sandbox map**, with every resource the roadmap needs. No campaign, scenarios or
  win conditions.
- **No save/load.** Reloading restarts the game. Game state is plain serializable data,
  so save/load can be added later cheaply.
- **Gameplay numbers** default to the original's Beginner-difficulty values in
  `docs/reference/zeus-numbers.md`.

## Technology

- **TypeScript + Vite** for build and dev server.
- **Three.js** with a fixed orthographic camera at the classic 2:1 isometric angle. The
  player sees a 2D isometric game. 3D is only how the picture is made: lighting gives
  models volume, and the depth buffer replaces hand-written isometric draw ordering.
  There is no camera rotation.
- **Plain DOM + CSS** for UI panels. No UI framework.
- **Vitest** for simulation tests. **Playwright** for one smoke test that the page boots
  and renders a frame.
- **GitHub Actions** runs typecheck, tests and build on every PR, and deploys `main` to
  **GitHub Pages**.

## Architecture

```
src/sim/      game rules; no DOM, no Three.js
src/render/   Three.js scene, camera, terrain, code-built models, palette
src/ui/       DOM panels: build menu, top bar, inspector, overlays toggle
src/main.ts   wiring: input → sim commands; sim state → render + UI each frame
```

- **Simulation**
  - Deterministic: a fixed timestep and a seeded RNG, so any test reproduces exactly.
  - State is plain data.
  - The outside world changes it only through commands: `placeBuilding`, `placeRoad`,
    `demolish`, `setSpeed`, and so on.
  - `tick()` advances it.
- **Renderer**
  - Reads simulation state and never mutates it.
  - Building and walker models are built in code from primitives, in a shared
    Mediterranean palette: white plaster, terracotta roofs, marble, olive greens, warm
    sandy ground.
  - Many identical objects (trees, road tiles, walkers) use instancing.
- **UI**
  - Reads state for display and issues commands.
- **Tests**
  - Simulation rules are tested at the simulation level: "a house with water and food
    becomes a Shack within N months".
  - Rendering is checked by the smoke test and by the owner's playtest.

## Art direction

Every slice adds models for the buildings and walkers it introduces. They should be
recognizably what they are: a farm has fields and a barn, a fountain has a basin and a
column, a sanctuary has a temple with columns and a pediment. They should read clearly
at default zoom, before they are pretty. Walkers are small figures with a distinguishing
color or prop (a water carrier with a jar, a cart pusher with a cart). Animation stays
minimal: walking bob, smoke from industry.

## Working agreement with the owner

The owner works **hands-off until the playtest**. A session is given a slice and is
expected to deliver it, finished and deployed, without anyone watching.

- **Never stop to ask.** No clarifying questions, no "should I proceed?", no waiting for
  approval of a plan. The design decisions were made in this spec. For anything the spec
  does not cover, choose the option closest to the original Zeus, record it under
  "Decisions I made" in the PR, and keep going.
- **One slice per session.** Finish the current slice completely before starting the
  next one. Never start the next slice in the same session.
- **The owner's only input is playtest feedback:** PR comments, or the session prompt.
  Act on it first. If there is none, the slice was fine.
- **The PR is the report.** The owner reads the PR and plays the deployed link, nothing
  else. The playtest checklist must let them verify the slice without reading code.
- **The owner merges, never a session.** Every PR build deploys to Pages, so the open
  slice PR is what the owner playtests. Only one slice PR is open at a time.
- **Done means deployed for review.** CI is green, Pages shows the PR's build, and the
  roadmap box is ticked in the PR.
- **If truly blocked** (CI cannot go green, or a deploy fails for reasons outside the
  repo), leave the PR open and unmerged, explain the blocker at the top of its
  description, and stop. This is the only case in which the owner is needed before the
  playtest.

## How a cloud session runs a slice

1. **Orient.** Read `CLAUDE.md`, the roadmap, this spec and the zeus-numbers reference.
   If a slice PR is still open, the owner has not accepted it yet: this session is a
   feedback session. Fix its comments on that branch, push, reply to each comment with
   what changed, and stop. Otherwise find the first unchecked slice and read any
   feedback left on the last merged PR or in the session prompt.
2. **Fix feedback first**, in its own commits.
3. **Plan.** Write `docs/slices/NN-name.md`, a detailed plan for this slice only.
4. **Build test-first** on a branch `slice-NN-name`.
5. **Open a PR** containing:
   - a **playtest checklist** of concrete things to try and what should happen;
   - **"Decisions I made"**: every choice not covered by this spec, with the option
     closest to Zeus preferred;
   - **"Left out"**: anything cut to protect quality.
6. **Stop** when CI is green and Pages shows the PR's build. Tick the slice in the
   roadmap in the same PR. The owner playtests, comments, and merges when satisfied.

Sessions cannot ask the owner questions mid-run. They decide, then record the decision
under "Decisions I made".

## Core rules (all slices)

- **Map:** 100×100 tiles, generated from a fixed seed.
  - Terrain: grass, meadow (fertile), forest, marble rock, copper ore and water.
  - One entry point on the map edge, connected by a pre-built road.
  - No wild animals.
- **Time:** months and years. Speeds are pause, 1×, 2× and 4×.
- **Roads:** walkers move only on roads.
  - A building works only if it touches a road.
  - Destination walkers (settlers, cart pushers, buyers) take the shortest road path.
  - Roaming walkers leave by the exit tile and wander. At junctions they prefer roads
    they haven't walked yet. After their range they walk home by the shortest path.
  - A roaming walker serves every house within 2 tiles of the road tiles it walks.
- **Labor:** 52% of the population works.
  - Buildings take workers from the shared pool in placement order.
  - A building below full staff works proportionally slower.
  - A building with no workers does nothing.
- **Treasury:** starts at 5,000 dr.
  - Buildings cost their Zeus price, and demolishing refunds nothing.
  - Wages are paid monthly.
  - **A negative treasury has no consequences.** It is shown in red, and building is
    still allowed.
- **Houses:** built as 2×2 vacant lots.
  - Settlers walk in from the entry point while there is vacant room.
  - A house evolves when it meets the next level's needs and appeal, and devolves when
    it loses one. Residents above the new capacity leave.
  - Thresholds come from zeus-numbers.
- **Inspector:**
  - Right-clicking any building, walker or tile pauses the game and opens a panel with
    its details. Closing the panel resumes the previous speed.
  - Each slice adds its own fields.
  - A house always shows what is blocking its next level, e.g. "needs: oil" or "needs:
    appeal 20 (has 14)".

## Roadmap

Each slice lists its content and the houses it makes reachable.

### 1 · Foundation
- **Project setup:** repo scaffold, CI, Pages deploy, smoke test.
- **Map:** the generated map with all terrain types rendered.
- **Camera:** pans with WASD, the arrow keys and middle-drag, and zooms with the wheel.
- **Clock:** with the speed controls.
- **Placement:**
  - Road tool: drag to draw.
  - Demolish tool: drag over an area.
  - A placeholder building that exercises footprint, terrain validity and road-access
    feedback.
- **Inspector:** for tiles and buildings.

### 2 · Settlers & treasury
- Vacant lots placed by dragging an area.
- Settlers spawn at the entry point and walk along roads to vacant houses. This slice
  brings pathfinding.
- Population, treasury and date in a top bar.
- Building costs.
- Houses reach: **Hut**.

### 3 · Workers & services
- Labor pool and staffing.
- Monthly wages.
- Unemployment shown in the top bar.
- Roaming walkers.
- **Fountain** with a water carrier, so houses track water access.
- **Palace** and **Tax Office** with a clerk who collects taxes.

### 4 · Food & appeal
- **Food chain:** Wheat Farm (on meadow, harvest in July) → cart pusher → Granary.
- **Agora:** an Agora with a food vendor. A buyer fetches food from the granary, and a
  peddler roams and stocks houses.
- **Eating:** houses eat monthly.
- **Appeal:**
  - Every building radiates appeal by distance, using the zeus-numbers values.
  - Park, Column and Flower Garden are added.
  - The **appeal overlay** is the first map mode, toggled with a key.
- Houses reach: **Shack**.

### 5 · Culture
- **College** trains philosophers, who go to a **Podium** and roam from it.
- **Gymnasium** sends athletes out to roam.
- **Drama School** trains actors, who go to a **Theater** and roam from it.
- Houses accumulate culture points from recent passes.
- Houses reach: **Hovel**. Tenement's culture is met here too, but it waits on fleece.

### 6 · Storehouse & fleece
- **Storehouse** with slots per good.
- **Sheep** are placed as animals that graze.
- A **Carding Shed** shears sheep within range, and fleece goes to the storehouse.
- A fleece vendor sets up in the agora.
- Houses reach: **Homestead**, **Tenement**.

### 7 · Olive oil
- **Olive trees** are placed on meadow.
- A **Growers' Lodge** harvests them, and an **Olive Press** turns olives into oil,
  which goes to the storehouse.
- An oil vendor sets up in the agora.
- Houses reach: **Apartment**, **Townhouse**.

### 8 · Safety
- **Fire risk:** builds up in buildings according to their increments.
  - Fires spread to neighbours and leave ruins.
- **Collapse risk:** builds up the same way.
  - A collapse leaves rubble.
- **Maintenance Office:** its superintendent roams and resets both risks.

### 9 · Map modes
- A toggle bar of tile overlays, each with a legend:
  - water
  - food
  - **supply** (fleece + oil)
  - culture
  - appeal (already exists)
  - fire risk
  - collapse risk
  - tax coverage
  - house level
  - staffing per building
- The appeal overlay from slice 4 is generalized here.

### 10 · Materials & sculpture
- **Timber Mill** (forest), **Masonry Shop** (marble rock) and **Foundry** (copper ore →
  bronze), each sending to the storehouse.
- **Sculpture Studio** turns 4 bronze into 1 sculpture.
- **Artisans' Guild**.
- Forest regrows slowly after cutting (**ours**).

### 11 · Sanctuaries
- Sanctuaries for **Demeter, Athena and Hephaestus**, using zeus-numbers sizes and
  materials.
- **Placement:** costs drachmas plus the initial marble.
- **Construction:**
  - Cart pushers deliver the remaining marble, wood and sculptures.
  - Artisans build in visible stages.
- A finished sanctuary radiates +20 appeal.

### 12 · God favors
- **Favor:** each god with a finished sanctuary has a favor meter from 0 to 100. It
  starts at 50 and decays monthly.
- **Sacrifices:** a sacrifice raises favor. It is triggered from the sanctuary
  inspector and consumes a sheep.
- **Visits:** the god periodically walks out into the city. Buildings of their industry
  along the route become **sanctified**, which boosts output.
- **High favor:** triggers a blessing:
  - Demeter: food delivered to granaries.
  - Athena: oil and olives delivered.
  - Hephaestus: no fire risk for a period, and studios sanctified.
- **Low favor:** sends the god on an angry visit carrying their curse.
- The slice session chooses exact rates.

## Out of scope

Elite housing, wine, armor, horses, military, invasions, monsters, heroes, trade,
mint and silver, hunting, fishing, carrots and onions, the infirmary and disease, crime
and watchposts, the stadium, gods without sanctuaries, campaign and scenarios,
save/load, sound, mobile, a difficulty selector, adjustable wage and tax rates.
