const SELECTOR_ID = 'test-selector';

export function renderTestSelector(tests, groups, touchSupported, onChange) {
  const container = document.getElementById(SELECTOR_ID);
  if (!container) return;

  const byId = new Map(tests.map((t) => [t.id, t]));

  container.innerHTML = groups
    .map((group) => {
      const items = group.ids
        .map((id) => byId.get(id))
        .filter((t) => t && !(t.skipIfNoTouch && !touchSupported));
      if (items.length === 0) return '';
      return `
        <fieldset class="test-selector-group">
          <legend class="test-selector-group-label">${group.label}</legend>
          ${items
            .map(
              (t) => `
            <label class="test-selector-item">
              <input type="checkbox" data-test-id="${t.id}" checked />
              <span class="test-selector-item-icon" aria-hidden="true">${t.icon}</span>
              <span class="test-selector-item-name">${t.name}</span>
            </label>`,
            )
            .join('')}
        </fieldset>`;
    })
    .join('');

  container.addEventListener('change', () => {
    onChange?.(getSelectedIds().size > 0);
  });
}

export function getSelectedIds() {
  const container = document.getElementById(SELECTOR_ID);
  if (!container) return new Set();
  const boxes = container.querySelectorAll('input[type="checkbox"][data-test-id]');
  const ids = new Set();
  boxes.forEach((b) => {
    if (b.checked) ids.add(b.dataset.testId);
  });
  return ids;
}
