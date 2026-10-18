import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dailyKwh, monthlyKwh, cost, totals, validateAppliance, formatMoney, formatKwh, PRESETS,
} from '../src/calc.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('dailyKwh converts watts and hours to kWh', () => {
  close(dailyKwh({ watts: 1000, hours: 1 }), 1);
  close(dailyKwh({ watts: 1500, hours: 6 }), 9);
  close(dailyKwh({ watts: 150, hours: 24 }), 3.6);
});

test('dailyKwh accepts numeric strings from form inputs', () => {
  close(dailyKwh({ watts: '2000', hours: '0.5' }), 1);
});

test('monthlyKwh uses 30 days by default', () => {
  close(monthlyKwh({ watts: 1000, hours: 1 }), 30);
  close(monthlyKwh({ watts: 1000, hours: 1 }, 31), 31);
});

test('zero usage costs nothing', () => {
  close(dailyKwh({ watts: 0, hours: 5 }), 0);
  close(dailyKwh({ watts: 500, hours: 0 }), 0);
});

test('cost multiplies kWh by rate', () => {
  close(cost(10, 0.12), 1.2);
  close(cost(0, 0.12), 0);
});

test('totals sums several appliances', () => {
  const t = totals([{ watts: 1000, hours: 2 }, { watts: 500, hours: 4 }], 0.1);
  close(t.dailyKwh, 4);
  close(t.monthlyKwh, 120);
  close(t.dailyCost, 0.4);
  close(t.monthlyCost, 12);
});

test('totals of an empty list is all zeros', () => {
  const t = totals([], 0.12);
  assert.deepEqual(t, { dailyKwh: 0, monthlyKwh: 0, dailyCost: 0, monthlyCost: 0 });
});

test('invalid input is rejected', () => {
  assert.throws(() => validateAppliance({ watts: -1, hours: 1 }), /Wattage/);
  assert.throws(() => validateAppliance({ watts: 'abc', hours: 1 }), /Wattage/);
  assert.throws(() => validateAppliance({ watts: 100, hours: 25 }), /Hours/);
  assert.throws(() => validateAppliance({ watts: 100, hours: -2 }), /Hours/);
  assert.throws(() => cost(5, -0.1), /Rate/);
});

test('formatting helpers', () => {
  assert.equal(formatMoney(12.345), '$12.35');
  assert.equal(formatMoney(0), '$0.00');
  assert.equal(formatKwh(3.6), '3.60 kWh');
  assert.equal(formatKwh(120), '120.0 kWh');
});

test('presets are valid appliances', () => {
  assert.ok(PRESETS.length > 0);
  for (const p of PRESETS) assert.doesNotThrow(() => validateAppliance(p), p.name);
});
