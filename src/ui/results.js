import { showScreen } from './screens.js';
import { renderReport } from './results-report.js';

const ICONS = { pass: '✓', fail: '✕', skip: '—' };
const BADGES = { pass: 'badge-pass', fail: 'badge-fail', skip: 'badge-skip' };
const BADGE_TEXT = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };

export function showResults(tests, results) {
  showScreen('results');

  const totals = computeTotals(tests, results);
  renderScore(totals);
  renderTagline(totals);
  renderList(tests, results);
  renderReport(tests, results, totals);
}

function computeTotals(tests, results) {
  const total = tests.length;
  const passed = tests.filter((t) => results[t.id]?.status === 'pass').length;
  const failed = tests.filter((t) => results[t.id]?.status === 'fail').length;
  return { total, passed, failed };
}

function renderScore({ total, passed, failed }) {
  const el = document.getElementById('results-score');
  el.textContent = `${passed}/${total}`;
  el.className = 'results-score ' + (failed === 0 ? 'all-pass' : 'has-fail');
}

function renderTagline({ failed }) {
  const el = document.getElementById('results-tagline');
  el.textContent =
    failed === 0
      ? 'All checks passed — your device is ready.'
      : `${failed} issue${failed > 1 ? 's' : ''} found. A tech support team member can help.`;
}

function renderList(tests, results) {
  const list = document.getElementById('results-list');
  list.innerHTML = '';
  tests.forEach((t) => {
    const r = results[t.id] || { status: 'skip', label: 'Not run' };
    const row = document.createElement('div');
    row.className = 'result-row';
    const color =
      r.status === 'pass' ? 'var(--green)' : r.status === 'fail' ? 'var(--red)' : 'var(--amber)';
    row.innerHTML = `
      <span class="result-icon" style="color:${color}">${ICONS[r.status]}</span>
      <span class="result-name">${t.icon} ${t.name}</span>
      <span class="result-badge ${BADGES[r.status]}">${BADGE_TEXT[r.status]}</span>`;
    list.appendChild(row);
  });
}
