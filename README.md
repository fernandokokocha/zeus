# Zeus clone

A browser city-builder modeled on *Zeus: Master of Olympus*: TypeScript, Vite and
Three.js, with all art generated in code.

**Play:** https://fernandokokocha.github.io/zeus/ (desktop browser, mouse and keyboard).

## How it is built

Unattended Claude sessions build the game one slice at a time. Each slice arrives as a
PR whose build deploys to Pages; the owner playtests it, comments, and approves, and
the next session squash-merges it. See `CLAUDE.md` for the routine,
`docs/roadmap.md` for progress, and
`docs/superpowers/specs/2026-10-11-zeus-clone-design.md` for the design.

## Development

```
npm install
npm run dev         # local dev server
npm test            # simulation tests
npm run typecheck
npm run test:e2e    # smoke test + screenshot
```
