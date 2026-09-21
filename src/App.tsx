/*
 * Line Calc.
 *
 * One question, asked twice about the same panel: how many fit on a line? The data
 * answer and the power answer come from unrelated physics and almost never agree, so
 * the app shows both side by side and then says which one actually binds — because the
 * run you can build is the smaller of the two, and which one it is changes with the
 * panel, the processor, the bit depth and the country you are in.
 */

import { useMemo, useState } from 'react';
import { PANELS, PANEL_SNAPSHOT_DATE } from './data/panels.generated';
import { PROCESSORS, RECEIVING_CARDS } from './data/processors.generated';
import { dataLine } from './domain/data-line';
import { powerLine, wallPower, SUPPLIES, CONTINUOUS_LOAD_DERATE } from './domain/power-line';
import { publishedChainFor, impliedAmps, PUBLISHED_CHAIN_SOURCE } from './domain/published-chains';
import type { BitDepth, Panel } from './domain/types';
import { PanelPicker } from './components/PanelPicker';
import { DataLineCard } from './components/DataLineCard';
import { PowerLineCard } from './components/PowerLineCard';
import { Verdict } from './components/Verdict';
import { WallSummary } from './components/WallSummary';
import { Field, Num } from './components/ui';

const FRAME_RATES = [24, 25, 30, 50, 60, 100, 120];
const DEPTHS: BitDepth[] = [8, 10, 12];

export const CUSTOM_PANEL: Panel = {
  id: '__custom__',
  manufacturer: 'Custom',
  series: 'Custom',
  model: 'Custom panel',
  pixelPitchMm: 2.5,
  widthMm: 500,
  heightMm: 500,
  pixelsX: 200,
  pixelsY: 200,
  weightKg: 7.5,
  powerMaxW: 180,
  powerAvgW: 60,
  verified: false,
  source: 'entered by hand',
};

