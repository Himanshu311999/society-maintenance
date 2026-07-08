import { FLOORS, UNITS_PER_FLOOR } from "../constants";
import { addMonths, currentMonthKey, compareKeys, monthsBetweenInclusive } from "./dateUtils";

/** Flat number for a given floor (1-7) and unit (1-8), e.g. floor 3, unit 4 -> "304". */
export function flatId(floor, unit) {
  return String(floor * 100 + unit);
}

/** Fresh ledger: 56 flats, no payments, ledger starting 6 months before today. */
export function makeDefaultData() {
  const currentMonth = currentMonthKey();
  const start = addMonths(currentMonth, -6);
  const flats = {};
  for (let f = 1; f <= FLOORS; f++) {
    for (let u = 1; u <= UNITS_PER_FLOOR; u++) {
      flats[flatId(f, u)] = { paidUntil: null, credit: 0, payments: [] };
    }
  }
  return { settings: { monthlyAmount: 1500, startMonth: start, currentMonth }, flats };
}

/** List of month keys still owed by a flat, given the ledger's start month and the current month. */
export function pendingMonthsFor(flat, startMonth, curMonth) {
  if (!flat) return [];
  const from = flat.paidUntil ? addMonths(flat.paidUntil, 1) : startMonth;
  return monthsBetweenInclusive(from, curMonth);
}

/** "clear" | "advance" | "due" | "overdue" | "nodata" — used to color the facade & status text. */
export function flatStatus(flat, startMonth, curMonth) {
  if (!flat) return "nodata";
  const pending = pendingMonthsFor(flat, startMonth, curMonth);
  if (pending.length === 0) {
    if (flat.paidUntil && compareKeys(flat.paidUntil, curMonth) > 0) return "advance";
    return "clear";
  }
  if (pending.length <= 2) return "due";
  return "overdue";
}
