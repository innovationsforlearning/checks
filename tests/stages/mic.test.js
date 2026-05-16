import { describe, it, expect, beforeEach, vi } from 'vitest';
import mic from '../../src/stages/mic.js';
import {
  makeCtx,
  mockGetUserMedia,
  fakeMediaStream,
  mockAudioContext,
  flushPromises,
} from '../helpers/mock-globals.js';

describe('mic stage', () => {
  let ctx;
  beforeEach(() => {
    vi.useFakeTimers();
    mockAudioContext();
    ctx = makeCtx();
  });

  it('exports the expected metadata', () => {
    expect(mic.id).toBe('mic');
    expect(typeof mic.run).toBe('function');
  });

  it('mounts the meter UI right away', () => {
    mockGetUserMedia(() => new Promise(() => {}));
    mic.run(ctx);
    expect(ctx.body.querySelectorAll('.meter-bar').length).toBeGreaterThan(0);
    expect(ctx.body.querySelector('#mic-heading').textContent).toBe('Say something out loud');
  });

  it('registers the stream when getUserMedia resolves', async () => {
    const { stream } = fakeMediaStream({ kind: 'audio' });
    mockGetUserMedia(() => Promise.resolve(stream));
    mic.run(ctx);
    // Let the pre-request delay elapse, then drain the promise queue.
    await vi.advanceTimersByTimeAsync(500);
    await flushPromises();
    expect(ctx.addStream).toHaveBeenCalledWith(stream);
  });

  it('shows the error UI and offers retry/skip when getUserMedia rejects', async () => {
    mockGetUserMedia(() => Promise.reject(new Error('NotAllowedError')));
    mic.run(ctx);
    await vi.advanceTimersByTimeAsync(500);
    await flushPromises();
    expect(ctx.body.querySelector('.test-prompt-heading').textContent).toBe(
      "We couldn't start your microphone",
    );
    const lastButtons = ctx.setButtons.mock.calls.at(-1)[0];
    expect(lastButtons.map((b) => b.label)).toEqual(['Try again', 'Skip']);
  });

  it('Skip button records a fail and advances', async () => {
    mockGetUserMedia(() => Promise.reject(new Error('NotAllowedError')));
    mic.run(ctx);
    await vi.advanceTimersByTimeAsync(500);
    await flushPromises();
    const buttons = ctx.setButtons.mock.calls.at(-1)[0];
    buttons[1].action();
    expect(ctx.markResult).toHaveBeenCalledWith('fail', 'Mic unavailable');
    expect(ctx.advance).toHaveBeenCalled();
  });
});
