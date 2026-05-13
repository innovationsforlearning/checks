import { renderDiagSummary, updateDiagSummary } from '../ui/diag.js';

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];
const STAGE_TIMEOUT_MS = 6000;

const DESCRIPTIONS = {
  ok: 'Your network lets your browser open direct video and audio connections, so live class will work end-to-end.',
  bad: 'Something on your network — usually a firewall, VPN, or strict school policy — is blocking the connections live video calls need. You may see a black screen or no audio in class.',
  unsupported: 'This browser is missing the live video and audio features needed for class. Try a current version of Chrome, Edge, Safari, or Firefox.',
};

export default {
  id: 'webrtc',
  icon: '📡',
  name: 'Video calling',
  instruction: 'Checking if your network allows real-time video connections.',
  run(ctx) {
    const detailsHTML = `
      <div class="diag-grid">
        <div class="diag-row"><span class="diag-label">WebRTC support</span><span class="diag-value muted" id="diag-rtc">checking...</span></div>
        <div class="diag-row"><span class="diag-label">STUN reachable</span><span class="diag-value muted" id="diag-stun">checking...</span></div>
        <div class="diag-row"><span class="diag-label">Candidate types</span><span class="diag-value muted" id="diag-cand">gathering...</span></div>
        <div class="diag-row"><span class="diag-label">Public IP detected</span><span class="diag-value muted" id="diag-ip">—</span></div>
      </div>`;

    renderDiagSummary(ctx.body, {
      state: 'loading',
      title: 'Checking video calling',
      description: 'Confirming your network allows the live video and audio connections class needs.',
      line: 'Testing connection to video servers...',
      detailsHTML,
    });

    ctx.setStatus('', 'Testing video call connectivity...');

    const rtcEl = document.getElementById('diag-rtc');
    const stunEl = document.getElementById('diag-stun');
    const candEl = document.getElementById('diag-cand');
    const ipEl = document.getElementById('diag-ip');

    if (!window.RTCPeerConnection) {
      rtcEl.textContent = 'Not supported';
      rtcEl.className = 'diag-value bad';
      updateDiagSummary({
        state: 'bad',
        title: "Video calls aren't supported",
        description: DESCRIPTIONS.unsupported,
      });
      ctx.markResult('fail', 'WebRTC not supported');
      ctx.setButtons([{ label: 'Got it →', primary: true, action: ctx.advance }]);
      return;
    }
    rtcEl.textContent = 'Yes';
    rtcEl.className = 'diag-value ok';

    let pc;
    let resolved = false;
    const types = new Set();

    const cleanup = () => {
      if (pc) {
        try {
          pc.close();
        } catch {}
        pc = null;
      }
    };
    ctx.addCleanup(cleanup);

    ctx.setButtons([
      {
        label: 'Skip',
        action: () => {
          ctx.markResult('skip', 'User skipped');
          ctx.advance();
        },
      },
    ]);

    try {
      pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      pc.createDataChannel('probe');

      pc.onicecandidate = (e) => {
        if (!e.candidate || resolved) return;
        const c = e.candidate.candidate || '';
        const parts = c.split(' ');
        const typIdx = parts.indexOf('typ');
        const typ = typIdx >= 0 ? parts[typIdx + 1] : '';
        if (typ) types.add(typ);
        candEl.textContent = [...types].join(', ');
        candEl.className = 'diag-value';

        if (typ === 'srflx') {
          const ip = parts[4];
          ipEl.textContent = ip || 'detected';
          ipEl.className = 'diag-value';
          stunEl.textContent = 'Yes';
          stunEl.className = 'diag-value ok';
          resolved = true;
          updateDiagSummary({
            state: 'ok',
            title: 'Video calling is ready',
            description: DESCRIPTIONS.ok,
          });
          ctx.markResult('pass', 'STUN reachable · video calling ready');
          ctx.setButtons([{ label: 'Looks good →', primary: true, action: ctx.advance }]);
          cleanup();
        }
      };

      pc.createOffer().then((offer) => pc && pc.setLocalDescription(offer));

      const timer = setTimeout(() => {
        if (resolved) return;
        stunEl.textContent = 'No';
        stunEl.className = 'diag-value bad';
        const hasOnlyHost = types.size > 0 && [...types].every((t) => t === 'host');
        const summary = hasOnlyHost
          ? 'your network may be blocking video calls'
          : "we couldn't reach the video servers";
        updateDiagSummary({
          state: 'bad',
          title: 'Video calls may not work here',
          description: DESCRIPTIONS.bad,
        });
        ctx.markResult('fail', summary);
        ctx.setButtons([{ label: 'Continue anyway →', primary: true, action: ctx.advance }]);
        cleanup();
      }, STAGE_TIMEOUT_MS);
      ctx.addCleanup(() => clearTimeout(timer));
    } catch (err) {
      rtcEl.textContent = 'Error: ' + err.message;
      rtcEl.className = 'diag-value bad';
      updateDiagSummary({
        state: 'bad',
        title: "Video calling didn't start",
        description: DESCRIPTIONS.bad,
      });
      ctx.markResult('fail', 'WebRTC error: ' + err.message);
      ctx.setButtons([{ label: 'Got it →', primary: true, action: ctx.advance }]);
    }
  },
};
