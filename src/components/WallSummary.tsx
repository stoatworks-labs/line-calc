import type { DataLineResult } from '../domain/data-line';
import type { PowerLineResult, SupplySpec } from '../domain/power-line';
import type { Panel, Processor } from '../domain/types';
import { Stat } from './ui';
import { amps, watts, int } from '../lib/format';

/**
 * What the whole wall needs, once the per-line answers are known.
 *
 * The current here is always the PEAK figure whatever the on-screen basis, because it is
 * what the distro has to survive rather than what the wall will average.
 */
export function WallSummary({
  panel,
  panelCount,
  data,
  power,
  wall,
  proc,
  supply,
}: {
  panel: Panel;
  panelCount: number;
  data: DataLineResult;
  power: PowerLineResult;
  wall: { circuits: number; peakAmpsTotal: number; avgAmpsTotal: number; peakKw: number; avgKw: number };
  proc: Processor;
  supply: SupplySpec;
}) {
  const ports = data.panelsPerPort > 0 ? Math.ceil(panelCount / data.panelsPerPort) : 0;
  const boxes = data.panelsPerProcessor > 0 ? Math.ceil(panelCount / data.panelsPerProcessor) : 0;
  const portsShort = ports > proc.portCount * boxes;

  return (
    <section className="wall">
      <header>
        <h2>A wall of {int(panelCount)} panels</h2>
        <p>
          {int(panelCount * panel.pixelsX * panel.pixelsY)} px total,{' '}
          {(panelCount * panel.weightKg).toFixed(0)} kg of panel
        </p>
      </header>

      <div className="wall__stats">
        <Stat label="Ports needed" value={ports || '—'} note={`at ${data.panelsPerPort} per port`} tone="data" />
        <Stat
          label={`${proc.model} needed`}
          value={boxes || '—'}
          note={`${proc.portCount} ports each, ${int(data.panelsPerProcessor)} panels each`}
          tone="data"
        />
        <Stat
          label="Circuits needed"
          value={wall.circuits || '—'}
          note={`at ${power.panelsPerCircuit} per circuit`}
          tone="power"
        />
        <Stat
          label="Peak draw"
          value={watts(wall.peakKw * 1000)}
          note={
            supply.phases === 3
              ? `${amps(wall.peakAmpsTotal)} per leg across three phases`
              : `${amps(wall.peakAmpsTotal)} at ${supply.volts} V`
          }
          tone="power"
        />
        <Stat
          label="Average draw"
          value={watts(wall.avgKw * 1000)}
          note={`${amps(wall.avgAmpsTotal)} — what it will actually pull`}
          tone="plain"
        />
      </div>

      {portsShort && (
        <p className="flag flag--warn">
          {ports} ports are needed but {boxes} × {proc.model} only offers{' '}
          {proc.portCount * boxes}. The device pixel cap bites before the ports do, so the
          extra processors are there for capacity rather than for connectors.
        </p>
      )}
    </section>
  );
}
