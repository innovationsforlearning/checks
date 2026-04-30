export default {
  id: 'webcam',
  icon: '📷',
  name: 'Webcam',
  instruction: 'Your camera will turn on. If you can see yourself, tap "Looks good."',
  run(ctx) {
    ctx.body.innerHTML = `
      <div class="test-prompt">
        <h2 class="test-prompt-heading">Starting your camera…</h2>
        <p class="test-prompt-sub">Allow camera access if your browser asks.</p>
      </div>
      <video id="webcam-video" autoplay muted playsinline></video>`;
    const heading = ctx.body.querySelector('.test-prompt-heading');
    const sub = ctx.body.querySelector('.test-prompt-sub');
    const video = ctx.body.querySelector('#webcam-video');

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        ctx.addStream(stream);
        video.srcObject = stream;
        heading.textContent = 'Can you see yourself?';
        sub.textContent = 'Your camera should be showing a live preview below.';
        ctx.setButtons([
          {
            label: "Yes, that's me ✓",
            primary: true,
            action: () => {
              ctx.markResult('pass', 'Camera working');
              ctx.advance();
            },
          },
          {
            label: "I don't see anything",
            action: () => {
              ctx.markResult('fail', 'No video visible');
              ctx.advance();
            },
          },
        ]);
      })
      .catch(() => {
        ctx.body.innerHTML = `
          <div class="test-prompt">
            <h2 class="test-prompt-heading">We couldn't start your camera</h2>
            <p class="test-prompt-sub">Permission was denied or no camera was found. That's okay — we'll move on.</p>
          </div>`;
        ctx.markResult('fail', 'Camera unavailable');
        ctx.setButtons([{ label: 'Got it →', primary: true, action: ctx.advance }]);
      });
  },
};
