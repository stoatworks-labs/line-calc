import { describe, it, expect } from 'vitest';
import { portCapacityPx, wireBitsPerPixel, dataLine, deviceCapacityPx } from './data-line';
import { PROCESSORS, RECEIVING_CARDS } from '../data/processors.generated';
import { PANELS } from '../data/panels.generated';
import type { Processor } from './types';

const byId = (id: string): Processor => {
  const p = PROCESSORS.find((x) => x.id === id);
  if (!p) throw new Error(`no processor ${id}`);
  return p;
};

/*
 * THE CALIBRATION. NovaStar publish three per-port figures for the MX40 Pro. If these
 * three stop reproducing, the capacity model has drifted and every number the tool
 * prints is wrong — so they are the first thing in the suite, not the last.
 */
describe('NovaStar MX40 Pro published per-port capacity', () => {
  const mx40 = byId('novastar-mx40-pro');

  it.each([
    [8 as const, 659_722],
    [10 as const, 494_791],
    [12 as const, 329_861],
  ])('reproduces %i-bit / 60 Hz to the pixel: %i px', (bitDepth, published) => {
    expect(portCapacityPx(mx40, { bitDepth, frameRateHz: 60 })).toBe(published);
  });

  it('gives the published ratios 1.00 / 0.75 / 0.50, which naive packing cannot', () => {
    const at = (bitDepth: 8 | 10 | 12) => portCapacityPx(mx40, { bitDepth, frameRateHz: 60 });
    expect(at(10) / at(8)).toBeCloseTo(0.75, 4);
    expect(at(12) / at(8)).toBeCloseTo(0.5, 4);
  });
});

describe('wire cost per pixel', () => {
  it('uses power-of-two containers, not 3 x depth', () => {
    expect(wireBitsPerPixel(8)).toBe(24);
    expect(wireBitsPerPixel(10)).toBe(32);
    expect(wireBitsPerPixel(12)).toBe(48);
  });

  it('is what makes the naive formula overstate 10-bit by about 7%', () => {
    const overstatement = wireBitsPerPixel(10) / (3 * 10) - 1;
    expect(overstatement).toBeGreaterThan(0.06);
    expect(overstatement).toBeLessThan(0.07);
  });
});

describe('device ceilings scale by their own rule', () => {
  it('a NovaStar bandwidth figure halves from 8-bit to 12-bit', () => {
    const mx40 = byId('novastar-mx40-pro');
    const at8 = deviceCapacityPx(mx40, { bitDepth: 8, frameRateHz: 60 })!;
    const at12 = deviceCapacityPx(mx40, { bitDepth: 12, frameRateHz: 60 })!;
    expect(at8).toBe(9_000_000);
    expect(at12 / at8).toBeCloseTo(0.5, 4);
  });

  it("a Brompton pixel-rate figure does not move with bit depth", () => {
    const sx40 = byId('brompton-sx40');
    const at8 = deviceCapacityPx(sx40, { bitDepth: 8, frameRateHz: 60 })!;
    const at12 = deviceCapacityPx(sx40, { bitDepth: 12, frameRateHz: 60 })!;
    expect(at8).toBe(9_000_000);
    expect(at12).toBe(at8);
  });

  it('...but a Brompton pixel-rate figure does move with frame rate', () => {
    const sx40 = byId('brompton-sx40');
    expect(deviceCapacityPx(sx40, { bitDepth: 8, frameRateHz: 120 })).toBe(4_500_000);
  });
});

describe('panels on one port', () => {
  const mx40 = byId('novastar-mx40-pro');
  /* A 500x500 200x200px panel — the commonest rental tile in the library. */
  const panel = { pixelsX: 200, pixelsY: 200 };

  it('divides the port by the panel and rounds DOWN', () => {
    const r = dataLine(panel, mx40, { bitDepth: 8, frameRateHz: 60 }, RECEIVING_CARDS);
    /* 659,722 / 40,000 = 16.49 -> 16 panels, not 17. */
    expect(r.panelsPerPort).toBe(16);
    expect(r.portLimitedBy).toBe('port-bandwidth');
  });

  it('reports the device cap when the box runs out before its ports do', () => {
    const r = dataLine(panel, mx40, { bitDepth: 8, frameRateHz: 60 }, RECEIVING_CARDS);
    /* 20 ports x 16 panels = 320 panels = 12.8 Mpx, over the MX40 Pro's 9 Mpx box. */
    expect(r.processorLimitedBy).toBe('device-cap');
    expect(r.panelsPerProcessor).toBe(225);
    expect(r.panelsPerProcessor).toBeLessThan(r.panelsPerPort * mx40.portCount);
  });

  it('carries fewer panels at 12-bit than at 8-bit', () => {
    const at8 = dataLine(panel, mx40, { bitDepth: 8, frameRateHz: 60 }, RECEIVING_CARDS);
    const at12 = dataLine(panel, mx40, { bitDepth: 12, frameRateHz: 60 }, RECEIVING_CARDS);
    expect(at12.panelsPerPort).toBeLessThan(at8.panelsPerPort);
    expect(at12.panelsPerPort).toBe(8);
  });

  it('halves the panels when the frame rate doubles', () => {
    const at60 = dataLine(panel, mx40, { bitDepth: 8, frameRateHz: 60 }, RECEIVING_CARDS);
    const at120 = dataLine(panel, mx40, { bitDepth: 8, frameRateHz: 120 }, RECEIVING_CARDS);
    expect(at120.panelsPerPort).toBe(Math.floor(at60.panelsPerPort / 2));
  });

  it('never claims a fractional panel fits', () => {
    for (const proc of PROCESSORS) {
      const r = dataLine(panel, proc, { bitDepth: 8, frameRateHz: 60 }, RECEIVING_CARDS);
      expect(Number.isInteger(r.panelsPerPort)).toBe(true);
      expect(r.usedPx).toBeLessThanOrEqual(r.portCapacityPx);
    }
  });
});

describe('the library is internally consistent', () => {
  it('every panel fits on at least one port of at least one processor at 8-bit/60', () => {
    for (const panel of PANELS) {
      const best = Math.max(
        ...PROCESSORS.map((p) => dataLine(panel, p, { bitDepth: 8, frameRateHz: 60 }, RECEIVING_CARDS).panelsPerPort),
      );
      expect(best, `${panel.id} does not fit any port`).toBeGreaterThan(0);
    }
  });

  it('every panel names a receiving card that exists, or none at all', () => {
    const ids = new Set(RECEIVING_CARDS.map((c) => c.id));
    for (const panel of PANELS) {
      if (panel.receivingCardId) expect(ids.has(panel.receivingCardId), `${panel.id}`).toBe(true);
    }
  });
});
