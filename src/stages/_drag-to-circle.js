import { mountOverlay, finishOverlay } from '../ui/overlay.js';

const STAGE_TIMEOUT_MS = 30000;

function dropCenter(drop) {
  const r = drop.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius: r.width / 2 };
}

function isOverDrop(drop, x, y) {
  const c = dropCenter(drop);
  return Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2) < c.radius;
}

/**
 * Fullscreen drag-to-drop test — drag the filled circle onto the dashed target.
 * Shared between the touchscreen and trackpad/mouse drag stages.
 *
 * @param {object} opts
 * @param {string} opts.title             Header title.
 * @param {string} opts.subtitle          Header subtitle.
 * @param {string} opts.statusPrefix      Test-area footer status text.
 * @param {string} opts.tooltipText       Drag tooltip text.
 * @param {string} opts.successLabel      markResult label on success.
 * @param {string} opts.failLabel         markResult label on timeout/skip-fail.
 * @param {object} ctx                    Stage context.
 */
export function runDragToCircle(opts, ctx) {
  ctx.body.innerHTML =
    '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem 0;">Opening fullscreen test...</p>';

  mountOverlay(`
    <div class="fs-header">
      <div>
        <div class="fs-header-title">${opts.title}</div>
        <div class="fs-header-sub">${opts.subtitle}</div>
      </div>
      <div class="fs-status" id="fs-status">Waiting...</div>
    </div>
    <div class="fs-arena" id="fs-arena">
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
  const arena = document.getElementById('fs-arena');
  const source = document.getElementById('fs-source');
  const drop = document.getElementById('fs-drop');
  const tooltip = document.getElementById('fs-tooltip');

  let dragging = false;
  let pointerId = null;
  let offX = 0;
  let offY = 0;
  let passed = false;

  function pass() {
    if (passed) return;
    passed = true;
    source.classList.add('hit');
    drop.classList.add('hit');
    drop.textContent = '✓';
    statusEl.classList.add('pass');
    statusEl.textContent = 'Drag complete ✓';
    ctx.markResult('pass', opts.successLabel);
    const footer = document.getElementById('fs-footer');
    footer.innerHTML = '';
    const cont = document.createElement('button');
    cont.className = 'btn btn-sm btn-primary';
    cont.textContent = 'Looks good →';
    cont.onclick = () => finishOverlay(ctx.advance);
    footer.appendChild(cont);
  }

  source.addEventListener('pointerdown', (e) => {
    if (passed) return;
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    try {
      source.setPointerCapture(e.pointerId);
    } catch {}
    source.classList.add('dragging');
    statusEl.textContent = 'Dragging...';
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
      pass();
    } else {
      source.style.left = '';
      source.style.top = '';
      statusEl.textContent = 'Waiting...';
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
    if (!passed) {
      finishOverlay(() => {
        ctx.markResult('fail', opts.failLabel);
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
