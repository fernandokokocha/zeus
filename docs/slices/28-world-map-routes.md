# Slice 28: World map and routes Implementation Plan

> **For agentic workers:** Execute this plan task by task, ticking the checkboxes as you
> go. If the superpowers skills are available, use superpowers:executing-plans.

**Goal:** Four partner cities with fixed goods and prices, a **World** panel that shows
them, and **routes**: each Traders' Guild opens one, to a partner of the player's choice,
from its inspector. The first route to each partner earns a monument with the trade-route
emblem. Opening needs a Palace with a road to the Main Road, and the Palace can't be
demolished while a route is open. A guild that goes closes its route. No caravans move yet.

**Architecture:** `src/sim/trade.ts` owns the two definitions tables (`PARTNERS`,
`TRADE_GOODS`), `state.routes` (`{ partner, guildId }[]`), `state.partnersTraded` (every
partner a route was ever opened to), `openRoute`, the guild's route status and
`worldReport` for the panel. `removeBuildings` drops the routes of doomed guilds;
`demolish` spares the Palace while a route is open and says why. Monuments remember what
earned them: `state.monumentsToPlace` becomes a queue of `MonumentKind`s and a placed
monument keeps its kind in `building.monument`, which picks its emblem. The UI adds
`src/ui/world.ts` (the panel, normal and choosing) and an **Open route** button in the
guild's inspector.

**Spec:** `docs/superpowers/specs/2026-10-27-trade-design.md`, "The world map and routes".

## Decisions (closest to Zeus, recorded in the commit)

1. **Monuments are placed oldest first.** The Monument tool places the earliest earned
   monument that isn't placed yet, with its own emblem. Zeus builds each commemorative
   monument from its own achievement; a picker can come later if wanted.
2. **The route notice carries the monument:** "Trade route to Kerynthos opened. A monument
   can be raised." for the first route to a partner, the plain notice otherwise.
3. **A guild that breaks up names its route** in the break-up notice ("… Its permit is lost
   and its route to Kerynthos closes"). A demolished guild closes it silently, like the
   permit.
4. **Demolishing over the Palace** while a route is open clears everything else in the
   area and leaves the Palace, with the status "Trade caravans deliver to the Palace".
5. **The guild's route line:** "Trade route: Kerynthos, 5-month round trip" when open;
   otherwise "Trade route: none yet" with the button, or the reason it can't open ("needs
   a Palace with a road to the Main Road", "every partner already trades with a guild")
   and no button.
6. **The World panel** has no shortcut key (W pans the camera). It does not pause the game,
   like the Ledger. Clicking a partner already trading while choosing only shows it.
7. **Partner colours** live in the UI with the other colours; the sim names the partners.
8. **The yard's line** with a route open is "Trade Yard: trading with Kerynthos"; its slots
   arrive in slice 29.

---

### Task 1: Plan

- [x] **Step 1:** Write this plan.

### Task 2: Monuments remember their kind

**Files:** `src/sim/monuments.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/ui/tools.ts`, `src/render/models.ts`, `tests/sim/monuments.test.ts`,
`tests/ui/tools.test.ts`.

- [x] **Step 1:** Failing tests: a placed monument keeps the kind that earned it; two
  earned monuments are placed oldest first.
- [x] **Step 2:** Implement; the model picks `CROWDED_CITY` or `TRADE_ROUTE` from the kind.

### Task 3: Partners and routes

**Files:** `src/sim/trade.ts`, `src/sim/state.ts`, `src/sim/commands.ts`,
`src/sim/guild.ts`, `src/sim/inspect.ts`, `tests/sim/trade.test.ts`,
`docs/reference/zeus-numbers.md`.

- [x] **Step 1:** Failing tests: the tables (every good the city makes sells to someone,
  cloth is bought from no one, every good on offer has a price); opening a route (notice, monument for
  the first route to a partner only, one route per guild, one guild per partner, needs a
  Palace with a road to the Main Road); the Palace can't be demolished while a route is
  open; a demolished, broken-up or burnt guild closes its route and frees the partner; the
  guild's and yard's inspector lines; `worldReport`.
- [x] **Step 2:** Implement; record the tables in `zeus-numbers.md`.

### Task 4: World panel and the Open route button

**Files:** `index.html`, `src/style.css`, `src/main.ts`, `src/ui/world.ts`,
`src/ui/inspector.ts`, `src/ui/tool-input.ts`.

- [x] **Step 1:** World button in the top bar; panel with a stylised map (our city on the
  east, the road running west, four partners in their colours, each road labelled with its
  round trip) and a details pane for the clicked partner.
- [x] **Step 2:** The guild inspector's Open route button opens the panel choosing; an
  available partner opens the route, the panel shows it, and the inspector updates.
- [x] **Step 3:** Demolish reports the spared Palace in the status line.

### Task 5: Ship

- [x] **Step 1:** Typecheck, tests, build. (Live session: the owner smoke-tests.)
- [x] **Step 2:** Tick the roadmap, squash onto `main` as `Slice 28: World map and routes`.
