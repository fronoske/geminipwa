// @ts-nocheck -- Enable after shared settings and DOM types are defined.
// Bundled into the generated index.html from this TypeScript source.
const INPUT_PRESET_CURSOR_MARKER = '{|}';

const inputPresetUtils = {
  initialized: false,
  textareaResizeObserver: null,

  createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  },

  normalizePresets(presets) {
    if (!Array.isArray(presets)) return [];
    const usedIds = new Set();
    return presets
      .filter(preset => preset && typeof preset === 'object')
      .map(preset => {
        let id = typeof preset.id === 'string' && preset.id ? preset.id : this.createId();
        if (usedIds.has(id)) id = this.createId();
        usedIds.add(id);
        return {
          id,
          label: typeof preset.label === 'string' ? preset.label : '',
          content: typeof preset.content === 'string' ? preset.content : '',
          autoSend: preset.autoSend === true,
        };
      });
  },

  parseTemplate(template) {
    const content = typeof template === 'string' ? template : '';
    const markerIndex = content.indexOf(INPUT_PRESET_CURSOR_MARKER);
    const text = content.split(INPUT_PRESET_CURSOR_MARKER).join('');
    const cursorOffset = markerIndex === -1
      ? text.length
      : content.slice(0, markerIndex).split(INPUT_PRESET_CURSOR_MARKER).join('').length;
    return { text, cursorOffset };
  },

  initialize() {
    if (this.initialized) {
      this.refresh();
      return;
    }
    this.initialized = true;
    state.settings.inputPresets = this.normalizePresets(state.settings.inputPresets);

    elements.addInputPresetBtn.addEventListener('click', () => {
      const presets = this.readSettingsFromUI();
      presets.push({ id: this.createId(), label: '', content: '', autoSend: false });
      state.settings.inputPresets = presets;
      this.renderSettings();
      this.notifySettingsChanged();
      elements.inputPresetSettingsList.lastElementChild?.querySelector('.input-preset-label')?.focus();
    });

    elements.userInput.addEventListener('focus', () => {
      if (elements.userInput.value.trim() === '') this.showPopup();
    });
    elements.userInput.addEventListener('blur', () => {
      setTimeout(() => this.hidePopup(), 160);
    });
    window.addEventListener('resize', () => {
      if (!elements.inputPresetPopup.classList.contains('hidden')) this.positionPopup();
    });
    if (typeof ResizeObserver !== 'undefined') {
      this.textareaResizeObserver = new ResizeObserver(() => {
        if (!elements.inputPresetPopup.classList.contains('hidden')) this.positionPopup();
      });
      this.textareaResizeObserver.observe(elements.userInput);
    } else {
      elements.userInput.addEventListener('input', () => {
        requestAnimationFrame(() => {
          if (!elements.inputPresetPopup.classList.contains('hidden')) this.positionPopup();
        });
      });
    }

    this.refresh();
  },

  refresh() {
    state.settings.inputPresets = this.normalizePresets(state.settings.inputPresets);
    this.renderSettings();
    this.renderPopup();
  },

  notifySettingsChanged() {
    elements.inputPresetSettingsList.dispatchEvent(new Event('change', { bubbles: true }));
  },

  readSettingsFromUI() {
    if (!elements.inputPresetSettingsList) return [];
    return Array.from(elements.inputPresetSettingsList.querySelectorAll('.input-preset-setting-item')).map(item => ({
      id: item.dataset.presetId || this.createId(),
      label: item.querySelector('.input-preset-label').value,
      content: item.querySelector('.input-preset-content').value,
      autoSend: item.querySelector('.input-preset-auto-send').checked,
    }));
  },

  renderSettings() {
    const container = elements.inputPresetSettingsList;
    container.replaceChildren();

    state.settings.inputPresets.forEach((preset, index) => {
      const item = document.createElement('div');
      item.className = 'input-preset-setting-item';
      item.dataset.presetId = preset.id;

      const header = document.createElement('div');
      header.className = 'input-preset-setting-header';

      const labelWrapper = document.createElement('label');
      labelWrapper.textContent = 'ラベル';
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'input-preset-label';
      labelInput.value = preset.label;
      labelInput.setAttribute('aria-label', `プリセット${index + 1}のラベル`);
      labelWrapper.appendChild(labelInput);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'input-preset-delete-btn';
      deleteButton.textContent = '削除';
      deleteButton.setAttribute('aria-label', `プリセット${index + 1}を削除`);
      deleteButton.addEventListener('click', () => {
        state.settings.inputPresets = this.readSettingsFromUI().filter(itemPreset => itemPreset.id !== preset.id);
        this.renderSettings();
        this.renderPopup();
        this.notifySettingsChanged();
      });

      header.append(labelWrapper, deleteButton);

      const contentLabel = document.createElement('label');
      contentLabel.textContent = '本文';
      const contentInput = document.createElement('textarea');
      contentInput.className = 'input-preset-content';
      contentInput.value = preset.content;
      contentInput.placeholder = `本文を入力。カーソル位置: ${INPUT_PRESET_CURSOR_MARKER}`;
      contentInput.setAttribute('aria-label', `プリセット${index + 1}の本文`);
      contentLabel.appendChild(contentInput);

      const autoSendLabel = document.createElement('label');
      autoSendLabel.className = 'checkbox-label input-preset-auto-send-label';
      const autoSendInput = document.createElement('input');
      autoSendInput.type = 'checkbox';
      autoSendInput.className = 'input-preset-auto-send';
      autoSendInput.checked = preset.autoSend;
      autoSendLabel.append(autoSendInput, ' 挿入後に自動送信する');

      item.append(header, contentLabel, autoSendLabel);
      container.appendChild(item);
    });
  },

  renderPopup() {
    const popup = elements.inputPresetPopup;
    popup.replaceChildren();

    state.settings.inputPresets
      .filter(preset => preset.label.trim() && preset.content)
      .forEach(preset => {
        const button = document.createElement('button');
        button.textContent = preset.label;
        button.type = 'button';
        button.tabIndex = -1;
        button.addEventListener('mousedown', event => event.preventDefault());
        button.addEventListener('click', event => {
          event.preventDefault();
          const parsed = this.parseTemplate(preset.content);
          this.insertAtCursor(elements.userInput, parsed.text, parsed.cursorOffset);
          this.hidePopup();
          elements.userInput.focus();
          if (preset.autoSend) {
            setTimeout(() => elements.sendButton?.click(), 50);
          }
        });
        popup.appendChild(button);
      });

    if (!popup.children.length) this.hidePopup();
  },

  positionPopup() {
    const rect = elements.userInput.getBoundingClientRect();
    const popup = elements.inputPresetPopup;
    popup.style.left = `${window.scrollX + rect.left}px`;
    popup.style.top = `${window.scrollY + rect.top - popup.offsetHeight - 8}px`;
  },

  showPopup() {
    if (!elements.inputPresetPopup.children.length) return;
    elements.inputPresetPopup.classList.remove('hidden');
    this.positionPopup();
  },

  hidePopup() {
    elements.inputPresetPopup.classList.add('hidden');
  },

  insertAtCursor(textarea, text, cursorOffset) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    textarea.value = before + text + after;
    const newPosition = before.length + Math.max(0, Math.min(cursorOffset, text.length));
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  },
};
