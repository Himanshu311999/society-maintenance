import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

let pool = null;
let useMemoryStore = false;
let memoryLedger = null;

function toKey(y, m) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function parseKey(key) {
  const [y, m] = key.split("-").map(Number);
  return { y, m };
}

function addMonths(key, n) {
  const { y, m } = parseKey(key);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return toKey(ny, nm);
}

function currentMonthKey() {
  const d = new Date();
  return toKey(d.getFullYear(), d.getMonth() + 1);
}

const MONTH_NAME_MAP = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function normalizePaidUntil(val) {
  if (!val) return null;
  if (typeof val !== "string") return null;
  // Already in YYYY-MM form
  if (/^\d{4}-\d{2}$/.test(val)) return val;

  // Try parse single-month labels like "May 2026" or "May, 2026"
  const m = val.match(/([A-Za-z]+)\s*,?\s*(\d{4})/);
  if (m) {
    const name = m[1].toLowerCase();
    const year = Number(m[2]);
    const monthNum = MONTH_NAME_MAP[name];
    if (monthNum) return toKey(year, monthNum);
  }

  // If it's a range like "June 2026 – July 2026", take the last month in the range
  const rangeMatch = val.match(/([A-Za-z]+)\s*(\d{4}).*[-–—].*([A-Za-z]+)\s*(\d{4})/);
  if (rangeMatch) {
    const name = rangeMatch[3].toLowerCase();
    const year = Number(rangeMatch[4]);
    const monthNum = MONTH_NAME_MAP[name];
    if (monthNum) return toKey(year, monthNum);
  }

  return null;
}

function buildConnectionString() {
  const configuredUrl = process.env.DATABASE_URL;
  if (configuredUrl && /^postgres(ql)?:\/\//i.test(configuredUrl)) {
    return configuredUrl;
  }

  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT;
  const name = process.env.DATABASE_NAME;

  if (!user || !password || !host || !port || !name) {
    return null;
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

function createPool() {
  const connectionString = buildConnectionString();
  if (!connectionString) {
    useMemoryStore = true;
    console.warn("No PostgreSQL configuration found. Falling back to in-memory ledger storage.");
    return null;
  }

  try {
    return new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
  } catch (error) {
    useMemoryStore = true;
    console.warn("PostgreSQL pool could not be created. Falling back to in-memory ledger storage.", error.message);
    return null;
  }
}

pool = createPool();

function createFlatEntry(flatId) {
  return {
    paidUntil: null,
    credit: 0,
    payments: [],
  };
}

function getDefaultLedger() {
  const ledger = {
    settings: {
      monthlyAmount: 1500,
      startMonth: addMonths(currentMonthKey(), -6),
      currentMonth: currentMonthKey(),
    },
    flats: {},
  };

  for (let floor = 1; floor <= 7; floor += 1) {
    for (let unit = 1; unit <= 8; unit += 1) {
      const flatId = String(floor * 100 + unit);
      ledger.flats[flatId] = createFlatEntry(flatId);
    }
  }

  return ledger;
}

function ensureMemoryLedger() {
  if (!memoryLedger) {
    memoryLedger = getDefaultLedger();
  }
  return memoryLedger;
}

function getMemorySetting(key, fallback = null) {
  const ledger = ensureMemoryLedger();
  return ledger.settings[key] ?? fallback;
}

function setMemorySetting(key, value) {
  const ledger = ensureMemoryLedger();
  ledger.settings[key] = value;
}

async function query(text, params = []) {
  if (useMemoryStore || !pool) {
    return { rows: [] };
  }

  try {
    return await pool.query(text, params);
  } catch (error) {
    if (error?.message && /invalid url|ECONNREFUSED|ENOTFOUND|password authentication|does not exist/i.test(error.message)) {
      useMemoryStore = true;
      console.warn("PostgreSQL query failed. Falling back to in-memory ledger storage.", error.message);
      return { rows: [] };
    }
    throw error;
  }
}

async function getSetting(key, fallback = null) {
  if (useMemoryStore || !pool) {
    return getMemorySetting(key, fallback);
  }

  try {
    const { rows } = await query("SELECT value FROM settings WHERE key = $1", [key]);
    return rows[0]?.value ?? fallback;
  } catch (error) {
    useMemoryStore = true;
    console.warn("Falling back to in-memory settings storage.", error.message);
    return getMemorySetting(key, fallback);
  }
}

async function setSetting(key, value) {
  if (useMemoryStore || !pool) {
    setMemorySetting(key, value);
    return;
  }

  try {
    await query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, String(value)]
    );
  } catch (error) {
    useMemoryStore = true;
    console.warn("Falling back to in-memory settings storage.", error.message);
    setMemorySetting(key, value);
  }
}

