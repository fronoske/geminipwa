// @ts-nocheck -- Enable after shared application service types are defined.
// Bundled into the generated index.html from this TypeScript source.
        const proofreadingApiConfigUtils = {
            MAX_CONFIGS: 10,

            initialize() {
                elements.addProofreadingApiConfigBtn.addEventListener('click', () => this.addConfig());
                this.renderList();
            },

            generateNextConfigLabel() {
                const index = state.settings.proofreadingApiConfigs.length;
                return `校正設定 ${index + 1}`;
            },

            addConfig() {
                const configs = state.settings.proofreadingApiConfigs;
                if (configs.length >= this.MAX_CONFIGS) {
                    uiUtils.showCustomAlert(`最大${this.MAX_CONFIGS}個までの校正設定を作成できます。`);
                    return;
                }
                const newConfig = {
                    id: Date.now().toString(),
                    label: this.generateNextConfigLabel(),
                    provider: 'gemini',
                    apiKey: '',
                    modelName: DEFAULT_MODEL,
                    systemPrompt: 'あなたはプロの編集者です。受け取った文章をより自然で分かりやすく校正してください。元の文章の意図やニュアンスは変えないでください。校正後の文章のみを出力してください。',
                    temperature: 0.2,
                    maxTokens: null,
                    topK: null,
                    topP: null,
                    presencePenalty: null,
                    frequencyPenalty: null,
                    thinkingBudget: null
                };
                configs.push(newConfig);
                if (configs.length === 1) {
                    state.settings.activeProofreadingConfigId = newConfig.id;
                }
                this.renderList();
            },

            deleteConfig(configId) {
                const configs = state.settings.proofreadingApiConfigs;
                const index = configs.findIndex(c => c.id === configId);
                if (index === -1) return;

                configs.splice(index, 1);
                if (state.settings.activeProofreadingConfigId === configId) {
                    state.settings.activeProofreadingConfigId = configs.length > 0 ? configs[0].id : null;
                }
                this.renderList();
            },

            selectConfig(configId) {
                state.settings.activeProofreadingConfigId = configId;
                this.renderList();
                elements.proofreadingApiConfigsList.dispatchEvent(new Event('change', { bubbles: true }));
            },

            updateConfigValue(configId, key, value) {
                const config = state.settings.proofreadingApiConfigs.find(c => c.id === configId);
                if (config) {
                    config[key] = value;
                    if (key === 'provider') {
                        config.modelName = this.getDefaultModelForProvider(value);
                        this.renderList();
                    }
                }
            },

            renderList() {
                const configs = state.settings.proofreadingApiConfigs;
                const container = elements.proofreadingApiConfigsList;
                container.innerHTML = '';

                if (configs.length === 0) {
                    const emptyMsg = document.createElement('p');
                    emptyMsg.textContent = '校正用のAPI設定がありません。';
                    emptyMsg.style.cssText = 'color: var(--text-secondary); font-size: 13px; text-align: center; margin: 10px 0;';
                    container.appendChild(emptyMsg);
                } else {
                    configs.forEach(config => {
                        const item = this.createConfigItem(config);
                        container.appendChild(item);
                    });
                }
                elements.addProofreadingApiConfigBtn.disabled = configs.length >= this.MAX_CONFIGS;
            },

            createConfigItem(config) {
                const item = document.createElement('div');
                item.className = 'api-key-item proofreading-api-config-item';
                item.dataset.configId = config.id;
                const isActive = state.settings.activeProofreadingConfigId === config.id;
                if (isActive) item.classList.add('active');

                const labelInput = document.createElement('input');
                labelInput.type = 'text';
                labelInput.className = 'api-key-item-label';
                labelInput.value = config.label;
                labelInput.addEventListener('change', (e) => this.updateConfigValue(config.id, 'label', e.target.value));

                const keyInput = document.createElement('input');
                keyInput.type = 'password';
                keyInput.className = 'api-key-item-input';
                keyInput.value = config.apiKey;
                keyInput.placeholder = 'APIキー...';
                keyInput.addEventListener('input', (e) => this.updateConfigValue(config.id, 'apiKey', e.target.value));

                const providerSelect = document.createElement('select');
                providerSelect.className = 'api-config-provider';
                API_PROVIDERS.forEach(providerInfo => {
                    if (providerInfo.value !== 'dummy') {
                        const option = document.createElement('option');
                        option.value = providerInfo.value;
                        option.textContent = providerInfo.text.split(' ')[0];
                        providerSelect.add(option);
                    }
                });
                providerSelect.value = config.provider;
                providerSelect.addEventListener('change', (e) => this.updateConfigValue(config.id, 'provider', e.target.value));

                const modelSelect = document.createElement('select');
                modelSelect.className = 'api-config-model';
                this.populateModelOptions(modelSelect, config.provider);
                modelSelect.value = config.modelName;
                modelSelect.addEventListener('change', (e) => this.updateConfigValue(config.id, 'modelName', e.target.value));

                const systemPromptTextarea = document.createElement('textarea');
                systemPromptTextarea.className = 'api-key-item-input';
                systemPromptTextarea.value = config.systemPrompt || '';
                systemPromptTextarea.placeholder = '校正用のシステムプロンプト...';
                systemPromptTextarea.rows = 2;
                systemPromptTextarea.addEventListener('change', (e) => this.updateConfigValue(config.id, 'systemPrompt', e.target.value));

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
                row1.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px;';
                row1.appendChild(labelInput);
                row1.appendChild(keyInput);
                row1.appendChild(actions);

                const row2 = document.createElement('div');
                row2.style.cssText = 'display: flex; gap: 5px;';
                row2.appendChild(providerSelect);
                row2.appendChild(modelSelect);

                item.appendChild(row1);
                item.appendChild(row2);
                item.appendChild(systemPromptTextarea);
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
                if (sourceSelect) {
                    sourceSelect.querySelectorAll('optgroup, option').forEach(el => {
                        selectElement.add(el.cloneNode(true));
                    });
                }
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
