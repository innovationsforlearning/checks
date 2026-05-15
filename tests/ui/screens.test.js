import { describe, it, expect, beforeEach } from 'vitest';
import { showScreen } from '../../src/ui/screens.js';

describe('showScreen', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="screen-welcome" class="screen active"></div>
      <div id="screen-test" class="screen"></div>
      <div id="screen-results" class="screen"></div>`;
  });

  it('activates the target screen and deactivates the rest', () => {
    showScreen('test');
    expect(document.getElementById('screen-welcome').classList.contains('active')).toBe(false);
    expect(document.getElementById('screen-test').classList.contains('active')).toBe(true);
    expect(document.getElementById('screen-results').classList.contains('active')).toBe(false);
  });

  it('does nothing if the screen id is unknown but still clears active', () => {
    showScreen('does-not-exist');
    expect(document.querySelectorAll('.screen.active').length).toBe(0);
  });
});
