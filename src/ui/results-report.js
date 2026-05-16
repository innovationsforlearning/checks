export function buildReport(active, results, { total, passed, failed }) {
  const ts = new Date().toISOString();
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio}x`;
  const viewport = `${window.innerWidth}×${window.innerHeight}`;

  const lines = [];
  lines.push(failed > 0 ? 'System Check — issues found' : 'System Check — diagnostic report');
  lines.push(`Time:     ${ts}`);
  lines.push(`Score:    ${passed}/${total} passed, ${failed} failed`);
  lines.push(`Browser:  ${ua}`);
  lines.push(`Screen:   ${screen}`);
  lines.push(`Viewport: ${viewport}`);

  const failures = active.filter((t) => results[t.id]?.status === 'fail');
  if (failures.length > 0) {
    lines.push('');
    lines.push('Failed checks');
    lines.push('-------------');
    failures.forEach((t) => {
      const r = results[t.id];
      lines.push(`✕ ${t.name} — ${r.label || 'no detail'}`);
    });
  }

  const skipped = active.filter((t) => results[t.id]?.status === 'skip');
  if (skipped.length > 0) {
    lines.push('');
    lines.push('Skipped checks');
    lines.push('--------------');
    skipped.forEach((t) => {
      const r = results[t.id];
      lines.push(`— ${t.name} — ${r?.label || 'not run'}`);
    });
  }

  return lines.join('\n');
}

async function copyText(text, textarea) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (!textarea) return false;
    textarea.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

function flashCopied(button) {
  const original = button.textContent;
  button.textContent = 'Copied ✓';
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, 1800);
}

export function renderReport(active, results, totals) {
  const host = document.getElementById('results-report');
  const slot = document.getElementById('results-copy-slot');
  if (!host || !slot) return;

  const report = buildReport(active, results, totals);
  host.innerHTML = `
    <h3 class="results-report-title">Details</h3>
    <textarea class="results-report-text" id="results-report-text" readonly></textarea>`;
  slot.innerHTML = `<button class="btn btn-primary" id="results-copy" type="button">Copy to clipboard</button>`;

  const textarea = host.querySelector('#results-report-text');
  textarea.value = report;

  const button = slot.querySelector('#results-copy');
  button.addEventListener('click', async () => {
    const ok = await copyText(report, textarea);
    if (ok) flashCopied(button);
    else button.textContent = 'Press ⌘C to copy';
  });
}
