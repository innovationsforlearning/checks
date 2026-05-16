const STAGE_TIMEOUT_MS = 120000;

function letter(code, label) {
  return {
    id: code,
    label,
    match: (e) => e.code === code || (e.key && e.key.toLowerCase() === label.toLowerCase()),
  };
}

function digit(code, label) {
  return {
    id: code,
    label,
    match: (e) => e.code === code || e.key === label,
  };
}

function buildKeyboardLayout() {
  return [
    {
      keys: [
        digit('Digit1', '1'),
        digit('Digit2', '2'),
        digit('Digit3', '3'),
        digit('Digit4', '4'),
        digit('Digit5', '5'),
        digit('Digit6', '6'),
        digit('Digit7', '7'),
        digit('Digit8', '8'),
        digit('Digit9', '9'),
        digit('Digit0', '0'),
        { id: 'Minus', label: '-', match: (e) => e.code === 'Minus' || e.key === '-' },
        {
          id: 'Backspace',
          label: '⌫',
          wide: 'bs',
          match: (e) => e.code === 'Backspace' || e.key === 'Backspace',
        },
      ],
    },
    {
      keys: [
        { id: 'Tab', label: 'Tab', wide: 'tab', match: (e) => e.code === 'Tab' || e.key === 'Tab' },
        letter('KeyQ', 'Q'),
        letter('KeyW', 'W'),
        letter('KeyE', 'E'),
        letter('KeyR', 'R'),
        letter('KeyT', 'T'),
        letter('KeyY', 'Y'),
        letter('KeyU', 'U'),
        letter('KeyI', 'I'),
        letter('KeyO', 'O'),
        letter('KeyP', 'P'),
      ],
    },
    {
      keys: [
        {
          id: 'CapsLock',
          label: 'Caps',
          wide: 'caps',
          match: (e) => e.code === 'CapsLock' || e.key === 'CapsLock',
        },
        letter('KeyA', 'A'),
        letter('KeyS', 'S'),
        letter('KeyD', 'D'),
        letter('KeyF', 'F'),
        letter('KeyG', 'G'),
        letter('KeyH', 'H'),
        letter('KeyJ', 'J'),
        letter('KeyK', 'K'),
        letter('KeyL', 'L'),
        {
          id: 'Enter',
          label: '↵',
          wide: 'enter',
          match: (e) => e.code === 'Enter' || e.key === 'Enter' || e.code === 'NumpadEnter',
        },
      ],
    },
    {
      keys: [
        {
          id: 'ShiftLeft',
          label: '⇧',
          wide: 'shift',
          match: (e) => e.code === 'ShiftLeft' || (e.key === 'Shift' && e.location === 1),
        },
        letter('KeyZ', 'Z'),
        letter('KeyX', 'X'),
        letter('KeyC', 'C'),
        letter('KeyV', 'V'),
        letter('KeyB', 'B'),
        letter('KeyN', 'N'),
        letter('KeyM', 'M'),
        { id: 'Comma', label: ',', match: (e) => e.code === 'Comma' || e.key === ',' },
        {
          id: 'Period',
          label: '.',
          match: (e) => e.code === 'Period' || e.key === '.' || e.code === 'NumpadDecimal',
        },
        {
          id: 'ShiftRight',
          label: '⇧',
          wide: 'shift',
          match: (e) => e.code === 'ShiftRight' || (e.key === 'Shift' && e.location === 2),
        },
      ],
    },
    {
      keys: [
        {
          id: 'Space',
          label: 'Space',
          wide: 'space',
          match: (e) => e.code === 'Space' || e.key === ' ',
        },
      ],
    },
  ];
}

const EXTRAS = [
  { id: 'sym-at', label: '@', match: (e) => e.key === '@' },
  { id: 'sym-under', label: '_', match: (e) => e.key === '_' },
];

