import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReport, renderReport } from '../../src/ui/results-report.js';

const tests = [
  { id: 'browser', icon: '💻', name: 'Browser' },
  { id: 'network', icon: '🌐', name: 'Network' },
  { id: 'mic', icon: '🎙️', name: 'Microphone' },
];

describe('buildReport', () => {
  it('starts with the header lines (score, browser, screen, viewport)', () => {
    const report = buildReport(
      tests,
      { browser: { status: 'fail', label: 'cookies disabled' } },
      { total: 3, passed: 1, failed: 1 },
    );
    expect(report).toMatch(/^System Check — issues found\n/);
    expect(report).toMatch(/Score:\s+1\/3 passed, 1 failed/);
    expect(report).toMatch(/Browser:\s+/);
    expect(report).toMatch(/Screen:\s+\d+×\d+ @/);
    expect(report).toMatch(/Viewport:\s+\d+×\d+/);
  });

  it('lists every failed check with its label', () => {
    const report = buildReport(
      tests,
      {
        browser: { status: 'pass' },
        network: { status: 'fail', label: 'too slow' },
        mic: { status: 'fail', label: 'no audio' },
      },
      { total: 3, passed: 1, failed: 2 },
    );
    expect(report).toMatch(/Failed checks\n-{13}\n✕ Network — too slow\n✕ Microphone — no audio/);
  });

  it('falls back to "no detail" when a failed result has no label', () => {
    const report = buildReport(
      tests,
      { network: { status: 'fail' } },
      { total: 3, passed: 2, failed: 1 },
    );
    expect(report).toMatch(/✕ Network — no detail/);
  });

  it('only includes the Skipped section when something was skipped', () => {
    const noSkip = buildReport(
      tests,
      { browser: { status: 'fail', label: 'x' } },
      { total: 3, passed: 0, failed: 1 },
    );
    expect(noSkip).not.toMatch(/Skipped checks/);

    const withSkip = buildReport(
      tests,
      {
        browser: { status: 'fail', label: 'x' },
        mic: { status: 'skip', label: 'User skipped' },
      },
      { total: 3, passed: 0, failed: 1 },
    );
    expect(withSkip).toMatch(/Skipped checks\n-{14}\n— Microphone — User skipped/);
  });

  it('uses a neutral header and omits the Failed section when nothing failed', () => {
    const report = buildReport(
      tests,
      { browser: { status: 'pass' }, network: { status: 'pass' }, mic: { status: 'pass' } },
      { total: 3, passed: 3, failed: 0 },
    );
    expect(report).toMatch(/^System Check — diagnostic report\n/);
    expect(report).not.toMatch(/Failed checks/);
  });

  it('uses an ISO 8601 timestamp', () => {
    const report = buildReport(tests, {}, { total: 0, passed: 0, failed: 0 });
    expect(report).toMatch(/Time:\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('renderReport', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="results-report"></div>
      <div id="results-copy-slot"></div>`;
  });

  it('renders the report even when nothing failed (always-show for tech support)', () => {
    renderReport(
      tests,
      { browser: { status: 'pass' }, network: { status: 'pass' }, mic: { status: 'pass' } },
      { total: 3, passed: 3, failed: 0 },
    );
    expect(document.querySelector('.results-report-title').textContent).toBe('Details');
    expect(document.getElementById('results-report-text').value).toMatch(
      /System Check — diagnostic report/,
    );
    expect(document.getElementById('results-copy').textContent).toBe('Copy to clipboard');
  });

  it('renders the Details title, textarea, and copy button when failures exist', () => {
    renderReport(
      tests,
      { browser: { status: 'fail', label: 'cookies' } },
      { total: 3, passed: 0, failed: 1 },
    );
    expect(document.querySelector('.results-report-title').textContent).toBe('Details');
    expect(document.getElementById('results-report-text').value).toMatch(/Failed checks/);
    expect(document.getElementById('results-copy').textContent).toBe('Copy to clipboard');
  });

  it('clicking Copy writes the report to the clipboard and flashes feedback', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });

    renderReport(
      tests,
      { browser: { status: 'fail', label: 'x' } },
      { total: 3, passed: 0, failed: 1 },
    );
    const button = document.getElementById('results-copy');
    button.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toMatch(/System Check — issues found/);
    expect(button.textContent).toBe('Copied ✓');
    expect(button.disabled).toBe(true);
  });

  it('falls back to execCommand when navigator.clipboard fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) },
    });
    document.execCommand = vi.fn(() => true);

    renderReport(
      tests,
      { browser: { status: 'fail', label: 'x' } },
      { total: 3, passed: 0, failed: 1 },
    );
    document.getElementById('results-copy').click();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
