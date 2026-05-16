import { describe, it, expect, beforeEach } from 'vitest';
import { showResults } from '../../src/ui/results.js';

const tests = [
  { id: 'browser', icon: '💻', name: 'Browser' },
  { id: 'network', icon: '🌐', name: 'Network' },
  { id: 'mic', icon: '🎙️', name: 'Microphone' },
];

function mountDom() {
  document.body.innerHTML = `
    <div id="screen-results" class="screen"></div>
    <div id="results-score"></div>
    <div id="results-tagline"></div>
    <div id="results-list"></div>
    <div id="results-report"></div>
    <div id="results-copy-slot"></div>`;
}

describe('showResults', () => {
  beforeEach(() => mountDom());

  it('renders the score as passed/total', () => {
    showResults(tests, {
      browser: { status: 'pass', label: '' },
      network: { status: 'pass', label: '' },
      mic: { status: 'fail', label: '' },
    });
    expect(document.getElementById('results-score').textContent).toBe('2/3');
  });

  it('applies all-pass class when nothing failed', () => {
    showResults(tests, {
      browser: { status: 'pass' },
      network: { status: 'pass' },
      mic: { status: 'pass' },
    });
    expect(document.getElementById('results-score').className).toBe('results-score all-pass');
    expect(document.getElementById('results-tagline').textContent).toMatch(/All checks passed/);
  });

  it('applies has-fail class and pluralizes the tagline', () => {
    showResults(tests, {
      browser: { status: 'pass' },
      network: { status: 'fail', label: 'down' },
      mic: { status: 'fail', label: 'no audio' },
    });
    expect(document.getElementById('results-score').className).toBe('results-score has-fail');
    expect(document.getElementById('results-tagline').textContent).toMatch(/2 issues found/);
  });

  it('singularizes the tagline when exactly one check failed', () => {
    showResults(tests, {
      browser: { status: 'pass' },
      network: { status: 'pass' },
      mic: { status: 'fail', label: 'no audio' },
    });
    expect(document.getElementById('results-tagline').textContent).toMatch(/1 issue found/);
  });

  it('renders one row per test with the appropriate badge class', () => {
    showResults(tests, {
      browser: { status: 'pass' },
      network: { status: 'fail', label: 'x' },
      mic: { status: 'skip' },
    });
    const rows = document.querySelectorAll('#results-list .result-row');
    expect(rows).toHaveLength(3);
    expect(rows[0].querySelector('.result-badge').className).toContain('badge-pass');
    expect(rows[1].querySelector('.result-badge').className).toContain('badge-fail');
    expect(rows[2].querySelector('.result-badge').className).toContain('badge-skip');
  });

  it('treats a missing result entry as a skip', () => {
    showResults(tests, { browser: { status: 'pass' } });
    const rows = document.querySelectorAll('#results-list .result-row');
    expect(rows[1].querySelector('.result-badge').textContent).toBe('SKIP');
  });

  it('renders the report block on every results screen, including all-pass', () => {
    showResults(tests, {
      browser: { status: 'pass' },
      network: { status: 'pass' },
      mic: { status: 'pass' },
    });
    expect(document.querySelector('.results-report-title').textContent).toBe('Details');
    expect(document.getElementById('results-copy').textContent).toBe('Copy to clipboard');
  });

  it('renders the report block and copy button when something failed', () => {
    showResults(tests, {
      browser: { status: 'pass' },
      network: { status: 'fail', label: 'down' },
      mic: { status: 'pass' },
    });
    expect(document.getElementById('results-report').querySelector('textarea')).not.toBeNull();
    expect(document.getElementById('results-copy')).not.toBeNull();
  });
});
