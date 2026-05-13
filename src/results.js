import { showScreen } from './ui/screens.js';

const ICONS = { pass: '✓', fail: '✕', skip: '—' };
const BADGES = { pass: 'badge-pass', fail: 'badge-fail', skip: 'badge-skip' };
const BADGE_TEXT = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };

export function showResults(tests, results) {
  showScreen('results');

  const active = tests;
  const total = active.length;
  const passed = active.filter((t) => results[t.id]?.status === 'pass').length;
  const failed = active.filter((t) => results[t.id]?.status === 'fail').length;

  const scoreEl = document.getElementById('results-score');
  scoreEl.textContent = `${passed}/${total}`;
  scoreEl.className = 'results-score ' + (failed === 0 ? 'all-pass' : 'has-fail');

  const tagEl = document.getElementById('results-tagline');
  tagEl.textContent =
    failed === 0
      ? 'All checks passed — your device is ready.'
      : `${failed} issue${failed > 1 ? 's' : ''} found. A tech support team member can help.`;

  const list = document.getElementById('results-list');
  list.innerHTML = '';
  active.forEach((t) => {
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
