import { PRESETS, totals, monthlyKwh, cost, validateAppliance, formatMoney, formatKwh, costBreakdown } from './calc.js';

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

function addAppliance(name, watts, hours, quantity = 1) {
  const { watts: w, hours: h, quantity: q } = validateAppliance({ watts, hours, quantity });
  state.appliances.push({ id: Date.now() + Math.random(), name: name.trim() || 'Appliance', watts: w, hours: h, quantity: q });
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
  $('clear-all').hidden = state.appliances.length === 0;

  for (const a of state.appliances) {
    const kwh = monthlyKwh(a);
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="item-main">
        <div class="item-name"></div>
        <div class="item-meta">${a.quantity > 1 ? `${a.quantity} × ` : ''}${a.watts} W · ${a.hours} h/day</div>
      </div>
      <div class="item-cost">${formatMoney(cost(kwh, rate))}<small>${formatKwh(kwh)}/mo</small></div>
      <button class="remove" type="button" aria-label="Remove">×</button>`;
    li.querySelector('.item-name').textContent = a.name; // user text: never via innerHTML
    li.querySelector('.remove').addEventListener('click', () => removeAppliance(a.id));
    list.append(li);
  }

  renderChart(rate);
}

function renderChart(rate) {
  const chart = $('chart');
  chart.replaceChildren();
  $('chart-card').hidden = state.appliances.length === 0;

  for (const row of costBreakdown(state.appliances, rate)) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="bar-head"><span class="bar-name"></span><span class="bar-val"></span></div>
      <div class="bar-track"><div class="bar-fill"></div></div>`;
    li.querySelector('.bar-name').textContent = row.name; // user text: textContent only
    li.querySelector('.bar-val').textContent = `${formatMoney(row.monthlyCost)} · ${Math.round(row.share * 100)}%`;
    li.querySelector('.bar-fill').style.width = `${row.barPct}%`;
    chart.append(li);
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
      addAppliance($('name').value, $('watts').value, $('hours').value, $('quantity').value);
      $('add-form').reset();
      $('quantity').value = 1;
      $('error').textContent = '';
    } catch (err) {
      $('error').textContent = err.message;
    }
  });

  $('clear-all').addEventListener('click', () => {
    if (!window.confirm('Remove all appliances?')) return;
    state.appliances = [];
    save();
    render();
  });

  render();
}

init();
