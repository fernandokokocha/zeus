# Model redesign

How a session redesigns 3D models (buildings, houses, walkers, animals) together with the
owner. These are interactive sessions, not slices: the owner picks between options, and the
picked one goes into the game in the same session.

## Direction

Unless the owner says otherwise, every design follows these:

- **Close to the original Zeus**, set in ancient Greece.
- **White and Aegean blue.** Walls are bright white, never dirty or cream. Blue goes on doors,
  shutters, trim and cloth. Terracotta, thatch and stone are accents.
- **Show what is special about the thing.** A building shows what it does or holds: a house
  shows the needs it meets, a workshop its goods, a service building its service.
- **High detail**, but it has to read at default zoom (30 px per tile). Silhouettes and
  colour blocks carry it there; small props only add to it at max zoom.

For things that come in levels (houses, upgrades, sanctuary stages):

- **Each level grows out of the chosen previous one.** Keep its layout and props, and add to
  them, so a player sees the upgrade happen.
- **Show each level's new need in its yard.** Food is bread, grain and a threshing floor; water
  is a cistern, a trough or buckets.
- **Hold back the next level's cue.** No jars before oil, no wool before fleece, so the next
  upgrade still has something new to show.
- **Poor reads as rough materials, not dirt.** Show it with reed roofs held down by stones,
  bare window holes and loose stone walls, while the walls stay clean white.
- **A new level must read as new from above, at default zoom.** Change the silhouette or the
  roof; new props in the yard are not enough.
- **Roofs climb with the levels:** reed (Hut–Hovel), flat white with a blue band
  (Homestead–Tenement), blue tiles (Apartment–Townhouse). Red tiles are kept for non-housing
  buildings such as temples.

## Layout of the code

| what | where |
|---|---|
| reusable parts (walls, roofs, doors, props, food, water, textures) | `src/render/kit/` |
| game models built from parts | `src/render/house-models.ts`, or a sibling `*-models.ts` per family |
| merging a model into one mesh per material, and cloning it | `src/render/bake.ts` |
| the comparison page | `gallery.html`, `src/gallery/main.ts` |
| the options being compared | `src/gallery/<thing>-options.ts` |

Write each option as a builder function that uses only `src/render/kit/`. Then picking one is
just moving that function into the game's models module and wiring it up. Never give the
gallery its own copy of the kit.

## The loop, per thing

1. **Read what exists.** Read the current model in `src/render/models.ts` (or
   `walker-layer.ts`), the thing's footprint in `BUILDING_SPECS`, and its states (working,
   stocked, stages, burning).
2. **Add a set to the gallery.** Make `src/gallery/<thing>-options.ts` with three options,
   each a `DesignOption` with a name, 3–4 notes and a builder. Register it in `SETS` in
   `src/gallery/main.ts`. Set `previous` to the chosen design of the level below, if there is
   one.
3. **Make the three options really different** in silhouette or idea, not three versions of
   one layout. Each note should say what the player learns from looking at it.
4. **Screenshot and look before showing anything:**
   ```
   npx vite --port 5199 --strictPort &      # once per session
   npx playwright screenshot --viewport-size=1600,1000 --wait-for-timeout=3000 \
     "http://localhost:5199/gallery.html?level=<key>" <scratchpad>/<key>.png
   ```
   Read the image. Check the close-up (max zoom) and the strip (default zoom and 2×). Fix
   anything that hides inside the model, fights the ground, or disappears at default zoom.
   If Chromium is missing, run `npx playwright install chromium` once.
5. **Present.** Give the gallery URL, one line per option, which one reads best at default
   zoom, and one question: which one, or which parts combined?
6. **Iterate on feedback.** The owner usually answers with a letter plus corrections ("C, but
   walls white like Hut B, simpler, no jars"). Apply exactly that to the option, mark it
   `chosen` in `SETS`, re-screenshot and show it. "Try again" means three new options in the
   direction given. Drop the old three; git history keeps them if they were ever committed.
7. **Next level or thing.** Start step 2 for it right away, building on the chosen design.

## Putting the pick into the game

1. Move the chosen builder from `src/gallery/<thing>-options.ts` into the game's models
   module, and point the option's `build` at it.
2. Wire it in `src/render/models.ts` through `bakedOnce(...)`, not as a raw builder.
3. Delete the model it replaces, plus every helper and geometry that only that model used.
   `npx tsc --noUnusedLocals` lists them.
4. Verify:
   - `npx tsc --noUnusedLocals` and `npm test` pass
   - the gallery strip, which renders baked models, looks the same as the close-ups
   - `npm run test:e2e` passes, and `test-results/screenshot.png` shows the model in the
     game. The smoke test only reaches early content, so the gallery strip is the check for
     anything later.
5. Work on `main`; no branch or PR. Commit only when the owner asks.

## Performance rules

The world layer rebuilds every building model whenever the game state changes. A kit model is
hundreds of meshes, each with its own geometry.

- **Buildings go through `bakedOnce`.** It builds the model once, merges it into one mesh per
  material, and hands out clones that share that geometry. A raw builder in the world layer
  leaks GPU memory on every rebuild and costs hundreds of draw calls per building.
- **A building with states** (working or idle, crop stages, sanctuary stages, burning) gets
  one baked template per state, keyed by state.
- **A building with counts** (storehouse loads, granary sacks) bakes the static shell, and
  adds the counted pieces as meshes that share one geometry and one material.
- **Reuse materials.** `surface()` and `flat()` cache theirs. A part that creates
  `new MeshLambertMaterial` on every call adds a draw call each time, so lift that material
  into a shared constant when it shows up in many buildings.

## Walkers and animals

Walkers are drawn by `src/render/walker-layer.ts`. Each figure is a list of `Part`s, and each
part becomes an `InstancedMesh` with its own material. So every part of a figure costs one
draw call for that figure type, however many walkers are on screen.

- **Same direction rules.** White and blue clothing, and the figure shows its job: a water
  carrier's jar, a peddler's goods, a philosopher's scroll.
- **Read at 30 px per tile.** A walker is about 0.65 tiles tall, roughly 20 px at default
  zoom. The job comes across through colour and one big prop, not small details.
- **Keep the part count low.** A detailed figure merges its parts into one geometry with
  vertex colours, which is a single `InstancedMesh`, rather than growing the `Part` list.
- **Animation runs in `createFigureSet`.** The bob is per figure, so don't bake motion into
  the geometry.
- **Gallery figures** go on a 1×1 tile with a road under them, shown next to a house so you
  can judge scale.

## What slowed past sessions

- Prototypes lived in `src/gallery/` with their own kit, so the port meant moving five
  files and rewiring imports. Build in `src/render/kit/` from the start.
- The merge-and-clone requirement only came up at port time. Use `bakedOnce` from the first
  gallery render.
- Every round of options got a full write-up before the owner had picked a direction. Keep
  notes to four lines and spend the effort on screenshots instead.
- Townhouse took six rounds: courtyards, pediments and atrium roofs all read as modern or
  odd. The owner wanted what Zeus does, a tall cluster of blocks each under its own roof. For
  the top of a family, start from the original game’s look before inventing.
