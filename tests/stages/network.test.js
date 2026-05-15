import { describe, it, expect, beforeEach, vi } from 'vitest';
import network from '../../src/stages/network.js';
import { makeCtx, mockFetch, flushPromises } from '../helpers/mock-globals.js';

describe('network stage', () => {
  let ctx;
  beforeEach(() => {
    vi.useFakeTimers();
    ctx = makeCtx();
  });

  it('exports the expected metadata', () => {
    expect(network.id).toBe('network');
    expect(network.name).toBe('Internet connection');
    expect(typeof network.run).toBe('function');
  });

  it('mounts the diagnostic grid with all of its rows', () => {
    mockFetch(() => new Promise(() => {}));
    network.run(ctx);
    expect(ctx.body.querySelector('#diag-online')).not.toBeNull();
    expect(ctx.body.querySelector('#diag-app')).not.toBeNull();
    expect(ctx.body.querySelector('#diag-net')).not.toBeNull();
    expect(ctx.body.querySelector('#diag-down')).not.toBeNull();
    expect(ctx.body.querySelector('#diag-up')).not.toBeNull();
    expect(ctx.body.querySelector('#diag-title').textContent).toBe('Checking your connection');
  });

  it('reflects offline state in the online row', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    mockFetch(() => new Promise(() => {}));
    network.run(ctx);
    expect(ctx.body.querySelector('#diag-online').textContent).toBe('Offline');
    expect(ctx.body.querySelector('#diag-online').className).toContain('bad');
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  });

  it('marks fail when the stage timeout elapses without bandwidth results', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    mockFetch(() => new Promise(() => {})); // stall everything
    network.run(ctx);
    await vi.advanceTimersByTimeAsync(46000);
    expect(ctx.markResult).toHaveBeenCalledWith('fail', 'Network checks timed out');
    const lastButtons = ctx.setButtons.mock.calls.at(-1)[0];
    expect(lastButtons[0].label).toBe('Got it →');
  });

  it('always offers a skip button up front', () => {
    mockFetch(() => new Promise(() => {}));
    network.run(ctx);
    const firstButtons = ctx.setButtons.mock.calls[0][0];
    expect(firstButtons[0].label).toBe('Skip');
    firstButtons[0].action();
    expect(ctx.markResult).toHaveBeenCalledWith('skip', 'User skipped');
  });
});
