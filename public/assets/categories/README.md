# Category tile illustrations

Drop one image per top-level category here. The landing page's "Shop by Category" tiles load them by file name
(see `CategoryTiles.tsx`). A missing file falls back to a real product photo from that category.

| File               | Category                                   |
| ------------------ | ------------------------------------------ |
| `drugs.png`        | Drugs                                      |
| `consumables.png`  | Consumable Medical Devices & Equipment     |
| `equipment.png`    | Non-Consumable Medical Devices & Equipment |
| `cosmetics.png`    | Cosmetic & Personal Use                    |
| `supplements.png`  | Supplements / Nutraceuticals               |

Recommended: square PNG or WebP with a transparent background, about 240x240 px, same illustration style for all
(for example soft 3D renders), subject centred with a little padding. Use only images you own or are licensed to use.
New categories: add a file and a matching entry to `ILLUSTRATIONS` in `CategoryTiles.tsx`.
