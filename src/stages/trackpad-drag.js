import { runDragToCircle } from './_drag-to-circle.js';

export default {
  id: 'trackpad-drag',
  icon: '🖱️',
  name: 'Trackpad / Touchscreen (drag)',
  skipIfTouch: true,
  instruction: 'Click and drag the filled circle into the dashed target.',
  run(ctx) {
    runDragToCircle(
      {
        title: 'Drag into the target',
        subtitle: 'Click and drag the filled circle onto the dashed one.',
        statusPrefix: 'Drag in fullscreen...',
        tooltipText: 'Drag me into the other circle',
        successLabel: 'Mouse drag detected',
        failLabel: 'Mouse drag not completed',
      },
      ctx,
    );
  },
};
