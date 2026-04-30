import { renderDiagSummary, updateDiagSummary } from '../ui/diag.js';

const PING_TIMEOUT_MS = 5000;
const PING_SAMPLES = 3;
const DOWNLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_BYTES = 5 * 1024 * 1024;
const BANDWIDTH_TIMEOUT_MS = 12000;
const STAGE_TIMEOUT_MS = 45000;

const HEALTHY_DOWN_MBPS = 5;
const HEALTHY_UP_MBPS = 3;
const FAIL_DOWN_MBPS = 1.5;
const SLOW_PING_MS = 600;
const FAIL_APP_PING_MS = 1500;

const APP_PING_URL = window.location.origin + '/favicon.ico';
const NET_PING_URL = 'https://www.google.com/favicon.ico';
const CF_DOWN_URL = 'https://speed.cloudflare.com/__down';
const CF_UP_URL = 'https://speed.cloudflare.com/__up';

async function ping(url) {
  const bust = url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();
  const start = performance.now();
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
  try {
    await fetch(bust, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
    return performance.now() - start;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function avgPing(url, samples = PING_SAMPLES) {
  const out = [];
  for (let i = 0; i < samples; i++) {
    const r = await ping(url);
    if (r !== null) out.push(r);
  }
  if (!out.length) return null;
  return out.reduce((a, b) => a + b, 0) / out.length;
}

function fmtPing(ms, el) {
  if (ms === null) {
    el.textContent = 'unreachable';
    el.className = 'diag-value bad';
    return;
  }
  el.textContent = `${Math.round(ms)} ms`;
  el.className = 'diag-value ' + (ms < 200 ? 'ok' : ms < SLOW_PING_MS ? 'warn' : 'bad');
}

function fmtMbps(bytes, seconds, el) {
  if (!bytes || !seconds) {
    el.textContent = 'unavailable';
    el.className = 'diag-value bad';
    return null;
  }
  const mbps = (bytes * 8) / seconds / 1_000_000;
  el.textContent = mbps.toFixed(1) + ' Mbps';
  el.className =
    'diag-value ' + (mbps >= HEALTHY_DOWN_MBPS ? 'ok' : mbps >= FAIL_DOWN_MBPS ? 'warn' : 'bad');
  return mbps;
}

async function measureDownload(bytes, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = performance.now();
  let received = 0;
  try {
    const res = await fetch(`${CF_DOWN_URL}?bytes=${bytes}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    });
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
    }
  } catch {
    /* aborted or network error — return whatever we got */
  } finally {
    clearTimeout(timer);
  }
  return { bytes: received, seconds: (performance.now() - start) / 1000 };
}

async function measureUpload(bytes, timeoutMs) {
  const payload = new Uint8Array(bytes);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = performance.now();
  try {
    await fetch(CF_UP_URL, {
      method: 'POST',
      body: payload,
      cache: 'no-store',
      signal: ctrl.signal,
    });
    return { bytes, seconds: (performance.now() - start) / 1000 };
  } catch {
    return { bytes: 0, seconds: 0 };
  } finally {
    clearTimeout(timer);
  }
}

function describeConnection() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return null;
  const parts = [];
  if (conn.effectiveType) parts.push(conn.effectiveType);
  if (conn.downlink) parts.push(conn.downlink + ' Mbps');
  if (conn.rtt) parts.push(conn.rtt + ' ms RTT');
  return parts.length ? parts.join(' · ') : 'unknown';
}

export default {
  id: 'network',
  icon: '🌐',
  name: 'Network',
  instruction: 'Measuring connection latency, reachability, and bandwidth.',
  run(ctx) {
    const detailsHTML = `
      <div class="diag-grid">
        <div class="diag-row"><span class="diag-label">Online status</span><span class="diag-value muted" id="diag-online">checking...</span></div>
        <div class="diag-row"><span class="diag-label">Connection type</span><span class="diag-value muted" id="diag-conn">checking...</span></div>
        <div class="diag-row"><span class="diag-label">Latency to app</span><span class="diag-value muted" id="diag-app">measuring...</span></div>
        <div class="diag-row"><span class="diag-label">Latency to internet</span><span class="diag-value muted" id="diag-net">measuring...</span></div>
        <div class="diag-row"><span class="diag-label">Download speed</span><span class="diag-value muted" id="diag-down">measuring...</span></div>
        <div class="diag-row"><span class="diag-label">Upload speed</span><span class="diag-value muted" id="diag-up">measuring...</span></div>
      </div>`;

    renderDiagSummary(ctx.body, {
      state: 'loading',
      title: 'Checking your connection',
      line: 'Measuring latency...',
      detailsHTML,
    });

    ctx.setStatus('', 'Running network checks...');
    ctx.setButtons([
      {
        label: 'Skip',
        action: () => {
          ctx.markResult('skip', 'User skipped');
          ctx.advance();
        },
      },
    ]);

    const onlineEl = document.getElementById('diag-online');
    onlineEl.textContent = navigator.onLine ? 'Online' : 'Offline';
    onlineEl.className = 'diag-value ' + (navigator.onLine ? 'ok' : 'bad');

    const connEl = document.getElementById('diag-conn');
    const connInfo = describeConnection();
    if (connInfo) {
      connEl.textContent = connInfo;
      connEl.className = 'diag-value';
    } else {
      connEl.textContent = 'API unavailable';
      connEl.className = 'diag-value muted';
    }

    let stageTimedOut = false;
    const stageTimeout = setTimeout(() => {
      stageTimedOut = true;
      updateDiagSummary({
        state: 'bad',
        title: "We couldn't reach the network",
        line: 'No response — check your Wi-Fi',
      });
      ctx.markResult('fail', 'Network checks timed out');
      ctx.setButtons([{ label: 'Got it →', primary: true, action: ctx.advance }]);
    }, STAGE_TIMEOUT_MS);
    ctx.addCleanup(() => clearTimeout(stageTimeout));

    (async () => {
      const [app, net] = await Promise.all([avgPing(APP_PING_URL), avgPing(NET_PING_URL)]);
      if (stageTimedOut) return;
      fmtPing(app, document.getElementById('diag-app'));
      fmtPing(net, document.getElementById('diag-net'));

      updateDiagSummary({
        state: 'loading',
        title: 'Checking your connection',
        line: 'Measuring bandwidth...',
      });

      const dl = await measureDownload(DOWNLOAD_BYTES, BANDWIDTH_TIMEOUT_MS);
      if (stageTimedOut) return;
      const downMbps = fmtMbps(dl.bytes, dl.seconds, document.getElementById('diag-down'));

      const ul = await measureUpload(UPLOAD_BYTES, BANDWIDTH_TIMEOUT_MS);
      if (stageTimedOut) return;
      const upMbps = fmtMbps(ul.bytes, ul.seconds, document.getElementById('diag-up'));

      clearTimeout(stageTimeout);

      const issues = [];
      if (!navigator.onLine) issues.push('offline');
      if (net === null && app === null) issues.push('no network');
      if (app !== null && app > FAIL_APP_PING_MS) issues.push('app very slow');
      if (downMbps !== null && downMbps < FAIL_DOWN_MBPS) issues.push('download too slow');

      const slowestPing = Math.max(app || 0, net || 0);
      const bandwidthLow =
        (downMbps !== null && downMbps < HEALTHY_DOWN_MBPS) ||
        (upMbps !== null && upMbps < HEALTHY_UP_MBPS);

      const bwLine = `${downMbps !== null ? downMbps.toFixed(1) + '↓' : '—'} / ${upMbps !== null ? upMbps.toFixed(1) + '↑' : '—'} Mbps`;
      const pingLine = `app ${app ? Math.round(app) + 'ms' : '—'} · internet ${net ? Math.round(net) + 'ms' : '—'}`;

      let state, title, line, btnLabel;
      if (issues.length > 0) {
        state = 'bad';
        title = "Your connection isn't working well";
        line = issues.join(', ');
        ctx.markResult('fail', `${line} · ${bwLine}`);
        btnLabel = 'Got it →';
      } else if (slowestPing > SLOW_PING_MS || bandwidthLow) {
        state = 'warn';
        title = 'Your connection is below the recommended level';
        line = `${pingLine} · ${bwLine}`;
        ctx.markResult('pass', line);
        btnLabel = 'Continue anyway →';
      } else {
        state = 'ok';
        title = 'Your connection looks healthy';
        line = `${pingLine} · ${bwLine}`;
        ctx.markResult('pass', line);
        btnLabel = 'Looks good →';
      }
      updateDiagSummary({ state, title, line });
      ctx.setButtons([{ label: btnLabel, primary: true, action: ctx.advance }]);
    })();
  },
};
