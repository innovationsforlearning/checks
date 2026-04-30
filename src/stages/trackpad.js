import { runCornersAndDrag } from './_corners-drag.js';

export default {
  id: 'trackpad',
  icon: '⬛',
  name: 'Trackpad / Mouse',
  instruction: 'Click each of the four corners, then drag the circle into the target.',
  run(ctx) {
    runCornersAndDrag(
      {
        title: 'Click each corner, then drag',
        subtitle: 'Drag the filled circle into the dashed one.',
        statusPrefix: 'Click & drag in fullscreen...',
        tooltipText: 'Drag me into the other circle',
        successLabel: 'Click & drag passed',
        failPrefix: '',
        usePointerCornerDown: false,
      },
      ctx,
    );
  },
};
