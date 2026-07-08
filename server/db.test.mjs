import test from 'node:test';
import assert from 'node:assert/strict';
import { getLedger } from './db.js';

test('getLedger returns a working ledger even without a configured database', async () => {
  const ledger = await getLedger();

  assert.ok(ledger.settings);
  assert.ok(ledger.flats);
  assert.ok(typeof ledger.settings.monthlyAmount === 'number');
  assert.ok(Object.keys(ledger.flats).length > 0);
});
