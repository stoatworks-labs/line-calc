/*
 * How many panels one processor port carries.
 *
 * THE ONE THING MOST SPREADSHEETS GET WRONG. The obvious formula is
 *
 *     pixels per port = link rate x efficiency / (3 x bit depth) / frame rate
 *
 * and it is right at 8-bit and wrong at 10 and 12 — in the direction that gets you
 * into trouble, because it OVERSTATES capacity by about 7% at 10-bit. Controllers pack
 * pixels into a power-of-two container so the DMA engine stays word-aligned, so the
 * real cost per pixel on the wire is:
 *
 *     depth    naive (3 x depth)    actual container
 *     8-bit    24 bits              24 bits
 *     10-bit   30 bits              32 bits
 *     12-bit   36 bits              48 bits
 *
 * NovaStar's published MX40 Pro per-port figures pin this down exactly. They print
 * 659,722 / 494,791 / 329,861 px at 8 / 10 / 12-bit, 60 Hz — ratios of exactly
 * 1.00 / 0.75 / 0.50, which are 24/24, 24/32 and 24/48. With those containers a single
 * link efficiency of 0.95 reproduces all three to the pixel; with naive packing no
 * single constant fits. `data-line.test.ts` pins the three figures: if they fail, the
 * model has drifted and every number this tool prints is suspect.
 *
 * Derived from Pixel Peeker's capacity model, which was calibrated against NovaStar's
 * V1.5.1 specification and Brompton's published per-port capacity table.
 *
 * THE SECOND THING. LED refresh rate — the 3840 Hz or 7680 Hz on the datasheet — does
 * NOT consume link bandwidth. The frame crosses the wire once per video frame; the
 * panel's driver ICs then re-scan it from local memory as many times as they like.
 * Refresh is a panel-side property. Frame RATE is the one that costs bandwidth.
 */

import type { BitDepth, PixelPacking, Panel, Processor, ReceivingCard, SignalFormat } from './types';
import { panelPixels } from './types';

/** Calibrated against NovaStar's three published MX40 Pro per-port figures. */
export const DEFAULT_LINK_EFFICIENCY = 0.95;

/**
 * Bits on the wire per pixel.
 *
 * `container`   — each component in a power-of-two container: 8->8, 10->16 halved to
 *                 a 32-bit triple, 12->16. This is what modern NovaStar and Brompton do.
 * `naive`       — 3 x depth, what the spreadsheets assume. Kept because a few older
 *                 controllers genuinely behave this way.
 */
export function wireBitsPerPixel(depth: BitDepth, packing: PixelPacking = 'container'): number {
  if (packing === 'naive') return 3 * depth;
  if (packing === 'container-legacy') return depth === 8 ? 24 : 48;
  switch (depth) {
    case 8: return 24;
    case 10: return 32;
    case 12: return 48;
  }
}

export function portEfficiency(proc: Processor, depth: BitDepth): number {
  return proc.portEfficiencyByDepth?.[depth] ?? proc.portEfficiency ?? DEFAULT_LINK_EFFICIENCY;
}

/** Pixels one port of `proc` carries at `signal`. */
export function portCapacityPx(proc: Processor, signal: SignalFormat): number {
  const bits = wireBitsPerPixel(signal.bitDepth, proc.packing);
  const usable = proc.portLinkGbps * 1e9 * portEfficiency(proc, signal.bitDepth);
  return Math.floor(usable / bits / signal.frameRateHz);
}

/**
 * The whole-device ceiling at `signal`, or null when the ports are the only limit.
 *
 * `bandwidth` figures are quoted at a reference format and scale with both wire cost
 * and frame rate. `pixel-rate` figures are a processing limit: the same at every bit
 * depth, flat up to the reference frame rate and proportional to 1/frameRate above it.
 * Brompton publish the second shape and NovaStar the first; treating one as the other
 * misstates the box by up to 2x.
 */
