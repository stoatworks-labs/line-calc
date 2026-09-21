/*
 * Generate Line Calc's panel and processor library from Pixel Peeker's.
 *
 * WHY A SNAPSHOT AND NOT A SHARED PACKAGE. Pixel Peeker's library was parsed out of
 * manufacturer datasheet PDFs, one record at a time, each carrying the `source` string
 * that says which sheet and which revision it came from. That provenance is the whole
 * value of it, and re-typing it here would destroy it. The fleet has no shared-package
 * machinery and adding one for two repos would be worse than a snapshot, so this script
 * is the join: it reads the sibling repo, keeps `source` and `verified` verbatim, drops
 * the fields only a canvas needs, and records WHEN it ran. Re-run it to resync.
 *
 *   node scripts/gen-panels.mjs [--pixel-peeker ../pixel-peeker]
 *
 * Pixel Peeker is TypeScript with type-only imports, so esbuild bundles it to a
 * temporary ES module first; plain `node --import` cannot read it directly.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const argIdx = process.argv.indexOf('--pixel-peeker');
const PP = resolve(argIdx > -1 ? process.argv[argIdx + 1] : join(REPO, '..', 'pixel-peeker'));

const esbuild = join(PP, 'node_modules', '.bin', 'esbuild');
const tmp = mkdtempSync(join(tmpdir(), 'line-calc-gen-'));

/** Bundle one of Pixel Peeker's data modules to ESM we can import. */
function load(entry) {
  const out = join(tmp, entry.replace(/[^a-z0-9]/gi, '_') + '.mjs');
  execFileSync(esbuild, [join(PP, entry), '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  return import(pathToFileURL(out).href);
}

const { CABINET_LIBRARY } = await load('src/data/cabinets/index.ts');
const processorsMod = await load('src/data/processors.ts');

const RECEIVERS = processorsMod.RECEIVING_CARDS ?? processorsMod.RECEIVER_LIBRARY ?? [];
const PROCESSORS = processorsMod.PROCESSOR_LIBRARY ?? processorsMod.PROCESSORS ?? [];

const STAMP = new Date().toISOString().slice(0, 10);
const banner = (what, n) => `/*
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * ${n} ${what}, snapshotted from Pixel Peeker (../pixel-peeker) on ${STAMP} by
 * scripts/gen-panels.mjs. Every record keeps the \`source\` string naming the
 * manufacturer datasheet it was parsed from, and \`verified: false\` still means
 * "good enough to lay out a wall, not good enough to quote a job".
 *
 * To resync: npm run gen:panels
 */
`;

const j = (v, _r, indent) => JSON.stringify(v, null, indent);

/* ---- panels ------------------------------------------------------------- */

const panels = CABINET_LIBRARY.map((c) => ({
  id: c.id,
  manufacturer: c.manufacturer,
  series: c.series,
  model: c.model,
  pixelPitchMm: c.pixelPitchMm,
  widthMm: c.widthMm,
  heightMm: c.heightMm,
  pixelsX: c.pixelsX,
  pixelsY: c.pixelsY,
  weightKg: c.weightKg,
  powerMaxW: c.powerMaxW,
  powerAvgW: c.powerAvgW,
  ...(c.receivingCardId ? { receivingCardId: c.receivingCardId } : {}),
  ...(c.maxRefreshHz ? { maxRefreshHz: c.maxRefreshHz } : {}),
  verified: c.verified,
  source: c.source,
}));

/* A library-wide sanity check, the same class as Pixel Peeker's own: a record that
   fails one of these is a transcription error, not an unusual panel. */
for (const p of panels) {
  const area = (p.widthMm / 1000) * (p.heightMm / 1000);
  const wPerM2 = p.powerMaxW / area;
  if (!(wPerM2 > 100 && wPerM2 < 1200)) throw new Error(`${p.id}: ${wPerM2.toFixed(0)} W/m2 is out of range`);
  if (!(p.powerAvgW > 0 && p.powerAvgW <= p.powerMaxW)) throw new Error(`${p.id}: average power ${p.powerAvgW} W vs max ${p.powerMaxW} W`);
  const pitchFromPixels = p.widthMm / p.pixelsX;
  if (Math.abs(pitchFromPixels - p.pixelPitchMm) / p.pixelPitchMm > 0.05) {
    throw new Error(`${p.id}: pitch label ${p.pixelPitchMm} mm but geometry gives ${pitchFromPixels.toFixed(2)} mm`);
  }
}

writeFileSync(
  join(REPO, 'src/data/panels.generated.ts'),
  banner('panels', panels.length) +
    `\nimport type { Panel } from '../domain/types';\n\nexport const PANEL_SNAPSHOT_DATE = ${j(STAMP)};\n\nexport const PANELS: Panel[] = ${j(panels, null, 2)};\n`,
);

/* ---- receiving cards ---------------------------------------------------- */

const cards = RECEIVERS.map((r) => ({
  id: r.id,
  manufacturer: r.manufacturer,
  model: r.model,
  maxPixels: r.maxPixels,
  ...(r.maxWidthPx ? { maxWidthPx: r.maxWidthPx } : {}),
  ...(r.maxHeightPx ? { maxHeightPx: r.maxHeightPx } : {}),
  source: r.source,
}));

/* ---- processors --------------------------------------------------------- */

/* Ports on every processor in the library are homogeneous, so one port record
   describes the box. The generator asserts that rather than assuming it: a future
   mixed-port controller must be handled deliberately, not averaged silently. */
const processors = PROCESSORS.map((p) => {
  const first = p.ports[0];
  for (const port of p.ports) {
    if (port.linkSpeedGbps !== first.linkSpeedGbps || port.medium !== first.medium || port.packing !== first.packing) {
      throw new Error(`${p.id} has mixed port types — Line Calc's one-port model cannot describe it`);
    }
  }
  return {
    id: p.id,
    manufacturer: p.manufacturer,
    model: p.model,
    portCount: p.ports.length,
    portLinkGbps: first.linkSpeedGbps,
    portMedium: first.medium,
    ...(first.efficiency !== undefined ? { portEfficiency: first.efficiency } : {}),
    ...(first.efficiencyByDepth ? { portEfficiencyByDepth: first.efficiencyByDepth } : {}),
    ...(first.packing ? { packing: first.packing } : {}),
    ...(p.totalCapacityPx ? { totalCapacityPx: p.totalCapacityPx } : {}),
    ...(p.capacityScaling ? { capacityScaling: p.capacityScaling } : {}),
    ...(p.referenceBitDepth ? { referenceBitDepth: p.referenceBitDepth } : {}),
    ...(p.referenceFrameRateHz ? { referenceFrameRateHz: p.referenceFrameRateHz } : {}),
    source: p.source,
  };
});

writeFileSync(
  join(REPO, 'src/data/processors.generated.ts'),
  banner('processors and receiving cards', processors.length + cards.length) +
    `\nimport type { Processor, ReceivingCard } from '../domain/types';\n\nexport const PROCESSORS: Processor[] = ${j(processors, null, 2)};\n\nexport const RECEIVING_CARDS: ReceivingCard[] = ${j(cards, null, 2)};\n`,
);

rmSync(tmp, { recursive: true, force: true });
console.log(`wrote ${panels.length} panels, ${processors.length} processors, ${cards.length} receiving cards (snapshot ${STAMP})`);
