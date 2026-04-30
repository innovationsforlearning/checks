import { mountOverlay, finishOverlay } from '../ui/overlay.js';

const STAGE_TIMEOUT_MS = 30000;
const LEFT_ANCHOR = 70;
const RIGHT_ANCHOR_OFFSET = 70;
const SUCCESS_THRESHOLD = 8;

function getX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}

export default {
  id: 'drag',
  icon: '↔️',
  name: 'Touchscreen (drag)',
  instruction: 'Press and drag from the left circle all the way to the right.',
  skipIfNoTouch: true,
  run(ctx) {
    ctx.body.innerHTML =
      '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:2rem 0;">Opening fullscreen test...</p>';

    const overlay = mountOverlay(`
      <div class="fs-header">
        <div>
          <div class="fs-header-title">Drag across the screen</div>
          <div class="fs-header-sub">Press and slide from the left side all the way to the right.</div>
        </div>
        <div class="fs-status" id="fs-drag-status">Waiting...</div>
      </div>
      <div class="fs-arena">
        <div id="fs-drag-track">
          <div class="fs-drag-line-bg"></div>
          <div id="fs-drag-line"></div>
          <div class="fs-drag-zone" id="fs-drag-start">start</div>
          <div class="fs-drag-zone" id="fs-drag-end">end</div>
          <div id="fs-drag-handle"></div>
          <div class="fs-drag-hint">Press and drag from left to right</div>
        </div>
      </div>
      <div class="fs-footer" id="fs-drag-footer">
        <button class="btn btn-sm" id="fs-drag-skip">Skip</button>
      </div>`);

    const track = document.getElementById('fs-drag-track');
    const handle = document.getElementById('fs-drag-handle');
    const line = document.getElementById('fs-drag-line');
    const startZone = document.getElementById('fs-drag-start');
    const endZone = document.getElementById('fs-drag-end');
    const statusEl = document.getElementById('fs-drag-status');

    let dragging = false;
    let passed = false;

    const trackRect = () => track.getBoundingClientRect();
    const rightAnchor = () => trackRect().width - RIGHT_ANCHOR_OFFSET;

    let handleX = LEFT_ANCHOR;
    handle.style.left = LEFT_ANCHOR + 'px';

    function onStart(e) {
      if (passed) return;
      const rect = trackRect();
      const x = getX(e) - rect.left;
      if (Math.abs(x - handleX) < 60 || x <= handleX) {
        dragging = true;
        startZone.classList.add('dragging');
        statusEl.textContent = 'Dragging...';
        e.preventDefault();
      }
    }

    function onMove(e) {
      if (!dragging || passed) return;
      e.preventDefault();
      const rect = trackRect();
      const min = LEFT_ANCHOR;
      const max = rightAnchor();
      const x = Math.max(min, Math.min(getX(e) - rect.left, max));
      handleX = x;
      handle.style.left = x + 'px';
      line.style.width = Math.max(0, x - min) + 'px';
      const near = x > max - 60;
      endZone.classList.toggle('reached', near);
      if (x >= max - SUCCESS_THRESHOLD) {
        passed = true;
        dragging = false;
        statusEl.classList.add('pass');
        statusEl.textContent = 'Drag complete ✓';
        ctx.markResult('pass', 'Drag gesture detected');
        const footer = document.getElementById('fs-drag-footer');
        footer.innerHTML = '';
        const cont = document.createElement('button');
        cont.className = 'btn btn-sm btn-primary';
        cont.textContent = 'Looks good →';
        cont.onclick = () => finishOverlay(ctx.advance);
        footer.appendChild(cont);
      }
    }

    function onEnd() {
      if (!passed && dragging) {
        dragging = false;
        startZone.classList.remove('dragging');
      }
    }

    track.addEventListener('mousedown', onStart);
    track.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    ctx.addCleanup(() => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
      const o = document.getElementById('fs-overlay');
      if (o) o.remove();
    });

    document.getElementById('fs-drag-skip').onclick = () => {
      finishOverlay(() => {
        ctx.markResult('skip', 'User skipped');
        ctx.advance();
      });
    };

    ctx.setStatus('', 'Drag left → right in fullscreen');
    ctx.setButtons([]);

    const timer = setTimeout(() => {
      if (!passed) {
        finishOverlay(() => {
          ctx.markResult('fail', 'Drag not completed');
          ctx.advance();
        });
      }
    }, STAGE_TIMEOUT_MS);
    ctx.addCleanup(() => clearTimeout(timer));
  },
};
