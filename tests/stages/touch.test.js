import { describe, it, expect, beforeEach } from 'vitest';
import touch from '../../src/stages/touch.js';
import drag from '../../src/stages/drag.js';
import trackpad from '../../src/stages/trackpad.js';
import trackpadDrag from '../../src/stages/trackpad-drag.js';
import { makeCtx } from '../helpers/mock-globals.js';

describe('input stage metadata', () => {
  it.each([
    [touch, 'touch', 'Touchscreen (tap)', true],
    [drag, 'drag', 'Touchscreen (drag)', true],
    [trackpad, 'trackpad', 'Trackpad / Touchscreen (click)', undefined],
    [trackpadDrag, 'trackpad-drag', 'Trackpad / Touchscreen (drag)', undefined],
  ])('%# exports the expected id, name, skipIfNoTouch flag', (stage, id, name, skip) => {
    expect(stage.id).toBe(id);
    expect(stage.name).toBe(name);
    expect(stage.skipIfNoTouch).toBe(skip);
    expect(typeof stage.run).toBe('function');
  });
});

describe('touch stage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts the corners overlay', () => {
    touch.run(makeCtx());
    expect(document.getElementById('fs-overlay')).not.toBeNull();
    expect(document.getElementById('fs-tz-c')).not.toBeNull();
  });
});

describe('drag stage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts the drag-to-circle overlay', () => {
    drag.run(makeCtx());
    expect(document.getElementById('fs-source')).not.toBeNull();
    expect(document.getElementById('fs-drop')).not.toBeNull();
  });
});

describe('trackpad stage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts the corners overlay', () => {
    trackpad.run(makeCtx());
    expect(document.getElementById('fs-tz-tl').textContent).toBe('A');
  });
});

describe('trackpad-drag stage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts the drag-to-circle overlay', () => {
    trackpadDrag.run(makeCtx());
    expect(document.getElementById('fs-source')).not.toBeNull();
  });
});
