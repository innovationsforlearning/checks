export function updateProgress(tests, index) {
  const total = tests.length;
  const pos = index + 1;
  const pct = (index / total) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label-left').textContent = `Test ${pos} of ${total}`;
  document.getElementById('progress-label-right').textContent = tests[index].name;
}
