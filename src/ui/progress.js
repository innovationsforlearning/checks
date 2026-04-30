export function updateProgress(tests, index, touchSupported) {
  const active = tests.filter((t) => !(t.skipIfNoTouch && !touchSupported));
  const pos = active.findIndex((t) => t.id === tests[index].id) + 1;
  const total = active.length;
  const pct = ((pos - 1) / total) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label-left').textContent = `Test ${pos} of ${total}`;
  document.getElementById('progress-label-right').textContent = tests[index].name;
}
