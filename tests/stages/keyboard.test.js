import { describe, it, expect, beforeEach, vi } from 'vitest';
import keyboard from '../../src/stages/keyboard.js';
import { makeCtx } from '../helpers/mock-globals.js';

describe('keyboard stage', () => {
  let ctx;
  beforeEach(() => {
    vi.useFakeTimers();
    ctx = makeCtx();
  });

  it('exports the expected metadata', () => {
    expect(keyboard.id).toBe('keyboard');
    expect(typeof keyboard.run).toBe('function');
  });

  it('mounts the layout, prompt, and input field', () => {
    keyboard.run(ctx);
    expect(ctx.body.querySelectorAll('.kb-key').length).toBeGreaterThan(0);
    expect(ctx.body.querySelector('#kb-heading').textContent).toBe('Press every key shown below');
    expect(ctx.body.querySelector('#key-input-field')).not.toBeNull();
  });

  it('lights up keys as they are pressed', () => {
    keyboard.run(ctx);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', key: 'a' }));
    expect(document.getElementById('kc-KeyA').classList.contains('hit')).toBe(true);
  });

  it('Skip button records a skip and advances', () => {
    keyboard.run(ctx);
    const buttons = ctx.setButtons.mock.calls[0][0];
    expect(buttons[0].label).toBe('Skip this');
    buttons[0].action();
    expect(ctx.markResult).toHaveBeenCalledWith('skip', 'User skipped');
    expect(ctx.advance).toHaveBeenCalled();
  });

  it('marks fail when the stage timeout elapses with insufficient keys', () => {
    keyboard.run(ctx);
    vi.advanceTimersByTime(121000);
    expect(ctx.markResult).toHaveBeenCalledWith('fail', expect.stringMatching(/keys detected/));
  });
});
