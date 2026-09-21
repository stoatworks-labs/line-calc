/*
 * Line Calc — the shapes.
 *
 * A "line" here is one of two quite different things that get planned together and
 * confused constantly:
 *
 *   - a DATA line: one processor port, and the run of panels hanging off it;
 *   - a POWER line: one circuit from a distro, and the run of panels daisy-chained
 *     along it.
 *
 * They are limited by unrelated physics, they rarely come out to the same number, and
 * the wall has to satisfy both.
 */

export type BitDepth = 8 | 10 | 12;

/** How a controller packs colour components onto the wire. See `wireBitsPerPixel`. */
export type PixelPacking = 'container' | 'container-legacy' | 'naive';

export interface Panel {
  id: string;
  manufacturer: string;
  series: string;
  model: string;
  /** The pitch as the datasheet prints it. A label — geometry is derived from pixels. */
  pixelPitchMm: number;
  widthMm: number;
  heightMm: number;
  pixelsX: number;
  pixelsY: number;
  weightKg: number;
  /** Peak draw, all-white frame at full brightness. What a distro must be sized for. */
  powerMaxW: number;
  /** Typical draw on real programme material. What the wall actually pulls. */
  powerAvgW: number;
  receivingCardId?: string;
  maxRefreshHz?: number;
  /** false = good enough to lay out a wall, not good enough to quote a job. */
  verified: boolean;
  /** The manufacturer document this record was parsed from. */
  source: string;
}

export interface ReceivingCard {
  id: string;
  manufacturer: string;
  model: string;
  maxPixels: number;
  maxWidthPx?: number;
  maxHeightPx?: number;
  source: string;
}

export interface Processor {
  id: string;
  manufacturer: string;
  model: string;
  portCount: number;
  portLinkGbps: number;
  portMedium: string;
  portEfficiency?: number;
  portEfficiencyByDepth?: Partial<Record<BitDepth, number>>;
  packing?: PixelPacking;
  /** Whole-device ceiling, quoted at the reference format below. */
  totalCapacityPx?: number;
  capacityScaling?: 'bandwidth' | 'pixel-rate';
  referenceBitDepth?: BitDepth;
  referenceFrameRateHz?: number;
  source: string;
}

export interface SignalFormat {
  bitDepth: BitDepth;
  frameRateHz: number;
}

/** A panel defined by hand rather than picked from the library. */
export interface CustomPanel {
  widthMm: number;
  heightMm: number;
  pixelsX: number;
  pixelsY: number;
  powerMaxW: number;
  powerAvgW: number;
  weightKg: number;
}

export function panelPixels(p: Pick<Panel, 'pixelsX' | 'pixelsY'>): number {
  return p.pixelsX * p.pixelsY;
}
