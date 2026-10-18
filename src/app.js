import { PRESETS, totals, monthlyKwh, cost, validateAppliance, formatMoney, formatKwh } from './calc.js';

const STORAGE_KEY = 'home-energy-calc:v1';
const $ = (id) => document.getElementById(id);

const state = load() || { rate: 0.12, appliances: [] };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.appliances)) return saved;
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return null;
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function currentRate() {
  const r = parseFloat($('rate').value);
  return Number.isFinite(r) && r >= 0 ? r : 0;
}

function addAppliance(name, watts, hours) {
  const { watts: w, hours: h } = validateAppliance({ watts, hours });
  state.appliances.push({ id: Date.now() + Math.random(), name: name.trim() || 'Appliance', watts: w, hours: h });
  save();
  render();
}

function removeAppliance(id) {
  state.appliances = state.appliances.filter((a) => a.id !== id);
  save();
  render();
}

function render() {
  const rate = currentRate();
  const t = totals(state.appliances, rate);
  $('monthly-cost').textContent = formatMoney(t.monthlyCost);
  $('monthly-kwh').textContent = formatKwh(t.monthlyKwh);
  $('daily-cost').textContent = formatMoney(t.dailyCost);
  $('daily-kwh').textContent = formatKwh(t.dailyKwh);

  const list = $('list');
  list.replaceChildren();
  $('empty').hidden = state.appliances.length > 0;

  for (const a of state.appliances) {
    const kwh = monthlyKwh(a);
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="item-main">
        <div class="item-name"></div>
        <div class="item-meta">${a.watts} W · ${a.hours} h/day</div>
      </div>
      <div class="item-cost">${formatMoney(cost(kwh, rate))}<small>${formatKwh(kwh)}/mo</small></div>
      <button class="remove" type="button" aria-label="Remove">×</button>`;
    li.querySelector('.item-name').textContent = a.name; // user text: never via innerHTML
    li.querySelector('.remove').addEventListener('click', () => removeAppliance(a.id));
    list.append(li);
  }
}

function init() {
  $('rate').value = state.rate;
  $('rate').addEventListener('input', () => { state.rate = currentRate(); save(); render(); });

  for (const p of PRESETS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = `+ ${p.name}`;
    b.addEventListener('click', () => addAppliance(p.name, p.watts, p.hours));
    $('presets').append(b);
  }

  $('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      addAppliance($('name').value, $('watts').value, $('hours').value);
      $('add-form').reset();
      $('error').textContent = '';
    } catch (err) {
      $('error').textContent = err.message;
    }
  });

  render();
}

init();
