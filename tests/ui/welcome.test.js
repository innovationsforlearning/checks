import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTestSelector, getSelectedIds } from '../../src/ui/welcome.js';

const tests = [
  { id: 'browser', icon: '💻', name: 'Browser' },
  { id: 'network', icon: '🌐', name: 'Network' },
  { id: 'touch', icon: '👆', name: 'Touch', skipIfNoTouch: true },
  { id: 'keyboard', icon: '⌨️', name: 'Keyboard' },
];

const groups = [
  { label: 'Connectivity', ids: ['browser', 'network'] },
  { label: 'Input', ids: ['touch', 'keyboard'] },
];

describe('renderTestSelector', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-selector"></div>';
  });

  it('renders one fieldset per group with the group label as legend', () => {
    renderTestSelector(tests, groups, true, () => {});
    const fieldsets = document.querySelectorAll('.test-selector-group');
    expect(fieldsets).toHaveLength(2);
    expect(fieldsets[0].querySelector('legend').textContent).toBe('Connectivity');
    expect(fieldsets[1].querySelector('legend').textContent).toBe('Input');
  });

  it('renders one checkbox per test, all checked by default', () => {
    renderTestSelector(tests, groups, true, () => {});
    const boxes = document.querySelectorAll('input[type="checkbox"][data-test-id]');
    expect(boxes).toHaveLength(4);
    boxes.forEach((b) => expect(b.checked).toBe(true));
  });

  it('hides skipIfNoTouch tests when touchSupported is false', () => {
    renderTestSelector(tests, groups, false, () => {});
    const ids = [...document.querySelectorAll('input[data-test-id]')].map((b) => b.dataset.testId);
    expect(ids).not.toContain('touch');
    expect(ids).toContain('keyboard');
  });

  it('omits groups whose tests are all hidden', () => {
    renderTestSelector(
      [{ id: 'touch', icon: '👆', name: 'Touch', skipIfNoTouch: true }],
      [{ label: 'Input', ids: ['touch'] }],
      false,
      () => {},
    );
    expect(document.querySelectorAll('.test-selector-group')).toHaveLength(0);
  });

  it('fires onChange with the current "any selected" state when a box toggles', () => {
    const onChange = vi.fn();
    renderTestSelector(tests, groups, true, onChange);
    const boxes = document.querySelectorAll('input[type="checkbox"][data-test-id]');
    boxes.forEach((b) => (b.checked = false));
    boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(false);

    boxes[0].checked = true;
    boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('does nothing if the container is absent', () => {
    document.body.innerHTML = '';
    expect(() => renderTestSelector(tests, groups, true, () => {})).not.toThrow();
  });
});

describe('getSelectedIds', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="test-selector"></div>';
    renderTestSelector(tests, groups, true, () => {});
  });

  it('returns the ids of every checked box', () => {
    expect(getSelectedIds()).toEqual(new Set(['browser', 'network', 'touch', 'keyboard']));
  });

  it('excludes unchecked boxes', () => {
    document.querySelector('input[data-test-id="network"]').checked = false;
    expect(getSelectedIds()).toEqual(new Set(['browser', 'touch', 'keyboard']));
  });

  it('returns an empty set when the container is missing', () => {
    document.body.innerHTML = '';
    expect(getSelectedIds()).toEqual(new Set());
  });
});
