# Contributing

Thanks for considering a contribution. This project is a small Vite + vanilla-JS app with no framework, no build dependencies beyond Vite, and no test suite — keep changes lean.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

## Project layout

```
index.html               # static shell — no app logic lives here
src/
  main.js                # bootstrap, stage runner, results state
  results.js             # final results screen renderer
  lib/
    cleanup.js           # CleanupBag — registers timeouts, streams, audio
                         # contexts, and listeners that get torn down between
                         # stages
    touch.js             # touchscreen feature detection
  ui/
    screens.js           # screen show/hide
    progress.js          # progress bar
    footer.js            # status text + button row
    diag.js              # diag-summary card (used by browser/network/webrtc)
    overlay.js           # fullscreen overlay mount/teardown
  stages/
    index.js             # ordered TESTS array
    browser.js           # 💻 browser & device facts
    network.js           # 🌐 latency + bandwidth
    webrtc.js            # 📡 STUN reachability
    webcam.js            # 📷 camera preview
    mic.js               # 🎙️ live level meter
    speaker.js           # 🔊 tone playback
    touch.js             # 👆 touch corners + drag-to-drop
    drag.js              # ↔️ horizontal drag gesture
    trackpad.js          # ⬛ click corners + drag-to-drop
    keyboard.js          # ⌨️ on-screen keyboard layout
    _corners-drag.js     # shared overlay used by touch + trackpad
  styles/
    index.css            # CSS entry point
    base.css             # reset, vars, typography, buttons, fade
    screens.css          # welcome / test / results screens + progress
    diag.css             # diagnostic summary card + grid
    stages.css           # per-stage components (mic meter, kb, etc.)
    overlay.css          # fullscreen overlay (touch/drag/trackpad)
    results.css          # final results list
```

## Adding a new stage

1. Create `src/stages/your-stage.js` exporting the standard descriptor:

   ```js
   export default {
     id: 'your-stage',
     icon: '🔧',
     name: 'Your stage',
     instruction: 'One short sentence shown above the test body.',
     // skipIfNoTouch: true,   // optional — auto-skip on non-touch devices
     run(ctx) {
       // ctx.body            — element to render into
       // ctx.markResult(s, l) — record 'pass' | 'fail' | 'skip' with a label
       // ctx.advance()        — move to the next stage
       // ctx.setStatus(t, m)  — footer status text
       // ctx.setButtons([...]) — footer button row
       // ctx.addCleanup(fn)   — register a teardown callback
       // ctx.addStream(s)     — auto-stop a MediaStream on advance
       // ctx.addAudioContext(c) — auto-close an AudioContext on advance
     },
   };
   ```

2. Import it into `src/stages/index.js` and add it to the `TESTS` array at the desired position.
3. If your stage needs styles, add a clearly-labeled section to `src/styles/stages.css` (or a new file imported from `index.css`).

The runner gives every stage a fresh `CleanupBag`. Anything you register via `addCleanup` / `addStream` / `addAudioContext` is torn down automatically when the user advances — so you don't need to manage stop/close lifecycles yourself.

## Code style

Run Prettier before committing:

```bash
npm run format
```

There is no linter or test suite. Most stages exercise real hardware (camera, mic, touch) which is hard to test in CI; please test changes by hand in a browser.

## Pull requests

- Keep PRs focused — one stage or fix per PR is ideal.
- Don't introduce frameworks, TypeScript, or transitive runtime deps without discussion.
- Update the README if you change user-visible behavior or thresholds.
