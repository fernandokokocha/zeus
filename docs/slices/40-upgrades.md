# Slice 40: Upgrades Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Works of Art buy eight upgrades, 1 each, from a Ledger chapter opened by the top
bar's Works of Art counter. Each upgrade changes one rule. One of them unlocks the Carrot
Farm, a wheat farm that harvests in January.

**Architecture:** `src/sim/upgrades.ts` holds `UPGRADE_SPECS` (name and rule text),
`buyUpgrade` and `hasUpgrade`. State keeps the owned upgrades. Each rule reads its number
through a small function next to the constant it replaces (`farmYield(state)`,
`workingShare(state)`, `loadsPerSlot(state, good)`, ...), so the base numbers stay in their
definitions tables. The Carrot Farm shares the wheat farm's growth and harvest code through a
`FARMS` table (type → harvest month).

**Spec:** `docs/superpowers/specs/2026-10-29-elite-rework-scholars-design.md`, "Upgrades".

## Decisions (recorded in the commit)

1. **The panel is a Ledger chapter**, "Upgrades", and the Works of Art counter becomes a
   button that opens it.
2. **Amphoras in storehouses:** the inspector's "N of M loads" counts the larger oil and olive
   slots. The storehouse model still draws at most 4 loads a slot.
3. **Pack mules** shortens trips that start after it is bought; caravans already out keep
   their return date. The round trip shown in the World panel and Ledger follows it.
4. **Plutocracy** raises what a house pays, so the inspector's tax line and the Treasury follow.
5. **Carrot Farm** has its own cart-pusher kind, its own row in Priorities, and the wheat
   farm's model with carrot rows.
6. **Buying posts no notice**: the player just did it.
7. The storehouse functions take the state, for Amphoras: an interface change, held by the
   storehouse and carrier tests.
8. **Names and art** (asked for mid-slice): Greek names (The Lyceum, Works and
   Days, Demeter's Furrows, Daukos, Arcadian Mules, Kerameikos, Ekklesia, Laws of Solon), and a
   black-figure pottery medallion each, drawn as inline SVG.
9. **A start city for the playtest:** `?city=upgrades` is the scholars city with 8 Works of Art.
10. A storehouse bay's tooltip says "oil: 5 loads" instead of "5 of 4 loads", since a slot's
    size now depends on the good.

---

### Task 1: Plan and spec

- [x] **Step 1:** Spec section, numbers, this plan.

### Task 2: Buying

- [x] **Step 1:** Failing tests: buying spends a Work of Art and owns the upgrade; it fails
  without a Work of Art and when already owned.
- [x] **Step 2:** Implement `upgrades.ts` and the state field.

### Task 3: The simple rules

- [x] **Step 1:** Failing tests, one per upgrade: Lyceum (75 pages), Crop rotation (10 loads),
  Democracy (60%), Plutocracy (×1.25), Pack mules (60 km).
- [x] **Step 2:** Implement.

### Task 4: Open fields and Amphoras

- [x] **Step 1:** Failing tests: a farm with one meadow tile is refused without Open fields and
  placed with it; oil and olive slots hold 6 loads and granaries 48 with Amphoras, other goods 4.
- [x] **Step 2:** Implement.

### Task 5: Carrot Farm

- [x] **Step 1:** Failing tests: refused without Carrots; harvests in January, not July; its cart
  takes food to a granary; Crop rotation and Open fields apply.
- [x] **Step 2:** Implement sim, tool (greyed out until bought), inspector, model, gallery.

### Task 6: Upgrades chapter

- [x] **Step 1:** The Ledger chapter with Buy buttons; the counter opens it.

### Task 7: Docs and ship

- [x] **Step 1:** Delete the roadmap item; typecheck, test, build; look at the game.
- [x] **Step 2:** Squash onto `main` as `Slice 40: Upgrades`.
