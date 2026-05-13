// Time-domain RMS amplitude that counts as "speech-like" energy.
// Byte values are 0–255 centered on 128; normal silence sits ~1–2 RMS,
// quiet speech ~6–10, normal speech 15+.
const VOICE_RMS_THRESHOLD = 6;
const REQUIRED_HIGH_FRAMES = 6;
const STAGE_TIMEOUT_MS = 20000;
const METER_BARS = 16;
const FFT_SIZE = 256;

// Some devices (notably Logitech webcams on macOS) hand back an audio track
// that ends immediately — usually because the device is still being released
// from the previous stage's video stream. A short delay + auto-retry resolves
// it most of the time.
const PRE_REQUEST_DELAY_MS = 300;
const ENDED_RETRY_DELAY_MS = 600;
const MAX_AUTO_RETRIES = 2;

function buildBody() {
  return `
    <div class="test-prompt">
      <h2 class="test-prompt-heading" id="mic-heading">Say something out loud</h2>
      <p class="test-prompt-sub" id="mic-sub">Watch the bars move as you speak. Allow microphone access if your browser asks.</p>
    </div>
    <div id="mic-meter-wrap">
      <div class="meter-bars" id="meter-bars">
        ${Array(METER_BARS)
          .fill(0)
          .map((_, i) => `<div class="meter-bar" id="bar-${i}" style="height:6px"></div>`)
          .join('')}
      </div>
    </div>`;
}

function renderError(ctx, message, onRetry) {
  ctx.body.innerHTML = `
    <div class="test-prompt">
      <h2 class="test-prompt-heading">${message.heading}</h2>
      <p class="test-prompt-sub">${message.sub}</p>
    </div>`;
  ctx.setButtons([
    { label: 'Try again', action: onRetry },
    {
      label: 'Skip',
      action: () => {
        ctx.markResult('fail', message.result);
        ctx.advance();
      },
    },
  ]);
}

export default {
  id: 'mic',
  icon: '🎙️',
  name: 'Microphone',
  instruction:
    'Say something out loud. Watch the level meter move — it will auto-detect your voice.',
  run(ctx) {
    let attempts = 0;

    const start = () => {
      attempts++;
      ctx.body.innerHTML = buildBody();
      const heading = ctx.body.querySelector('#mic-heading');
      const sub = ctx.body.querySelector('#mic-sub');

      ctx.setButtons([
        {
          label: 'Try a different mic',
          action: () => {
            attempts = 0;
            start();
          },
        },
        {
          label: "I don't see anything moving",
          action: () => {
            ctx.markResult('fail', 'No mic detected');
            ctx.advance();
          },
        },
      ]);

      let passed = false;
      let stopped = false;
      ctx.addCleanup(() => {
        stopped = true;
      });

      const wait = (ms) => new Promise((r) => setTimeout(r, ms));

      const requestStream = async () => {
        // Pause briefly so the prior stage's hardware can fully release.
        if (attempts === 1) await wait(PRE_REQUEST_DELAY_MS);
        return navigator.mediaDevices.getUserMedia({ audio: true });
      };

      requestStream()
        .then((stream) => {
          if (stopped) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          ctx.addStream(stream);

          const track = stream.getAudioTracks()[0];

          // If the track is born ended (or ends within a moment), retry.
          if (track && track.readyState === 'ended') {
            return handleEndedTrack();
          }

          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          ctx.addAudioContext(audioCtx);

          const tryResume = () => audioCtx.resume().catch(() => {});
          tryResume();
          audioCtx.onstatechange = () => {
            if (audioCtx.state !== 'running') tryResume();
          };

          if (track) {
            track.onended = () => {
              if (!passed && !stopped) handleEndedTrack();
            };
          }

          const src = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = FFT_SIZE;
          analyser.smoothingTimeConstant = 0.4;
          src.connect(analyser);

          // Workaround for a Chromium quirk where samples don't flow through a
          // MediaStreamSource until the graph reaches the destination. Routing
          // through a silent gain node keeps the path "live" without echoing
          // the user's mic back to them.
          const silentGain = audioCtx.createGain();
          silentGain.gain.value = 0;
          analyser.connect(silentGain);
          silentGain.connect(audioCtx.destination);

          const timeData = new Uint8Array(analyser.fftSize);
          const freqData = new Uint8Array(analyser.frequencyBinCount);
          const bars = Array.from(ctx.body.querySelectorAll('.meter-bar'));
          const binStep = Math.max(
            1,
            Math.floor((analyser.frequencyBinCount - 1) / bars.length),
          );
          let highCount = 0;

          function tick() {
            if (stopped) return;
            analyser.getByteTimeDomainData(timeData);
            let sumSq = 0;
            for (let i = 0; i < timeData.length; i++) {
              const v = timeData[i] - 128;
              sumSq += v * v;
            }
            const rms = Math.sqrt(sumSq / timeData.length);

            analyser.getByteFrequencyData(freqData);
            for (let i = 0; i < bars.length; i++) {
              const v = freqData[1 + i * binStep] || 0;
              const h = Math.min(72, (v / 255) * 72);
              bars[i].style.height = Math.max(6, h) + 'px';
              bars[i].classList.toggle('active', h > 10);
            }

            if (!passed && rms > VOICE_RMS_THRESHOLD) {
              highCount++;
              if (highCount > REQUIRED_HIGH_FRAMES) {
                passed = true;
                heading.textContent = 'We can hear you ✓';
                sub.textContent = 'Your microphone is working.';
                ctx.markResult('pass', 'Microphone working');
                ctx.setButtons([
                  { label: 'Sounds good →', primary: true, action: ctx.advance },
                ]);
              }
            } else if (!passed && rms < 1) {
              highCount = 0;
            }

            requestAnimationFrame(tick);
          }
          tick();

          const timer = setTimeout(() => {
            if (!passed && !stopped) {
              ctx.markResult('fail', 'No audio detected');
              ctx.advance();
            }
          }, STAGE_TIMEOUT_MS);
          ctx.addCleanup(() => clearTimeout(timer));
        })
        .catch(() => {
          renderError(
            ctx,
            {
              heading: "We couldn't start your microphone",
              sub: 'Permission was denied or no microphone was found. Check your browser permissions and try again.',
              result: 'Mic unavailable',
            },
            () => {
              attempts = 0;
              start();
            },
          );
        });

      function handleEndedTrack() {
        if (stopped) return;
        stopped = true;
        if (attempts < MAX_AUTO_RETRIES) {
          if (sub) sub.textContent = 'Trying again — your mic was busy for a moment…';
          setTimeout(start, ENDED_RETRY_DELAY_MS);
        } else {
          renderError(
            ctx,
            {
              heading: "Your microphone isn't responding",
              sub: 'The track ended before any audio came through. Close any app using the mic (Zoom, etc.), check macOS Privacy → Microphone, then retry.',
              result: 'Audio track ended immediately',
            },
            () => {
              attempts = 0;
              start();
            },
          );
        }
      }
    };

    start();
  },
};
