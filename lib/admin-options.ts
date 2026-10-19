/**
 * Client-safe admin option lists. These live here (not in lib/admin-data.ts)
 * because that module is `"use server"` and may only export async functions.
 */

export const PLATFORM_OPTIONS = ["mt4", "mt5", "ctrader", "dxfeed", "match_trader", "other"] as const;

export const INSTRUMENT_OPTIONS = [
  "forex",
  "indices",
  "commodities",
  "metals",
  "crypto",
  "stocks",
  "other",
] as const;
