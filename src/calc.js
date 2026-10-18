// Pure calculation logic. No DOM access, so it can be unit tested in Node.

export const DAYS_PER_MONTH = 30;

export const PRESETS = [
  { name: 'Baseboard heater', watts: 1500, hours: 6 },
  { name: 'EV charger (Level 2)', watts: 7200, hours: 2 },
  { name: 'Clothes dryer', watts: 3000, hours: 1 },
  { name: 'Refrigerator', watts: 150, hours: 24 },
  { name: 'Dishwasher', watts: 1800, hours: 1 },
  { name: 'TV', watts: 100, hours: 4 },
];

function toNumber(value) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : NaN;
}

/** Throws if the appliance fields are not usable numbers. */
export function validateAppliance({ watts, hours }) {
  const w = toNumber(watts);
  const h = toNumber(hours);
  if (Number.isNaN(w) || w < 0) throw new Error('Wattage must be a number of 0 or more');
  if (Number.isNaN(h) || h < 0 || h > 24) throw new Error('Hours per day must be between 0 and 24');
  return { watts: w, hours: h };
}

/** kWh used per day by one appliance. */
export function dailyKwh(appliance) {
  const { watts, hours } = validateAppliance(appliance);
  return (watts * hours) / 1000;
}

/** kWh used per month (30 days) by one appliance. */
export function monthlyKwh(appliance, days = DAYS_PER_MONTH) {
  return dailyKwh(appliance) * days;
}

/** Cost in dollars for a number of kWh at a rate in $/kWh. */
export function cost(kwh, rate) {
  const r = toNumber(rate);
  if (Number.isNaN(r) || r < 0) throw new Error('Rate must be a number of 0 or more');
  return kwh * r;
}

/** Totals for a list of appliances. */
export function totals(appliances, rate, days = DAYS_PER_MONTH) {
  const day = appliances.reduce((sum, a) => sum + dailyKwh(a), 0);
  const month = day * days;
  return {
    dailyKwh: day,
    monthlyKwh: month,
    dailyCost: cost(day, rate),
    monthlyCost: cost(month, rate),
  };
}

export function formatMoney(value) {
  return `$${value.toFixed(2)}`;
}

export function formatKwh(value) {
  return `${value.toFixed(value < 10 ? 2 : 1)} kWh`;
}
