const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Build a "YYYY-MM" key from a year and 1-indexed month. */
export function toKey(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Parse a "YYYY-MM" key into { y, m }. */
export function parseKey(key) {
  if (typeof key !== "string" || !key.trim()) {
    return { y: null, m: null };
  }

  const [y, m] = key.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    return { y: null, m: null };
  }

  return { y, m };
}

/** Add n months to a "YYYY-MM" key (n can be negative). */
export function addMonths(key, n) {
  const { y, m } = parseKey(key);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return toKey(ny, nm);
}

/** Human label for a "YYYY-MM" key, e.g. "Jun '26". */
export function monthLabel(key) {
  const { y, m } = parseKey(key);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return "—";
  }

  return `${MONTH_NAMES[m - 1]} '${String(y).slice(2)}`;
}

/** Lexicographic compare of two "YYYY-MM" keys (works since they're zero-padded). */
export function compareKeys(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Current month as a "YYYY-MM" key. */
export function currentMonthKey() {
  const d = new Date();
  return toKey(d.getFullYear(), d.getMonth() + 1);
}

/** All month keys from start to end, inclusive. Empty array if start > end. */
export function monthsBetweenInclusive(start, end) {
  if (compareKeys(start, end) > 0) return [];
  const out = [];
  let cur = start;
  let guard = 0;
  while (compareKeys(cur, end) <= 0 && guard < 600) {
    out.push(cur);
    cur = addMonths(cur, 1);
    guard++;
  }
  return out;
}