export function deviceCapacityPx(proc: Processor, signal: SignalFormat): number | null {
  if (!proc.totalCapacityPx) return null;
  const refDepth = proc.referenceBitDepth ?? 8;
  const refRate = proc.referenceFrameRateHz ?? 60;
  if ((proc.capacityScaling ?? 'bandwidth') === 'pixel-rate') {
    return Math.floor(proc.totalCapacityPx * Math.min(1, refRate / signal.frameRateHz));
  }
  const wireRatio = wireBitsPerPixel(refDepth, proc.packing) / wireBitsPerPixel(signal.bitDepth, proc.packing);
  return Math.floor(proc.totalCapacityPx * wireRatio * (refRate / signal.frameRateHz));
}

export type PortLimit = 'port-bandwidth' | 'receiving-card';
export type ProcessorLimit = PortLimit | 'device-cap';

export interface DataLineResult {
  /** Panels one port carries. */
  panelsPerPort: number;
  /**
   * What bound the PORT. Kept separate from `processorLimitedBy` because they answer
   * different questions and routinely disagree: an MX40 Pro port runs out of bandwidth
   * at 16 of a 200x200 tile, but the box runs out of backplane at 225 rather than the
   * 320 its twenty ports could carry. Answering "what is the limit?" with one field
   * forces a choice between two true answers.
   */
  portLimitedBy: PortLimit;
  /** ...and what bound the whole box. */
  processorLimitedBy: ProcessorLimit;
  portCapacityPx: number;
  panelPixels: number;
  /** Pixels actually used by `panelsPerPort` panels, and the share of the port that is. */
  usedPx: number;
  utilisation: number;
  /** Panels the whole box carries, once its own ceiling is applied. */
  panelsPerProcessor: number;
  /** Ports needed before the device ceiling bites, or null if it never does. */
  deviceCapacityPx: number | null;
  /** Highest frame rate this port sustains with `panelsPerPort` on it. */
  maxFrameRateHz: number;
  /** Set when the receiving card, not the link, is the binding constraint. */
  cardLimit?: { model: string; maxPixels: number };
}

export function dataLine(
  panel: Pick<Panel, 'pixelsX' | 'pixelsY' | 'receivingCardId'>,
  proc: Processor,
  signal: SignalFormat,
  cards: ReceivingCard[] = [],
): DataLineResult {
  const px = panelPixels(panel);
  if (px <= 0) throw new Error('a panel with no pixels has no capacity');

  const portPx = portCapacityPx(proc, signal);
  let panels = Math.floor(portPx / px);
  let portLimitedBy: PortLimit = 'port-bandwidth';

  /* A receiving card caps the pixels behind ONE card, which is one panel here, so it
     cannot reduce the panels per port — but it can mean the panel is undrivable at
     all, which is worth saying rather than silently returning a number. */
  const card = panel.receivingCardId ? cards.find((c) => c.id === panel.receivingCardId) : undefined;
  const cardLimit = card && px > card.maxPixels ? { model: card.model, maxPixels: card.maxPixels } : undefined;
  if (cardLimit) {
    panels = 0;
    portLimitedBy = 'receiving-card';
  }

  const device = deviceCapacityPx(proc, signal);
  const portsWorth = panels * proc.portCount;
  let perProcessor = portsWorth;
  let processorLimitedBy: ProcessorLimit = portLimitedBy;
  if (device !== null) {
    const byDevice = Math.floor(device / px);
    if (byDevice < portsWorth) {
      perProcessor = byDevice;
      processorLimitedBy = 'device-cap';
    }
  }

  const used = panels * px;
  const bits = wireBitsPerPixel(signal.bitDepth, proc.packing);
  const maxRate = used > 0
    ? (proc.portLinkGbps * 1e9 * portEfficiency(proc, signal.bitDepth)) / bits / used
    : Infinity;

  return {
    panelsPerPort: panels,
    portLimitedBy,
    processorLimitedBy,
    portCapacityPx: portPx,
    panelPixels: px,
    usedPx: used,
    utilisation: portPx > 0 ? used / portPx : 0,
    panelsPerProcessor: perProcessor,
    deviceCapacityPx: device,
    maxFrameRateHz: maxRate,
    ...(cardLimit ? { cardLimit } : {}),
  };
}
