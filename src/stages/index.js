import browser from './browser.js';
import network from './network.js';
import webrtc from './webrtc.js';
import webcam from './webcam.js';
import mic from './mic.js';
import speaker from './speaker.js';
import touch from './touch.js';
import drag from './drag.js';
import trackpad from './trackpad.js';
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
  keyboard,
];
