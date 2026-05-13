import { runCorners } from './_corners.js';

export default {
  id: 'trackpad',
  icon: '⬛',
  name: 'Trackpad / Touchscreen (click)',
  instruction: 'Click each labeled zone — corners first or center first, order doesn’t matter.',
  run(ctx) {
    runCorners(
      {
        title: 'Click each zone',
        subtitle: 'Click A, B, C, D, and E in any order.',
        statusPrefix: 'Click in fullscreen...',
        successLabel: 'All click zones registered',
        usePointerDown: false,
      },
      ctx,
    );
  },
};
