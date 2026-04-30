export function setStatus(type, msg) {
  const el = document.getElementById('test-status-label');
  el.className = 'test-status ' + (type || '');
  el.textContent = msg;
}

export function setButtons(btns) {
  const wrap = document.getElementById('test-btns');
  wrap.innerHTML = '';
  btns.forEach((b) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm' + (b.primary ? ' btn-primary' : '');
    btn.textContent = b.label;
    btn.onclick = b.action;
    wrap.appendChild(btn);
  });
}
