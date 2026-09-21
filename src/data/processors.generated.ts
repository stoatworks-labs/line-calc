/*
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * 21 processors and receiving cards, snapshotted from Pixel Peeker (../pixel-peeker) on 2026-09-21 by
 * scripts/gen-panels.mjs. Every record keeps the `source` string naming the
 * manufacturer datasheet it was parsed from, and `verified: false` still means
 * "good enough to lay out a wall, not good enough to quote a job".
 *
 * To resync: npm run gen:panels
 */

import type { Processor, ReceivingCard } from '../domain/types';

export const PROCESSORS: Processor[] = [
  {
    "id": "novastar-mx40-pro",
    "manufacturer": "NovaStar",
    "model": "MX40 Pro",
    "portCount": 20,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.95,
    "packing": "container",
    "totalCapacityPx": 9000000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar MX40 Pro LED Display Controller Specifications V1.4.1, oss.novastar.tech"
  },
  {
    "id": "novastar-cx40-pro",
    "manufacturer": "NovaStar",
    "model": "CX40 Pro",
    "portCount": 6,
    "portLinkGbps": 5,
    "portMedium": "RJ45",
    "portEfficiency": 0.8499456,
    "portEfficiencyByDepth": {
      "10": 0.879863808
    },
    "packing": "container",
    "totalCapacityPx": 9000000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar CX40 Pro LED Display Controller Specifications V1.5.1, 2026-04-30, novastar.tech"
  },
  {
    "id": "novastar-mx30",
    "manufacturer": "NovaStar",
    "model": "MX30",
    "portCount": 10,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.95,
    "packing": "container",
    "totalCapacityPx": 6500000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar MX30 LED Display Controller Specifications V1.4.0, 2024-06-13, oss.novastar.tech"
  },
  {
    "id": "novastar-mx20",
    "manufacturer": "NovaStar",
    "model": "MX20",
    "portCount": 6,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.95,
    "packing": "container",
    "totalCapacityPx": 3900000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar MX20 LED Display Controller Specifications V1.4.1, 2024-08, oss.novastar.tech"
  },
  {
    "id": "novastar-ku20",
    "manufacturer": "NovaStar",
    "model": "KU20",
    "portCount": 6,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.95,
    "packing": "container",
    "totalCapacityPx": 3900000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar KU20 LED Display Controller Specifications V1.5.1, 2026-04-30, novastar.tech"
  },
  {
    "id": "novastar-mx2000-pro",
    "manufacturer": "NovaStar",
    "model": "MX2000 Pro (1G fibre)",
    "portCount": 8,
    "portLinkGbps": 10,
    "portMedium": "SFP+",
    "portEfficiency": 0.95,
    "packing": "container",
    "totalCapacityPx": 35380000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar MX2000 Pro LED Display Controller Specifications V1.1.1, 2023-10-13, oss.novastar.tech"
  },
  {
    "id": "novastar-mx2000-pro-5g",
    "manufacturer": "NovaStar",
    "model": "MX2000 Pro (5G)",
    "portCount": 2,
    "portLinkGbps": 40,
    "portMedium": "Fibre",
    "portEfficiency": 0.8499456,
    "portEfficiencyByDepth": {
      "10": 0.879863808
    },
    "packing": "container",
    "totalCapacityPx": 35380000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar MX2000 Pro LED Display Controller Specifications V1.5.1, 2026-04-30, novastar.tech"
  },
  {
    "id": "novastar-mx6000-pro",
    "manufacturer": "NovaStar",
    "model": "MX6000 Pro (1G fibre)",
    "portCount": 32,
    "portLinkGbps": 10,
    "portMedium": "SFP+",
    "portEfficiency": 0.95,
    "packing": "container",
    "totalCapacityPx": 141000000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar MX6000 Pro LED Display Controller Specifications V1.1.1, 2023-10-13, oss.novastar.tech"
  },
  {
    "id": "novastar-mx6000-pro-5g",
    "manufacturer": "NovaStar",
    "model": "MX6000 Pro (5G)",
    "portCount": 8,
    "portLinkGbps": 40,
    "portMedium": "Fibre",
    "portEfficiency": 0.8499456,
    "portEfficiencyByDepth": {
      "10": 0.879863808
    },
    "packing": "container",
    "totalCapacityPx": 141000000,
    "referenceBitDepth": 8,
    "referenceFrameRateHz": 60,
    "source": "NovaStar MX6000 Pro LED Display Controller Specifications V1.5.1, 2026-04-30, novastar.tech"
  },
  {
    "id": "novastar-mctrl4k",
    "manufacturer": "NovaStar",
    "model": "MCTRL4K",
    "portCount": 16,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.936,
    "packing": "container-legacy",
    "source": "NovaStar MCTRL4K LED Display Controller Specifications V1.2.1, 2024-08-22, oss.novastar.tech"
  },
  {
    "id": "novastar-mctrl660-pro",
    "manufacturer": "NovaStar",
    "model": "MCTRL660 PRO",
    "portCount": 6,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.936,
    "packing": "container-legacy",
    "source": "NovaStar MCTRL660 PRO Independent Controller Specifications V1.4.1, 2024-08-22, oss.novastar.tech"
  },
  {
    "id": "novastar-mctrl660",
    "manufacturer": "NovaStar",
    "model": "MCTRL660",
    "portCount": 4,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.936,
    "packing": "container-legacy",
    "source": "NovaStar MCTRL660 LED Display Controller Specifications V1.4.4, 2024-08-22, oss.novastar.tech"
  },
  {
    "id": "brompton-sx40",
    "manufacturer": "Brompton",
    "model": "Tessera SX40",
    "portCount": 4,
    "portLinkGbps": 10,
    "portMedium": "SFP+",
    "portEfficiency": 0.756,
    "packing": "naive",
    "totalCapacityPx": 9000000,
    "capacityScaling": "pixel-rate",
    "referenceFrameRateHz": 60,
    "source": "Brompton Tessera SX40 Data Sheet, Feb 2025 EN, bromptontech.com; per-port and per-processor figures from Brompton’s \"Tessera Processor Output Port Capacity\" table (dl.bromptontech.com, processor version 3.5.2)"
  },
  {
    "id": "brompton-s8",
    "manufacturer": "Brompton",
    "model": "Tessera S8",
    "portCount": 8,
    "portLinkGbps": 1,
    "portMedium": "RJ45",
    "portEfficiency": 0.756,
    "packing": "naive",
    "totalCapacityPx": 4500000,
    "capacityScaling": "pixel-rate",
    "referenceFrameRateHz": 60,
    "source": "Brompton Tessera S8 Data Sheet, Mar 2025 EN, bromptontech.com"
  },
  {
    "id": "brompton-sq200",
    "manufacturer": "Brompton",
    "model": "Tessera SQ200 (36 Mpx, with QD-S)",
    "portCount": 12,
    "portLinkGbps": 10,
    "portMedium": "SFP+",
    "portEfficiency": 0.756,
    "packing": "naive",
    "totalCapacityPx": 36000000,
    "capacityScaling": "pixel-rate",
    "referenceFrameRateHz": 60,
    "source": "Brompton Tessera SQ200 Data Sheet, Oct 2025 EN, and Tessera QD-S Data Sheet, June 2026 EN, bromptontech.com"
  }
];

