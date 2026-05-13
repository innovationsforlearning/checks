import { runCorners } from './_corners.js';

export default {
  id: 'touch',
  icon: '👆',
  name: 'Touchscreen (tap)',
  instruction: 'Tap each labeled zone — corners first or center first, order doesn’t matter.',
  skipIfNoTouch: true,
  run(ctx) {
    runCorners(
      {
        title: 'Tap each zone',
        subtitle: 'Tap A, B, C, D, and E in any order.',
        statusPrefix: 'Tap in fullscreen...',
        successLabel: 'All tap zones registered',
        usePointerDown: true,
      },
      ctx,
    );
  },
};
