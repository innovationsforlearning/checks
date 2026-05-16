import { vi, afterEach } from 'vitest';

// Canary: warn if anything leaks DOM nodes into document.body. makeCtx() owns
// its own teardown; this catches future helpers that forget to clean up.
afterEach(() => {
  if (document.body.children.length > 0) {
    const tags = Array.from(document.body.children).map((el) => el.tagName.toLowerCase());
    console.warn(`leaked ${tags.length} document.body child(ren) after test: ${tags.join(', ')}`);
    document.body.innerHTML = '';
  }
});

// jsdom doesn't ship pointer events with capture/release helpers, so stub them.
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function () {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function () {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function () {
    return false;
  };
}

// jsdom returns 0 for layout — give getBoundingClientRect a stable default so
// drag math doesn't divide-by-zero.
const originalGBCR = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  const r = originalGBCR.call(this);
  if (r.width === 0 && r.height === 0) {
    return { x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 };
  }
  return r;
};

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener() {}, removeListener() {} });
}
