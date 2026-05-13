import { runDragToCircle } from './_drag-to-circle.js';

export default {
  id: 'drag',
  icon: '↔️',
  name: 'Touchscreen (drag)',
  instruction: 'Drag the filled circle into the dashed target.',
  skipIfNoTouch: true,
  run(ctx) {
    runDragToCircle(
      {
        title: 'Drag into the target',
        subtitle: 'Press and slide the filled circle onto the dashed one.',
        statusPrefix: 'Drag in fullscreen...',
        tooltipText: 'Drag me into the other circle',
        successLabel: 'Touch drag detected',
        failLabel: 'Touch drag not completed',
      },
      ctx,
    );
  },
};