async function initializeSchema() {
  if (useMemoryStore || !pool) {
    ensureMemoryLedger();
    return;
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS flats (
        flatId TEXT PRIMARY KEY,
        paidUntil TEXT,
        credit NUMERIC DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        flatId TEXT NOT NULL,
        date TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        mode TEXT NOT NULL,
        monthsCovered INTEGER NOT NULL,
        FOREIGN KEY(flatId) REFERENCES flats(flatId)
      );
    `);
  } catch (error) {
    useMemoryStore = true;
    console.warn("Falling back to in-memory ledger storage.", error.message);
    ensureMemoryLedger();
  }
}

function getDefaultStartMonth() {
  return addMonths(currentMonthKey(), -6);
}

async function ensureDefaultSettings() {
  if (useMemoryStore || !pool) {
    const ledger = ensureMemoryLedger();
    if (!ledger.settings.monthlyAmount) {
      ledger.settings.monthlyAmount = 1500;
    }
    if (!ledger.settings.currentMonth) {
      ledger.settings.currentMonth = currentMonthKey();
    }
    if (!ledger.settings.startMonth) {
      ledger.settings.startMonth = getDefaultStartMonth();
    }
    return;
  }

  const monthlyAmount = await getSetting("monthlyAmount");
  if (!monthlyAmount) {
    await setSetting("monthlyAmount", 1500);
  }

  const currentMonth = await getSetting("currentMonth");
  if (!currentMonth) {
    await setSetting("currentMonth", currentMonthKey());
  }

  const startMonth = await getSetting("startMonth");
  if (!startMonth) {
    await setSetting("startMonth", getDefaultStartMonth());
  }
}

async function ensureDefaultFlats() {
  if (useMemoryStore || !pool) {
    const ledger = ensureMemoryLedger();
    const existingIds = Object.keys(ledger.flats);
    if (existingIds.length > 0) {
      return;
    }

    const defaultLedger = getDefaultLedger();
    ledger.flats = defaultLedger.flats;
    return;
  }

  const { rows } = await query("SELECT COUNT(*) AS total FROM flats");
  if (Number(rows[0].total) > 0) return;

  const insertText = "INSERT INTO flats (flatId, paidUntil, credit) VALUES ($1, NULL, 0)";
  for (let floor = 1; floor <= 7; floor += 1) {
    for (let unit = 1; unit <= 8; unit += 1) {
      await query(insertText, [String(floor * 100 + unit)]);
    }
  }
}

async function getLedger() {
  if (useMemoryStore || !pool) {
    await initializeSchema();
    await ensureDefaultSettings();
    await ensureDefaultFlats();
    return structuredClone(ensureMemoryLedger());
  }

  await initializeSchema();
  await ensureDefaultSettings();
  await ensureDefaultFlats();

  const settings = {
    monthlyAmount: Number(await getSetting("monthlyAmount")),
    startMonth: await getSetting("startMonth"),
    currentMonth: await getSetting("currentMonth"),
  };

  const flats = {};
  const flatRows = await query("SELECT flatId, paidUntil, credit FROM flats");
  flatRows.rows.forEach((row) => {
    const rawPaid = row.paiduntil || null;
    const normalized = normalizePaidUntil(rawPaid);
    flats[row.flatid] = {
      paidUntil: normalized || null,
      credit: Number(row.credit) || 0,
      payments: [],
    };
  });

  const paymentRows = await query(
    "SELECT id, flatId, date, amount, mode, monthsCovered FROM payments ORDER BY date ASC"
  );

  paymentRows.rows.forEach((row) => {
    const flatId = row.flatid || row.flatId;
    if (!flats[flatId]) return;
    flats[flatId].payments.push({
      id: row.id,
      date: row.date,
      amount: Number(row.amount),
      mode: row.mode,
      monthsCovered: Number(row.monthscovered),
    });
  });

  return { settings, flats };
}

async function resetLedger() {
  if (useMemoryStore || !pool) {
    memoryLedger = getDefaultLedger();
    return getLedger();
  }

  await query("BEGIN");
  try {
    await query("DELETE FROM payments");
    await query("DELETE FROM flats");
    await query("DELETE FROM settings");
    await ensureDefaultSettings();
    await ensureDefaultFlats();
    await query("COMMIT");
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
  return getLedger();
}

function calculatePayment(flat, settings, amount) {
  const base = flat.paidUntil ? flat.paidUntil : addMonths(settings.startMonth, -1);
  const totalAvailable = amount + (flat.credit || 0);
  const monthsCovered = Math.floor(totalAvailable / settings.monthlyAmount);
  const newPaidUntil = flat.paidUntil
    ? addMonths(base, monthsCovered)
    : monthsCovered > 0
    ? addMonths(base, monthsCovered)
    : null;
  const remainder = Math.round((totalAvailable - monthsCovered * settings.monthlyAmount) * 100) / 100;
  return { monthsCovered, newPaidUntil, remainder };
}

async function recordPayment(flatId, amount, mode) {
  const ledger = await getLedger();
  const flat = ledger.flats[flatId];
  if (!flat) throw new Error(`Flat ${flatId} not found`);

  const { monthsCovered, newPaidUntil, remainder } = calculatePayment(flat, ledger.settings, amount);
  const payment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    amount,
    mode,
    monthsCovered,
  };

  if (useMemoryStore || !pool) {
    const memory = ensureMemoryLedger();
    flat.payments.push(payment);
    flat.paidUntil = newPaidUntil;
    flat.credit = remainder;
    return { ledger: await getLedger(), payment };
  }

  await query(
    "INSERT INTO payments (id, flatId, date, amount, mode, monthsCovered) VALUES ($1, $2, $3, $4, $5, $6)",
    [payment.id, flatId, payment.date, payment.amount, payment.mode, payment.monthsCovered]
  );

  await query("UPDATE flats SET paidUntil = $1, credit = $2 WHERE flatId = $3", [newPaidUntil, remainder, flatId]);

  return { ledger: await getLedger(), payment };
}

async function deletePayment(flatId, paymentId) {
  const ledger = await getLedger();
  const flat = ledger.flats[flatId];
  if (!flat) throw new Error(`Flat ${flatId} not found`);

  if (useMemoryStore || !pool) {
    flat.payments = flat.payments.filter((payment) => payment.id !== paymentId);
    let base = addMonths(ledger.settings.startMonth, -1);
    let credit = 0;
    flat.payments.forEach((payment) => {
      const totalAvailable = Number(payment.amount) + credit;
      const monthsCovered = Math.floor(totalAvailable / ledger.settings.monthlyAmount);
      base = addMonths(base, monthsCovered);
      credit = Math.round((totalAvailable - monthsCovered * ledger.settings.monthlyAmount) * 100) / 100;
    });

    flat.paidUntil = base === addMonths(ledger.settings.startMonth, -1) ? null : base;
    flat.credit = credit;
    return getLedger();
  }

  await query("DELETE FROM payments WHERE id = $1", [paymentId]);

  const remainingRows = await query(
    "SELECT id, date, amount, mode, monthsCovered FROM payments WHERE flatId = $1 ORDER BY date ASC",
    [flatId]
  );

  let base = addMonths(ledger.settings.startMonth, -1);
  let credit = 0;
  remainingRows.rows.forEach((p) => {
    const totalAvailable = Number(p.amount) + credit;
    const monthsCovered = Math.floor(totalAvailable / ledger.settings.monthlyAmount);
    base = addMonths(base, monthsCovered);
    credit = Math.round((totalAvailable - monthsCovered * ledger.settings.monthlyAmount) * 100) / 100;
  });

  const updatedPaidUntil = base === addMonths(ledger.settings.startMonth, -1) ? null : base;
  await query("UPDATE flats SET paidUntil = $1, credit = $2 WHERE flatId = $3", [updatedPaidUntil, credit, flatId]);

  return getLedger();
}

async function updateSettings(monthlyAmount) {
  if (useMemoryStore || !pool) {
    const ledger = ensureMemoryLedger();
    ledger.settings.monthlyAmount = monthlyAmount;
    return getLedger();
  }

  await setSetting("monthlyAmount", monthlyAmount);
  return getLedger();
}

export { getLedger, recordPayment, deletePayment, resetLedger, updateSettings };