// Touch layout — letter/digit keys only, no modifiers, so keys auto-size to fill each row
function buildTouchLayout() {
  return [
    {
      keys: [
        digit('Digit1', '1'), digit('Digit2', '2'), digit('Digit3', '3'),
        digit('Digit4', '4'), digit('Digit5', '5'), digit('Digit6', '6'),
        digit('Digit7', '7'), digit('Digit8', '8'), digit('Digit9', '9'),
        digit('Digit0', '0'),
      ],
    },
    {
      keys: [
        letter('KeyQ', 'Q'), letter('KeyW', 'W'), letter('KeyE', 'E'),
        letter('KeyR', 'R'), letter('KeyT', 'T'), letter('KeyY', 'Y'),
        letter('KeyU', 'U'), letter('KeyI', 'I'), letter('KeyO', 'O'),
        letter('KeyP', 'P'),
      ],
    },
    {
      keys: [
        letter('KeyA', 'A'), letter('KeyS', 'S'), letter('KeyD', 'D'),
        letter('KeyF', 'F'), letter('KeyG', 'G'), letter('KeyH', 'H'),
        letter('KeyJ', 'J'), letter('KeyK', 'K'), letter('KeyL', 'L'),
      ],
    },
    {
      keys: [
        letter('KeyZ', 'Z'), letter('KeyX', 'X'), letter('KeyC', 'C'),
        letter('KeyV', 'V'), letter('KeyB', 'B'), letter('KeyN', 'N'),
        letter('KeyM', 'M'),
      ],
    },
  ];
}

const TOUCH_EXTRAS = [
  { id: 'sym-at', label: '@' },
  { id: 'sym-under', label: '_' },
];

const renderKey = (k) =>
  `<div class="kb-key${k.wide ? ' kb-key-' + k.wide : ''}" id="kc-${k.id}">${k.label}</div>`;

const renderTouchKey = (k) =>
  `<div class="kb-key kb-key--touch" id="kc-${k.id}">${k.label}</div>`;

function runKeyboardMode(ctx) {
  const layout = buildKeyboardLayout();
  const allKeys = [...layout.flatMap((r) => r.keys), ...EXTRAS];
  const hit = new Set();
  let passed = false;

  ctx.body.innerHTML = `
    <div class="test-prompt">
      <h2 class="test-prompt-heading" id="kb-heading">Press every key shown below</h2>
      <p class="test-prompt-sub" id="kb-sub">0 of ${allKeys.length} pressed</p>
    </div>
    <div class="kb-layout">
      ${layout.map((row) => `<div class="kb-row">${row.keys.map(renderKey).join('')}</div>`).join('')}
      <div class="kb-extras">
        <span class="kb-extras-label">Email symbols:</span>
        ${EXTRAS.map(renderKey).join('')}
      </div>
    </div>
    <input id="key-input-field" type="text" autocomplete="off">`;

  const heading = ctx.body.querySelector('#kb-heading');
  const sub = ctx.body.querySelector('#kb-sub');
  const field = document.getElementById('key-input-field');
  field.focus();

  function register(id) {
    if (hit.has(id)) return;
    hit.add(id);
    const chip = document.getElementById('kc-' + id);
    if (chip) chip.classList.add('hit');
    if (passed) return;
    sub.textContent = `${hit.size} of ${allKeys.length} pressed`;
    if (hit.size === allKeys.length) {
      passed = true;
      heading.textContent = 'All keys are working ✓';
      sub.textContent = 'Every key registered correctly.';
      ctx.markResult('pass', `${hit.size}/${allKeys.length} keys verified`);
      ctx.setButtons([{ label: 'Looks good →', primary: true, action: ctx.advance }]);
    }
  }

  const handler = (e) => {
    let matched = false;
    for (const def of allKeys) {
      if (def.match(e)) {
        register(def.id);
        matched = true;
      }
    }
    const blockDefault =
      matched ||
      e.code === 'Tab' ||
      e.key === 'Tab' ||
      e.code === 'Backspace' ||
      e.key === 'Backspace' ||
      e.code === 'Space' ||
      e.key === ' ' ||
      e.code === 'Enter' ||
      e.key === 'Enter';
    if (blockDefault) e.preventDefault();
  };
  document.addEventListener('keydown', handler, true);
  ctx.addCleanup(() => document.removeEventListener('keydown', handler, true));

  ctx.setButtons([
    {
      label: 'Skip this',
      action: () => {
        ctx.markResult('skip', 'User skipped');
        ctx.advance();
      },
    },
  ]);

  const timer = setTimeout(() => {
    if (!passed) {
      ctx.markResult('fail', `Only ${hit.size}/${allKeys.length} keys detected`);
      ctx.advance();
    }
  }, STAGE_TIMEOUT_MS);
  ctx.addCleanup(() => clearTimeout(timer));
}

