import './styles/index.css';

import { TESTS } from './stages/index.js';
import { createCleanupBag } from './lib/cleanup.js';
import { hasTouchScreen } from './lib/touch.js';
import { showScreen } from './ui/screens.js';
import { updateProgress } from './ui/progress.js';
import { setStatus, setButtons } from './ui/footer.js';
import { showResults } from './results.js';

const ADVANCE_DELAY_MS = 350;

const state = {
  index: 0,
  results: {},
  touchSupported: hasTouchScreen(),
  cleanup: createCleanupBag(),
};

function startTests() {
  state.touchSupported = hasTouchScreen();
  state.index = 0;
  state.results = {};
  showScreen('test');
  runTest(state.index);
}

function buildContext(test, body) {
  const advance = () => advanceTest();
  return {
    body,
    touchSupported: state.touchSupported,
    markResult(status, label) {
      state.results[test.id] = { status, label };
    },
    advance,
    setStatus,
    setButtons,
    addCleanup: state.cleanup.add,
    addStream: state.cleanup.addStream,
    addAudioContext: state.cleanup.addAudioContext,
    addListener: state.cleanup.addListener,
  };
}

function runTest(index) {
  state.cleanup.run();

  const test = TESTS[index];
  if (!test) {
    showResults(TESTS, state.results, state.touchSupported);
    return;
  }

  if (test.skipIfNoTouch && !state.touchSupported) {
    state.results[test.id] = { status: 'skip', label: 'No touchscreen detected' };
    advanceTest();
    return;
  }

  updateProgress(TESTS, index, state.touchSupported);
  document.getElementById('test-title').textContent = test.name;
  document.getElementById('test-instruction').textContent = test.instruction;

  const statusEl = document.getElementById('test-status-label');
  statusEl.className = 'test-status';
  statusEl.textContent = 'Ready';

  document.getElementById('test-btns').innerHTML = '';

  const body = document.getElementById('test-body');
  body.classList.remove('fade-in');
  void body.offsetWidth;
  body.classList.add('fade-in');
  body.innerHTML = '';

  state.cleanup = createCleanupBag();
  const ctx = buildContext(test, body);
  test.run(ctx);
}

function advanceTest() {
  state.cleanup.run();
  state.index++;
  setTimeout(() => runTest(state.index), ADVANCE_DELAY_MS);
}

function restartTests() {
  state.cleanup.run();
  state.index = 0;
  state.results = {};
  showScreen('test');
  runTest(0);
}

function showWelcome() {
  state.cleanup.run();
  showScreen('welcome');
}

function bindWelcome() {
  document.getElementById('welcome-start').addEventListener('click', startTests);
  document.getElementById('results-restart').addEventListener('click', restartTests);
  document.getElementById('results-done').addEventListener('click', showWelcome);
}

bindWelcome();