export default function App() {
  const [panelId, setPanelId] = useState('absen-pl25-pro-v2-novastar');
  const [custom, setCustom] = useState<Panel>(CUSTOM_PANEL);
  const [procId, setProcId] = useState('novastar-mx40-pro');
  const [bitDepth, setBitDepth] = useState<BitDepth>(8);
  const [frameRateHz, setFrameRateHz] = useState(60);
  const [supplyId, setSupplyId] = useState('uk-230-1p');
  const [breakerAmps, setBreakerAmps] = useState(16);
  const [derated, setDerated] = useState(true);
  const [basis, setBasis] = useState<'peak' | 'average'>('peak');
  const [wallPanels, setWallPanels] = useState(120);

  const panel = panelId === '__custom__' ? custom : (PANELS.find((p) => p.id === panelId) ?? CUSTOM_PANEL);
  const proc = PROCESSORS.find((p) => p.id === procId) ?? PROCESSORS[0]!;
  const supply = SUPPLIES.find((s) => s.id === supplyId) ?? SUPPLIES[0]!;

  /* A breaker the chosen supply does not offer would silently give a wrong answer. */
  const breaker = supply.breakers.includes(breakerAmps) ? breakerAmps : supply.breakers[0]!;

  const powerInput = {
    supply,
    breakerAmps: breaker,
    derate: derated ? CONTINUOUS_LOAD_DERATE : 1,
    basis,
  };

  const data = useMemo(
    () => dataLine(panel, proc, { bitDepth, frameRateHz }, RECEIVING_CARDS),
    [panel, proc, bitDepth, frameRateHz],
  );
  const power = useMemo(() => powerLine(panel, powerInput), [panel, supply, breaker, derated, basis]);
  const wall = useMemo(() => wallPower(panel, wallPanels, powerInput), [panel, wallPanels, supply, breaker, derated, basis]);

  const published = publishedChainFor(panel.id);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/icon.svg" alt="" width="22" height="22" />
          <span>Line Calc</span>
        </div>
        <p className="tagline">
          How many panels fit on one processor port, and how many on one power circuit.
        </p>
        <button type="button" className="ghost" onClick={() => window.dispatchEvent(new Event('stoatworks:about'))}>
          About
        </button>
      </header>

      <main className="main">
        <aside className="col col--input">
          <PanelPicker
            panels={PANELS}
            panelId={panelId}
            onPick={setPanelId}
            custom={custom}
            onCustomChange={setCustom}
            snapshotDate={PANEL_SNAPSHOT_DATE}
          />

          <section className="panelbox">
            <h2>Signal</h2>
            <Field label="Processor">
              <select value={procId} onChange={(e) => setProcId(e.currentTarget.value)}>
                {PROCESSORS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.manufacturer} {p.model}
                  </option>
                ))}
              </select>
            </Field>
            <div className="row2">
              <Field label="Bit depth">
                <select value={bitDepth} onChange={(e) => setBitDepth(Number(e.currentTarget.value) as BitDepth)}>
                  {DEPTHS.map((d) => (
                    <option key={d} value={d}>{d}-bit</option>
                  ))}
                </select>
              </Field>
              <Field label="Frame rate">
                <select value={frameRateHz} onChange={(e) => setFrameRateHz(Number(e.currentTarget.value))}>
                  {FRAME_RATES.map((f) => (
                    <option key={f} value={f}>{f} Hz</option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="hint">
              The panel's 3840 Hz or 7680 Hz refresh rate is not in this box on purpose — LED
              refresh costs the panel, not the link. Frame rate is the one that costs bandwidth.
            </p>
          </section>

          <section className="panelbox">
            <h2>Power</h2>
            <Field label="Supply">
              <select
                value={supplyId}
                onChange={(e) => {
                  const next = SUPPLIES.find((s) => s.id === e.currentTarget.value)!;
                  setSupplyId(next.id);
                  if (!next.breakers.includes(breakerAmps)) setBreakerAmps(next.breakers[0]!);
                }}
              >
                {SUPPLIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} — {s.region}
                  </option>
                ))}
              </select>
            </Field>
            <div className="row2">
              <Field label="Breaker">
                <select value={breaker} onChange={(e) => setBreakerAmps(Number(e.currentTarget.value))}>
                  {supply.breakers.map((b) => (
                    <option key={b} value={b}>{b} A</option>
                  ))}
                </select>
              </Field>
              <Field label="Power figure">
                <select value={basis} onChange={(e) => setBasis(e.currentTarget.value as 'peak' | 'average')}>
                  <option value="peak">Peak (all white)</option>
                  <option value="average">Average (programme)</option>
                </select>
              </Field>
            </div>
            <label className="check">
              <input type="checkbox" checked={derated} onChange={(e) => setDerated(e.currentTarget.checked)} />
              <span>
                Derate to 80% for a continuous load
                <em>NEC 210.20(A). Off = the full breaker rating, which is a trip point, not a budget.</em>
              </span>
            </label>
            {basis === 'average' && (
              <p className="hint hint--warn">
                Average power is for estimating what the venue will be asked for. Size a distro on
                it and the wall trips the first time someone puts up a white holding slide.
              </p>
            )}
          </section>

          <section className="panelbox">
            <h2>Whole wall</h2>
            <Field label="Panels in the wall">
              <Num value={wallPanels} min={1} max={5000} onChange={setWallPanels} />
            </Field>
          </section>
        </aside>

        <div className="col col--out">
          <Verdict panel={panel} data={data} power={power} proc={proc} supply={supply} breaker={breaker} />

          <div className="cards">
            <DataLineCard panel={panel} proc={proc} result={data} bitDepth={bitDepth} frameRateHz={frameRateHz} />
            <PowerLineCard
              panel={panel}
              result={power}
              supply={supply}
              breaker={breaker}
              derated={derated}
              basis={basis}
              published={published}
              impliedAmps={published ? impliedAmps(published, panel.powerMaxW) : null}
              publishedSource={PUBLISHED_CHAIN_SOURCE}
            />
          </div>

          <WallSummary
            panel={panel}
            panelCount={wallPanels}
            data={data}
            power={power}
            wall={wall}
            proc={proc}
            supply={supply}
          />
        </div>
      </main>
    </div>
  );
}
