import { describe, it, expect, beforeEach, vi } from 'vitest';
import speaker from '../../src/stages/speaker.js';
import { makeCtx, mockAudioContext } from '../helpers/mock-globals.js';

describe('speaker stage', () => {
  let ctx;
  beforeEach(() => {
    vi.useFakeTimers();
    mockAudioContext();
    ctx = makeCtx();
  });

  it('exports the expected metadata', () => {
    expect(speaker.id).toBe('speaker');
    expect(typeof speaker.run).toBe('function');
  });

  it('mounts the visualizer and prompt', () => {
    speaker.run(ctx);
    expect(ctx.body.querySelector('.test-prompt-heading').textContent).toBe('Did you hear that?');
    expect(ctx.body.querySelectorAll('.wave-bar').length).toBeGreaterThan(0);
  });

  it('starts a tone shortly after run', () => {
    speaker.run(ctx);
    vi.advanceTimersByTime(400);
    expect(ctx.addAudioContext).toHaveBeenCalled();
  });

  it('exposes Play again, fail, and primary pass actions', () => {
    speaker.run(ctx);
    const buttons = ctx.setButtons.mock.calls[0][0];
    const labels = buttons.map((b) => b.label);
    expect(labels).toEqual(['↺ Play again', "I didn't hear it", 'Yes, I heard it ✓']);
    expect(buttons[2].primary).toBe(true);
  });

  it('confirming pass calls markResult and advance', () => {
    speaker.run(ctx);
    const buttons = ctx.setButtons.mock.calls[0][0];
    buttons[2].action();
    expect(ctx.markResult).toHaveBeenCalledWith('pass', 'Speakers working');
    expect(ctx.advance).toHaveBeenCalled();
  });

  it('reporting no audio calls markResult fail and advance', () => {
    speaker.run(ctx);
    const buttons = ctx.setButtons.mock.calls[0][0];
    buttons[1].action();
    expect(ctx.markResult).toHaveBeenCalledWith('fail', 'No audio heard');
    expect(ctx.advance).toHaveBeenCalled();
  });
});
