# Line Calc

> **AI-assisted project.** This codebase was created with [Claude Code](https://claude.com/claude-code)
> (Anthropic), directed and reviewed by a human author. The data-line model is verified
> numerically: it reproduces NovaStar's three published MX40 Pro per-port figures to the
> pixel, and those are pinned as tests. The panel library is a dated snapshot of
> [Pixel Peeker](https://github.com/stoatworks-labs/pixel-peeker)'s, which was parsed from
> manufacturer datasheet PDFs with each record carrying its source. It has **not** been
> used to plan a wall that was then built, and no processor, panel or distro has been
> connected to it.

How many LED panels fit on one processor port, and how many on one power circuit.

Two questions about the same panel, limited by unrelated physics, that almost never come
out to the same number — and the run you can actually build is the smaller of the two.
Runs entirely in the browser. No account, no server, nothing uploaded.

**Status: alpha.** The data half is calibrated against published manufacturer figures.
The power half is arithmetic plus one published table to check it against, and it is
steady-state only.

## What it does

- **Pick a panel.** 150 rental panels from Absen, Aluvision, Gloshine, ROE and Unilumin,
  each with the datasheet it was parsed from — or define your own by size, resolution and
  watts.
- **Data line.** Pixels per port for 15 NovaStar and Brompton controllers, at 8/10/12-bit
  and 24–120 Hz, with the receiving-card and whole-device ceilings applied.
- **Power line.** Panels per circuit for UK/EU and US supplies, single and three phase,
  at any breaker rating, with or without the 80% continuous-load derate, on peak or
  average power.
- **Which one binds.** The app says whether it is data or power that stops you, and how
  much of the other you are leaving unused.
- **The whole wall.** Ports, processors, circuits and total draw for a given panel count.

## The bit that matters: port capacity

Most LED capacity spreadsheets compute `pixels = link rate / (3 x bit depth) / frame
rate`. That is wrong at 10-bit and 12-bit, in the direction that gets you into trouble —
it overstates capacity by about 7% at 10-bit.

Controllers pack pixels into a **power-of-two container** so the DMA engine stays
word-aligned:

| Bit depth | Naive (3 x depth) | Actual container |
|-----------|-------------------|------------------|
| 8-bit     | 24 bits/px        | **24 bits/px**   |
| 10-bit    | 30 bits/px        | **32 bits/px**   |
| 12-bit    | 36 bits/px        | **48 bits/px**   |

With those containers, a single link efficiency of **0.95** reproduces NovaStar's three
published MX40 Pro per-port figures exactly:

| Signal        | NovaStar publishes | Line Calc computes |
|---------------|--------------------|--------------------|
| 8-bit @ 60 Hz | 659,722 px         | 659,722 px         |
| 10-bit @ 60 Hz| 494,791 px         | 494,791 px         |
| 12-bit @ 60 Hz| 329,861 px         | 329,861 px         |

With naive packing no single efficiency constant fits all three. These are pinned in
`src/domain/data-line.test.ts`.

**LED refresh rate does not consume link bandwidth.** The 3840 Hz or 7680 Hz on the
datasheet is a panel-side property: the frame crosses the wire once per video frame and
the driver ICs re-scan it from local memory. Frame *rate* is the one that costs
bandwidth, which is why the app asks for that and not for refresh.

## The bit that is new: power lines

Almost no manufacturer publishes a panels-per-circuit figure, so the tool computes it —
`floor(breaker amps x derate / (watts / volts))` — and shows the arithmetic.

Where a brochure *does* print a number it is usually not the one people think. ROE's
spec tables give "Max. Hanging (panels)" and "Max. Stacking (panels)" — 12 and 5 for the
Carbon series — which are **mechanical** limits about what the top panel's frame can
carry, and get misread as power limits constantly.

**Absen are the exception**, and the calibration source. The PL V2 Series User Manual
(section 4.2, p.19) tabulates the quantity of cabinets one 3x2.5mm² cable carries at
AC220V and AC110V, for eighteen models. Two things fall out of checking it:

- The 110 V column is the 220 V column **halved and rounded up** — `ceil(n/2)` in all
  eighteen rows. That is the signature of a *current* limit, not a power or cable-length
  one. Fifteen rows halve exactly; the three that round up are the odd 7-panel rows,
  where rounding up is the *less* conservative direction.
- Divide back out and every row lands between **9.7 A and 15.3 A** at 220 V — inside a
  16 A limit, with margin. So the published figures are a conservative, quantised
  recommendation rather than a computed maximum, and the app shows the gap.

Both findings are asserted in `src/domain/power-line.test.ts`.

## What it does not do

- **Inrush.** LED panel supplies draw a large, brief surge at switch-on. It is why a wall
  is powered up in sections and why a breaker that holds all day can trip on power-up.
  Flagged in the UI, not modelled.
- **Cable length.** Volt drop along the daisy chain is not computed. See the
  [cable voltage drop reference](https://stoatworks-labs.com/reference/cable-voltage-drop)
  for that arithmetic.
- **Power factor**, harmonics, or neutral current on three phase.
- **Laying out a wall.** That is [Pixel Peeker](https://github.com/stoatworks-labs/pixel-peeker),
  which shares the library and does the canvas, the wiring and the exports.

Sizing a circuit is a job for whoever signs off the distro.

## The panel library

`src/data/panels.generated.ts` is a **dated snapshot** of Pixel Peeker's library, produced
by `npm run gen:panels`. Every record keeps the `source` string naming the manufacturer
document it was parsed from, and `verified: false` still means "good enough to plan a
wall, not good enough to quote a job" — the UI badges it.

The generator asserts the library is sane before writing: W/m² in range, average power at
or below peak, and the pitch label consistent with the geometry to within 5%.

```bash
npm run gen:panels                       # resync from ../pixel-peeker
npm run gen:panels -- --pixel-peeker ../elsewhere
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 28 tests, including the calibration pins
npm run build
```

<!-- attributions:start -->
This project is built on other people's work — see [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
<!-- attributions:end -->

## Licence

MIT. See [LICENSE](LICENSE).
