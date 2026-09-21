import type { DataLineResult } from '../domain/data-line';
import { wireBitsPerPixel, portEfficiency } from '../domain/data-line';
import type { BitDepth, Panel, Processor } from '../domain/types';
import { Stat, Bar } from './ui';
import { int, px, pct } from '../lib/format';

const LIMIT_TEXT: Record<string, string> = {
  'port-bandwidth': 'the port runs out of bandwidth',
  'receiving-card': 'the receiving card cannot drive this panel',
  'device-cap': 'the processor runs out before its ports do',
};

export function DataLineCard({
  panel,
  proc,
  result,
  bitDepth,
  frameRateHz,
}: {
  panel: Panel;
  proc: Processor;
  result: DataLineResult;
  bitDepth: BitDepth;
  frameRateHz: number;
}) {
  const bits = wireBitsPerPixel(bitDepth, proc.packing);
  const naive = 3 * bitDepth;
  const eff = portEfficiency(proc, bitDepth);
  const portsUsedByDevice =
    result.panelsPerPort > 0 ? Math.ceil(result.panelsPerProcessor / result.panelsPerPort) : 0;

  return (
    <section className="card card--data">
      <header>
        <h2>Data line</h2>
        <p>One port of a {proc.manufacturer} {proc.model}</p>
      </header>

      <Stat
        label="Panels on one port"
        value={result.panelsPerPort || '—'}
        note={LIMIT_TEXT[result.portLimitedBy]}
        tone="data"
        big
      />

      <Bar fraction={result.utilisation} tone="data" />
      <p className="barnote">
        {px(result.usedPx)} of {px(result.portCapacityPx)} used — {pct(result.utilisation)} of the port.
        {result.panelsPerPort > 0 && (
          <> One more panel would need {px((result.panelsPerPort + 1) * result.panelPixels)}.</>
        )}
      </p>

      <dl className="detail">
        <div>
          <dt>Port capacity</dt>
          <dd>{px(result.portCapacityPx)} at {bitDepth}-bit / {frameRateHz} Hz</dd>
        </div>
        <div>
          <dt>Cost per pixel</dt>
          <dd>
            {bits} bits
            {bits !== naive && (
              <em> — not {naive}. Power-of-two containers, which is the {pct(bits / naive - 1)} most spreadsheets miss.</em>
            )}
          </dd>
        </div>
        <div>
          <dt>Link</dt>
          <dd>{proc.portLinkGbps} Gb/s {proc.portMedium} × {proc.portCount}, {(eff * 100).toFixed(1)}% efficient</dd>
        </div>
        <div>
          <dt>Panel</dt>
          <dd>{panel.pixelsX} × {panel.pixelsY} = {int(result.panelPixels)} px</dd>
        </div>
        <div>
          <dt>Whole processor</dt>
          <dd>
            {int(result.panelsPerProcessor)} panels
            {result.processorLimitedBy === 'device-cap' && result.deviceCapacityPx !== null ? (
              <em>
                {' '}— capped at {px(result.deviceCapacityPx)}, so it fills only {portsUsedByDevice} of
                its {proc.portCount} ports
              </em>
            ) : (
              <em> — {proc.portCount} ports × {result.panelsPerPort}</em>
            )}
          </dd>
        </div>
        <div>
          <dt>Headroom</dt>
          <dd>
            {Number.isFinite(result.maxFrameRateHz)
              ? `${Math.floor(result.maxFrameRateHz)} Hz max at this load`
              : '—'}
          </dd>
        </div>
      </dl>

      {result.cardLimit && (
        <p className="flag flag--bad">
          This panel is {int(result.panelPixels)} px and its {result.cardLimit.model} receiving card
          tops out at {int(result.cardLimit.maxPixels)} px. The record is inconsistent — check the
          datasheet before trusting either figure.
        </p>
      )}

      <p className="src">{proc.source}</p>
    </section>
  );
}
