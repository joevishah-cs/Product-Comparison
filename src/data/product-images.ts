/**
 * Product imagery manifest.
 *
 * A product shows a real manufacturer photograph only when one has been supplied
 * for that exact model and recorded here with its origin. Anything else falls back
 * to a neutral, clearly-labelled equipment illustration — attaching the wrong
 * competitor's unit to a specification is worse than showing no photograph.
 *
 * To add photographs: drop the file in `public/products/photos/` and add an entry
 * below keyed by the catalog product id. No other code changes are required.
 */

export type ImageKind = "photograph" | "illustration";

export interface ProductImage {
  src: string;
  kind: ImageKind;
  /** Who the image belongs to, shown as an attribution line. */
  credit: string;
  /** Where it came from, so provenance can be audited like any other source. */
  origin: string;
  /** Which models the photograph legitimately represents. */
  appliesTo: string;
}

export const PRODUCT_PHOTOS: Record<string, ProductImage> = {
  "bc_dh6vs-fit-daikin": {
    src: "/products/photos/daikin-fit.png",
    kind: "photograph",
    credit: "Daikin",
    origin: "Daikin FIT product photography supplied with the project assets",
    appliesTo: "Daikin FIT side-discharge outdoor unit",
  },
  "bc_dh7vs-fit-daikin": {
    src: "/products/photos/daikin-fit.png",
    kind: "photograph",
    credit: "Daikin",
    origin: "Daikin FIT product photography supplied with the project assets",
    appliesTo: "Daikin FIT side-discharge outdoor unit",
  },
  "bc_dh9vs-fit-aurora-daikin": {
    src: "/products/photos/daikin-fit.png",
    kind: "photograph",
    credit: "Daikin",
    origin: "Daikin FIT product photography supplied with the project assets",
    appliesTo: "Daikin FIT side-discharge outdoor unit",
  },
  "bc_ids-premium-bosch": {
    src: "/products/photos/bosch-ids-premium.webp",
    kind: "photograph",
    credit: "Bosch",
    origin: "Bosch IDS Premium product photography supplied with the project assets",
    appliesTo: "Bosch IDS Premium outdoor unit",
  },
};

export function photoFor(productId: string): ProductImage | null {
  return PRODUCT_PHOTOS[productId] ?? null;
}

/** Products still awaiting manufacturer photography. */
export function hasPhoto(productId: string): boolean {
  return productId in PRODUCT_PHOTOS;
}
