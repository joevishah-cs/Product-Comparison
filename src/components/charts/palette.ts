import type { Product } from "@/data/types";

/** Daikin blue for Daikin, distinct neutral tones for competitors. Status is never
 *  carried by colour alone -- every chart also labels values and marks Daikin rows. */
export const DAIKIN_FILL = "#0097e0";
export const DAIKIN_FILL_ALT = "#0b557b";
export const DAIKIN_LIGHT = "#59bcff";

const COMPETITOR_FILLS = [
  "#94a3b8",
  "#64748b",
  "#a8b6c6",
  "#475569",
  "#b8c4d2",
  "#7c8b9d",
  "#cbd5e1",
  "#334155",
];

export const AXIS_COLOR = "#274060";
export const GRID_COLOR = "#e4ecf4";

/** Assigns a stable colour per product across every chart in a comparison. */
export function buildColorMap(products: Product[]): Record<string, string> {
  const map: Record<string, string> = {};
  let daikinIdx = 0;
  let compIdx = 0;
  for (const p of products) {
    if (p.isDaikin) {
      map[p.id] = [DAIKIN_FILL, DAIKIN_FILL_ALT, DAIKIN_LIGHT][daikinIdx % 3];
      daikinIdx += 1;
    } else {
      map[p.id] = COMPETITOR_FILLS[compIdx % COMPETITOR_FILLS.length];
      compIdx += 1;
    }
  }
  return map;
}

/** Short axis label that stays legible when projected. */
export function shortLabel(product: Product): string {
  const model = product.model.length > 16 ? `${product.model.slice(0, 15)}…` : product.model;
  return product.isDaikin ? `${model} ★` : model;
}
