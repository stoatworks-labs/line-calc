# Line Calc — working notes

## Why this exists next to Pixel Peeker

Pixel Peeker lays out a wall: a canvas, cabinets you drag, ports you wire, exports. This
answers one question at the rental desk without opening any of that — *how many of these
fit on a line?* — and adds the half Pixel Peeker does not model at all: power circuits.

The split was a deliberate choice (2026-09-21), not an accident of history. Pixel Peeker
totals a wall's watts and divides by 230; it has no per-circuit model and `CabinetSpec`
carries no power-connector field. Adding a quick line calculator to a canvas app would
have buried the quick answer.

**The library is shared by snapshot, not by package.** `scripts/gen-panels.mjs` reads
Pixel Peeker's TypeScript through esbuild and emits `src/data/*.generated.ts`, keeping
every record's `source` and `verified` fields and stamping the date. The fleet has no
shared-package machinery and two repos do not justify building it; re-run the generator
to resync. If a third consumer ever appears, that is the moment to reconsider.

## Research, 2026-09-21

Looking for published panels-per-power-circuit figures across the library's five makers.

- **Absen — found one, and it is the good one.** PL V2 Series User Manual section 4.2
  p.19: eighteen rows of cabinets-per-cable at AC220V and AC110V on 3x2.5mm². Mirrored at
  `ledwallcentral.com/manuals/led_wall_manual_series_15.pdf` (the manuals.plus copy is
  behind a bot challenge; the ledwallcentral mirror is open and `pdftotext -layout` parses
  it cleanly). The same manual also states "No more than 655360 pixels can be loaded on
  each network port" — a vendor's own per-port cap, near NovaStar's 659,722 at 8-bit/60.
- **ROE — publishes no power-chain figure and no connector type.** Checked the Carbon,
  Vanish and Black Quartz brochures under
  `roevisual.com/uploads/files/Product File/...` (URL-encode the spaces). Their spec
  tables give Max. Hanging and Max. Stacking, which are mechanical. Worth stating on the
  page precisely *because* those two numbers get misread as power limits.
- **Unilumin, Gloshine, Aluvision** — nothing found in the open sources. Unilumin's
  manuals are on ManualsLib rather than their own site; Gloshine's sheets are image PDFs.
- **A sweep of `ledwallcentral.com/manuals/led_wall_manual_series_N.pdf`** for N in 1–30,
  plus a scattering up to 400, turned up one other manual with the same section heading
  (LR3.9-7.8) but no table under it. The Absen table looks genuinely unusual.

Absen's own installation text is the honest summary of the whole problem:

> "Please confirm the input voltage, the number of cabinets loaded on each power cable
> will be different upon different voltages and product models."

## Things that would be wrong to "fix"

- **`portLimitedBy` and `processorLimitedBy` are two fields on purpose.** They routinely
  disagree — an MX40 Pro port runs out of bandwidth at 16 of a 200x200 tile while the box
  runs out of backplane at 225 rather than the 320 its twenty ports could carry.
  Collapsing them to one `limitedBy` forces a choice between two true answers, and that
  is exactly the bug the first version of the test suite caught.
- **`#root { min-height: 100% }`, not `height`.** The other calculators in the fleet pin
  it to `height: 100%` because they are fixed-height canvas apps. This one scrolls, and a
  pinned root leaves the vendored support footer sitting on top of the last section.
- **Three phase uses the PHASE voltage.** Panels are line-to-neutral loads: a 400 V
  three-phase supply feeds them at 230 V, a 208 V supply at 120 V. `SupplySpec.volts` is
  therefore the phase voltage and `label` is the line-to-line name everyone says out loud.
- **Peak power is the default basis.** Average power is for telling a venue what the wall
  will draw; a distro sized on it trips on the first white holding slide.

## Still open

- No published chain limits or connector types for the other four manufacturers. If
  Unilumin's ManualsLib copies become readable, their Upad manuals are the next place to
  look.
- Cable length / volt drop along the chain is not modelled. It is the natural next
  addition and the arithmetic already exists on the website's cable-voltage-drop page.
- No launcher (the Tauri tray shell the fleet vendors into its web tools). Deliberate for
  a first cut; it is a separate release round.
