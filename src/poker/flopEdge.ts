import type { Card } from "./cards";
import { FLOP_EQUITY } from "./flopEquity";
import { CANONICAL_FLOPS, flopIndex, FLOP_SPOTS } from "./flops";
import { decodeEquities } from "./preflop";

const tables = new Map<string, Float32Array>();

/** The raiser's precomputed equity on every canonical flop for a FLOP_SPOTS id. */
export function flopEquities(spotId: string): Float32Array {
  let table = tables.get(spotId);
  if (!table) {
    const encoded = FLOP_EQUITY[spotId];
    if (!encoded) throw new Error(`No flop equities for ${spotId}`);
    table = decodeEquities(encoded);
    tables.set(spotId, table);
  }
  return table;
}

/** The raiser's equity against the caller on this flop. */
export function raiserEquity(spotId: string, flop: Card[]): number {
  return flopEquities(spotId)[flopIndex(flop)];
}

export { CANONICAL_FLOPS, FLOP_SPOTS };
