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
- **A building with workers shows them.** When staffed, one animated worker stands where the
  player can see him (doing the job, or idling by the door) and the door is open; when empty,
  nobody is there, tools are put away and the door is shut. Design both states side by side.
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
| workers: figure parts and motions (rest, lookout, hammer) | `src/render/kit/figure.ts` |
| baking a worker and giving each building its own timing | `src/render/staff.ts` |

Write each option as a builder function that uses only `src/render/kit/`. Then picking one is
just moving that function into the game's models module and wiring it up. Never give the
gallery its own copy of the kit.

## The loop, per thing

1. **Read what exists.** Read the current model in `src/render/models.ts` (or
   `walker-layer.ts`), the thing's footprint in `BUILDING_SPECS`, and its states (working,
   stocked, stages, burning).
2. **Add a set to the gallery.** Make `src/gallery/<thing>-options.ts` with three options,
   each a `DesignOption` with a short name and a builder. Register it in `SETS` in
   `src/gallery/main.ts`. Keep the page lean, because every extra render and line is paid for
   in tokens:
   - **No notes.** The rotating model speaks for itself; leave `notes` out.
   - **No strip.** Leave `strip` out, so the page shows only the close-ups. (Older sets keep
     theirs through `strip: true`; don't add it to new ones.)
   - **One close-up per critical state,** as `variants`: without and with workers
     (`withoutAndWithWorkers`), empty and full stock, each growth or upgrade stage. Nothing
     beyond the states the game actually shows.
3. **Make the three options really different** in silhouette or idea, not three versions of
   one layout.
4. **Screenshot and look before showing anything:**
   ```
   npx vite --port 5199 --strictPort &      # once per session
   npx playwright screenshot --viewport-size=1600,1000 --wait-for-timeout=3000 \
     "http://localhost:5199/gallery.html?level=<key>" <scratchpad>/<key>.png
   ```
   Read the image. Fix anything that hides inside the model or fights the ground, and judge
   whether the silhouette and colour blocks would still read at a quarter of the close-up size.
   If Chromium is missing, run `npx playwright install chromium` once.
5. **Present.** Give the gallery URL, the option names, and one question: which one, or which
   parts combined?
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
   - `npm run test:e2e` passes, and the gallery close-ups show the model as chosen
5. Work on `main`; no branch or PR. Commit only when the owner asks.

## Performance rules

The world layer rebuilds every building model whenever the game state changes. A kit model is
hundreds of meshes, each with its own geometry.

- **Buildings go through `bakedOnce`.** It builds the model once, merges it into one mesh per
  material, and hands out clones that share that geometry. A raw builder in the world layer
  leaks GPU memory on every rebuild and costs hundreds of draw calls per building.
- **A building with states** (working or idle, crop stages, sanctuary stages, burning) gets
  one baked template per state, keyed by state.
- **A worker is not baked into the building.** Bake his parts once with `bakedFigure`, add him
  to the shell with `posedFigure`, and the world layer animates him every frame.
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

## Variants

Things that repeat across a map (terrain props, trees, parks, gardens) can have several
approved options, and the game picks one per tile from its position, so a city always looks
the same after a reload.

- **Gallery:** make 5 options that look right next to each other, and mark every approved
  one with `chosen: [0, 2, 3]` in `SETS`.
- **Buildings:** bake each variant once and pick it with `variantIndexAt(b.x, b.y, n)` from
  `palette.ts`. See `park-models.ts` and `olive-models.ts`.
- **Terrain:** each variant is one vertex-coloured geometry built with `vertexColoured` from
  `kit/rocks.ts`, kept under about 150 triangles, and listed through `varied(cover, builds)`
  in `terrain-layer.ts`. Never pass these through `bake()`, because it drops the vertex
  colours. A tile's stump has the same index as its tree, so the right stump appears.
- **Check at scale:** a single tile looks different from a field of hundreds. Render a real
  map's tiles of that terrain with every variant mixed in before showing the owner.

## Bulk rounds

The owner picks several items from `docs/redesign-backlog.md`, and one background agent
designs each one in parallel.

1. **Set up first, in the main session.** Make an empty `<thing>-options.ts` for each item
   and register its set in `SETS`, so the agents never edit `main.ts`. Start the dev server
   once.
2. **Brief each agent** with this file, the existing model, its states, a sibling already
   redesigned to copy, the file names it owns, and the screenshot command. Builders go
   straight into `src/render/<thing>-models.ts` with the shell, worker and stock split
   already made, and the gallery imports them.
3. **Shared files:** agents may only add to `palette.ts`, `kit/figure.ts` and shared kit
   files, using Edit and re-reading when it fails. A full rewrite of a shared file has wiped
   another agent's work before.
4. **Present all items at once:** one table of gallery links, plus what stood out in the
   screenshots.
5. **Feedback** goes to the agent that made the design (`SendMessage`), so it keeps its
   context. The main session wires the picks into the game one at a time, because they all
   edit `models.ts`.
6. **After wiring,** run `npx tsc --noUnusedLocals` repeatedly until it is clean. It finds
   the helpers, materials and palette colours the old models leave behind.

## What slowed past sessions

- Prototypes lived in `src/gallery/` with their own kit, so the port meant moving five
  files and rewiring imports. Build in `src/render/kit/` from the start.
- The merge-and-clone requirement only came up at port time. Use `bakedOnce` from the first
  gallery render.
- Gallery pages grew notes, a strip and a scene, and each one cost tokens to write, render
  and read back. The owner wants rotating close-ups of each state and nothing else.
- Townhouse took six rounds: courtyards, pediments and atrium roofs all read as modern or
  odd. The owner wanted what Zeus does, a tall cluster of blocks each under its own roof. For
  the top of a family, start from the original game’s look before inventing.
