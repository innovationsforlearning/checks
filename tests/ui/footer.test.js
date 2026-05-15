import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setStatus, setButtons } from '../../src/ui/footer.js';

describe('footer', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-status-label">Waiting</div>
      <div id="test-btns"></div>`;
  });

  describe('setStatus', () => {
    it('updates text and applies the type class', () => {
      setStatus('pass', 'All good');
      const el = document.getElementById('test-status-label');
      expect(el.textContent).toBe('All good');
      expect(el.className).toBe('test-status pass');
    });

    it('handles missing type by setting base class only', () => {
      setStatus(null, 'Waiting');
      expect(document.getElementById('test-status-label').className).toBe('test-status ');
    });
  });

  describe('setButtons', () => {
    it('renders one button per entry with correct labels and primary class', () => {
      setButtons([
        { label: 'Continue', primary: true, action: () => {} },
        { label: 'Skip', action: () => {} },
      ]);
      const btns = document.querySelectorAll('#test-btns .btn');
      expect(btns).toHaveLength(2);
      expect(btns[0].textContent).toBe('Continue');
      expect(btns[0].className).toBe('btn btn-sm btn-primary');
      expect(btns[1].textContent).toBe('Skip');
      expect(btns[1].className).toBe('btn btn-sm');
    });

    it('clears existing buttons before rendering new ones', () => {
      setButtons([{ label: 'First', action: () => {} }]);
      setButtons([{ label: 'Second', action: () => {} }]);
      const btns = document.querySelectorAll('#test-btns .btn');
      expect(btns).toHaveLength(1);
      expect(btns[0].textContent).toBe('Second');
    });

    it('wires onclick to the action callback', () => {
      const action = vi.fn();
      setButtons([{ label: 'Go', action }]);
      document.querySelector('#test-btns .btn').click();
      expect(action).toHaveBeenCalled();
    });
  });
});
