# CLAUDE.md — Line Calc

Command reference. For the model, the invariants and the traps, read
[AGENTS.md](AGENTS.md) first, then [docs/NOTES.md](docs/NOTES.md).

## Commands

```bash
npm install
npm run dev          # vite dev server
npm test             # vitest — 28 tests, including the calibration pins
npm run test:watch
npm run build        # tsc -b && vite build -> dist/
npm run preview      # serve the built dist/ (does NOT apply _headers)
npm run serve:dist   # serve dist/ WITH _headers applied — use this to check the CSP
npm run typecheck
npm run gen:panels   # resync the library from ../pixel-peeker
```

## Deploy

```bash
npx wrangler login   # you must run this — it's an account sign-in
npm run deploy       # build + wrangler deploy
```

Or connect the repo in Cloudflare: build `npm ci && npm run build`, output `dist`.

## Ground rules

- **The three NovaStar MX40 Pro figures in `data-line.test.ts` are the contract.** If a
  change breaks them, the change is wrong. Everything the app prints rests on them.
- `src/data/*.generated.ts` is generated. Never hand-edit; run `npm run gen:panels`.
- Pixels cost **power-of-two containers** on the wire (24/32/48 bits), not `3 x depth`.
  Do not "correct" this back to the naive formula.
- **LED refresh rate is not link bandwidth.** Frame rate is. Don't add refresh as an
  input to the capacity model.
- Three phase uses the **phase** voltage (230 V of a 400 V supply). `SupplySpec.volts` is
  phase; `label` is the line-to-line name.
- Peak power is the default basis and should stay that way.
- `verified: false` on a panel record means "cannot be used to quote a job". Keep the
  badge.
