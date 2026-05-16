import { describe, it, expect, beforeEach } from 'vitest';
import { runDragToCircle } from '../../src/stages/_drag-to-circle.js';
import { makeCtx } from '../helpers/mock-globals.js';

const opts = {
  title: 'Drag',
  subtitle: 'sub',
  statusPrefix: 'drag...',
  tooltipText: 'drag me',
  successLabel: 'drag pass',
  failLabel: 'drag fail',
};

function pointerEvent(type, x, y) {
  const e = new Event(type, { bubbles: true });
  Object.assign(e, { pointerId: 1, clientX: x, clientY: y });
  return e;
}

describe('runDragToCircle', () => {
  let ctx;
  beforeEach(() => {
    document.body.innerHTML = '';
    ctx = makeCtx();
  });

  it('mounts the source, drop target, and tooltip', () => {
    runDragToCircle(opts, ctx);
    expect(document.getElementById('fs-source')).not.toBeNull();
    expect(document.getElementById('fs-drop')).not.toBeNull();
    expect(document.getElementById('fs-tooltip').textContent).toBe('drag me');
  });

  it('marks pass when the source is released over the drop target', () => {
    runDragToCircle(opts, ctx);
    const source = document.getElementById('fs-source');
    const drop = document.getElementById('fs-drop');
    // setup.js stubs getBoundingClientRect to return 0,0 → 100,100 by default,
    // so the drop center is at (50, 50) with radius 50. Release within that.
    source.dispatchEvent(pointerEvent('pointerdown', 0, 0));
    source.dispatchEvent(pointerEvent('pointermove', 50, 50));
    source.dispatchEvent(pointerEvent('pointerup', 50, 50));
    expect(ctx.markResult).toHaveBeenCalledWith('pass', opts.successLabel);
    expect(drop.classList.contains('hit')).toBe(true);
  });

  it('does not mark pass when released away from the drop target', () => {
    runDragToCircle(opts, ctx);
    const source = document.getElementById('fs-source');
    source.dispatchEvent(pointerEvent('pointerdown', 0, 0));
    source.dispatchEvent(pointerEvent('pointermove', 200, 200));
    source.dispatchEvent(pointerEvent('pointerup', 200, 200));
    expect(ctx.markResult).not.toHaveBeenCalledWith('pass', opts.successLabel);
  });

  it('Skip button marks a skip and advances', () => {
    runDragToCircle(opts, ctx);
    document.getElementById('fs-skip').click();
    expect(ctx.markResult).toHaveBeenCalledWith('skip', 'User skipped');
    expect(ctx.advance).toHaveBeenCalled();
  });
});
