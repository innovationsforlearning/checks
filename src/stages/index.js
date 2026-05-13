import browser from './browser.js';
import network from './network.js';
import webrtc from './webrtc.js';
import webcam from './webcam.js';
import mic from './mic.js';
import speaker from './speaker.js';
import touch from './touch.js';
import drag from './drag.js';
import trackpad from './trackpad.js';
import trackpadDrag from './trackpad-drag.js';
import keyboard from './keyboard.js';

/**
 * Ordered list of test stages. Each stage is a module exporting:
 *   { id, icon, name, instruction, skipIfNoTouch?, run(ctx) }
 *
 * The order of this array drives the order users experience the checks.
 */
export const TESTS = [
  browser,
  network,
  webrtc,
  webcam,
  mic,
  speaker,
  touch,
  drag,
  trackpad,
  trackpadDrag,
  keyboard,
];

// Groups drive the welcome-screen checklist. Each entry lists stage ids in
// the order they should appear in that group; flattening the groups must
// yield the same ordering as TESTS so the run sequence stays predictable.
export const STAGE_GROUPS = [
  { label: 'Connectivity', ids: ['browser', 'network', 'webrtc'] },
  { label: 'Hardware', ids: ['webcam', 'mic', 'speaker'] },
  { label: 'Input', ids: ['touch', 'drag', 'trackpad', 'trackpad-drag', 'keyboard'] },
];
