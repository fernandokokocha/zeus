# Slice 39: Elite sites Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** The guild's site help (slice 17) works for every elite type. A house shows a
"possible Scholars' House site" line with what its block still lacks, the **Guilds** map
mode becomes **Elites** and colours placeable blocks per type (traders blue, scholars
purple), and "A Scholars' House can now be placed at …" is posted once per block.

**Architecture:** `guild.ts` becomes `elite-sites.ts`. Its survey of the blocks around a
house, the placeable-site search and the notice take an elite type and read the type's
road from `ELITE_SITES`, as placement already does. `guildRange` stays, since only the
guild has a range. State keeps announced corners per type.

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`, "Elite sites".

## Decisions (recorded in the commit)

1. **Where the scholars' line shows.** Scholars can use any road, so a block along any road
   would qualify and every house in the city would carry the line. It shows only where the
   block lines a road and at least one of its neighbours (Theater, Gymnasium, Podium) is
   already within 6 tiles. That neighbourhood plays the part the Main Road band plays for
   the guild.
2. **Wording:** "Possible Scholars' House site at 3, 12: not a Townhouse yet, the Library's
   ground across the road isn't clear, no Theater within 6 tiles, no permit, appeal 25
   (has 22)", or "Scholars' House site at 3, 12: a Scholars' House can be placed now". The
   guild's lines are unchanged. Both lines show when both apply, guild first.
3. **Closest block:** each missing neighbour counts as one thing missing.
4. **Colours:** the guild band keeps its light blue, a placeable guild block is a deep blue
   (it was green), a placeable Scholars' House block is purple. Scholars have no band. A
   block placeable for both shows the guild, whose place is scarcer.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Sites per type (refactor)

- [x] **Step 1:** Move `guild.ts` to `elite-sites.ts`, with the survey, placeable search
  and notice taking a type. Guild tests stay green unmodified.

### Task 3: Inspector

- [x] **Step 1:** Failing tests: a ready scholars block says it can be placed; a missing
  neighbour, the Library's ground, permit and appeal are named; no line without any
  neighbour; a house can show both lines.
- [x] **Step 2:** Implement.

### Task 4: Elites map mode

- [x] **Step 1:** Failing tests: the mode is `eliteSites`; a placeable scholars block reads
  2 on all its tiles; the guild still reads 1 and its band 0.
- [x] **Step 2:** Implement, with the colours and the key.

### Task 5: Notice

- [x] **Step 1:** Failing tests: "A Scholars' House can now be placed at 3,12", once per
  block, only with a scholars permit; announcing one type doesn't silence the other.
- [x] **Step 2:** Implement.

### Task 6: Docs and ship

- [x] **Step 1:** Delete the roadmap item; numbers reference; typecheck, test, build.
- [x] **Step 2:** Squash onto `main` as `Slice 39: Elite sites`.
