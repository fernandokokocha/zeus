# Zeus clone

A browser city-builder modeled on *Zeus: Master of Olympus*. Unattended Claude sessions
build it one slice at a time, and the owner playtests the deployed build between slices.

- **Design:** `docs/superpowers/specs/2026-10-11-zeus-clone-design.md`. Read all of it
  every session.
- **Gameplay numbers:** `docs/reference/zeus-numbers.md`.
- **Progress:** `docs/roadmap.md`.
- **Slice plans:** `docs/slices/NN-name.md`.

## Working agreement

The owner is hands-off until the playtest. The spec's "Working agreement" section is
binding. In short:

- **Never stop to ask.** Decide, using the option closest to the original Zeus, record
  the decision in the PR, and keep going.
- **One slice per session**, finished completely.
- **Done means deployed:** CI green, PR merged, Pages updated, roadmap ticked.
- **If truly blocked,** leave the PR open with the blocker at the top of its description.

## Session routine

1. **Find the slice.** Read the spec and the roadmap. The slice is the first unchecked
   one.
2. **Collect feedback.** Read the owner's comments on the PR of the previous slice
   (`gh pr list --state merged --limit 1`, then `gh pr view <n> --comments`) and the
   session prompt. Fix the feedback first, in its own commits.
3. **Get a plan.** If `docs/slices/NN-*.md` exists, execute it task by task and tick its
   boxes. Otherwise, write it first, in the same format as `docs/slices/01-foundation.md`.
4. **Build test-first** on branch `slice-NN-name`.
5. **Look at the game.** `npm run test:e2e` saves `test-results/screenshot.png`. Open it
   and check that the slice looks right before opening the PR.
6. **Open the PR,** titled `Slice NN: Name`. Its body has these sections:
   - **Playtest checklist:** concrete things to try and what should happen. The owner
     verifies the slice from this alone.
   - **Decisions I made:** every choice the spec didn't cover.
   - **Left out:** anything cut to protect quality.

   Tick the slice in `docs/roadmap.md` in the same PR.
7. **Merge** with `gh pr merge --squash` once CI is green. If merging isn't possible
   from the session, say so on the first line of the PR description.

## Commands

```
npm run dev         # local dev server
npm test            # simulation tests (Vitest)
npm run typecheck
npm run build
npm run test:e2e    # Playwright smoke test + screenshot
```

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
