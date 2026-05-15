import { describe, it, expect, beforeEach } from 'vitest';
import webcam from '../../src/stages/webcam.js';
import { makeCtx, mockGetUserMedia, fakeMediaStream, flushPromises } from '../helpers/mock-globals.js';

describe('webcam stage', () => {
  let ctx;
  beforeEach(() => {
    ctx = makeCtx();
  });

  it('exports the expected metadata', () => {
    expect(webcam.id).toBe('webcam');
    expect(typeof webcam.run).toBe('function');
  });

  it('mounts the video element and primes the prompt', () => {
    mockGetUserMedia(() => new Promise(() => {}));
    webcam.run(ctx);
    expect(ctx.body.querySelector('#webcam-video')).not.toBeNull();
    expect(ctx.body.querySelector('.test-prompt-heading').textContent).toBe('Starting your camera…');
  });

  it('on stream resolved: registers the stream, updates copy, and offers pass/fail buttons', async () => {
    const { stream } = fakeMediaStream({ kind: 'video' });
    mockGetUserMedia(() => Promise.resolve(stream));
    webcam.run(ctx);
    await flushPromises();
    expect(ctx.addStream).toHaveBeenCalledWith(stream);
    expect(ctx.body.querySelector('.test-prompt-heading').textContent).toBe('Can you see yourself?');
    const buttons = ctx.setButtons.mock.calls.at(-1)[0];
    expect(buttons.map((b) => b.label)).toEqual([
      "Yes, that's me ✓",
      "I don't see anything",
    ]);
    buttons[0].action();
    expect(ctx.markResult).toHaveBeenCalledWith('pass', 'Camera working');
    expect(ctx.advance).toHaveBeenCalled();
  });

  it('marks fail when getUserMedia rejects', async () => {
    mockGetUserMedia(() => Promise.reject(new Error('NotAllowedError')));
    webcam.run(ctx);
    await flushPromises();
    expect(ctx.markResult).toHaveBeenCalledWith('fail', 'Camera unavailable');
    expect(ctx.body.querySelector('.test-prompt-heading').textContent).toBe(
      "We couldn't start your camera",
    );
  });
});