function runTouchMode(ctx) {
  const layout = buildTouchLayout();
  const allKeys = [...layout.flatMap((r) => r.keys), ...TOUCH_EXTRAS];
  const hit = new Set();
  let passed = false;

  document.getElementById('test-instruction').textContent =
    'Tap every key below. Each lights up when touched.';

  ctx.body.innerHTML = `
    <div class="test-prompt">
      <h2 class="test-prompt-heading" id="kb-heading">Tap every key below</h2>
      <p class="test-prompt-sub" id="kb-sub">0 of ${allKeys.length} tapped</p>
    </div>
    <div class="kb-layout kb-layout--touch">
      ${layout.map((row) => `<div class="kb-row">${row.keys.map(renderTouchKey).join('')}</div>`).join('')}
      <div class="kb-extras">
        <span class="kb-extras-label">Also tap:</span>
        ${TOUCH_EXTRAS.map(renderTouchKey).join('')}
      </div>
    </div>`;

  const heading = ctx.body.querySelector('#kb-heading');
  const sub = ctx.body.querySelector('#kb-sub');

  function register(id) {
    if (hit.has(id)) return;
    hit.add(id);
    const chip = document.getElementById('kc-' + id);
    if (chip) chip.classList.add('hit');
    if (passed) return;
    sub.textContent = `${hit.size} of ${allKeys.length} tapped`;
    if (hit.size === allKeys.length) {
      passed = true;
      heading.textContent = 'All keys tapped ✓';
      sub.textContent = 'Touch registered across the full keyboard area.';
      ctx.markResult('pass', `${hit.size}/${allKeys.length} keys tapped`);
      ctx.setButtons([{ label: 'Looks good →', primary: true, action: ctx.advance }]);
    }
  }

  const kbEl = ctx.body.querySelector('.kb-layout--touch');
  const handler = (e) => {
    const key = e.target.closest('.kb-key--touch');
    if (!key) return;
    e.preventDefault();
    register(key.id.slice(3)); // strip 'kc-'
  };
  kbEl.addEventListener('touchstart', handler, { passive: false });
  ctx.addCleanup(() => kbEl.removeEventListener('touchstart', handler));

  ctx.setButtons([
    {
      label: 'Skip this',
      action: () => {
        ctx.markResult('skip', 'User skipped');
        ctx.advance();
      },
    },
  ]);

  const timer = setTimeout(() => {
    if (!passed) {
      ctx.markResult('fail', `Only ${hit.size}/${allKeys.length} keys tapped`);
      ctx.advance();
    }
  }, STAGE_TIMEOUT_MS);
  ctx.addCleanup(() => clearTimeout(timer));
}

export default {
  id: 'keyboard',
  icon: '⌨️',
  name: 'Keyboard',
  instruction: 'Press every key shown on the keyboard layout. Each lights up when detected.',
  run(ctx) {
    if (ctx.touchSupported) {
      runTouchMode(ctx);
    } else {
      runKeyboardMode(ctx);
    }
  },
};
