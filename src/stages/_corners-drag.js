import { mountOverlay, finishOverlay } from '../ui/overlay.js';

const STAGE_TIMEOUT_MS = 30000;
const TOTAL_HITS = 5; // 4 corners + 1 drag

function dropCenter(drop) {
  const r = drop.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius: r.width / 2 };
}

function isOverDrop(drop, x, y) {
  const c = dropCenter(drop);
  return Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2) < c.radius;
}

/**
 * Renders a fullscreen 4-corner + drag-to-drop test.
 * Used by both the touchscreen and trackpad/mouse stages.
 *
 * @param {object} opts
 * @param {string} opts.title             Header title.
 * @param {string} opts.subtitle          Header subtitle.
 * @param {string} opts.statusPrefix      Test-area footer status text.
 * @param {string} opts.tooltipText       Drag tooltip text.
 * @param {string} opts.successLabel      markResult label on success.
 * @param {string} opts.failPrefix        Used in fail label: `${prefix} ${hits}/${total} ...`.
 * @param {boolean} opts.usePointerCornerDown  If true, listen to pointerdown on corners (for touch).
 * @param {object} ctx                    Stage context.
 */
export function runCornersAndDrag(opts, ctx) {
  ctx.body.innerHTML =
    '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem 0;">Opening fullscreen test...</p>';

  const overlay = mountOverlay(`
    <div class="fs-header">
      <div>
        <div class="fs-header-title">${opts.title}</div>
        <div class="fs-header-sub">${opts.subtitle}</div>
      </div>
      <div class="fs-status" id="fs-status">0 / ${TOTAL_HITS} complete</div>
    </div>
    <div class="fs-arena" id="fs-arena">
      <div class="fs-touch-zone" id="fs-tz-tl">↖</div>
      <div class="fs-touch-zone" id="fs-tz-tr">↗</div>
      <div class="fs-touch-zone" id="fs-tz-bl">↙</div>
      <div class="fs-touch-zone" id="fs-tz-br">↘</div>
      <div class="fs-drag-drop" id="fs-drop">drop here</div>
      <div class="fs-drag-source" id="fs-source">
        <div class="fs-drag-tooltip" id="fs-tooltip">${opts.tooltipText}</div>
        <span>⊙</span>
      </div>
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

  ['tl', 'tr', 'bl', 'br'].forEach((z) => {
    const el = document.getElementById('fs-tz-' + z);
    const onHit = (e) => {
      if (hits.has(z)) return;
      e.preventDefault();
      el.classList.add('hit');
      el.textContent = '✓';
      complete(z);
    };
    if (opts.usePointerCornerDown) el.addEventListener('pointerdown', onHit);
    el.addEventListener('click', onHit);
  });

  const arena = document.getElementById('fs-arena');
  const source = document.getElementById('fs-source');
  const drop = document.getElementById('fs-drop');
  const tooltip = document.getElementById('fs-tooltip');

  let dragging = false;
  let pointerId = null;
  let offX = 0;
  let offY = 0;

  source.addEventListener('pointerdown', (e) => {
    if (hits.has('drag')) return;
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    try {
      source.setPointerCapture(e.pointerId);
    } catch {}
    source.classList.add('dragging');
    if (tooltip) tooltip.style.opacity = '0';
    const r = source.getBoundingClientRect();
    offX = e.clientX - (r.left + r.width / 2);
    offY = e.clientY - (r.top + r.height / 2);
  });

  source.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    e.preventDefault();
    const ar = arena.getBoundingClientRect();
    source.style.left = e.clientX - ar.left - offX + 'px';
    source.style.top = e.clientY - ar.top - offY + 'px';
    drop.classList.toggle('over', isOverDrop(drop, e.clientX, e.clientY));
  });

  function endDrag(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    source.classList.remove('dragging');
    try {
      source.releasePointerCapture(e.pointerId);
    } catch {}
    drop.classList.remove('over');
    if (isOverDrop(drop, e.clientX, e.clientY)) {
      const ar = arena.getBoundingClientRect();
      const c = dropCenter(drop);
      source.style.left = c.x - ar.left + 'px';
      source.style.top = c.y - ar.top + 'px';
      source.classList.add('hit');
      drop.classList.add('hit');
      drop.textContent = '✓';
      complete('drag');
    } else {
      source.style.left = '';
      source.style.top = '';
      if (tooltip) tooltip.style.opacity = '';
    }
  }
  source.addEventListener('pointerup', endDrag);
  source.addEventListener('pointercancel', endDrag);

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
        ctx.markResult('fail', `${opts.failPrefix} ${hits.size}/${TOTAL_HITS} actions completed`);
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
