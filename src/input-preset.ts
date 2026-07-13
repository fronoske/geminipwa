// @ts-nocheck -- Preserve the pre-migration input preset behavior exactly.
// Bundled into the generated index.html from this TypeScript source.
(function() {
  const presetList = [
    {label: '続', value: '（続けて）', autoSend: true},
    {label: '展', value: '（【今後の展開】）', autoSend: false, moveCursorLeft: 1},
  ];

  const textarea = document.getElementById('user-input');
  const popup = document.getElementById('input-preset-popup');

  popup.style.display = 'none';
  popup.style.position = 'absolute';
  popup.style.flexDirection = 'row';
  popup.innerHTML = '';
  presetList.forEach(preset => {
    const btn = document.createElement('button');
    btn.textContent = preset.label;
    btn.type = 'button';
    btn.tabIndex = -1;
    btn.onclick = function(e) {
      e.preventDefault();
      insertAtCursor(textarea, preset.value, preset.moveCursorLeft || 0);
      hidePopup();
      textarea.focus();
      if (preset.autoSend) {
        setTimeout(() => {
          document.getElementById('send-button')?.click();
        }, 50);
      }
    };
    popup.appendChild(btn);
  });

  function showPopup() {
    const rect = textarea.getBoundingClientRect();
    popup.style.display = 'flex';
    popup.style.left = (window.scrollX + rect.left) + 'px';
    popup.style.top = (window.scrollY + rect.top - popup.offsetHeight - 8) + 'px';
    popup.style.opacity = 1;
  }
  function hidePopup() {
    popup.style.display = 'none';
    popup.style.opacity = 0;
  }

  function insertAtCursor(textarea, text, moveLeft = 0) {
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + text + after;
    let newPos = before.length + text.length - moveLeft;
    newPos = Math.max(newPos, 0);
    textarea.setSelectionRange(newPos, newPos);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  textarea.addEventListener('focus', () => {
    if (textarea.value.trim() === '') showPopup();
  });
  textarea.addEventListener('blur', () => {
    setTimeout(hidePopup, 160);
  });
  window.addEventListener('resize', () => {
    if (popup.style.display === 'flex') showPopup();
  });
})();
document.getElementById('app-version').textContent = '2026.07.06-fronoske';
