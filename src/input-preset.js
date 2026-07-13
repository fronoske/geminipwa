    (function() {
      // 1. ボタン内容設定
      const presetList = [
        {label: '続', value: '（続けて）', autoSend: true},
        {label: '展', value: '（【今後の展開】）', autoSend: false, moveCursorLeft: 1},
      ];

      // 2. DOM取得
      const textarea = document.getElementById('user-input');
      const popup = document.getElementById('input-preset-popup');

      // 3. ボタン生成
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

      // 4. textareaの上にポップアップ配置
      function showPopup() {
        const rect = textarea.getBoundingClientRect();
        popup.style.display = 'flex';
        // absolute配置: body基準の座標へ
        popup.style.left = (window.scrollX + rect.left) + 'px';
        popup.style.top = (window.scrollY + rect.top - popup.offsetHeight - 8) + 'px';
        popup.style.opacity = 1;
      }
      function hidePopup() {
        popup.style.display = 'none';
        popup.style.opacity = 0;
      }

      function insertAtCursor(textarea, text, moveLeft = 0) {
        // textarea.selectionStart/Endでカーソル位置取得
        const start = textarea.selectionStart, end = textarea.selectionEnd;
        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        textarea.value = before + text + after;
        // 挿入した直後（moveLeft分だけ左）のカーソル位置へ
        let newPos = before.length + text.length - moveLeft;
        newPos = Math.max(newPos, 0);
        textarea.setSelectionRange(newPos, newPos);
        // イベント（input）発火
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 6. イベント紐付け
      textarea.addEventListener('focus', () => {
        if (textarea.value.trim() === '') showPopup();
      });
      textarea.addEventListener('blur', () => {
        setTimeout(hidePopup, 160); // ボタン押下を拾うため少し遅らせる
      });
      // ウィンドウリサイズ等で再配置
      window.addEventListener('resize', () => {
        if (popup.style.display === 'flex') showPopup();
      });
    })();
    document.getElementById('app-version').textContent = '2026.07.06-fronoske';
