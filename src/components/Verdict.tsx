import type { DataLineResult } from '../domain/data-line';
import type { PowerLineResult, SupplySpec } from '../domain/power-line';
import type { Panel, Processor } from '../domain/types';
import { mm, plural } from '../lib/format';

/**
 * The answer to the question actually being asked.
 *
 * A run of panels has to satisfy BOTH lines, so the number you can build is the smaller
 * of the two — and which one it is flips with the panel, the bit depth and the country.
 * Showing the two cards without saying which binds leaves the user to do the one bit of
 * reasoning the tool exists for.
 */
export function Verdict({
  panel,
  data,
  power,
  proc,
  supply,
  breaker,
}: {
  panel: Panel;
  data: DataLineResult;
  power: PowerLineResult;
  proc: Processor;
  supply: SupplySpec;
  breaker: number;
}) {
  const d = data.panelsPerPort;
  const p = power.panelsPerCircuit;
  const run = Math.min(d, p);
  const bindsOnData = d < p;
  const equal = d === p;

  if (run <= 0) {
    return (
      <section className="verdict verdict--bad">
        <h2>Nothing fits</h2>
        <p>
          {d <= 0
            ? `A ${proc.model} port cannot carry even one of these panels at this format.`
            : `One panel draws more than a ${breaker} A circuit on ${supply.label} allows.`}
        </p>
      </section>
    );
  }

  const widthMm = run * panel.widthMm;

  return (
    <section className={`verdict verdict--${equal ? 'even' : bindsOnData ? 'data' : 'power'}`}>
      <p className="verdict__eyebrow">A single line of this panel</p>
      <h2>
        <strong>{run}</strong> panels
        <span className="verdict__sub">
          {' '}— {mm(widthMm)} in a row, or {mm(run * panel.heightMm)} in a column
        </span>
      </h2>
      <p className="verdict__why">
        {equal ? (
          <>
            Both lines land on {run}: the port and the circuit run out together, which is a
            coincidence of this panel, this processor and this breaker rather than a design.
          </>
        ) : bindsOnData ? (
          <>
            <b>Data binds.</b> The port stops at {d} while the {breaker} A circuit would carry {p}.
            You have {plural(p - d, 'panel')} of spare power on this circuit — worth knowing before
            someone adds a distro that was never the problem.
          </>
        ) : (
          <>
            <b>Power binds.</b> The circuit stops at {p} while the port would carry {d}. Another{' '}
            {plural(d - p, 'panel')} of link capacity is sitting unused, so the fix is another
            circuit, not another port.
          </>
        )}
      </p>
    </section>
  );
}
