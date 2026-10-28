# Slice 30: Trade: imports Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** A yard slot can also **import** a good the route's partner sells, with an
**amount** up to one caravan load. When the slot is empty, no caravan is already on its way
to it, the partner has one of its **2** caravans at home and the treasury can cover the
amount at "we pay them", a caravan sets off from the partner. It spends half the round trip
coming, enters at the west edge in the partner's colour, walks to the yard and unloads into
the slot; only then is the treasury charged, on a new **Imports** line. It walks back west
and spends the other half off the map before the partner has it home. The yard's cart
pushers empty the slot into storehouses (granaries for food).

**Architecture:** The yard's `exportSlots` become `tradeSlots`, each `null`, `{ trade:
'export', good }` or `{ trade: 'import', good, loads }`. `setExportSlot` keeps its
signature; `setImportSlot` is new. Imported goods land in the yard's ordinary pool of that
good, as exports do. Nine new **unload** carrier kinds (`foodUnload` … `clothUnload`) are
deliverers whose home is the yard: a delivering carrier's `capacity` becomes what its home
keeps of the good (0 everywhere else), so the yard keeps what its export slots hold and
carts out the rest. That also carts a switched-off export slot's goods back, left out of
slice 29. `src/sim/imports.ts` owns `state.foreignCaravans`: trips `coming` (off the map),
`in` (west edge to the yard), `back` (yard to the west edge) and `going` (off the map).
The Treasury gains an `imports` spending account.

**Spec:** `docs/superpowers/specs/2026-10-27-trade-design.md`, "Imports (slice 30)".

## Decisions (closest to Zeus, recorded in the commit)

1. **An import slot's holding** is shared out from the yard's pool of its good in slot
   order, like exports. A partner never buys and sells the same good, so a good is never
   imported and exported by one yard at once.
2. **The yard keeps only what its export slots hold.** Everything else (imports, and goods
   left behind by a slot switched off) is carted to storehouses (granaries for food).
3. **An order is the slot as it was when the caravan set off.** If the slot is switched
   off or changed meanwhile, the caravan still delivers and is paid; the cart pushers store
   the goods.
4. **Paid on unloading even into debt.** The treasury is checked when the caravan sets off
   and charged when it unloads, whatever it holds then (Zeus lets the treasury go negative).
5. **One import caravan sets off per yard per tick,** for the first slot that qualifies.
6. **When the yard is gone** (its guild demoted), a caravan still off the map turns back
   there, taking as long to get home as it had travelled; one on the map walks back west.
   Neither charges anything.
7. **Foreign caravans never wait for a road:** they walk between the west edge and the
   yard, and the Main Road, which can't be demolished, always joins the two.
8. **The amount** is chosen in whole loads, from 1 to a caravan load; choosing an import
   good sets a full caravan load.
9. **The yard's inspector** lists caravans coming ("Caravan from Thebes with 6 loads of
   wood: here in about 1 month") and, per slot that only lacks money, "Waiting: the
   treasury can't pay for 6 wood (132 dr)".
10. **The World panel** counts each partner's caravans at home.
11. **Placeholder models:** a foreign caravan is the merchant and donkey of ours, cloaked in
    the partner's colour: laden coming in, bare walking back.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Slots

**Files:** `src/sim/exports.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/sim/inspect.ts`, `tests/sim/exports.test.ts`, `tests/sim/imports.test.ts`.

- [x] **Step 1:** Restructure `exportSlots` into `tradeSlots` (export tests that read the
  field change; their behavior doesn't).
- [x] **Step 2:** Failing tests: an import slot takes a good the partner sells with an
  amount from 1 to a caravan load, nothing else; its holding.
- [x] **Step 3:** Implement.

### Task 3: Unloading

**Files:** `src/sim/carriers.ts`, `src/sim/state.ts`, `tests/sim/imports.test.ts`.

- [x] **Step 1:** Make a deliverer's capacity what its home keeps (refactor: carrier and
  export tests unchanged).
- [x] **Step 2:** Failing tests: the yard's cart pushers store imported goods in
  storehouses (granaries for food), keep what export slots hold, and cart back a
  switched-off export slot's goods; nothing moves without workers.
- [x] **Step 3:** Implement.

### Task 4: Foreign caravans

**Files:** `src/sim/imports.ts`, `src/sim/tick.ts`, `src/sim/treasury.ts`,
`src/sim/trade.ts`, `tests/sim/imports.test.ts`, `tests/sim/treasury.test.ts`.

- [x] **Step 1:** Failing tests: a caravan sets off for an empty slot when the partner has
  a caravan home and the treasury can pay; not for a slot already served, not with both of
  the partner's caravans out, not without money; it arrives after half the round trip,
  walks to the yard, unloads and is charged (Imports account), walks west and is home
  after the other half; it turns back without charging when the yard is gone; the World panel's count.
- [x] **Step 2:** Implement.

### Task 5: Inspectors

**Files:** `src/sim/inspect.ts`, `tests/sim/imports.test.ts`.

- [x] **Step 1:** Failing tests: the foreign caravan's inspector; the yard's import slots,
  caravans coming and the waiting-for-money line.
- [x] **Step 2:** Implement.

### Task 6: UI and models

**Files:** `src/ui/inspector.ts`, `src/ui/yard-panel.ts`, `src/ui/ledger-chapters.ts`,
`src/ui/world.ts`, `src/render/walker-layer.ts`, `src/render/palette.ts`,
`docs/reference/zeus-numbers.md`.

- [x] **Step 1:** The slot panel offers Off, each export and each import, and an amount
  for imports.
- [x] **Step 2:** The Treasury's Imports line; foreign caravan figures.

### Task 7: Ship

- [x] **Step 1:** Typecheck, tests, build. (Live session: the owner smoke-tests.)
- [x] **Step 2:** Tick the roadmap, squash onto `main` as `Slice 30: Trade: imports`.
