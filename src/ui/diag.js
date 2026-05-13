function diagIcon(state) {
  return state === 'ok' ? '✓' : state === 'warn' ? '⚠' : state === 'bad' ? '✕' : '·';
}

// The summary card shows the state icon, title, and a plain-language
// description of what that state means. Per-stage technical details live in
// `detailsHTML`, revealed via the "Show details" toggle. Stages still pass a
// `line` to the summary helpers so existing call sites keep working — it's
// recorded with markResult but not surfaced on the card.
export function renderDiagSummary(body, { state, title, description, detailsHTML }) {
  body.innerHTML = `
    <div class="diag-summary">
      <div class="diag-summary-icon ${state}" id="diag-icon">${diagIcon(state)}</div>
      <div class="diag-summary-title" id="diag-title">${title}</div>
      <div class="diag-summary-description" id="diag-description">${description || ''}</div>
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

export function updateDiagSummary({ state, title, description }) {
  const icon = document.getElementById('diag-icon');
  if (icon && state) {
    icon.className = 'diag-summary-icon ' + state;
    icon.textContent = diagIcon(state);
  }
  if (title !== undefined) {
    const t = document.getElementById('diag-title');
    if (t) t.textContent = title;
  }
  if (description !== undefined) {
    const d = document.getElementById('diag-description');
    if (d) d.textContent = description;
  }
}
