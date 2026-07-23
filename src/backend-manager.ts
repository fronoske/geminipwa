// @ts-nocheck -- Enable after shared application service types are defined.
// Bundled into the generated index.html from this TypeScript source.
       const multiBackendUtils = {
            MAX_BACKENDS: 100,
            MAX_API_KEYS_PER_BACKEND: 100,

            initialize() {
                elements.addLlmaggregatorBackendBtn.addEventListener('click', () => this.addBackend());
                this.renderList();
            },

            addBackend() {
                const inputElement = elements.llmaggregatorNewBackendsInput;
                if (!inputElement) return;
                const inputText = inputElement.value.trim();
                const backends = state.settings.llmaggregatorBackends;

                if (backends.length >= this.MAX_BACKENDS) {
                    uiUtils.showCustomAlert(`最大${this.MAX_BACKENDS}個までのバックエンドURLを設定できます。`);
                    return;
                }

                const urlsToAdd = inputText.split(',').map(url => url.trim()).filter(url => url !== '');

                if (urlsToAdd.length === 0) {
                    uiUtils.showCustomAlert('追加するバックエンドURLを入力してください。');
                    return;
                }

                const wasEmpty = backends.length === 0;

                urlsToAdd.forEach(urlValue => {
                    const newBackend = {
                        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        label: `URL ${backends.length + 1}`,
                        url: urlValue,
                        isActive: false,
                        apiKeys: [],
                        activeApiKeyIndex: -1
                    };
                    backends.push(newBackend);
                });

                if (wasEmpty && backends.length > 0) {
                    backends[0].isActive = true;
                    this.setActiveBackendIndex(0);
                }

                inputElement.value = '';
                this.renderList();
                this.updateMainBackendInput();
            },

            async deleteBackend(backendId) {
                const backends = state.settings.llmaggregatorBackends;
                const backendIndex = backends.findIndex(b => b.id === backendId);
                if (backendIndex === -1) return;

                const backendToDelete = backends[backendIndex];
                const confirmed = await uiUtils.showCustomConfirm(`バックエンド「${backendToDelete.label}」を削除しますか？`);
                if (!confirmed) return;

                const wasActive = backendToDelete.isActive;
                backends.splice(backendIndex, 1);

                if (wasActive && backends.length > 0) {
                    const newActiveIndex = Math.min(backendIndex, backends.length - 1);
                    backends[newActiveIndex].isActive = true;
                    this.setActiveBackendIndex(newActiveIndex);
                } else if (backends.length === 0) {
                    this.setActiveBackendIndex(-1);
                }

                this.renderList();
                this.updateMainBackendInput();

                uiUtils.updateApiKeyCycleButtons();
            },

            selectBackend(backendId) {
                const backends = state.settings.llmaggregatorBackends;
                const selectedIndex = backends.findIndex(b => b.id === backendId);
                if (selectedIndex === -1) return;

                backends.forEach((backend, index) => {
                    backend.isActive = index === selectedIndex;
                });

                this.setActiveBackendIndex(selectedIndex);
                this.renderList();
                this.updateMainBackendInput();

                uiUtils.updateApiKeyCycleButtons();
                elements.llmaggregatorBackendsList.dispatchEvent(new Event('change', { bubbles: true }));
            },

            updateBackendUrl(backendId, newUrl) {
                const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                if (backend) {
                    backend.url = newUrl.trim();
                    if (backend.isActive) this.updateMainBackendInput();
                }
            },

            updateBackendLabel(backendId, newLabel) {
                const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                if (backend) {
                    backend.label = newLabel.trim() || `URL ${state.settings.llmaggregatorBackends.indexOf(backend) + 1}`;
                }
            },

            setActiveBackendIndex(index) {
                state.settings.llmaggregatorActiveBackendIndex = index;
            },

            getActiveBackend() {
                const backends = state.settings.llmaggregatorBackends;
                return backends.find(b => b.isActive) || null;
            },

            getActiveApiKeyForBackend(backend) {
                if (!backend || !backend.apiKeys || backend.apiKeys.length === 0) return '';
                const activeKey = backend.apiKeys.find(k => k.isActive);
                return activeKey ? activeKey.value : '';
            },

            updateMainBackendInput() {
                if (!state.settings.showMultiBackends) return;
                const activeBackend = this.getActiveBackend();
                elements.llmAggregatorApiBackendInput.value = activeBackend ? activeBackend.url : '';
                elements.llmAggregatorApiKeyInput.value = this.getActiveApiKeyForBackend(activeBackend);
            },

            renderList() {
                const backends = state.settings.llmaggregatorBackends;
                const container = elements.llmaggregatorBackendsList;
                const addButton = elements.addLlmaggregatorBackendBtn;
                container.innerHTML = '';

                if (backends.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.textContent = 'バックエンドURLが設定されていません。';
                    emptyMsg.style.cssText = 'color: var(--text-secondary); font-size: 13px; text-align: center; margin: 10px 0;';
                    container.appendChild(emptyMsg);
                } else {
                    backends.forEach((backend) => {
                        const item = this.createBackendItem(backend);
                        container.appendChild(item);
                    });
                }
                addButton.disabled = backends.length >= this.MAX_BACKENDS;
            },

            createBackendItem(backend) {
                const item = document.createElement('div');
                item.className = `api-key-item llm-aggregator-backend-item ${backend.isActive ? 'active' : ''}`;
                item.dataset.backendId = backend.id;

                const infoRow = document.createElement('div');
                infoRow.style.cssText = 'display: flex; gap: 5px; width: 100%;';

                const labelInput = this.createInputElement('text', 'api-key-item-label', backend.label, `URL ${state.settings.llmaggregatorBackends.indexOf(backend) + 1}`, (e) => this.updateBackendLabel(backend.id, e.target.value));
                const urlInput = this.createInputElement('text', 'api-key-item-input', backend.url, 'https://...', (e) => this.updateBackendUrl(backend.id, e.target.value));
                const actions = this.createActionsDiv(backend);

                infoRow.appendChild(labelInput);
                infoRow.appendChild(urlInput);
                infoRow.appendChild(actions);

                const apiKeyDetails = document.createElement('details');
                apiKeyDetails.className = 'backend-api-keys-details';
                const apiKeySummary = document.createElement('summary');
                apiKeySummary.innerHTML = `APIキー管理 (<span class="api-key-count">${backend.apiKeys.length}</span>個)`;
                apiKeyDetails.appendChild(apiKeySummary);

                const apiKeyContainer = document.createElement('div');
                apiKeyContainer.className = 'api-keys-list-container';
                apiKeyDetails.appendChild(apiKeyContainer);

                item.appendChild(infoRow);
                item.appendChild(apiKeyDetails);

                this.renderApiKeysForBackend(apiKeyContainer, backend.id);
                return item;
            },

            createInputElement(type, className, value, placeholder, eventListener) {
                const input = document.createElement('input');
                input.type = type;
                input.className = className;
                input.value = value;
                input.placeholder = placeholder;
                input.style.marginBottom = '0';
                input.addEventListener('change', eventListener);
                return input;
            },

            createActionsDiv(backend) {
                const actions = document.createElement('div');
                actions.className = 'api-key-item-actions';
                const selectBtn = document.createElement('button');
                selectBtn.className = `api-key-select-btn ${backend.isActive ? 'active' : ''}`;
                selectBtn.textContent = backend.isActive ? '使用中' : '未選択';
                selectBtn.disabled = backend.isActive;
                selectBtn.addEventListener('click', () => this.selectBackend(backend.id));
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'api-key-delete-btn';
                deleteBtn.textContent = '削';
                deleteBtn.addEventListener('click', () => this.deleteBackend(backend.id));
                actions.appendChild(selectBtn);
                actions.appendChild(deleteBtn);
                return actions;
            },

            toggleMultiBackendsVisibility(show) {
                const multiSection = document.getElementById('llmaggregator-multi-backends-section');
                const singleUrlInput = elements.llmAggregatorApiBackendInput;
                const singleUrlLabel = document.querySelector('label[for="llmaggregator-api-backend"]');
                const singleKeyInput = elements.llmAggregatorApiKeyInput;
                const singleKeyLabel = document.querySelector('label[for="llmaggregator-api-key"]');
                const singleKeyMultiSection = document.getElementById('llmaggregator-multi-api-keys-section');

                if (multiSection) multiSection.classList.toggle('hidden', !show);
                if (singleUrlInput) singleUrlInput.classList.toggle('hidden', show);
                if (singleUrlLabel) singleUrlLabel.classList.toggle('hidden', show);
                if (singleKeyInput) singleKeyInput.classList.toggle('hidden', show);
                if (singleKeyLabel) singleKeyLabel.classList.toggle('hidden', show);
                if (singleKeyMultiSection) singleKeyMultiSection.classList.toggle('hidden', show);

                if (!show) {
                    singleUrlInput.value = state.settings.llmAggregatorApiBackend || '';
                    singleKeyInput.value = state.settings.llmAggregatorApiKey || '';
                } else {
                    this.updateMainBackendInput();
                }
            },

            addApiKeyToBackend(backendId, textarea) {
                const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                if (!backend) return;
                const keys = backend.apiKeys || [];
                const keysToAdd = textarea.value.split(',').map(k => k.trim()).filter(Boolean);

                keysToAdd.forEach(keyValue => {
                    if (keys.length >= this.MAX_API_KEYS_PER_BACKEND) return;
                    if (state.settings.removeDuplicateApiKeys && keys.some(k => k.value === keyValue)) return;

                    const newKey = { id: `${Date.now()}-${Math.random()}`, label: `キー ${keys.length + 1}`, value: keyValue, isActive: keys.length === 0 };
                    keys.push(newKey);
                });

                backend.apiKeys = keys;
                textarea.value = '';
                this.renderApiKeysForBackend(textarea.closest('.api-keys-list-container'), backendId);
                this.updateMainBackendInput();
                uiUtils.updateApiKeyCycleButtons();
            },

            async deleteApiKeyFromBackend(backendId, keyId) {
                const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                if (!backend) return;
                const keyIndex = backend.apiKeys.findIndex(k => k.id === keyId);
                if (keyIndex === -1) return;

                const confirmed = state.settings.disableDeleteApiKeyConfirmation
                    ? await uiUtils.showCustomConfirm(`APIキー「${backend.apiKeys[keyIndex].label}」を削除しますか？`)
                    : true;
                if (!confirmed) return;

                const wasActive = backend.apiKeys[keyIndex].isActive;
                backend.apiKeys.splice(keyIndex, 1);

                if (wasActive && backend.apiKeys.length > 0) {
                    const newActiveIndex = Math.min(keyIndex, backend.apiKeys.length - 1);
                    backend.apiKeys[newActiveIndex].isActive = true;
                }

                const container = document.querySelector(`[data-backend-id="${backendId}"] .api-keys-list-container`);
                this.renderApiKeysForBackend(container, backendId);
                this.updateMainBackendInput();
                uiUtils.updateApiKeyCycleButtons();
            },

            selectApiKeyForBackend(backendId, keyId) {
                const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                if (!backend) return;
                const selectedIndex = backend.apiKeys.findIndex(k => k.id === keyId);
                if (selectedIndex === -1) return;

                backend.apiKeys.forEach((key, index) => key.isActive = index === selectedIndex);

                const container = document.querySelector(`[data-backend-id="${backendId}"] .api-keys-list-container`);
                this.renderApiKeysForBackend(container, backendId);
                this.updateMainBackendInput();
                uiUtils.updateApiKeyCycleButtons();
            },

            renderApiKeysForBackend(container, backendId) {
                if (!container) return;
                const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                if (!backend) return;

                const keys = backend.apiKeys || [];

                container.innerHTML = '';

                const apiKeyListDiv = document.createElement('div');
                apiKeyListDiv.className = 'api-keys-list';

                if (keys.length > 0) {
                    keys.forEach((key, index) => {
                        apiKeyListDiv.appendChild(this.createApiKeyItem(backendId, key, index));
                    });
                }

                container.appendChild(apiKeyListDiv);

                const addForm = document.createElement('div');
                addForm.className = 'add-api-key-form';
                addForm.style.cssText = 'margin-top: -5px; display: flex; gap: 5px; align-items: center;';
                const textarea = document.createElement('textarea');
                textarea.className = 'api-key-item-input';
                textarea.placeholder = '新しいAPIキーを入力...';
                textarea.style.cssText = 'flex-grow: 1; margin-bottom: 0; height: 38px; resize: vertical; min-height: 0; padding-top: 10px;';
                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.className = 'add-api-key-btn';
                addButton.textContent = '追加';
                addButton.style.cssText = 'width: auto; padding: 8px 15px; min-width: 84px;';
                addButton.disabled = keys.length >= this.MAX_API_KEYS_PER_BACKEND;
                addButton.addEventListener('click', () => this.addApiKeyToBackend(backendId, textarea));
                addForm.appendChild(textarea);
                addForm.appendChild(addButton);

                container.appendChild(addForm);
                const summarySpan = document.querySelector(`[data-backend-id="${backendId}"] .api-key-count`);
                if(summarySpan) summarySpan.textContent = keys.length;
            },

            createApiKeyItem(backendId, key, index) {
                const item = document.createElement('div');
                item.className = `api-key-item ${key.isActive ? 'active' : ''}`;
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.gap = '5px';

                const labelInput = this.createInputElement('text', 'api-key-item-label', key.label, `キー ${index + 1}`, (e) => {
                    const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                    const apiKey = backend.apiKeys.find(k => k.id === key.id);
                    if(apiKey) apiKey.label = e.target.value;
                });

                const keyInput = this.createInputElement(state.settings.unmaskApiKeys ? 'text' : 'password', 'api-key-item-input', key.value, 'APIキー...', (e) => {
                    const backend = state.settings.llmaggregatorBackends.find(b => b.id === backendId);
                    const apiKey = backend.apiKeys.find(k => k.id === key.id);
                    if(apiKey) apiKey.value = e.target.value;
                    if(apiKey.isActive) this.updateMainBackendInput();
                });
                keyInput.dataset.apiKeyInput = 'true';

                const actions = document.createElement('div');
                actions.className = 'api-key-item-actions';
                const selectBtn = document.createElement('button');
                selectBtn.className = `api-key-select-btn ${key.isActive ? 'active' : ''}`;
                selectBtn.textContent = key.isActive ? '使用中' : '未選択';
                selectBtn.disabled = key.isActive;
                selectBtn.addEventListener('click', () => this.selectApiKeyForBackend(backendId, key.id));
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'api-key-delete-btn';
                deleteBtn.textContent = '削';
                deleteBtn.addEventListener('click', () => this.deleteApiKeyFromBackend(backendId, key.id));

                actions.appendChild(selectBtn);
                actions.appendChild(deleteBtn);
                row.appendChild(labelInput);
                row.appendChild(keyInput);
                row.appendChild(actions);
                item.appendChild(row);
                return item;
            },
        };
