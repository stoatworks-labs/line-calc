import { useMemo, useState } from 'react';
import type { Panel } from '../domain/types';
import { Field, Num } from './ui';
import { mm } from '../lib/format';

/**
 * Pick a panel from the library, or describe one by hand.
 *
 * The library is 150 records parsed out of manufacturer datasheets, each carrying the
 * document it came from. `verified: false` means the record is good enough to plan a
 * wall with and not good enough to quote a job from, and the badge says so rather than
 * the app quietly treating both kinds the same.
 */
export function PanelPicker({
  panels,
  panelId,
  onPick,
  custom,
  onCustomChange,
  snapshotDate,
}: {
  panels: Panel[];
  panelId: string;
  onPick: (id: string) => void;
  custom: Panel;
  onCustomChange: (p: Panel) => void;
  snapshotDate: string;
}) {
  const [maker, setMaker] = useState('all');
  const [query, setQuery] = useState('');

  const makers = useMemo(() => [...new Set(panels.map((p) => p.manufacturer))].sort(), [panels]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return panels
      .filter((p) => maker === 'all' || p.manufacturer === maker)
      .filter((p) => !q || `${p.manufacturer} ${p.series} ${p.model}`.toLowerCase().includes(q))
      .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.model.localeCompare(b.model));
  }, [panels, maker, query]);

  const isCustom = panelId === '__custom__';
  const selected = isCustom ? custom : panels.find((p) => p.id === panelId);

  const set = (k: keyof Panel, v: number) => onCustomChange({ ...custom, [k]: v });

  return (
    <section className="panelbox">
      <h2>Panel</h2>

      <div className="row2">
        <Field label="Manufacturer">
          <select value={maker} onChange={(e) => setMaker(e.currentTarget.value)}>
            <option value="all">All ({panels.length})</option>
            {makers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Search">
          <input
            type="search"
            value={query}
            placeholder="PL2.5, Carbon, CB5…"
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </Field>
      </div>

      <Field label={`Model — ${shown.length} match${shown.length === 1 ? '' : 'es'}`}>
        <select value={panelId} onChange={(e) => onPick(e.currentTarget.value)}>
          <option value="__custom__">Custom panel…</option>
          {shown.map((p) => (
            <option key={p.id} value={p.id}>
              {p.manufacturer} {p.model} — {p.pixelsX}×{p.pixelsY}, {p.powerMaxW} W
            </option>
          ))}
        </select>
      </Field>

      {isCustom ? (
        <div className="custom">
          <div className="row2">
            <Field label="Width"><Num value={custom.widthMm} min={10} max={5000} onChange={(n) => set('widthMm', n)} suffix="mm" /></Field>
            <Field label="Height"><Num value={custom.heightMm} min={10} max={5000} onChange={(n) => set('heightMm', n)} suffix="mm" /></Field>
          </div>
          <div className="row2">
            <Field label="Pixels across"><Num value={custom.pixelsX} min={1} max={4096} onChange={(n) => set('pixelsX', n)} suffix="px" /></Field>
            <Field label="Pixels down"><Num value={custom.pixelsY} min={1} max={4096} onChange={(n) => set('pixelsY', n)} suffix="px" /></Field>
          </div>
          <div className="row2">
            <Field label="Peak power"><Num value={custom.powerMaxW} min={1} max={5000} onChange={(n) => set('powerMaxW', n)} suffix="W" /></Field>
            <Field label="Average power"><Num value={custom.powerAvgW} min={1} max={5000} onChange={(n) => set('powerAvgW', n)} suffix="W" /></Field>
          </div>
          <p className="hint">
            Peak is the all-white, full-brightness figure — the one a distro has to survive.
            A datasheet that quotes W/m² rather than W/panel needs multiplying by the panel
            area first: {mm(custom.widthMm)} × {mm(custom.heightMm)} is{' '}
            {((custom.widthMm / 1000) * (custom.heightMm / 1000)).toFixed(3)} m².
          </p>
        </div>
      ) : selected ? (
        <div className="spec">
          <dl>
            <div><dt>Size</dt><dd>{mm(selected.widthMm)} × {mm(selected.heightMm)}</dd></div>
            <div><dt>Resolution</dt><dd>{selected.pixelsX} × {selected.pixelsY} px</dd></div>
            <div><dt>Pitch</dt><dd>{selected.pixelPitchMm} mm</dd></div>
            <div><dt>Peak / average</dt><dd>{selected.powerMaxW} W / {selected.powerAvgW} W</dd></div>
            <div><dt>Weight</dt><dd>{selected.weightKg} kg</dd></div>
          </dl>
          <p className={`prov ${selected.verified ? 'prov--ok' : 'prov--soft'}`}>
            {selected.verified ? 'From the datasheet: ' : 'Unverified — plan with it, do not quote from it. '}
            <span>{selected.source}</span>
          </p>
        </div>
      ) : null}

      <p className="hint hint--faint">
        Library snapshotted from Pixel Peeker on {snapshotDate}. Check the maker's current
        sheet before anything leaves the building.
      </p>
    </section>
  );
}
