import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountOverlay, finishOverlay, removeOverlay } from '../../src/ui/overlay.js';

describe('overlay', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mountOverlay inserts the markup into the document', () => {
    mountOverlay('<p id="inside">hi</p>');
    const overlay = document.getElementById('fs-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.querySelector('#inside').textContent).toBe('hi');
  });

  it('mountOverlay replaces an existing overlay rather than stacking', () => {
    mountOverlay('<span>first</span>');
    mountOverlay('<span>second</span>');
    expect(document.querySelectorAll('#fs-overlay')).toHaveLength(1);
    expect(document.getElementById('fs-overlay').textContent).toBe('second');
  });

  it('removeOverlay removes the overlay from the DOM', () => {
    mountOverlay('<span>x</span>');
    removeOverlay();
    expect(document.getElementById('fs-overlay')).toBeNull();
  });

  it('finishOverlay removes and then invokes the callback', () => {
    mountOverlay('<span>x</span>');
    const cb = vi.fn();
    finishOverlay(cb);
    expect(document.getElementById('fs-overlay')).toBeNull();
    expect(cb).toHaveBeenCalled();
  });

  it('finishOverlay tolerates a missing callback', () => {
    mountOverlay('<span>x</span>');
    expect(() => finishOverlay()).not.toThrow();
  });
});
