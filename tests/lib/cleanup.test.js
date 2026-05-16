import { describe, it, expect, vi } from 'vitest';
import { createCleanupBag } from '../../src/lib/cleanup.js';

describe('createCleanupBag', () => {
  it('runs added functions in LIFO order', () => {
    const bag = createCleanupBag();
    const calls = [];
    bag.add(() => calls.push('a'));
    bag.add(() => calls.push('b'));
    bag.add(() => calls.push('c'));
    bag.run();
    expect(calls).toEqual(['c', 'b', 'a']);
  });

  it('ignores non-function arguments to add()', () => {
    const bag = createCleanupBag();
    bag.add(null);
    bag.add(undefined);
    bag.add('not a function');
    expect(() => bag.run()).not.toThrow();
  });

  it('continues running cleanups even when one throws', () => {
    const bag = createCleanupBag();
    const after = vi.fn();
    bag.add(after);
    bag.add(() => {
      throw new Error('boom');
    });
    expect(() => bag.run()).not.toThrow();
    expect(after).toHaveBeenCalled();
  });

  it('addStream stops every track when run', () => {
    const bag = createCleanupBag();
    const t1 = { stop: vi.fn() };
    const t2 = { stop: vi.fn() };
    bag.addStream({ getTracks: () => [t1, t2] });
    bag.run();
    expect(t1.stop).toHaveBeenCalled();
    expect(t2.stop).toHaveBeenCalled();
  });

  it('addAudioContext closes the context when run', () => {
    const bag = createCleanupBag();
    const audioCtx = { close: vi.fn() };
    bag.addAudioContext(audioCtx);
    bag.run();
    expect(audioCtx.close).toHaveBeenCalled();
  });

  it('addListener attaches and detaches the listener', () => {
    const bag = createCleanupBag();
    const target = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const handler = () => {};
    bag.addListener(target, 'click', handler);
    expect(target.addEventListener).toHaveBeenCalledWith('click', handler, undefined);
    bag.run();
    expect(target.removeEventListener).toHaveBeenCalledWith('click', handler, undefined);
  });

  it('clears the queue after run so a second run is a no-op', () => {
    const bag = createCleanupBag();
    const fn = vi.fn();
    bag.add(fn);
    bag.run();
    bag.run();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
