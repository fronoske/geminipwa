// @ts-nocheck -- Enable after shared application service types are defined.
// Bundled into the generated index.html from this TypeScript source.
const multiApiKeyUtils = {
            MAX_API_KEYS: 1000,
            providerPrefixMap: {
            'g': 'gemini', 'ge': 'gemini', 'gemini': 'gemini', 'go': 'gemini', 'google': 'gemini',
            'd': 'deepseek', 'ds': 'deepseek', 'deepseek': 'deepseek', 'de': 'deepseek',
            'c': 'claude', 'cl': 'claude', 'claude': 'claude', 'a': 'claude', 'an': 'claude', 'anthropic': 'claude',
            'o': 'openai', 'op': 'openai', 'openai': 'openai', 'ch': 'openai', 'chatgpt': 'openai',
            'x': 'xai', 'xa': 'xai', 'xai': 'xai', 'gr': 'xai', 'grok': 'xai'
        },

            async handleBatchAddApiKeys(inputText) {
                const commands = inputText.split(',').map(cmd => cmd.trim()).filter(cmd => cmd);

                const prefixes = Object.keys(this.providerPrefixMap).join('|');
                const regex = new RegExp(`^(${prefixes}):\\s*([^\\s]+)$`, 'i');

                const results = {
                    success: {},
                    failed: {}
                };
                let commandsFound = 0;

                for (const command of commands) {
                    const match = command.match(regex);
                    if (match) {
                        commandsFound++;
                        const prefix = match[1].toLowerCase();
                        const keyValue = match[2];
                        const provider = this.providerPrefixMap[prefix];

                        if (provider && keyValue) {
                            if (provider === 'llmaggregator') {
                                const activeBackend = multiBackendUtils.getActiveBackend();
                                if (activeBackend) {
                                    const keys = activeBackend.apiKeys || [];
                                    if (keys.length < multiBackendUtils.MAX_API_KEYS_PER_BACKEND) {
                                        if (!(state.settings.removeDuplicateApiKeys && keys.some(k => k.value === keyValue))) {
                                            const newKey = { id: `${Date.now()}-${Math.random()}`, label: `キー ${keys.length + 1}`, value: keyValue, isActive: keys.length === 0 };
                                            keys.push(newKey);
                                            activeBackend.apiKeys = keys;
                                            results.success[provider] = (results.success[provider] || 0) + 1;
                                        }
                                    } else {
                                        results.failed[provider] = (results.failed[provider] || 0) + 1;
                                    }
                                }
                                continue;
                            }
                            const keys = this.getApiKeysArray(provider);

                            if (state.settings.removeDuplicateApiKeys && keys.some(k => k.value === keyValue)) {
                                continue;
                            }

                            if (keys.length < this.MAX_API_KEYS) {
                                const newKey = {
                                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                                    label: `キー ${keys.length + 1}`,
                                    value: keyValue,
                                    isActive: keys.length === 0
                                };
                                keys.push(newKey);
                                if (newKey.isActive) {
                                    this.setActiveApiKeyIndex(provider, 0);
                                }
                                results.success[provider] = (results.success[provider] || 0) + 1;
                            } else {
                                results.failed[provider] = (results.failed[provider] || 0) + 1;
                            }
                        }
                    }
                }

                if (commandsFound === 0) {
                    return;
                }

                this.renderAllApiKeyLists();
                Object.values(this.providerPrefixMap).forEach(p => {
                    const uniqueProviderName = [...new Set(Object.values(this.providerPrefixMap))].find(name => name === p);
                    if (uniqueProviderName) this.updateMainApiKeyInput(uniqueProviderName);
                });
            },

            initializeMultiApiKeys() {
                elements.addGeminiApiKeyBtn.addEventListener('click', () => this.addApiKey('gemini'));
                elements.addDeepseekApiKeyBtn.addEventListener('click', () => this.addApiKey('deepseek'));
                elements.addClaudeApiKeyBtn.addEventListener('click', () => this.addApiKey('claude'));
                elements.addOpenaiApiKeyBtn.addEventListener('click', () => this.addApiKey('openai'));
                elements.addXaiApiKeyBtn.addEventListener('click', () => this.addApiKey('xai'));

                this.renderAllApiKeyLists();
            },

            async addApiKey(provider) {
                const inputElement = document.getElementById(`${provider}-new-api-keys-input`);
                if (!inputElement) return;
                const inputText = inputElement.value; // .trim() を削除

                const prefixes = Object.keys(this.providerPrefixMap).join('|');
                const commandRegex = new RegExp(`(?:^|\\s|,|\\n)(${prefixes}):`, 'i');

                if (commandRegex.test(inputText)) {
                    await this.handleBatchAddApiKeys(inputText);
                    this.clearAllNewKeyTextareas();
                    return;
                }

                const keys = this.getApiKeysArray(provider);
                const keysToAdd = inputText.split(',')
                    .map(key => key.trim())
                    .filter(key => key !== '');

                if (keysToAdd.length === 0) {
                    uiUtils.showCustomAlert('追加するAPIキーを入力してください。');
                    return;
                }

                let addedCount = 0;
                let duplicateCount = 0;

                const wasEmpty = keys.length === 0;

                keysToAdd.forEach(keyValue => {
                    if (state.settings.removeDuplicateApiKeys && keys.some(k => k.value === keyValue)) {
                        duplicateCount++;
                        return;
                    }

                    if (keys.length >= this.MAX_API_KEYS) {

                        return;
                    }

                    const newKey = {
                        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        label: `キー ${keys.length + 1}`,
                        value: keyValue,
                        isActive: false
                    };
                    keys.push(newKey);
                    addedCount++;
                });


                if (addedCount === 0) {
                    inputElement.value = '';
                    return;
                }

                if (keys.length + keysToAdd.length > this.MAX_API_KEYS) {
                    uiUtils.showCustomAlert(`最大${this.MAX_API_KEYS}個までのAPIキーを設定できます。現在のキー数: ${keys.length}, 追加しようとしたキー数: ${keysToAdd.length}`);
                    return;
                }


                if (wasEmpty && keys.length > 0) {
                    keys[0].isActive = true;
                    this.setActiveApiKeyIndex(provider, 0);
                }

                inputElement.value = '';
                this.renderApiKeyList(provider);
                this.updateMainApiKeyInput(provider);
                uiUtils.updateApiKeyCycleButtons();
            },

            clearAllNewKeyTextareas() {
                const providers = ['gemini', 'deepseek', 'claude', 'openai', 'xai', 'llmaggregator'];
                providers.forEach(provider => {
                    const inputElement = document.getElementById(`${provider}-new-api-keys-input`);
                    if (inputElement) {
                        inputElement.value = '';
                    }
                });
            },

            async deleteApiKey(provider, keyId) {
                const keys = this.getApiKeysArray(provider);
                const keyIndex = keys.findIndex(key => key.id === keyId);
                if (keyIndex === -1) return;

                const keyToDelete = keys[keyIndex];
                let confirmed = false;
if (state.settings.disableDeleteApiKeyConfirmation) {
    confirmed = await uiUtils.showCustomConfirm(
        `APIキー「${keyToDelete.label}」を削除しますか？`
    );
} else {
    confirmed = true;
}
                if (!confirmed) return;

                const wasActive = keyToDelete.isActive;
                keys.splice(keyIndex, 1);

                if (wasActive && keys.length > 0) {
                    const newActiveIndex = Math.min(keyIndex, keys.length - 1);
                    keys[newActiveIndex].isActive = true;
                    this.setActiveApiKeyIndex(provider, newActiveIndex);
                } else if (keys.length === 0) {
                    this.setActiveApiKeyIndex(provider, -1);
                }

                this.renderApiKeyList(provider);
                this.updateMainApiKeyInput(provider);
                uiUtils.updateApiKeyCycleButtons();
            },

            selectApiKey(provider, keyId) {
                const keys = this.getApiKeysArray(provider);
                const selectedIndex = keys.findIndex(key => key.id === keyId);
                if (selectedIndex === -1) return;

                keys.forEach((key, index) => {
                    key.isActive = index === selectedIndex;
                });

                this.setActiveApiKeyIndex(provider, selectedIndex);
                this.renderApiKeyList(provider);
                this.updateMainApiKeyInput(provider);
                uiUtils.updateApiKeyCycleButtons();

                const container = this.getListContainer(provider);
                if (container) {
                    container.dispatchEvent(new Event('change', { bubbles: true }));
                }
            },

            updateApiKeyValue(provider, keyId, newValue) {
                const keys = this.getApiKeysArray(provider);
                const key = keys.find(k => k.id === keyId);
                if (key) {
                    key.value = newValue.trim();
                    if (key.isActive) {
                        this.updateMainApiKeyInput(provider);
                    }
                }
            },

            updateApiKeyLabel(provider, keyId, newLabel) {
                const keys = this.getApiKeysArray(provider);
                const key = keys.find(k => k.id === keyId);
                if (key) {
                    key.label = newLabel.trim() || `キー ${keys.indexOf(key) + 1}`;
                }
            },

            getApiKeysArray(provider) {
                switch (provider) {
                    case 'gemini': return state.settings.geminiApiKeys;
                    case 'deepseek': return state.settings.deepseekApiKeys;
                    case 'claude': return state.settings.claudeApiKeys;
                    case 'openai': return state.settings.openaiApiKeys;
                    case 'xai': return state.settings.xaiApiKeys;
                    default: return [];
                }
            },

            setActiveApiKeyIndex(provider, index) {
                switch (provider) {
                    case 'gemini': state.settings.geminiActiveApiKeyIndex = index; break;
                    case 'deepseek': state.settings.deepseekActiveApiKeyIndex = index; break;
                    case 'claude': state.settings.claudeActiveApiKeyIndex = index; break;
                    case 'openai': state.settings.openaiActiveApiKeyIndex = index; break;
                    case 'xai': state.settings.xaiActiveApiKeyIndex = index; break;
                }
            },

            getActiveApiKey(provider) {
                const keys = this.getApiKeysArray(provider);
                const activeKey = keys.find(key => key.isActive);
                return activeKey ? activeKey.value : '';
            },

            updateMainApiKeyInput(provider) {
                if (!state.settings.showMultiApiKeys) {
                    return;
                }
                const activeKey = this.getActiveApiKey(provider);
                switch (provider) {
                    case 'gemini':
                        elements.geminiApiKeyInput.value = activeKey;
                        break;
                    case 'deepseek':
                        elements.deepSeekApiKeyInput.value = activeKey;
                        break;
                    case 'claude':
                        elements.claudeApiKeyInput.value = activeKey;
                        break;
                    case 'openai':
                        elements.openaiApiKeyInput.value = activeKey;
                        break;
                    case 'xai':
                        elements.xaiApiKeyInput.value = activeKey;
                        break;
                }
            },

            renderApiKeyList(provider) {
                const keys = this.getApiKeysArray(provider);
                const container = this.getListContainer(provider);
                const addButton = this.getAddButton(provider);

                container.innerHTML = '';

                if (keys.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.textContent = 'APIキーが設定されていません。';
                    emptyMsg.style.color = 'var(--text-secondary)';
                    emptyMsg.style.fontSize = '13px';
                    emptyMsg.style.textAlign = 'center';
                    emptyMsg.style.margin = '10px 0';
                    container.appendChild(emptyMsg);
                } else {
                    keys.forEach((key, index) => {
                        const item = this.createApiKeyItem(provider, key, index);
                        container.appendChild(item);
                    });
                }

                addButton.disabled = keys.length >= this.MAX_API_KEYS;
                addButton.textContent = keys.length >= this.MAX_API_KEYS
                    ? `最大${this.MAX_API_KEYS}個まで`
                    : '追加';
            },

            createApiKeyItem(provider, key, index) {
                const item = document.createElement('div');
                item.className = `api-key-item ${key.isActive ? 'active' : ''}`;

                const row1 = document.createElement('div');
                row1.style.display = 'flex';
                row1.style.gap = '5px';

                const labelInput = document.createElement('input');
                labelInput.type = 'text';
                labelInput.className = 'api-key-item-label';
                labelInput.value = key.label;
                labelInput.placeholder = `キー ${index + 1}`;
                labelInput.style.marginBottom = '0';
                labelInput.addEventListener('change', (e) => {
                    this.updateApiKeyLabel(provider, key.id, e.target.value);
                });

                const keyInput = document.createElement('input');
                keyInput.type = 'password';
                keyInput.className = 'api-key-item-input';
                keyInput.value = key.value;
                keyInput.placeholder = 'APIキーを入力...';
                keyInput.style.marginBottom = '0';
                keyInput.addEventListener('input', (e) => {
                    this.updateApiKeyValue(provider, key.id, e.target.value);
                });

                const actions = document.createElement('div');
                actions.className = 'api-key-item-actions';

                const selectBtn = document.createElement('button');
                selectBtn.className = `api-key-select-btn ${key.isActive ? 'active' : ''}`;
                selectBtn.textContent = key.isActive ? '使用中' : '未選択';
                selectBtn.disabled = key.isActive;
                selectBtn.addEventListener('click', () => {
                    this.selectApiKey(provider, key.id);
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'api-key-delete-btn';
                deleteBtn.textContent = '削';
                deleteBtn.addEventListener('click', () => {
                    this.deleteApiKey(provider, key.id);
                });

                actions.appendChild(selectBtn);
                actions.appendChild(deleteBtn);

                row1.appendChild(labelInput);
                row1.appendChild(keyInput);
                row1.appendChild(actions);

                item.appendChild(row1);
                return item;
            },

            getListContainer(provider) {
                switch (provider) {
                    case 'gemini': return elements.geminiApiKeysList;
                    case 'deepseek': return elements.deepseekApiKeysList;
                    case 'claude': return elements.claudeApiKeysList;
                    case 'openai': return elements.openaiApiKeysList;
                    case 'xai': return elements.xaiApiKeysList;
                    default: return null;
                }
            },

            getAddButton(provider) {
                switch (provider) {
                    case 'gemini': return elements.addGeminiApiKeyBtn;
                    case 'deepseek': return elements.addDeepseekApiKeyBtn;
                    case 'claude': return elements.addClaudeApiKeyBtn;
                    case 'openai': return elements.addOpenaiApiKeyBtn;
                    case 'xai': return elements.addXaiApiKeyBtn;

                    default: return null;
                }
            },

            renderAllApiKeyLists() {
                this.renderApiKeyList('gemini');
                this.renderApiKeyList('deepseek');
                this.renderApiKeyList('claude');
                this.renderApiKeyList('openai');
                this.renderApiKeyList('xai');

            },

            syncMainApiKeyInput(provider) {
                if (!state.settings.showMultiApiKeys) {
                    return;
                }
                let mainValue = '';
                switch (provider) {
                    case 'gemini': mainValue = elements.geminiApiKeyInput.value.trim(); break;
                    case 'deepseek': mainValue = elements.deepSeekApiKeyInput.value.trim(); break;
                    case 'claude': mainValue = elements.claudeApiKeyInput.value.trim(); break;
                    case 'openai': mainValue = elements.openaiApiKeyInput.value.trim(); break;
                    case 'xai': mainValue = elements.xaiApiKeyInput.value.trim(); break;

                }

                const keys = this.getApiKeysArray(provider);
                const activeKey = keys.find(key => key.isActive);

                if (activeKey && activeKey.value !== mainValue) {
                    activeKey.value = mainValue;
                    this.renderApiKeyList(provider);
                }
            }
        };
