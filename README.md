# System Check

A browser-based device readiness check. Walks a user through a sequence of short tests to verify their hardware and connection are good enough for video calls and interactive learning.

Built as a [Vite](https://vitejs.dev/) static app — vanilla JavaScript, no framework, deployable anywhere that serves static files.

## What it tests

| Stage                          | Checks                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser & device               | User agent, OS, viewport, cookies, local storage                                                                                                              |
| Network                        | Online status, connection type, latency to the app and the public internet, **download/upload bandwidth** (via Cloudflare's `speed.cloudflare.com` endpoints) |
| Video calling (WebRTC)         | WebRTC support, STUN reachability, ICE candidate types, public IP                                                                                             |
| Webcam                         | Live preview — user confirms they can see themselves                                                                                                          |
| Microphone                     | Live level meter with auto voice detection                                                                                                                    |
| Speakers                       | Plays a tone; user confirms they heard it                                                                                                                     |
| Touchscreen (tap)              | Tap-the-corners (skipped on non-touch devices)                                                                                                                |
| Touchscreen (drag)             | Drag-to-target gesture (skipped on non-touch devices)                                                                                                         |
| Trackpad / Touchscreen (click) | Click-the-corners                                                                                                                                             |
| Trackpad / Touchscreen (drag)  | Drag-to-target gesture                                                                                                                                        |
| Keyboard                       | On-screen keyboard layout that lights up each key as it's pressed                                                                                             |

Each stage produces a `pass` / `warn` / `fail` / `skip` result, and the final screen summarises the run.

## Requirements

- Node.js 18 or newer
- A modern browser with permissions for camera, mic, and (if testing) touch input

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Production build:

```bash
npm run build    # outputs to dist/
npm run preview  # serve the built bundle locally
```

`dist/` is fully static — host it on any object store, CDN, or static-site service.

## Deploying

### Heroku (Heroku Pipelines)

This repo is set up to deploy as a Heroku Node.js app:

- `package.json` declares `engines.node ≥ 18`, a `heroku-postbuild` step that runs `vite build`, and a `start` script that serves `dist/` via [`serve`](https://www.npmjs.com/package/serve) on `$PORT`.
- `Procfile` runs `npm start`.
- `app.json` declares the app for Pipelines / Review Apps.

Create the app and push:

```bash
heroku create system-check --stack heroku-24
git push heroku main
heroku open
```

For a pipeline:

```bash
heroku pipelines:create system-check -a system-check-staging
heroku pipelines:add system-check -a system-check-production -s production
```

Promote staging → production via the dashboard or `heroku pipelines:promote`.

### Anywhere else

Run `npm run build` and upload `dist/` to your host of choice (S3, Netlify, Cloudflare Pages, GitHub Pages, nginx, etc.). There are no runtime dependencies.

## Tests

Vitest with the jsdom environment — no browser, no network.

```bash
npm test            # one-shot run
npm run test:watch  # watch mode
npm run test:coverage
```

Stage tests live in `tests/stages/` and mock browser APIs (`getUserMedia`, `RTCPeerConnection`, `fetch`, `AudioContext`) via [tests/helpers/mock-globals.js](./tests/helpers/mock-globals.js). Setup shims for jsdom gaps (pointer capture, `matchMedia`, layout) are in [tests/setup.js](./tests/setup.js).

## Network thresholds

The network stage's verdict combines latency and bandwidth. Thresholds live at the top of [src/stages/network.js](./src/stages/network.js):

- **Healthy** — latency < 150 ms to both targets, download ≥ 10 Mbps, upload ≥ 3 Mbps
- **Warn** — any of: latency > 150 ms (moderate) or > 400 ms (high), download < 10 Mbps, or upload < 3 Mbps
- **Fail** — offline, no network response, app latency > 1500 ms, slowest latency > 800 ms, or download < 1.5 Mbps

Bandwidth uses Cloudflare's public speed-test endpoints (`__down`, `__up`) with a 12-second cap per direction, so a stuck connection still produces a result rather than hanging the stage. The whole stage is bounded by a 45-second timeout.

## Project layout

```
index.html        # static shell — no app logic
src/
  main.js         # bootstrap + stage runner
  assets/         # static assets
  lib/            # cleanup bag + small helpers
  stages/         # one file per test
  styles/         # CSS, split by concern
  ui/             # screens, progress, footer, diag, overlay, results
tests/            # vitest specs (helpers/, lib/, stages/, ui/)
Procfile          # Heroku web process
app.json          # Heroku app manifest
vite.config.js    # Vite config
vitest.config.js  # Vitest config (jsdom env, setup file)
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on the stage contract and how to add a new test.

## License

MIT — see [LICENSE](./LICENSE).
