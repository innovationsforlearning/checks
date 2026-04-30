const TONE_HZ = 440;
const TONE_DURATION_S = 1.5;
const WAVE_BARS = 7;

export default {
  id: 'speaker',
  icon: '🔊',
  name: 'Speakers',
  instruction:
    'A tone will play. Turn your volume up if needed, then confirm whether you heard it.',
  run(ctx) {
    ctx.body.innerHTML = `
      <div class="test-prompt">
        <h2 class="test-prompt-heading">Did you hear that?</h2>
        <p class="test-prompt-sub">A short tone is playing now. Turn your volume up if you missed it.</p>
      </div>
      <div id="speaker-vis">
        ${Array(WAVE_BARS)
          .fill(0)
          .map(
            (_, i) =>
              `<div class="wave-bar" id="wb-${i}" style="animation-delay:${i * 0.1}s; height:6px"></div>`,
          )
          .join('')}
      </div>`;

    function play() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.addAudioContext(audioCtx);
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(TONE_HZ, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + TONE_DURATION_S);
        osc.start();
        osc.stop(audioCtx.currentTime + TONE_DURATION_S);
        const bars = ctx.body.querySelectorAll('.wave-bar');
        bars.forEach((b) => b.classList.add('playing'));
        const stopAnim = setTimeout(
          () => bars.forEach((b) => b.classList.remove('playing')),
          TONE_DURATION_S * 1000,
        );
        ctx.addCleanup(() => clearTimeout(stopAnim));
      } catch {}
    }

    const playSoon = setTimeout(play, 300);
    ctx.addCleanup(() => clearTimeout(playSoon));

    ctx.setButtons([
      { label: '↺ Play again', action: play },
      {
        label: "I didn't hear it",
        action: () => {
          ctx.markResult('fail', 'No audio heard');
          ctx.advance();
        },
      },
      {
        label: 'Yes, I heard it ✓',
        primary: true,
        action: () => {
          ctx.markResult('pass', 'Speakers working');
          ctx.advance();
        },
      },
    ]);
  },
};