export const RECEIVING_CARDS: ReceivingCard[] = [
  {
    "id": "novastar-a10s-pro",
    "manufacturer": "NovaStar",
    "model": "A10s Pro",
    "maxPixels": 262144,
    "maxWidthPx": 512,
    "maxHeightPx": 512,
    "source": "NovaStar A10s Pro Receiving Card Specifications V1.5.1, 2026-01-19, novastar.tech"
  },
  {
    "id": "novastar-a8s-pro",
    "manufacturer": "NovaStar",
    "model": "A8s Pro",
    "maxPixels": 262144,
    "maxWidthPx": 512,
    "maxHeightPx": 512,
    "source": "NovaStar A8s Pro Receiving Card Specifications V1.1.2, 2023-12-30, oss.novastar.tech"
  },
  {
    "id": "novastar-a8s",
    "manufacturer": "NovaStar",
    "model": "A8s",
    "maxPixels": 196608,
    "maxWidthPx": 512,
    "maxHeightPx": 384,
    "source": "NovaStar A8s Receiving Card Specifications V2.2.0, 2021-11-25, oss.novastar.tech"
  },
  {
    "id": "novastar-a5s-plus",
    "manufacturer": "NovaStar",
    "model": "A5s Plus",
    "maxPixels": 196608,
    "maxWidthPx": 512,
    "maxHeightPx": 384,
    "source": "NovaStar A5s Plus Receiving Card Specifications V1.1.4, 2021-12-03, oss.novastar.tech"
  },
  {
    "id": "novastar-a4s",
    "manufacturer": "NovaStar",
    "model": "A4s",
    "maxPixels": 65536,
    "maxWidthPx": 256,
    "maxHeightPx": 256,
    "source": "NovaStar A4s Receiving Card Specifications V2.1.4, 2021-08-25, oss.novastar.tech"
  },
  {
    "id": "brompton-r2",
    "manufacturer": "Brompton",
    "model": "Tessera R2",
    "maxPixels": 262144,
    "source": "Brompton Tessera R2 Data Sheet, Mar 2026 EN, bromptontech.com"
  }
];
