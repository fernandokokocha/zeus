# Zeus clone

A browser city-builder modeled on *Zeus: Master of Olympus*. Unattended Claude sessions
build it one slice at a time, and the owner playtests the deployed build between slices.

- **Design:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`, extended by
  `docs/superpowers/specs/2026-10-25-elite-housing-design.md` (elite housing, slices 12–17),
  `docs/superpowers/specs/2026-10-26-map-modes-ledger-design.md` (map modes and the Ledger,
  slices 18–24), `docs/superpowers/specs/2026-10-27-appeal-design.md` (road upgrades and the
  Monument, slices 25–26) and `docs/superpowers/specs/2026-10-27-trade-design.md` (trade,
  slices 27–31). Read all five every session.
- **Gameplay numbers:** `docs/reference/zeus-numbers.md`.
- **Progress:** `docs/roadmap.md`.
- **Slice plans:** `docs/slices/NN-name.md`.
- **Redesigning models** with the owner (buildings, houses, walkers): `docs/model-redesign.md`.
- **Redesign backlog:** `docs/redesign-backlog.md`, the things still on placeholder models.
  When the owner says "redesign" followed by items (backlog numbers or names, one or many),
  that is a request for a bulk round: one background agent per item, run as "Bulk rounds"
  in `docs/model-redesign.md` describes.

## Working agreement

**Interactive sessions never push.** When the owner is in the session and gives a task
(feedback, a feature, a redesign), it ends with a local commit on `main`: no push and no
waiting for CI. The owner tests locally and stacks changes, so push only when explicitly
asked. Everything below is for unattended slice sessions.

The owner is hands-off until the playtest. The spec's "Working agreement" section is
binding. In short:

- **Never stop to ask.** Decide, using the option closest to the original Zeus, record
  the decision in the slice commit, and keep going.
- **One slice per session**, finished completely.
- **Trunk-based development.** A finished slice is squashed into one commit on `main` and
  pushed. No pull requests and no waiting for approval: pushing to `main` is expected,
  and it is the point. The owner playtests as soon as the slice is done instead of
  waiting on a PR. Feedback arrives in a later session prompt and is fixed on `main`.
- **Done means deployed.** The slice commit is on `main`, its CI run is green, and Pages
  serves it.
- **If truly blocked,** don't push a broken `main`. Leave the work on its branch, push the
  branch, and put the blocker at the top of the session's final report.

## Session routine

1. **Find the slice.** Pull `main`. Read the spec and the roadmap. The slice is the first
   unchecked one. Fix any feedback in the session prompt first, in its own commits on
   `main`.
2. **Get a plan.** If `docs/slices/NN-*.md` exists, execute it task by task and tick its
   boxes. Otherwise, write it first, in the same format as `docs/slices/01-foundation.md`.
3. **Build test-first** on a local branch `slice-NN-name`, in small commits.
4. **Look at the game.** `npm run test:e2e` saves `test-results/screenshot.png`. Open it
   and check that the slice looks right.
5. **Ship it.** Tick the slice in `docs/roadmap.md`, squash the branch onto `main` as one
   commit titled `Slice NN: Name`, and push. The commit body and the session's final
   report both carry:
   - **Playtest checklist:** concrete things to try and what should happen. The owner
     verifies the slice from this alone.
   - **Decisions I made:** every choice the spec didn't cover.
   - **Left out:** anything cut to protect quality.
6. **Wait for CI** on `main` to go green and deploy to Pages
   (https://fernandokokocha.github.io/zeus/), then stop.

## Commands

```
npm run dev         # local dev server
npm test            # simulation tests (Vitest)
npm run typecheck
npm run build
npm run test:e2e    # Playwright smoke test + screenshot
```

## CI status

The repo is public, so the REST API needs no login (`gh api` works too, where `gh` is
authenticated). If `git remote` is empty, run
`git remote add origin https://github.com/fernandokokocha/zeus` first.

```
curl -s "https://api.github.com/repos/fernandokokocha/zeus/actions/runs?branch=main&per_page=1"
```

If the preinstalled Chromium does not match the Playwright version, run the e2e test
locally through an uncommitted config that sets
`launchOptions.executablePath: '/opt/pw-browsers/chromium'`. CI installs its own.

## Code rules

- `src/sim` holds every game rule. It never imports from `src/render`, `src/ui`,
  `three`, or touches the DOM. Rules are tested in `tests/` at the simulation level,
  test first.
- **Numbers come from `docs/reference/zeus-numbers.md`** and live in one definitions
  table per concept in code, never inline in logic.
- **No comments by default.** A comment that says *what* code does gets replaced by a
  better name, a named constant, or an extracted function. A comment that documents
  behavior by example gets replaced by a test. Only a genuine *why* that the code cannot
  express survives.
- **No defensive programming.** Don't scatter `?.` or `!` across the code or swallow
  impossible states. Let bad states fail loudly. Where existence genuinely varies,
  handle it explicitly and test it.
- **Never guess an abstraction.** Write the simple, concrete thing for the slice in
  front of you. Generalize when a second or third real case arrives, not before.
  Following a pattern that already exists in the code is not guessing.
- **Removing is work.** Delete dead code, duplicate logic and stale docs whenever you
  see them.
- **A refactor never changes behavior.** Existing tests stay green without modification.
  A behavior change is named and committed separately.
- Throwaway scripts are written in Ruby (stdlib only) and never committed.
