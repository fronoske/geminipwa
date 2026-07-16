// @ts-nocheck -- Enable after shared UI types are defined.
// Bundled into the generated index.html from this TypeScript source.
Object.assign(uiUtils, {
            updateChatScreenElementVisibility() {
                const header = elements.chatScreen.querySelector('.app-header');
                const allButtons = Array.from(header.querySelectorAll('button'));
                allButtons.forEach(btn => btn.classList.remove('layout-hidden'));

                const updateVisibility = () => {
                    const toggleableButtons = [
                        { id: '#show-chat-title-toggle', element: elements.chatTitle },
                        { id: '#show-header-menu-button-toggle', element: elements.headerMenuContainer },
                        { id: '#show-api-provider-toggle-header', element: elements.headerApiProviderToggleBtn },
                       { id: '#show-header-cycle-api-key-btn-toggle', element: elements.headerCycleApiKeyBtn },
                        { id: '#show-scroll-to-top-button-toggle', element: elements.scrollToTopBtn },
                        { id: '#show-scroll-to-bottom-button-toggle', element: elements.scrollToBottomBtn },
                        { id: '#show-toggle-all-content-button-toggle', element: elements.toggleAllContentBtn },
                        { id: '#show-memo-button-toggle', element: elements.toggleMemoBtn },
                        { id: '#show-clipboard-stack-button-toggle', element: elements.toggleClipboardStackBtn },
                    ];

                    toggleableButtons.forEach(item => {
                        const checkbox = document.querySelector(item.id);
                        if (item.element) {
                            item.element.classList.toggle('hidden', !checkbox.checked);
                        }
                    });
                    if (!state.settings.showHeaderMenuButton) {
                        this.setHeaderMenuOpen(false);
                    }

                    this.adjustHeaderLayout();
                    this.updateProviderToggleButtons();
                };

                requestAnimationFrame(updateVisibility);
            },
            adjustHeaderLayout() {
                const header = elements.chatScreen.querySelector('.app-header');
                if (!header) return;

                const allButtons = Array.from(header.querySelectorAll('button:not(#goto-history-btn):not(#goto-settings-btn)'));
                allButtons.forEach(btn => btn.classList.remove('layout-hidden'));

                requestAnimationFrame(() => {
                    let containerWidth = header.offsetWidth;
                    let settingsBtnRect = elements.gotoSettingsBtn.getBoundingClientRect();
                    let headerRect = header.getBoundingClientRect();
                    let isOverflowing = settingsBtnRect.right > headerRect.right - 5;

                    const buttonPriority = [
                        '#toggle-clipboard-stack-btn', '#toggle-memo-btn', '#scroll-to-top-btn',
                        '#scroll-to-bottom-btn', '#toggle-all-content-btn', '#header-api-provider-toggle-btn',
                        '#header-cycle-api-key-btn'
                    ];

                    if (isOverflowing) {
                        for (const selector of buttonPriority) {
                            const btn = header.querySelector(selector);
                            if (btn && !btn.classList.contains('hidden') && !btn.classList.contains('layout-hidden')) {
                                btn.classList.add('layout-hidden');
                                settingsBtnRect = elements.gotoSettingsBtn.getBoundingClientRect();
                                isOverflowing = settingsBtnRect.right > headerRect.right - 5;
                                if (!isOverflowing) break;
                            }
                        }
                    }
                });
            },
            setHeaderMenuOpen(isOpen) {
                elements.headerSubmenu.classList.toggle('hidden', !isOpen);
                elements.headerMenuBtn.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) {
                    elements.headerSubmenu.querySelector('[role="menuitem"]')?.focus();
                }
            },
            toggleHeaderMenu() {
                this.setHeaderMenuOpen(elements.headerSubmenu.classList.contains('hidden'));
            },
            updateProviderToggleButtons() {
                const providerMap = {
                    gemini: { text: 'GE', title: 'Gemini', className: 'gemini' },
                    deepseek: { text: 'DS', title: 'DeepSeek', className: 'deepseek' },
                    claude: { text: 'AN', title: 'Anthropic', className: 'claude' },
                    openai: { text: 'OP', title: 'OpenAI', className: 'openai' },
                    openrouter: { text: 'OR', title: 'OpenRouter', className: 'openrouter' },
                    xai: { text: 'XA', title: 'xAI', className: 'xai' },
                    llmaggregator: { text: 'LA', title: 'LLM Aggregator', className: 'llmaggregator' },
                };
                const currentProviderInfo = providerMap[state.settings.apiProvider] || { text: '??', title: 'Unknown', className: '' };

                [elements.headerApiProviderToggleBtn].forEach(button => {
                    if (button) {
                        button.textContent = currentProviderInfo.text;
                        button.title = `API: ${currentProviderInfo.title}`;
                        button.classList.remove('gemini', 'deepseek', 'claude', 'openai', 'openrouter', 'xai', 'llmaggregator');
                        if (currentProviderInfo.className) {
                            button.classList.add(currentProviderInfo.className);
                        }
                    }
                });
            },
            updateHistoryHeaderButtonVisibility() {
                const showBulkActions = state.settings.showBulkHistoryActions;
                if (elements.exportAllSessionsBtn) {
                    elements.exportAllSessionsBtn.classList.toggle('hidden', !showBulkActions);
                }
                if (elements.importAllSessionsBtn) {
                    elements.importAllSessionsBtn.classList.toggle('hidden', !showBulkActions);
                }
            },
            updateUserModelOptions() {
                const group = elements.geminiUserDefinedModelsGroup;
                group.innerHTML = '';
                const models = (state.settings.additionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    group.disabled = false;
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        group.appendChild(option);
                    });
                    if (models.includes(state.settings.modelName)) {
                        elements.geminiModelNameSelect.value = state.settings.modelName;
                    }
                } else {
                    group.disabled = true;
                }
            },
            updateDeepSeekUserModelOptions() {
                const select = elements.deepSeekModelNameSelect;
                const userDefinedOptgroup = select.querySelector('optgroup[label="ユーザー指定 (DeepSeek)"]');
                if (userDefinedOptgroup) {
                    userDefinedOptgroup.remove();
                }

                const baseModelsOptgroup = select.querySelector('optgroup[label="基本モデル (DeepSeek)"]') || select;
                baseModelsOptgroup.innerHTML = '';
                const defaultDeepSeekModels = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
                defaultDeepSeekModels.forEach(modelId => {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = modelId;
                    baseModelsOptgroup.appendChild(option);
                });

                const additionalModels = (state.settings.deepSeekAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (additionalModels.length > 0) {
                    let optgroup = document.createElement('optgroup');
                    optgroup.label = 'ユーザー指定 (DeepSeek)';
                    optgroup.id = 'deepseek-user-defined-models-group';
                    additionalModels.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        optgroup.appendChild(option);
                    });
                    select.appendChild(optgroup);
                }

                if (state.settings.deepSeekModelName && Array.from(select.options).some(opt => opt.value === state.settings.deepSeekModelName)) {
                    select.value = state.settings.deepSeekModelName;
                } else if (select.options.length > 0) {
                    select.value = defaultDeepSeekModels[0];
                    state.settings.deepSeekModelName = select.value;
                }
            },
            updateClaudeUserModelOptions() {
                const group = elements.claudeUserDefinedModelsGroup;
                group.innerHTML = '';
                const models = (state.settings.claudeAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    group.disabled = false;
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        group.appendChild(option);
                    });
                    if (models.includes(state.settings.claudeModelName)) {
                        elements.claudeModelNameSelect.value = state.settings.claudeModelName;
                    }
                } else {
                    group.disabled = true;
                }
            },
            updateOpenAIUserModelOptions() {
                const select = elements.openaiModelNameSelect;
                select.querySelectorAll('optgroup[label="ユーザー指定"]').forEach(el => el.remove());
                const models = (state.settings.openaiAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = 'ユーザー指定';
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        optgroup.appendChild(option);
                    });
                    select.appendChild(optgroup);
                }
                if (Array.from(select.options).some(opt => opt.value === state.settings.openaiModelName)) {
                    select.value = state.settings.openaiModelName;
                } else {
                    select.value = DEFAULT_OPENAI_MODEL;
                }
            },
            updateOpenRouterUserModelOptions() {
                const selectedGroup = elements.openrouterSelectedModelsGroup;
                const manualGroup = elements.openrouterUserDefinedModelsGroup;
                const currentModelId = elements.openrouterModelNameSelect.value
                    || state.settings.openrouterModelName
                    || DEFAULT_OPENROUTER_MODEL;
                selectedGroup.innerHTML = '';
                manualGroup.innerHTML = '';
                const selectedModels = Array.isArray(state.settings.openrouterSelectedModels)
                    ? [...new Set(state.settings.openrouterSelectedModels.filter(Boolean))]
                    : [];
                const manualModels = (state.settings.openrouterAdditionalModels || '')
                    .split(',')
                    .map(model => model.trim())
                    .filter(Boolean);

                selectedModels.forEach(modelId => {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = typeof openRouterModelCatalog !== 'undefined'
                        ? openRouterModelCatalog.getDisplayLabel(modelId)
                        : modelId;
                    selectedGroup.appendChild(option);
                });
                const selectedIds = new Set(selectedModels);
                manualModels.filter((modelId) => !selectedIds.has(modelId)).forEach(modelId => {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = modelId;
                    manualGroup.appendChild(option);
                });
                selectedGroup.disabled = selectedGroup.children.length === 0;
                manualGroup.disabled = manualGroup.children.length === 0;
                const availableOptions = Array.from(elements.openrouterModelNameSelect.options);
                const nextModelId = availableOptions.some(option => option.value === currentModelId)
                    ? currentModelId
                    : (availableOptions[0]?.value || '');
                elements.openrouterModelNameSelect.value = nextModelId;
                state.settings.openrouterModelName = nextModelId;
                if (elements.openrouterSelectedModelCount) {
                    elements.openrouterSelectedModelCount.textContent = String(selectedModels.length);
                }
            },
            updateXaiUserModelOptions() {
                const group = elements.xaiUserDefinedModelsGroup;
                group.innerHTML = '';
                const models = (state.settings.xaiAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    group.disabled = false;
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        group.appendChild(option);
                    });
                    if (models.includes(state.settings.xaiModelName)) {
                        elements.xaiModelNameSelect.value = state.settings.xaiModelName;
                    }
                } else {
                    group.disabled = true;
                }
            },
            updateLlmAggregatorUserModelOptions() {
                const select = elements.llmAggregatorModelNameSelect;
                const userDefinedOptgroup = select.querySelector('optgroup[label="ユーザー指定"]');
                select.innerHTML = '';

                const hfOptgroup = document.createElement('optgroup');
                hfOptgroup.label = 'Hugging Faceサンプル';
                const hfOption = document.createElement('option');
                hfOption.value = 'moonshotai/Kimi-K2-Thinking:novita';
                hfOption.textContent = 'moonshotai/Kimi-K2-Thinking:novita';
                hfOptgroup.appendChild(hfOption);
                select.appendChild(hfOptgroup);

                const openRouterOptgroup = document.createElement('optgroup');
                openRouterOptgroup.label = 'OpenRouterサンプル';
                const openRouterModels = [
                    'google/gemma-4-31b-it:free',
                    'google/gemini-3.1-pro-preview',
                    'google/gemini-2.5-pro',
                    'anthropic/claude-sonnet-5',
                    'z-ai/glm-5.2',
                    'deepseek/deepseek-v4-pro'
                ];
                openRouterModels.forEach(modelId => {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = modelId;
                    openRouterOptgroup.appendChild(option);
                });
                select.appendChild(openRouterOptgroup);

                const additionalModels = (state.settings.llmAggregatorAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (additionalModels.length > 0) {
                    let optgroup = document.createElement('optgroup');
                    optgroup.label = 'ユーザー指定';
                    optgroup.id = 'llmaggregator-user-defined-models-group';
                    additionalModels.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        optgroup.appendChild(option);
                    });
                    select.appendChild(optgroup);
                }

                if (state.settings.llmAggregatorModelName && Array.from(select.options).some(opt => opt.value === state.settings.llmAggregatorModelName)) {
                    select.value = state.settings.llmAggregatorModelName;
                } else if (select.options.length > 0) {
                    select.value = DEFAULT_LLMAGGREGATOR_MODEL;
                    state.settings.llmAggregatorModelName = select.value;
                }
            },
            applyFontFamily() {
                const customFont = state.settings.fontFamily?.trim();
                const fontFamilyToApply = customFont ? customFont : DEFAULT_FONT_FAMILY;
                document.documentElement.style.setProperty('--font-family', fontFamilyToApply);
                document.documentElement.style.setProperty('--message-body-font-size', `${state.settings.messageBodyFontSize || DEFAULT_MESSAGE_BODY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--code-block-font-size', `${state.settings.codeBlockFontSize || DEFAULT_CODE_BLOCK_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--thought-summary-font-size', `${state.settings.thoughtSummaryFontSize || DEFAULT_THOUGHT_SUMMARY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--chat-ui-scale', state.settings.chatUiScale || 1.0);
                document.documentElement.style.setProperty('--settings-ui-scale', state.settings.settingsUiScale || 1.0);
                document.documentElement.style.setProperty('--history-ui-scale', state.settings.historyUiScale || 1.0);
            },
});
