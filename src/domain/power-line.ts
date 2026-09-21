/*
 * How many panels one power circuit carries.
 *
 * WHY THIS IS COMPUTED RATHER THAN LOOKED UP. Almost no manufacturer publishes a
 * panels-per-circuit figure, and the ones that do publish it for their own cable and
 * their own assumptions. ROE's brochures, for instance, print "Max. Hanging (panels)"
 * and "Max. Stacking (panels)" — 12 and 5 for the Carbon series — which are MECHANICAL
 * limits about what the top panel's frame can hold, and are routinely misread as power
 * limits. They are unrelated numbers that happen to look alike.
 *
 * Absen are the exception and the calibration source: the PL V2 series user manual
 * (p.19) tabulates the quantity of cabinets one 3x2.5mm2 power cable carries, at AC220V
 * and at AC110V, for eighteen models. See `published-chains.ts` for the table and for
 * what checking it against the power figures reveals.
 *
 * THE ARITHMETIC. A panel is a resistive-ish load at unity-ish power factor, so
 *
 *     current per panel = watts / volts
 *     panels per circuit = floor( breaker amps x derating / current per panel )
 *
 * and the only real questions are which watts, which volts, and what derating.
 *
 *   WHICH WATTS. Peak (all-white at full brightness) for anything that sizes a cable or
 *   a breaker; average for estimating what the venue will actually be asked for. A
 *   distro sized on average power trips the first time someone puts up a white holding
 *   slide, which is why `powerMaxW` is the default here.
 *
 *   WHICH VOLTS. 230 V single phase (UK/EU), 120 V (US), 208 V (US three-phase
 *   line-to-line) and 400 V three-phase all appear on real jobs, and the answer roughly
 *   halves between 230 V and 120 V for the same breaker — which is exactly the factor
 *   of two in Absen's two columns.
 *
 *   WHAT DERATING. A breaker is rated for its trip current, not for a load you intend to
 *   leave on all day. The 80% rule (NEC 210.20(A) for a continuous load; BS 7671 reaches
 *   the same place by a different route) is the default here and is the number most
 *   rental power plans assume. Inrush is a separate problem and is flagged, not modelled:
 *   LED panel PSUs draw a large, brief surge at switch-on, which is why a wall is
 *   switched on in sections and why a type-B breaker that holds steady-state can still
 *   trip on power-up.
 */

import type { Panel } from './types';

export type PowerBasis = 'peak' | 'average';

export interface SupplySpec {
  id: string;
  label: string;
  volts: number;
  phases: 1 | 3;
  /** Breaker ratings that are actually fitted to distros on this supply. */
  breakers: number[];
  region: string;
}

/*
 * The supplies a wall actually gets plugged into. Voltages are nominal: BS 7671 and
 * IEC 60038 put the UK/EU single-phase nominal at 230 V (the old 240 V UK and 220 V
 * European figures were harmonised onto it with asymmetric tolerances, and distribution
 * in the UK still sits nearer 240 V in practice), and NEC-land at 120/208/240 V.
 */
export const SUPPLIES: SupplySpec[] = [
  { id: 'uk-230-1p', label: '230 V single phase', volts: 230, phases: 1, breakers: [10, 13, 16, 20, 32], region: 'UK / EU' },
  { id: 'uk-400-3p', label: '400 V three phase', volts: 230, phases: 3, breakers: [16, 32, 63, 125], region: 'UK / EU' },
  { id: 'us-120-1p', label: '120 V single phase', volts: 120, phases: 1, breakers: [15, 20, 30], region: 'US' },
  { id: 'us-208-3p', label: '208 V three phase', volts: 120, phases: 3, breakers: [20, 30, 60, 100], region: 'US' },
  { id: 'us-240-1p', label: '240 V single phase', volts: 240, phases: 1, breakers: [20, 30, 50], region: 'US' },
];

/** NEC 210.20(A): a continuous load may use 80% of the overcurrent device's rating. */
export const CONTINUOUS_LOAD_DERATE = 0.8;

export interface PowerLineInput {
  supply: SupplySpec;
  breakerAmps: number;
  /** Fraction of the breaker rating the load may use. 0.8 is the continuous-load rule. */
  derate: number;
  basis: PowerBasis;
}

export interface PowerLineResult {
  /** Panels on one circuit. For three phase this is panels per PHASE. */
  panelsPerCircuit: number;
  /** ...and across all three phases, for a three-phase distro feeding the wall evenly. */
  panelsPerSupply: number;
  wattsPerPanel: number;
  ampsPerPanel: number;
  /** The current the circuit is allowed to carry after derating. */
  usableAmps: number;
  /** What `panelsPerCircuit` panels actually draw, and the share of the breaker that is. */
  drawAmps: number;
  utilisation: number;
  /** Headroom in whole panels before the next one would exceed the derated limit. */
  spareAmps: number;
  totalWatts: number;
}

export function powerLine(
  panel: Pick<Panel, 'powerMaxW' | 'powerAvgW'>,
  input: PowerLineInput,
): PowerLineResult {
  const watts = input.basis === 'peak' ? panel.powerMaxW : panel.powerAvgW;
  if (!(watts > 0)) throw new Error('a panel that draws nothing has no power limit');

  /*
   * Three phase feeds a wall as three independent single-phase circuits, one per leg —
   * the panels are line-to-neutral loads, not line-to-line. So the per-circuit answer
   * uses the PHASE voltage (230 V of a 400 V supply, 120 V of a 208 V supply), which is
   * why `volts` above is the phase voltage and the label is the line-to-line name.
   */
  const ampsPerPanel = watts / input.supply.volts;
  const usableAmps = input.breakerAmps * input.derate;
  const panelsPerCircuit = Math.floor(usableAmps / ampsPerPanel);
  const drawAmps = panelsPerCircuit * ampsPerPanel;

  return {
    panelsPerCircuit,
    panelsPerSupply: panelsPerCircuit * input.supply.phases,
    wattsPerPanel: watts,
    ampsPerPanel,
    usableAmps,
    drawAmps,
    utilisation: usableAmps > 0 ? drawAmps / usableAmps : 0,
    spareAmps: usableAmps - drawAmps,
    totalWatts: panelsPerCircuit * watts,
  };
}

/**
 * The circuits, and the total current, a whole wall of `panelCount` panels needs.
 * This is the number to hand a production electrician, and it is the peak figure
 * whatever the on-screen basis, because that is what the distro has to survive.
 */
export function wallPower(
  panel: Pick<Panel, 'powerMaxW' | 'powerAvgW'>,
  panelCount: number,
  input: PowerLineInput,
): { circuits: number; peakAmpsTotal: number; avgAmpsTotal: number; peakKw: number; avgKw: number } {
  const per = powerLine(panel, input);
  const circuits = per.panelsPerCircuit > 0 ? Math.ceil(panelCount / per.panelsPerCircuit) : 0;
  const peakW = panel.powerMaxW * panelCount;
  const avgW = panel.powerAvgW * panelCount;
  const legs = input.supply.phases;
  return {
    circuits,
    peakAmpsTotal: peakW / input.supply.volts / legs,
    avgAmpsTotal: avgW / input.supply.volts / legs,
    peakKw: peakW / 1000,
    avgKw: avgW / 1000,
  };
}
