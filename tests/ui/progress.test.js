import { describe, it, expect, beforeEach } from 'vitest';
import { updateProgress } from '../../src/ui/progress.js';

describe('updateProgress', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
      <span id="progress-label-left"></span>
      <span id="progress-label-right"></span>`;
  });

  const tests = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Bravo' },
    { id: 'c', name: 'Charlie' },
  ];

  it('writes "Test N of M" with N = index + 1', () => {
    updateProgress(tests, 1);
    expect(document.getElementById('progress-label-left').textContent).toBe('Test 2 of 3');
  });

  it('writes the current test name on the right', () => {
    updateProgress(tests, 2);
    expect(document.getElementById('progress-label-right').textContent).toBe('Charlie');
  });

  it('fills the bar proportionally to completion so far', () => {
    updateProgress(tests, 0);
    expect(document.getElementById('progress-fill').style.width).toBe('0%');
    updateProgress(tests, 1);
    const w = document.getElementById('progress-fill').style.width;
    expect(parseFloat(w)).toBeCloseTo(33.33, 1);
  });
});
