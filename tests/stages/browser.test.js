import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import browser from '../../src/stages/browser.js';
import { makeCtx } from '../helpers/mock-globals.js';

describe('browser stage', () => {
  let ctx;
  let cookieDescriptor;
  beforeEach(() => {
    cookieDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'cookieEnabled');
    ctx = makeCtx();
  });
  afterEach(() => {
    if (cookieDescriptor) {
      Object.defineProperty(Navigator.prototype, 'cookieEnabled', cookieDescriptor);
    }
  });

  it('exports the expected metadata', () => {
    expect(browser.id).toBe('browser');
    expect(browser.name).toBe('Resolution & device compatibility');
    expect(typeof browser.run).toBe('function');
  });

  it('passes when cookies and localStorage are available', () => {
    browser.run(ctx);
    expect(ctx.markResult).toHaveBeenCalledWith('pass', expect.any(String));
    expect(ctx.body.querySelector('#diag-icon').textContent).toBe('✓');
    expect(ctx.body.querySelector('#diag-title').textContent).toBe('Your browser is ready');
  });

  it('fails when cookies are disabled', () => {
    Object.defineProperty(Navigator.prototype, 'cookieEnabled', {
      configurable: true,
      get: () => false,
    });
    browser.run(ctx);
    expect(ctx.markResult).toHaveBeenCalledWith('fail', expect.stringContaining('cookies'));
    expect(ctx.body.querySelector('#diag-icon').textContent).toBe('✕');
  });

  it('always registers a primary continue button', () => {
    browser.run(ctx);
    expect(ctx.setButtons).toHaveBeenCalled();
    const buttons = ctx.setButtons.mock.calls[0][0];
    expect(buttons[0].primary).toBe(true);
  });
});
