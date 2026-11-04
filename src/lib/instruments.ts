export type Instrument = "NQ" | "MNQ" | "ES" | "MES" | "YM" | "MYM" | "RTY" | "M2K" | "GC" | "SI" | "CL" | "6E" | "6B";

export interface ContractSpec {
  /** Dollars per 1.0 move in price, per contract. */
  pointValue: number;
  /** Smallest price step. */
  tick: number;
  /** Decimal places prices are quoted in. */
  decimals: number;
}

// Standard CME Group contract specifications (USD).
export const CONTRACTS: Record<Instrument, ContractSpec> = {
  NQ: { pointValue: 20, tick: 0.25, decimals: 2 },
  MNQ: { pointValue: 2, tick: 0.25, decimals: 2 },
  ES: { pointValue: 50, tick: 0.25, decimals: 2 },
  MES: { pointValue: 5, tick: 0.25, decimals: 2 },
  YM: { pointValue: 5, tick: 1, decimals: 0 },
  MYM: { pointValue: 0.5, tick: 1, decimals: 0 },
  RTY: { pointValue: 50, tick: 0.1, decimals: 1 },
  M2K: { pointValue: 5, tick: 0.1, decimals: 1 },
  GC: { pointValue: 100, tick: 0.1, decimals: 1 },
  SI: { pointValue: 5000, tick: 0.005, decimals: 3 },
  CL: { pointValue: 1000, tick: 0.01, decimals: 2 },
  "6E": { pointValue: 125000, tick: 0.00005, decimals: 5 },
  "6B": { pointValue: 62500, tick: 0.0001, decimals: 4 },
};

export const INSTRUMENTS = Object.keys(CONTRACTS) as Instrument[];

/** Dollar value of one tick for one contract (e.g. NQ $5.00, 6E $6.25). */
export function tickValue(instrument: Instrument): number {
  const spec = CONTRACTS[instrument];
  return round(spec.tick * spec.pointValue, 2);
}

/** Rounds without the usual floating point drift (1.005 -> 1.01). */
export function round(value: number, decimals: number): number {
  return Number(Math.round(Number(`${value}e${decimals}`)) + `e-${decimals}`);
}
