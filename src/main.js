import './styles/index.css';

import { TESTS, STAGE_GROUPS } from './stages/index.js';
import { createCleanupBag } from './lib/cleanup.js';
import { hasTouchScreen } from './lib/touch.js';
import { showScreen } from './ui/screens.js';
import { updateProgress } from './ui/progress.js';
import { setStatus, setButtons } from './ui/footer.js';
import { renderTestSelector, getSelectedIds } from './ui/welcome.js';
import { showResults } from './ui/results.js';

const ADVANCE_DELAY_MS = 350;

const state = {
  index: 0,
  results: {},
  touchSupported: hasTouchScreen(),
  cleanup: createCleanupBag(),
  activeTests: TESTS,
};

function startTests() {
  state.touchSupported = hasTouchScreen();
  const selected = getSelectedIds();
  state.activeTests = TESTS.filter(
    (t) =>
      selected.has(t.id) &&
      !(t.skipIfNoTouch && !state.touchSupported) &&
      !(t.skipIfTouch && state.touchSupported),
  );
  if (state.activeTests.length === 0) return;
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

  const test = state.activeTests[index];
  if (!test) {
    showResults(state.activeTests, state.results);
    return;
  }

  updateProgress(state.activeTests, index);
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

function bindWelcome() {
  renderTestSelector(TESTS, STAGE_GROUPS, state.touchSupported, (anySelected) => {
    document.getElementById('welcome-start').disabled = !anySelected;
  });
  document.getElementById('welcome-start').addEventListener('click', startTests);
  document.getElementById('results-restart').addEventListener('click', restartTests);
}

bindWelcome();
