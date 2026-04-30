import { runCornersAndDrag } from './_corners-drag.js';

export default {
  id: 'touch',
  icon: '👆',
  name: 'Touchscreen (tap & drag)',
  instruction: 'Tap each of the four corners, then drag the circle into the target.',
  skipIfNoTouch: true,
  run(ctx) {
    runCornersAndDrag(
      {
        title: 'Tap each corner, then drag',
        subtitle: 'Drag the filled circle into the dashed one.',
        statusPrefix: 'Tap & drag in fullscreen...',
        tooltipText: 'Drag me into the other circle',
        successLabel: 'Tap & drag passed',
        failPrefix: '',
        usePointerCornerDown: true,
      },
      ctx,
    );
  },
};
