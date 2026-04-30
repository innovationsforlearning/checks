export function removeOverlay() {
  const o = document.getElementById('fs-overlay');
  if (!o) return;
  if (typeof o._cleanup === 'function') {
    try {
      o._cleanup();
    } catch {}
  }
  o.remove();
}

export function finishOverlay(then) {
  removeOverlay();
  if (typeof then === 'function') then();
}

export function mountOverlay(html) {
  removeOverlay();
  const overlay = document.createElement('div');
  overlay.id = 'fs-overlay';
  overlay.className = 'fs-overlay';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  return overlay;
}
