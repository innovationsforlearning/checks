import { renderDiagSummary } from '../ui/diag.js';

function detectOS(ua) {
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Mac OS X/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_.]+)/);
    return m ? `macOS ${m[1].replace(/_/g, '.')}` : 'macOS';
  }
  if (/Windows NT/.test(ua)) {
    const m = ua.match(/Windows NT ([\d.]+)/);
    const map = { '10.0': '10/11', 6.3: '8.1', 6.2: '8', 6.1: '7' };
    return m ? `Windows ${map[m[1]] || m[1]}` : 'Windows';
  }
  if (/Android/.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/);
    return m ? `Android ${m[1]}` : 'Android';
  }
  if (/iPhone|iPad|iPod/.test(ua)) {
    const m = ua.match(/OS ([\d_]+) like Mac/);
    return m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS';
  }
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectBrowser(ua) {
  const edge = ua.match(/Edg\/(\d+)/);
  if (edge) return `Edge ${edge[1]}`;
  const firefox = ua.match(/Firefox\/(\d+)/);
  if (firefox) return `Firefox ${firefox[1]}`;
  const chrome = ua.match(/Chrome\/(\d+)/);
  if (chrome) return `Chrome ${chrome[1]}`;
  const safari = ua.match(/Version\/(\d+).*Safari/);
  if (safari) return `Safari ${safari[1]}`;
  return 'Unknown';
}

function checkLocalStorage() {
  try {
    localStorage.setItem('_t', '1');
    localStorage.removeItem('_t');
    return true;
  } catch {
    return false;
  }
}

export default {
  id: 'browser',
  icon: '💻',
  name: 'Browser & device',
  instruction: 'Capturing your browser and operating system info — useful for support.',
  run(ctx) {
    const ua = navigator.userAgent;
    const os = detectOS(ua);
    const browserName = detectBrowser(ua);
    const screenSize = `${window.screen.width} × ${window.screen.height}`;
    const viewport = `${window.innerWidth} × ${window.innerHeight}`;
    const dpr = window.devicePixelRatio || 1;
    const lang = navigator.language || 'unknown';
    const cookies = navigator.cookieEnabled;
    const localStorageOk = checkLocalStorage();

    const detailsHTML = `
      <div class="diag-grid">
        <div class="diag-row"><span class="diag-label">Operating system</span><span class="diag-value">${os}</span></div>
        <div class="diag-row"><span class="diag-label">Browser</span><span class="diag-value">${browserName}</span></div>
        <div class="diag-row"><span class="diag-label">Screen resolution</span><span class="diag-value">${screenSize}</span></div>
        <div class="diag-row"><span class="diag-label">Window size</span><span class="diag-value">${viewport}</span></div>
        <div class="diag-row"><span class="diag-label">Pixel ratio</span><span class="diag-value">${dpr}×</span></div>
        <div class="diag-row"><span class="diag-label">Language</span><span class="diag-value">${lang}</span></div>
        <div class="diag-row"><span class="diag-label">Cookies</span><span class="diag-value ${cookies ? 'ok' : 'bad'}">${cookies ? 'Enabled' : 'Disabled'}</span></div>
        <div class="diag-row"><span class="diag-label">Local storage</span><span class="diag-value ${localStorageOk ? 'ok' : 'bad'}">${localStorageOk ? 'Available' : 'Blocked'}</span></div>
      </div>`;

    const issues = [];
    if (!cookies) issues.push('cookies disabled');
    if (!localStorageOk) issues.push('storage blocked');

    if (issues.length === 0) {
      renderDiagSummary(ctx.body, {
        state: 'ok',
        title: 'Your browser is ready',
        line: `${os} · ${browserName}`,
        detailsHTML,
      });
      ctx.markResult('pass', `${os} · ${browserName}`);
      ctx.setButtons([{ label: 'Looks good →', primary: true, action: ctx.advance }]);
    } else {
      renderDiagSummary(ctx.body, {
        state: 'bad',
        title: "There's a browser issue",
        line: issues.join(', '),
        detailsHTML,
      });
      ctx.markResult('fail', issues.join(', '));
      ctx.setButtons([{ label: 'Got it →', primary: true, action: ctx.advance }]);
    }
  },
};
