'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const SESSION_FILE = path.join(os.homedir(), '.genesis', 'session.json');
const DEFAULT_BUDGET = 500_000;

// Thresholds (% of budget) for escalating alerts
const THRESHOLDS = [
  { pct: 80, icon: '🟡', label: 'AVISO' },
  { pct: 90, icon: '🔴', label: 'ALERTA' },
  { pct: 95, icon: '⛔', label: 'CRITICO' },
];

let _session = null;
let _lastAlertPct = 0;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadSession() {
  if (_session) return _session;

  if (fs.existsSync(SESSION_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      if (data.date === today()) {
        _session = data;
        return _session;
      }
    } catch { /* stale or corrupt — start fresh */ }
  }

  _session = {
    date: today(),
    budget: DEFAULT_BUDGET,
    totals: {},
    calls: [],
  };
  return _session;
}

function saveSession() {
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
  fs.writeFileSync(SESSION_FILE, JSON.stringify(_session, null, 2));
}

function track(provider, model, tokens, label = '') {
  const s = loadSession();
  const key = `${provider}/${model}`;

  s.totals[key] = s.totals[key] || { input: 0, output: 0, cache_read: 0, cache_write: 0, calls: 0 };
  s.totals[key].input += tokens.input || 0;
  s.totals[key].output += tokens.output || 0;
  s.totals[key].cache_read += tokens.cache_read || 0;
  s.totals[key].cache_write += tokens.cache_write || 0;
  s.totals[key].calls += 1;

  s.calls.push({
    t: new Date().toISOString(),
    provider,
    model,
    tokens,
    label,
  });

  saveSession();
  checkBudget(s);
}

function checkBudget(s) {
  const used = totalUsed(s);
  const pct = Math.round((used / s.budget) * 100);

  // Only alert when crossing a new threshold (avoid spamming)
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    const t = THRESHOLDS[i];
    if (pct >= t.pct && _lastAlertPct < t.pct) {
      process.stderr.write(
        `\n${t.icon} ${t.label}: ${pct}% do budget de tokens usado` +
        ` (${used.toLocaleString()} / ${s.budget.toLocaleString()})\n`,
      );
      _lastAlertPct = t.pct;
      break;
    }
  }
}

function totalUsed(s) {
  s = s || loadSession();
  return Object.values(s.totals).reduce((sum, t) => sum + t.input + t.output, 0);
}

function setBudget(n) {
  const s = loadSession();
  s.budget = n;
  saveSession();
}

function summary() {
  const s = loadSession();
  const used = totalUsed(s);
  const pct = Math.round((used / s.budget) * 100);
  const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '░');

  const lines = [
    `\nTokens — ${s.date}`,
    `Budget  : ${s.budget.toLocaleString()}`,
    `Usado   : ${used.toLocaleString()} (${pct}%)  [${bar}]`,
    '',
    'Por modelo:',
  ];

  for (const [key, t] of Object.entries(s.totals)) {
    const total = t.input + t.output;
    const cache = t.cache_read > 0 ? ` | cache_read: ${t.cache_read.toLocaleString()}` : '';
    lines.push(`  ${key.padEnd(40)} ${total.toLocaleString().padStart(8)} tok  (${t.calls} calls)${cache}`);
  }

  if (s.calls.length > 0) {
    const last = s.calls[s.calls.length - 1];
    lines.push(`\nUltima chamada: ${last.label || last.model}  ${new Date(last.t).toLocaleTimeString()}`);
  }

  return lines.join('\n');
}

function reset() {
  _session = null;
  _lastAlertPct = 0;
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
}

module.exports = { track, summary, setBudget, totalUsed: () => totalUsed(), reset };
