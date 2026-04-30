# System Check

A browser-based device readiness check. Walks a user through a sequence of short tests to verify their hardware and connection are good enough for video calls and interactive learning.

Built as a single static page powered by [Vite](https://vitejs.dev/).

## What it tests

| Stage | Checks |
| --- | --- |
| Browser & device | User agent, OS, viewport — captured for support context |
| Network | Online status, connection type, latency to the app and the public internet, **download/upload bandwidth** (via Cloudflare's `speed.cloudflare.com` endpoints) |
| Video calling (WebRTC) | WebRTC support, STUN reachability, ICE candidate types, public IP |
| Webcam | Live preview — user confirms they can see themselves |
| Microphone | Live level meter with auto voice detection |
| Speakers | Plays a tone; user confirms they heard it |
| Touchscreen | Tap-the-corners and drag-to-target (skipped on non-touch devices) |
| Trackpad / Mouse | Click-the-corners and drag-to-target |
| Keyboard | On-screen keyboard layout lights up each key as it's pressed |

Each stage produces a pass / warn / fail / skip result, and the final screen summarises the run.

## Requirements

- Node.js 18+ (for the dev server and build)
- A modern browser with permissions for camera, mic, and (if testing) touch input

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server (http://localhost:5173)
```

For a production build:

```bash
npm run build    # outputs to dist/
npm run preview  # serve the built bundle locally
```

The page is fully static — `dist/` can be hosted anywhere (S3, Netlify, Cloudflare Pages, GitHub Pages, etc.).

## Network thresholds

The network stage's verdict combines latency and bandwidth:

- **Healthy**: latency < 600 ms to both targets, download ≥ 5 Mbps, upload ≥ 3 Mbps
- **Warn**: any of latency > 600 ms, download < 5 Mbps, or upload < 3 Mbps
- **Fail**: offline, no network response, app latency > 1500 ms, or download < 1.5 Mbps

Bandwidth measurement uses Cloudflare's public speed-test endpoints (`__down`, `__up`) with a 12-second cap per direction, so a stuck connection still produces a result rather than hanging the stage.

## Project layout

```
index.html       # entire app — markup, styles, and test logic in one file
vite.config.js   # Vite config
package.json     # scripts and dev dependency on Vite
```

The app is intentionally kept as a single self-contained HTML file so it can be served as a static asset with no runtime dependencies.
