import assert from 'node:assert/strict';

import {
  addDaysWita,
  dateRangeEndingAt,
  endOfDayWita,
  monthRange,
  startOfDayWita,
} from '../src/lib/wita.js';

// Batas hari WITA (UTC+8)
assert.equal(startOfDayWita('2026-11-15').toISOString(), '2026-11-14T16:00:00.000Z');
assert.equal(endOfDayWita('2026-11-15').toISOString(), '2026-11-15T15:59:59.999Z');

// Rentang bulan mengikuti batas kalender
assert.deepEqual(monthRange('2026-11-15'), { from: '2026-11-01', to: '2026-11-30' });
assert.deepEqual(monthRange('2026-02-10'), { from: '2026-02-01', to: '2026-02-28' });
assert.deepEqual(monthRange('2028-02-10'), { from: '2028-02-01', to: '2028-02-29' });

// Tren 30 hari berakhir pada hari ini
const trend = dateRangeEndingAt('2026-11-15', 30);
assert.equal(trend.length, 30);
assert.equal(trend[0], '2026-10-17');
assert.equal(trend.at(-1), '2026-11-15');
assert.equal(trend.at(-7), addDaysWita('2026-11-15', -6));

// Pergantian bulan dan tahun
assert.equal(addDaysWita('2026-12-31', 1), '2027-01-01');
assert.equal(addDaysWita('2026-03-01', -1), '2026-02-28');

console.log('dashboard rules: OK');
