function diagIcon(state) {
  return state === 'ok' ? '✓' : state === 'warn' ? '⚠' : state === 'bad' ? '✕' : '·';
}

export function renderDiagSummary(body, { state, title, line, detailsHTML }) {
  body.innerHTML = `
    <div class="diag-summary">
      <div class="diag-summary-icon ${state}" id="diag-icon">${diagIcon(state)}</div>
      <div class="diag-summary-title" id="diag-title">${title}</div>
      <div class="diag-summary-line" id="diag-line">${line || ''}</div>
      <button class="diag-toggle" id="diag-toggle" type="button">Show details</button>
    </div>
    <div class="diag-details" id="diag-details">${detailsHTML || ''}</div>`;
  document.getElementById('diag-toggle').onclick = () => {
    const d = document.getElementById('diag-details');
    const t = document.getElementById('diag-toggle');
    const open = d.classList.toggle('open');
    t.textContent = open ? 'Hide details' : 'Show details';
  };
}

export function updateDiagSummary({ state, title, line }) {
  const icon = document.getElementById('diag-icon');
  if (icon && state) {
    icon.className = 'diag-summary-icon ' + state;
    icon.textContent = diagIcon(state);
  }
  if (title !== undefined) {
    const t = document.getElementById('diag-title');
    if (t) t.textContent = title;
  }
  if (line !== undefined) {
    const l = document.getElementById('diag-line');
    if (l) l.textContent = line;
  }
}
