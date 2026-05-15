import { describe, it, expect, beforeEach } from 'vitest';
import { renderDiagSummary, updateDiagSummary } from '../../src/ui/diag.js';

describe('renderDiagSummary', () => {
  let body;
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    body = document.getElementById('host');
  });

  it('renders icon, title, description, and details', () => {
    renderDiagSummary(body, {
      state: 'ok',
      title: 'Looks good',
      description: 'Everything works',
      detailsHTML: '<p>more</p>',
    });
    expect(document.getElementById('diag-icon').textContent).toBe('✓');
    expect(document.getElementById('diag-icon').className).toBe('diag-summary-icon ok');
    expect(document.getElementById('diag-title').textContent).toBe('Looks good');
    expect(document.getElementById('diag-description').textContent).toBe('Everything works');
    expect(document.getElementById('diag-details').innerHTML).toBe('<p>more</p>');
  });

  it.each([
    ['ok', '✓'],
    ['warn', '⚠'],
    ['bad', '✕'],
    ['loading', '·'],
  ])('uses the right icon for state %s', (state, icon) => {
    renderDiagSummary(body, { state, title: 't' });
    expect(document.getElementById('diag-icon').textContent).toBe(icon);
  });

  it('toggle button opens and closes the details block', () => {
    renderDiagSummary(body, { state: 'ok', title: 't', detailsHTML: '<p>x</p>' });
    const toggle = document.getElementById('diag-toggle');
    const details = document.getElementById('diag-details');
    expect(details.classList.contains('open')).toBe(false);
    toggle.click();
    expect(details.classList.contains('open')).toBe(true);
    expect(toggle.textContent).toBe('Hide details');
    toggle.click();
    expect(details.classList.contains('open')).toBe(false);
    expect(toggle.textContent).toBe('Show details');
  });

  it('falls back to empty strings when description or detailsHTML are missing', () => {
    renderDiagSummary(body, { state: 'ok', title: 't' });
    expect(document.getElementById('diag-description').textContent).toBe('');
    expect(document.getElementById('diag-details').innerHTML).toBe('');
  });
});

describe('updateDiagSummary', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    renderDiagSummary(document.getElementById('host'), {
      state: 'loading',
      title: 'Initial',
      description: 'Initial description',
    });
  });

  it('updates state, title, and description independently', () => {
    updateDiagSummary({ state: 'ok', title: 'Done', description: 'All good' });
    expect(document.getElementById('diag-icon').textContent).toBe('✓');
    expect(document.getElementById('diag-icon').className).toBe('diag-summary-icon ok');
    expect(document.getElementById('diag-title').textContent).toBe('Done');
    expect(document.getElementById('diag-description').textContent).toBe('All good');
  });

  it('leaves fields unchanged when undefined is passed', () => {
    updateDiagSummary({ title: 'Only title' });
    expect(document.getElementById('diag-title').textContent).toBe('Only title');
    expect(document.getElementById('diag-description').textContent).toBe('Initial description');
  });

  it('tolerates missing DOM nodes', () => {
    document.body.innerHTML = '';
    expect(() => updateDiagSummary({ state: 'ok', title: 't', description: 'd' })).not.toThrow();
  });
});
