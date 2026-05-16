import { renderDiagSummary, updateDiagSummary } from '../ui/diag.js';

const PING_TIMEOUT_MS = 5000;
const PING_SAMPLES = 3;
const DOWNLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_BYTES = 5 * 1024 * 1024;
const BANDWIDTH_TIMEOUT_MS = 12000;
const STAGE_TIMEOUT_MS = 45000;

const HEALTHY_DOWN_MBPS = 10;
const HEALTHY_UP_MBPS = 3;
const WEAK_DOWN_MBPS = 3;
const WEAK_UP_MBPS = 1;
const FAIL_DOWN_MBPS = 1.5;
const HEALTHY_PING_MS = 150;
const SLOW_PING_MS = 400;

const DESCRIPTIONS = {
  ok: 'Video calls, screen sharing, and uploads should all run smoothly. Pages will load quickly and audio should stay clear.',
  warn: 'Video calls should still work, but expect occasional choppiness, lower video quality, or slower uploads when others are online with you.',
  bad: 'Video calls will likely freeze, drop out, or fail to connect. You may also have trouble loading pages or signing in.',
};

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
  el.className =
    'diag-value ' + (ms < HEALTHY_PING_MS ? 'ok' : ms < SLOW_PING_MS ? 'warn' : 'bad');
}

function fmtMbps(bytes, seconds, el, healthyThreshold, weakThreshold) {
  if (!bytes || !seconds) {
    el.textContent = 'unavailable';
    el.className = 'diag-value bad';
    return null;
  }
  const mbps = (bytes * 8) / seconds / 1_000_000;
  el.textContent = mbps.toFixed(1) + ' Mbps';
  el.className =
    'diag-value ' +
    (mbps >= healthyThreshold ? 'ok' : mbps >= weakThreshold ? 'warn' : 'bad');
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
  name: 'Internet connection',
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
      description: 'Measuring how quickly your network responds and how much data it can move.',
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
        description: DESCRIPTIONS.bad,
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
        description: 'Measuring how much data your connection can move up and down.',
      });

      const dl = await measureDownload(DOWNLOAD_BYTES, BANDWIDTH_TIMEOUT_MS);
      if (stageTimedOut) return;
      const downMbps = fmtMbps(
        dl.bytes,
        dl.seconds,
        document.getElementById('diag-down'),
        HEALTHY_DOWN_MBPS,
        WEAK_DOWN_MBPS,
      );

      const ul = await measureUpload(UPLOAD_BYTES, BANDWIDTH_TIMEOUT_MS);
      if (stageTimedOut) return;
      const upMbps = fmtMbps(
        ul.bytes,
        ul.seconds,
        document.getElementById('diag-up'),
        HEALTHY_UP_MBPS,
        WEAK_UP_MBPS,
      );

      clearTimeout(stageTimeout);

      const failures = [];
      if (!navigator.onLine) failures.push('offline');
      if (net === null && app === null) failures.push('no network');
      if (downMbps !== null && downMbps < FAIL_DOWN_MBPS) failures.push('download too slow');
      if (net !== null && net > SLOW_PING_MS * 2) failures.push('very high latency');

      const weaknesses = [];
      if (net !== null && net > SLOW_PING_MS) weaknesses.push('high latency');
      else if (net !== null && net > HEALTHY_PING_MS) weaknesses.push('moderate latency');
      if (downMbps !== null && downMbps < HEALTHY_DOWN_MBPS) weaknesses.push('limited download');
      if (upMbps !== null && upMbps < HEALTHY_UP_MBPS) weaknesses.push('limited upload');

      const bwLine = `${downMbps !== null ? downMbps.toFixed(1) + '↓' : '—'} / ${upMbps !== null ? upMbps.toFixed(1) + '↑' : '—'} Mbps`;
      const pingLine = `internet ${net !== null ? Math.round(net) + 'ms' : '—'}`;

      let state, title, description, btnLabel;
      if (failures.length > 0) {
        state = 'bad';
        title = "Your connection isn't working well";
        description = DESCRIPTIONS.bad;
        ctx.markResult('fail', `${failures.join(', ')} · ${bwLine}`);
        btnLabel = 'Got it →';
      } else if (weaknesses.length > 0) {
        state = 'warn';
        title = 'Your connection is weaker than recommended';
        description = DESCRIPTIONS.warn;
        ctx.markResult('pass', `weak: ${weaknesses.join(', ')} · ${pingLine} · ${bwLine}`);
        btnLabel = 'Continue anyway →';
      } else {
        state = 'ok';
        title = 'Your connection looks healthy';
        description = DESCRIPTIONS.ok;
        ctx.markResult('pass', `${pingLine} · ${bwLine}`);
        btnLabel = 'Looks good →';
      }
      updateDiagSummary({ state, title, description });
      ctx.setButtons([{ label: btnLabel, primary: true, action: ctx.advance }]);
    })();
  },
};
