import { mountOverlay, finishOverlay } from '../ui/overlay.js';

const STAGE_TIMEOUT_MS = 30000;
const ZONES = ['tl', 'tr', 'bl', 'br', 'c'];
const LABELS = { tl: 'A', tr: 'B', bl: 'C', br: 'D', c: 'E' };
const TOTAL_HITS = ZONES.length;

/**
 * Fullscreen "hit each zone" test — 4 corners + center. Order is irrelevant.
 * Shared between the touchscreen and trackpad/mouse stages.
 *
 * @param {object} opts
 * @param {string} opts.title             Header title.
 * @param {string} opts.subtitle          Header subtitle.
 * @param {string} opts.statusPrefix      Test-area footer status text.
 * @param {string} opts.successLabel      markResult label on success.
 * @param {boolean} opts.usePointerDown   If true, listen to pointerdown (touch); otherwise click.
 * @param {object} ctx                    Stage context.
 */
export function runCorners(opts, ctx) {
  ctx.body.innerHTML =
    '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem 0;">Opening fullscreen test...</p>';

  mountOverlay(`
    <div class="fs-header">
      <div>
        <div class="fs-header-title">${opts.title}</div>
        <div class="fs-header-sub">${opts.subtitle}</div>
      </div>
      <div class="fs-status" id="fs-status">0 / ${TOTAL_HITS} complete</div>
    </div>
    <div class="fs-arena" id="fs-arena">
      ${ZONES.map(
        (z) => `<div class="fs-touch-zone" id="fs-tz-${z}">${LABELS[z]}</div>`,
      ).join('')}
    </div>
    <div class="fs-footer" id="fs-footer">
      <button class="btn btn-sm" id="fs-skip">Skip</button>
    </div>`);

  const statusEl = document.getElementById('fs-status');
  const hits = new Set();

  function complete(zone) {
    if (hits.has(zone)) return;
    hits.add(zone);
    statusEl.textContent = `${hits.size} / ${TOTAL_HITS} complete`;
    if (hits.size === TOTAL_HITS) {
      statusEl.classList.add('pass');
      statusEl.textContent = 'All complete ✓';
      ctx.markResult('pass', opts.successLabel);
      const footer = document.getElementById('fs-footer');
      footer.innerHTML = '';
      const cont = document.createElement('button');
      cont.className = 'btn btn-sm btn-primary';
      cont.textContent = 'Looks good →';
      cont.onclick = () => finishOverlay(ctx.advance);
      footer.appendChild(cont);
    }
  }

  ZONES.forEach((z) => {
    const el = document.getElementById('fs-tz-' + z);
    const onHit = (e) => {
      if (hits.has(z)) return;
      e.preventDefault();
      el.classList.add('hit');
      el.textContent = '✓';
      complete(z);
    };
    if (opts.usePointerDown) el.addEventListener('pointerdown', onHit);
    el.addEventListener('click', onHit);
  });

  document.getElementById('fs-skip').onclick = () => {
    finishOverlay(() => {
      ctx.markResult('skip', 'User skipped');
      ctx.advance();
    });
  };

  ctx.setStatus('', opts.statusPrefix);
  ctx.setButtons([]);

  const stageTimer = setTimeout(() => {
    if (hits.size < TOTAL_HITS) {
      finishOverlay(() => {
        ctx.markResult('fail', `${hits.size}/${TOTAL_HITS} zones tapped`);
        ctx.advance();
      });
    }
  }, STAGE_TIMEOUT_MS);

  ctx.addCleanup(() => {
    clearTimeout(stageTimer);
    const o = document.getElementById('fs-overlay');
    if (o) o.remove();
  });
}
