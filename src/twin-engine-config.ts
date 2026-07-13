// @ts-nocheck -- Enable after shared application service types are defined.
// Bundled into the generated index.html from this TypeScript source.
        const twinEngineApiConfigUtils = {
            MAX_CONFIGS: 1000,

            initialize() {
                elements.addTwinEngineApiConfigBtn.addEventListener('click', () => this.addConfig());
                this.renderList();
            },

            generateNextConfigLabel() {
                const index = state.settings.twinEngineApiConfigs.length;
                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const char = alphabet[index % 26];
                const numberSuffix = Math.floor(index / 26);

                return `${char}${numberSuffix > 0 ? numberSuffix + 1 : ''}設定`;
            },

            addConfig() {
                const configs = state.settings.twinEngineApiConfigs;
                if (configs.length >= this.MAX_CONFIGS) {
                    uiUtils.showCustomAlert(`最大${this.MAX_CONFIGS}個までのAPI設定を作成できます。`);
                    return;
                }
                const newConfig = {
                    id: Date.now().toString(),
                    label: this.generateNextConfigLabel(),
                    provider: 'gemini',
                    apiKey: '',
                    modelName: DEFAULT_MODEL,
                    temperature: null,
                    maxTokens: null,
                    topK: null,
                    topP: null,
                    presencePenalty: null,
                    frequencyPenalty: null,
                    thinkingBudget: null
                };
                configs.push(newConfig);
                if (configs.length === 1) {
                    state.settings.twinEngineActiveConfigId = newConfig.id;
                }
                this.renderList();
            },

            deleteConfig(configId) {
                const configs = state.settings.twinEngineApiConfigs;
                const index = configs.findIndex(c => c.id === configId);
                if (index === -1) return;

                configs.splice(index, 1);
                if (state.settings.twinEngineActiveConfigId === configId) {
                    state.settings.twinEngineActiveConfigId = configs.length > 0 ? configs[0].id : null;
                }
                this.renderList();
            },

            selectConfig(configId) {
                state.settings.twinEngineActiveConfigId = configId;
                this.renderList();
                elements.twinEngineApiConfigsList.dispatchEvent(new Event('change', { bubbles: true }));
            },

            updateConfigValue(configId, key, value) {
                const config = state.settings.twinEngineApiConfigs.find(c => c.id === configId);
                if (config) {
                    config[key] = value;
                    if (key === 'provider') {
                        config.modelName = this.getDefaultModelForProvider(value);
                        this.renderList();
                    }
                }
            },

            renderList() {
                const configs = state.settings.twinEngineApiConfigs;
                const container = elements.twinEngineApiConfigsList;
                container.innerHTML = '';

                if (configs.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.textContent = 'Twin-engine用のAPI設定がありません。';
                    emptyMsg.style.cssText = 'color: var(--text-secondary); font-size: 13px; text-align: center; margin: 10px 0;';
                    container.appendChild(emptyMsg);
                } else {
                    configs.forEach(config => {
                        const item = this.createConfigItem(config);
                        container.appendChild(item);
                    });
                }
                elements.addTwinEngineApiConfigBtn.disabled = configs.length >= this.MAX_CONFIGS;
                elements.addTwinEngineApiConfigBtn.textContent = configs.length >= this.MAX_CONFIGS
                    ? `最大${this.MAX_CONFIGS}個まで`
                    : '新しいAPI設定を追加';
                uiUtils.updateTwinEngineApiKeyCycleButton();
                elements.enableWebhookNotificationToggle.checked = state.settings.enableWebhookNotification;
                elements.webhookSettingsContainer.classList.toggle('hidden', !state.settings.enableWebhookNotification);
                webhookUtils.renderList();
            },

            createConfigItem(config) {
                const item = document.createElement('div');
                item.className = 'api-key-item twin-engine-api-config-item';
                item.dataset.configId = config.id;
                const isActive = state.settings.twinEngineActiveConfigId === config.id;
                if (isActive) item.classList.add('active');

                const labelInput = document.createElement('input');
                labelInput.type = 'text';
                labelInput.className = 'api-key-item-label twin-engine-config-label';
                labelInput.value = config.label;
                labelInput.addEventListener('change', (e) => this.updateConfigValue(config.id, 'label', e.target.value));

                const keyInput = document.createElement('input');
                keyInput.type = 'password';
                keyInput.className = 'api-key-item-input twin-engine-config-apikey';
                keyInput.value = config.apiKey;
                keyInput.placeholder = 'APIキーを入力...';
                keyInput.addEventListener('input', (e) => this.updateConfigValue(config.id, 'apiKey', e.target.value));

                const providerSelect = document.createElement('select');
                providerSelect.className = 'twin-engine-config-provider';
                API_PROVIDERS.forEach(providerInfo => {
                    if (providerInfo.value !== 'dummy') {
                        const option = document.createElement('option');
                        option.value = providerInfo.value;
                        option.textContent = providerInfo.text;
                        providerSelect.add(option);
                    }
                });
                providerSelect.value = config.provider;
                providerSelect.addEventListener('change', (e) => this.updateConfigValue(config.id, 'provider', e.target.value));

                const modelSelect = document.createElement('select');
                modelSelect.className = 'twin-engine-config-model';
                this.populateModelOptions(modelSelect, config.provider);
                modelSelect.value = config.modelName;
                modelSelect.addEventListener('change', (e) => this.updateConfigValue(config.id, 'modelName', e.target.value));

                const actions = document.createElement('div');
                actions.className = 'api-key-item-actions';
                const selectBtn = document.createElement('button');
                selectBtn.className = `api-key-select-btn ${isActive ? 'active' : ''}`;
                selectBtn.textContent = isActive ? '使用中' : '未選択';
                selectBtn.disabled = isActive;
                selectBtn.addEventListener('click', () => this.selectConfig(config.id));
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'api-key-delete-btn';
                deleteBtn.textContent = '削';
                deleteBtn.addEventListener('click', () => this.deleteConfig(config.id));
                actions.appendChild(selectBtn);
                actions.appendChild(deleteBtn);

                const row1 = document.createElement('div');
                row1.appendChild(labelInput);
                row1.appendChild(keyInput);
                row1.appendChild(actions);

                const row2 = document.createElement('div');
                row2.appendChild(providerSelect);
                row2.appendChild(modelSelect);

                const details = document.createElement('details');

                const summary = document.createElement('summary');
                summary.textContent = '詳細パラメータ';
                summary.style.cursor = 'pointer';
                summary.style.fontSize = '13px';
                summary.style.color = 'var(--text-link)';
                details.appendChild(summary);

                const paramsContainer = document.createElement('div');
                paramsContainer.className = 'param-grid';
                paramsContainer.style.marginTop = '10px';
                paramsContainer.style.paddingLeft = '15px';

                const createParamInput = (label, property, type = 'number', placeholder = '', step = 'any') => {
                    const div = document.createElement('div');
                    const lbl = document.createElement('label');
                    lbl.textContent = label;
                    lbl.style.fontSize = '12px';
                    const input = document.createElement('input');
                    input.type = type;
                    input.placeholder = placeholder;
                    if (step !== 'any') input.step = step;
                    input.value = config[property] ?? '';
                    input.style.fontSize = '12px';
                    input.style.padding = '4px 6px';
                    input.addEventListener('change', (e) => {
                        const value = e.target.value;
                        const parsedValue = value === '' ? null : (type === 'number' ? parseFloat(value) : value);
                        this.updateConfigValue(config.id, property, parsedValue);
                    });
                    div.appendChild(lbl);
                    div.appendChild(input);
                    return div;
                };

                paramsContainer.appendChild(createParamInput('Max Tokens:', 'maxTokens', 'number', '例: 4096', '1'));
                paramsContainer.appendChild(createParamInput('Temperature:', 'temperature', 'number', '例: 0.7', '0.01'));
                paramsContainer.appendChild(createParamInput('Top K:', 'topK', 'number', '例: 40', '1'));
                paramsContainer.appendChild(createParamInput('Top P:', 'topP', 'number', '例: 0.95', '0.01'));
                paramsContainer.appendChild(createParamInput('Presence Penalty:', 'presencePenalty', 'number', '例: 0.0', '0.1'));
                paramsContainer.appendChild(createParamInput('Frequency Penalty:', 'frequencyPenalty', 'number', '例: 0.0', '0.1'));
                const thinkingBudgetDiv = createParamInput('Thinking Budget:', 'thinkingBudget', 'number', '例: 5000', '1');
                paramsContainer.appendChild(thinkingBudgetDiv);

                const buttonContainer = document.createElement('div');
                buttonContainer.style.display = 'flex';
                buttonContainer.style.gap = '5px';
                buttonContainer.style.marginTop = '3px';

                const createBudgetButton = (text, value) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.textContent = text;
                    button.dataset.value = value;
                    button.style.cssText = `
        padding: 2px 6px;
        font-size: 11px;
        background-color: var(--bg-button-action);
        color: var(--text-light);
        border-radius: 3px;
        flex-grow: 1;
        cursor: pointer;
        border: none;
    `;
                    button.addEventListener('click', () => {
                        const input = thinkingBudgetDiv.querySelector('input');
                        if (value === 'null') {
                            input.value = '';
                        } else {
                            input.value = value;
                        }
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                    return button;
                };

                buttonContainer.appendChild(createBudgetButton('無', 'null'));
                buttonContainer.appendChild(createBudgetButton('0', '0'));

                thinkingBudgetDiv.appendChild(buttonContainer);
                details.appendChild(paramsContainer);

                item.appendChild(row1);
                item.appendChild(row2);
                item.appendChild(details);
                return item;
            },

            populateModelOptions(selectElement, provider) {
                selectElement.innerHTML = '';
                let sourceSelect;
                switch (provider) {
                    case 'gemini': sourceSelect = elements.geminiModelNameSelect; break;
                    case 'deepseek': sourceSelect = elements.deepSeekModelNameSelect; break;
                    case 'claude': sourceSelect = elements.claudeModelNameSelect; break;
                    case 'openai': sourceSelect = elements.openaiModelNameSelect; break;
                    case 'xai': sourceSelect = elements.xaiModelNameSelect; break;
                    case 'llmaggregator': sourceSelect = elements.llmAggregatorModelNameSelect; break;
                    default: return;
                }
                sourceSelect.querySelectorAll('optgroup, option').forEach(el => {
                    selectElement.add(el.cloneNode(true));
                });
            },

            getDefaultModelForProvider(provider) {
                switch (provider) {
                    case 'gemini': return DEFAULT_MODEL;
                    case 'deepseek': return DEFAULT_DEEPSEEK_MODEL;
                    case 'claude': return DEFAULT_CLAUDE_MODEL;
                    case 'openai': return DEFAULT_OPENAI_MODEL;
                    case 'xai': return DEFAULT_XAI_MODEL;
                    case 'llmaggregator': return DEFAULT_LLMAGGREGATOR_MODEL;
                    default: return '';
                }
            },
        };
