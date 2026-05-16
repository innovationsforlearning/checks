import { describe, it, expect, beforeEach } from 'vitest';
import { runCorners } from '../../src/stages/_corners.js';
import { makeCtx } from '../helpers/mock-globals.js';

const opts = {
  title: 'Tap zones',
  subtitle: 'sub',
  statusPrefix: 'tap...',
  successLabel: 'all zones registered',
  usePointerDown: false,
};

describe('runCorners', () => {
  let ctx;
  beforeEach(() => {
    document.body.innerHTML = '';
    ctx = makeCtx();
  });

  it('mounts an overlay with five zones (A-E) and a skip button', () => {
    runCorners(opts, ctx);
    const overlay = document.getElementById('fs-overlay');
    expect(overlay).not.toBeNull();
    const labels = ['fs-tz-tl', 'fs-tz-tr', 'fs-tz-bl', 'fs-tz-br', 'fs-tz-c'].map(
      (id) => document.getElementById(id).textContent,
    );
    expect(labels).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(document.getElementById('fs-skip')).not.toBeNull();
  });

  it('marks pass and offers a continue button after every zone is clicked, in any order', () => {
    runCorners(opts, ctx);
    ['fs-tz-c', 'fs-tz-tr', 'fs-tz-bl', 'fs-tz-br', 'fs-tz-tl'].forEach((id) =>
      document.getElementById(id).click(),
    );
    expect(ctx.markResult).toHaveBeenCalledWith('pass', opts.successLabel);
    expect(document.getElementById('fs-status').textContent).toBe('All complete ✓');
    expect(document.querySelector('#fs-footer .btn-primary')).not.toBeNull();
  });

  it('marks each hit zone visually and tracks status text', () => {
    runCorners(opts, ctx);
    document.getElementById('fs-tz-tl').click();
    expect(document.getElementById('fs-tz-tl').classList.contains('hit')).toBe(true);
    expect(document.getElementById('fs-tz-tl').textContent).toBe('✓');
    expect(document.getElementById('fs-status').textContent).toBe('1 / 5 complete');
  });

  it('ignores repeated clicks on the same zone', () => {
    runCorners(opts, ctx);
    document.getElementById('fs-tz-tl').click();
    document.getElementById('fs-tz-tl').click();
    expect(document.getElementById('fs-status').textContent).toBe('1 / 5 complete');
  });

  it('Skip button marks a skip and advances', () => {
    runCorners(opts, ctx);
    document.getElementById('fs-skip').click();
    expect(ctx.markResult).toHaveBeenCalledWith('skip', 'User skipped');
    expect(ctx.advance).toHaveBeenCalled();
  });

  it('registers pointerdown when usePointerDown is true', () => {
    runCorners({ ...opts, usePointerDown: true }, ctx);
    document
      .getElementById('fs-tz-c')
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(document.getElementById('fs-tz-c').classList.contains('hit')).toBe(true);
  });
});
