const VOICE_THRESHOLD = 18;
const REQUIRED_HIGH_FRAMES = 8;
const STAGE_TIMEOUT_MS = 12000;
const METER_BARS = 16;

export default {
  id: 'mic',
  icon: '🎙️',
  name: 'Microphone',
  instruction:
    'Say something out loud. Watch the level meter move — it will auto-detect your voice.',
  run(ctx) {
    ctx.body.innerHTML = `
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

    const heading = ctx.body.querySelector('#mic-heading');
    const sub = ctx.body.querySelector('#mic-sub');
    let passed = false;
    let stopped = false;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        ctx.addStream(stream);
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.addAudioContext(audioCtx);
        ctx.addCleanup(() => {
          stopped = true;
        });

        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let highCount = 0;

        function tick() {
          if (stopped) return;
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          const bars = ctx.body.querySelectorAll('.meter-bar');
          bars.forEach((bar, i) => {
            const h = Math.min(60, (data[i * 2] / 255) * 60);
            bar.style.height = Math.max(6, h) + 'px';
            bar.classList.toggle('active', h > 10);
          });
          if (avg > VOICE_THRESHOLD && !passed) {
            highCount++;
            if (highCount > REQUIRED_HIGH_FRAMES) {
              passed = true;
              heading.textContent = 'We can hear you ✓';
              sub.textContent = 'Your microphone is working.';
              ctx.markResult('pass', 'Microphone working');
              ctx.setButtons([{ label: 'Sounds good →', primary: true, action: ctx.advance }]);
            }
          }
          requestAnimationFrame(tick);
        }
        tick();

        ctx.setButtons([
          {
            label: "I don't see anything moving",
            action: () => {
              ctx.markResult('fail', 'No mic detected');
              ctx.advance();
            },
          },
        ]);

        const timer = setTimeout(() => {
          if (!passed) {
            ctx.markResult('fail', 'No audio detected');
            ctx.advance();
          }
        }, STAGE_TIMEOUT_MS);
        ctx.addCleanup(() => clearTimeout(timer));
      })
      .catch(() => {
        ctx.body.innerHTML = `
          <div class="test-prompt">
            <h2 class="test-prompt-heading">We couldn't start your microphone</h2>
            <p class="test-prompt-sub">Permission was denied or no microphone was found. That's okay — we'll move on.</p>
          </div>`;
        ctx.markResult('fail', 'Mic unavailable');
        ctx.setButtons([{ label: 'Got it →', primary: true, action: ctx.advance }]);
      });
  },
};
