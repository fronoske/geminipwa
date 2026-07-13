"use strict";
(() => {
    const presetList = [
        { label: '続', value: '（続けて）', autoSend: true },
        { label: '展', value: '（【今後の展開】）', autoSend: false, moveCursorLeft: 1 },
    ];
    const textarea = document.getElementById('user-input');
    const popup = document.getElementById('input-preset-popup');
    if (!(textarea instanceof HTMLTextAreaElement) || !(popup instanceof HTMLElement)) {
        throw new Error('Input preset elements are missing');
    }
    const input = textarea;
    const presetPopup = popup;
    presetPopup.style.display = 'none';
    presetPopup.style.position = 'absolute';
    presetPopup.style.flexDirection = 'row';
    presetPopup.innerHTML = '';
    presetList.forEach((preset) => {
        const button = document.createElement('button');
        button.textContent = preset.label;
        button.type = 'button';
        button.tabIndex = -1;
        button.onclick = (event) => {
            event.preventDefault();
            insertAtCursor(input, preset.value, preset.moveCursorLeft ?? 0);
            hidePopup();
            input.focus();
            if (preset.autoSend) {
                window.setTimeout(() => {
                    document.getElementById('send-button')?.click();
                }, 50);
            }
        };
        presetPopup.appendChild(button);
    });
    function showPopup() {
        const rect = input.getBoundingClientRect();
        presetPopup.style.display = 'flex';
        presetPopup.style.left = `${window.scrollX + rect.left}px`;
        presetPopup.style.top = `${window.scrollY + rect.top - presetPopup.offsetHeight - 8}px`;
        presetPopup.style.opacity = '1';
    }
    function hidePopup() {
        presetPopup.style.display = 'none';
        presetPopup.style.opacity = '0';
    }
    function insertAtCursor(target, text, moveLeft = 0) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const before = target.value.substring(0, start);
        const after = target.value.substring(end);
        target.value = before + text + after;
        const newPosition = Math.max(before.length + text.length - moveLeft, 0);
        target.setSelectionRange(newPosition, newPosition);
        target.dispatchEvent(new Event('input', { bubbles: true }));
    }
    input.addEventListener('focus', () => {
        if (input.value.trim() === '')
            showPopup();
    });
    input.addEventListener('blur', () => {
        window.setTimeout(hidePopup, 160);
    });
    window.addEventListener('resize', () => {
        if (presetPopup.style.display === 'flex')
            showPopup();
    });
})();
const appVersion = document.getElementById('app-version');
if (!appVersion)
    throw new Error('App version element is missing');
appVersion.textContent = '2026.07.06-fronoske';
