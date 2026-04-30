export function createCleanupBag() {
  const items = [];
  return {
    add(fn) {
      if (typeof fn === 'function') items.push(fn);
    },
    addTimeout(id) {
      items.push(() => clearTimeout(id));
    },
    addStream(stream) {
      items.push(() => {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {}
      });
    },
    addAudioContext(audioCtx) {
      items.push(() => {
        try {
          audioCtx.close();
        } catch {}
      });
    },
    addListener(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      items.push(() => target.removeEventListener(event, handler, options));
    },
    run() {
      while (items.length) {
        const fn = items.pop();
        try {
          fn();
        } catch {}
      }
    },
  };
}
