import { describe, it, expect, afterEach } from 'vitest';
import { hasTouchScreen } from '../../src/lib/touch.js';

describe('hasTouchScreen', () => {
  const origMaxTouchPoints = navigator.maxTouchPoints;

  afterEach(() => {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: origMaxTouchPoints,
      configurable: true,
    });
    delete window.ontouchstart;
  });

  it('returns true when ontouchstart is present', () => {
    window.ontouchstart = null;
    expect(hasTouchScreen()).toBe(true);
  });

  it('returns true when navigator.maxTouchPoints > 0', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });
    expect(hasTouchScreen()).toBe(true);
  });

  it('returns false when neither signal is present', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
    expect(hasTouchScreen()).toBe(false);
  });
});
