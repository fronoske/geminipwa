// @ts-nocheck -- Enable after shared UI types are defined.
// Bundled into the generated index.html from this TypeScript source.
Object.assign(uiUtils, {
            applySidePanelSettingsToUI() {
                if (elements.toggleMemoBtn) {
                    elements.toggleMemoBtn.classList.toggle('hidden', !state.settings.showMemoButton);
                }
                document.documentElement.style.setProperty('--memo-height', state.settings.memoHeight || DEFAULT_MEMO_HEIGHT);

                if (elements.toggleClipboardStackBtn) {
                    elements.toggleClipboardStackBtn.classList.toggle('hidden', !state.settings.showClipboardStackButton);
                }
                document.documentElement.style.setProperty('--clipboard-stack-height', state.settings.clipboardStackHeight || DEFAULT_CLIPBOARD_STACK_HEIGHT);
            },
            applyOpacitySettings() {
                document.documentElement.style.setProperty('--message-bubble-opacity',
                    state.settings.enableMessageBubbleOpacity ? state.settings.messageBubbleOpacity : 1
                );
                document.documentElement.style.setProperty('--header-footer-opacity',
                    state.settings.enableHeaderFooterOpacity ? state.settings.headerFooterOpacity : 1
                );
                document.documentElement.style.setProperty('--chat-overlay-alpha',
                    state.settings.enableChatOverlayOpacity ? state.settings.chatOverlayOpacity : 1
                );
                document.documentElement.style.setProperty('--message-actions-bg-opacity',
                    state.settings.enableMessageActionsBackgroundOpacity ? state.settings.messageActionsBackgroundOpacity : 1
                );
                document.documentElement.style.setProperty('--thought-summary-opacity',
                    state.settings.enableThoughtSummaryOpacity ? state.settings.thoughtSummaryOpacity : 1
                );
                let headerColor, secondaryColor, userMessageColor, modelMessageColor, overlayBaseColor, tertiaryColorRgbStr;

switch (state.settings.theme) {
                    case 'dark':
                        headerColor = DARK_THEME_COLOR;
                        secondaryColor = DARK_MODE_SECONDARY_COLOR;
                        userMessageColor = DARK_MODE_USER_MESSAGE_COLOR;
                        modelMessageColor = DARK_MODE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = DARK_MODE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-pink':
                        headerColor = PASTEL_PINK_HEADER_COLOR;
                        secondaryColor = PASTEL_PINK_SECONDARY_COLOR;
                        userMessageColor = PASTEL_PINK_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_PINK_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_PINK_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-blue':
                        headerColor = PASTEL_BLUE_HEADER_COLOR;
                        secondaryColor = PASTEL_BLUE_SECONDARY_COLOR;
                        userMessageColor = PASTEL_BLUE_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_BLUE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_BLUE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-yellow':
                        headerColor = PASTEL_YELLOW_HEADER_COLOR;
                        secondaryColor = PASTEL_YELLOW_SECONDARY_COLOR;
                        userMessageColor = PASTEL_YELLOW_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_YELLOW_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_YELLOW_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-purple':
                        headerColor = PASTEL_PURPLE_HEADER_COLOR;
                        secondaryColor = PASTEL_PURPLE_SECONDARY_COLOR;
                        userMessageColor = PASTEL_PURPLE_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_PURPLE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_PURPLE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-rainbow':
                        headerColor = PASTEL_RAINBOW_HEADER_COLOR;
                        secondaryColor = PASTEL_RAINBOW_SECONDARY_COLOR;
                        userMessageColor = PASTEL_RAINBOW_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_RAINBOW_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_RAINBOW_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'light':
                    default:
                        headerColor = LIGHT_THEME_COLOR;
                        secondaryColor = LIGHT_MODE_SECONDARY_COLOR;
                        userMessageColor = LIGHT_MODE_USER_MESSAGE_COLOR;
                        modelMessageColor = LIGHT_MODE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = LIGHT_MODE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                }

                if (state.settings.theme !== 'pastel-rainbow') {
                    const headerRgb = this.hexToRgb(headerColor) || this.parseRgbCss(headerColor);
                    if (headerRgb) {
                        document.documentElement.style.setProperty('--bg-header-rgb', `${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}`);
                    }
                }

                const secondaryBgRgb = this.hexToRgb(secondaryColor) || this.parseRgbCss(secondaryColor);
                if (secondaryBgRgb) {
                    document.documentElement.style.setProperty('--bg-secondary-rgb', `${secondaryBgRgb.r}, ${secondaryBgRgb.g}, ${secondaryBgRgb.b}`);
                }
                const userMessageBgRgb = this.hexToRgb(userMessageColor) || this.parseRgbCss(userMessageColor);
                if (userMessageBgRgb) {
                    document.documentElement.style.setProperty('--bg-user-message-rgb', `${userMessageBgRgb.r}, ${userMessageBgRgb.g}, ${userMessageBgRgb.b}`);
                }
                const modelMessageBgRgb = this.hexToRgb(modelMessageColor) || this.parseRgbCss(modelMessageColor);
                if (modelMessageBgRgb) {
                    document.documentElement.style.setProperty('--bg-model-message-rgb', `${modelMessageBgRgb.r}, ${modelMessageBgRgb.g}, ${modelMessageBgRgb.b}`);
                }
                const overlayBaseRgbVal = this.hexToRgb(overlayBaseColor) || this.parseRgbCss(overlayBaseColor);
                if (overlayBaseRgbVal) {
                    document.documentElement.style.setProperty('--overlay-base-rgb', `${overlayBaseRgbVal.r}, ${overlayBaseRgbVal.g}, ${overlayBaseRgbVal.b}`);
                }
                if (tertiaryColorRgbStr) {
                    document.documentElement.style.setProperty('--bg-tertiary-rgb', tertiaryColorRgbStr);
                }
            },
            hexToRgb(hex) {
                if (typeof hex !== 'string') return null;
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            },
            parseRgbCss(rgbString) {
                if (typeof rgbString !== 'string') return null;
                const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                if (match) {
                    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
                }
                return null;
            },
            applyZoomPreventionSetting() {
                let viewportMeta = document.querySelector('meta[name="viewport"]');
                if (!viewportMeta) {
                    viewportMeta = document.createElement('meta');
                    viewportMeta.name = 'viewport';
                    document.head.appendChild(viewportMeta);
                }

                let content = "width=device-width, initial-scale=1.0";
                if (state.settings.preventZoom) {
                    content += ", maximum-scale=1.0, user-scalable=no";
                }
                viewportMeta.content = content;
            },
            applyTheme() {
                const theme = state.settings.theme;
document.body.classList.remove('dark-mode', 'light-mode-forced', 'pastel-pink-mode', 'pastel-blue-mode', 'pastel-yellow-mode', 'pastel-purple-mode', 'pastel-rainbow-mode');
                let themeColorMetaValue;
                let currentThemeUserMessageBgRgb = this.hexToRgb(LIGHT_MODE_USER_MESSAGE_COLOR) || { r: 220, g: 248, b: 198 };
                let currentThemeModelMessageBgRgb = this.hexToRgb(LIGHT_MODE_MODEL_MESSAGE_COLOR) || { r: 229, g: 229, b: 234 };

                switch (theme) {
                    case 'dark':
                        document.body.classList.add('dark-mode');
                        themeColorMetaValue = DARK_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(DARK_MODE_USER_MESSAGE_COLOR) || { r: 5, g: 97, b: 98 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(DARK_MODE_MODEL_MESSAGE_COLOR) || { r: 58, g: 58, b: 60 };
                        break;
                    case 'pastel-pink':
                        document.body.classList.add('pastel-pink-mode');
                        themeColorMetaValue = PASTEL_PINK_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_PINK_USER_MESSAGE_COLOR) || { r: 255, g: 221, b: 238 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_PINK_MODEL_MESSAGE_COLOR) || { r: 243, g: 232, b: 255 };
                        break;
                    case 'pastel-blue':
                        document.body.classList.add('pastel-blue-mode');
                        themeColorMetaValue = PASTEL_BLUE_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_BLUE_USER_MESSAGE_COLOR) || { r: 207, g: 241, b: 239 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_BLUE_MODEL_MESSAGE_COLOR) || { r: 224, g: 232, b: 255 };
                        break;
                    case 'pastel-yellow':
                        document.body.classList.add('pastel-yellow-mode');
                        themeColorMetaValue = PASTEL_YELLOW_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_YELLOW_USER_MESSAGE_COLOR) || { r: 255, g: 245, b: 186 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_YELLOW_MODEL_MESSAGE_COLOR) || { r: 255, g: 228, b: 181 };
                        break;
                    case 'pastel-purple':
                        document.body.classList.add('pastel-purple-mode');
                        themeColorMetaValue = PASTEL_PURPLE_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_PURPLE_USER_MESSAGE_COLOR) || { r: 209, g: 196, b: 233 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_PURPLE_MODEL_MESSAGE_COLOR) || { r: 197, g: 202, b: 233 };
                        break;
                    case 'pastel-rainbow':
                        document.body.classList.add('pastel-rainbow-mode');
                        themeColorMetaValue = PASTEL_RAINBOW_HEADER_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_RAINBOW_USER_MESSAGE_COLOR) || { r: 224, g: 255, b: 240 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_RAINBOW_MODEL_MESSAGE_COLOR) || { r: 224, g: 240, b: 255 };
                        break;
                    case 'light':
                    default:
                        document.body.classList.add('light-mode-forced');
                        themeColorMetaValue = LIGHT_THEME_COLOR;
                        break;
                }
                if (elements.themeColorMeta) {
                    elements.themeColorMeta.content = themeColorMetaValue;
                }

                document.documentElement.style.setProperty('--current-theme-user-message-rgb', `${currentThemeUserMessageBgRgb.r}, ${currentThemeUserMessageBgRgb.g}, ${currentThemeUserMessageBgRgb.b}`);
                document.documentElement.style.setProperty('--current-theme-model-message-rgb', `${currentThemeModelMessageBgRgb.r}, ${currentThemeModelMessageBgRgb.g}, ${currentThemeModelMessageBgRgb.b}`);

                this.applyOpacitySettings();
                this.applyZoomPreventionSetting();
            },
    applyElevationSetting() {
        document.body.classList.toggle('elevation-enabled', state.settings.enableElevation);
        document.body.classList.toggle('elevation-hover-enabled', state.settings.enableElevationHover);
    },

            applySettingsToUI() {
                this.toggleApiSettingsVisibility(state.settings.apiProvider);
                elements.apiProviderSelect.value = state.settings.apiProvider;
                elements.commonSystemPromptDefaultTextarea.value = state.settings.commonSystemPrompt || '';
                elements.enableCommonSystemPromptDefaultCheckbox.checked = state.settings.enableCommonSystemPromptDefault;
                elements.commonDummyUserInput.value = state.settings.commonDummyUser || '';
                elements.enableCommonDummyUserCheckbox.checked = state.settings.enableCommonDummyUser;
                elements.geminiApiKeyInput.value = state.settings.apiKey || '';
                elements.geminiModelNameSelect.value = state.settings.modelName || DEFAULT_MODEL;
                elements.geminiAdditionalModelsTextarea.value = state.settings.additionalModels || '';
elements.deepSeekApiKeyInput.value = state.settings.deepSeekApiKey || '';
elements.deepSeekApiEndpointInput.value = state.settings.deepSeekApiEndpoint || '';
elements.deepSeekModelNameSelect.value = state.settings.deepSeekModelName || DEFAULT_DEEPSEEK_MODEL;
                elements.deepSeekAdditionalModelsTextarea.value = state.settings.deepSeekAdditionalModels || '';
                elements.claudeApiKeyInput.value = state.settings.claudeApiKey || '';
                elements.claudeModelNameSelect.value = state.settings.claudeModelName || DEFAULT_CLAUDE_MODEL;
                elements.claudeAdditionalModelsTextarea.value = state.settings.claudeAdditionalModels || '';
                elements.openaiApiKeyInput.value = state.settings.openaiApiKey || '';
                elements.openaiModelNameSelect.value = state.settings.openaiModelName || DEFAULT_OPENAI_MODEL;
                elements.openaiAdditionalModelsTextarea.value = state.settings.openaiAdditionalModels || '';
                elements.openrouterApiKeyInput.value = state.settings.openrouterApiKey || '';
                elements.openrouterModelNameSelect.value = state.settings.openrouterModelName || DEFAULT_OPENROUTER_MODEL;
                elements.openrouterAdditionalModelsTextarea.value = state.settings.openrouterAdditionalModels || '';
                elements.xaiApiKeyInput.value = state.settings.xaiApiKey || '';
                elements.xaiModelNameSelect.value = state.settings.xaiModelName || DEFAULT_XAI_MODEL;
                elements.xaiAdditionalModelsTextarea.value = state.settings.xaiAdditionalModels || '';
                elements.llmAggregatorApiBackendInput.value = state.settings.llmAggregatorApiBackend || '';
                elements.llmAggregatorApiKeyInput.value = state.settings.llmAggregatorApiKey || '';
                elements.llmAggregatorModelNameSelect.value = state.settings.llmAggregatorModelName || DEFAULT_LLMAGGREGATOR_MODEL;
                elements.llmAggregatorAdditionalModelsTextarea.value = state.settings.llmAggregatorAdditionalModels || '';

                multiBackendUtils.renderList();

                multiApiKeyUtils.renderAllApiKeyLists();
                multiApiKeyUtils.updateMainApiKeyInput('gemini');
                multiApiKeyUtils.updateMainApiKeyInput('deepseek');
                multiApiKeyUtils.updateMainApiKeyInput('claude');
                multiApiKeyUtils.updateMainApiKeyInput('openai');
                multiApiKeyUtils.updateMainApiKeyInput('openrouter');
                multiApiKeyUtils.updateMainApiKeyInput('xai');
                multiApiKeyUtils.updateMainApiKeyInput('llmaggregator');

                const setupParamUI = (paramId, storageKey) => {
                    const numberInput = document.getElementById(paramId);
                    const sliderInput = document.getElementById(paramId + '-slider');
                    const checkbox = document.querySelector(`.param-default-checkbox[data-target-id="${paramId}"]`);
                    const maxInput = document.querySelector(`.param-slider-max-input[data-target-id="${paramId}"]`);
                    const label = checkbox.parentElement;
                    if (label) {
                        label.title = "カスタム値を指定する (チェックを入れると有効)";
                    }

                    let paramKey = paramId.replace(/-(\w)/g, (_, c) => c.toUpperCase());
                    if (paramKey.startsWith('deepseek')) {
                        paramKey = 'deepSeek' + paramKey.substring('deepseek'.length);
                    } else if (paramKey.startsWith('llmaggregator')) {
                        paramKey = 'llmAggregator' + paramKey.substring('llmaggregator'.length);
                    }
                    const value = state.settings[paramKey] ?? null;

                    const useCustomValue = value !== null;

                    checkbox.checked = useCustomValue;
                    numberInput.disabled = !useCustomValue;
                    sliderInput.disabled = !useCustomValue;
                    if (maxInput) maxInput.disabled = !useCustomValue;

                    if (useCustomValue) {
                        numberInput.value = value;
                        sliderInput.value = value;
                    } else {
                        numberInput.value = '';
                    }

                    if (maxInput) {
                        const maxVal = state.settings[storageKey] || parseFloat(sliderInput.getAttribute('max')) || 100;
                        sliderInput.max = maxVal;
                        maxInput.value = maxVal;
                    }
                };

                elements.geminiSystemPromptDefaultTextarea.value = state.settings.geminiSystemPrompt || '';
                elements.geminiEnableSystemPromptDefaultCheckbox.checked = state.settings.geminiEnableSystemPromptDefault;
                setupParamUI('gemini-max-tokens', 'geminiMaxTokensSliderMax');
                setupParamUI('gemini-temperature');
                setupParamUI('gemini-top-k', 'geminiTopKSliderMax');
                setupParamUI('gemini-top-p');
                setupParamUI('gemini-presence-penalty');
                setupParamUI('gemini-frequency-penalty');
                setupParamUI('gemini-thinking-budget', 'geminiThinkingBudgetSliderMax');
                elements.geminiThinkingBudgetInput.value = state.settings.geminiThinkingBudget === null ? '' : state.settings.geminiThinkingBudget;
                elements.geminiIncludeThoughtsToggle.checked = state.settings.geminiIncludeThoughts;
                elements.geminiExpandThoughtsByDefaultToggle.checked = state.settings.geminiExpandThoughtsByDefault;
                elements.geminiStreamingOutputCheckbox.checked = state.settings.geminiStreamingOutput;
                elements.geminiStreamingSpeedInput.value = state.settings.geminiStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.geminiPseudoStreamingCheckbox.checked = state.settings.geminiPseudoStreaming;
                elements.geminiEnableGroundingToggle.checked = state.settings.geminiEnableGrounding;
                elements.deepSeekSystemPromptDefaultTextarea.value = state.settings.deepSeekSystemPrompt || '';
                elements.deepSeekEnableSystemPromptDefaultCheckbox.checked = state.settings.deepSeekEnableSystemPromptDefault;
                setupParamUI('deepseek-max-tokens', 'deepseekMaxTokensSliderMax');
                setupParamUI('deepseek-temperature');
                setupParamUI('deepseek-top-p');
                setupParamUI('deepseek-presence-penalty');
                setupParamUI('deepseek-frequency-penalty');
                elements.deepSeekIncludeThoughtsToggle.checked = state.settings.deepSeekIncludeDeepSeekThoughts;
                elements.deepSeekExpandThoughtsByDefaultToggle.checked = state.settings.deepSeekExpandThoughtsByDefault;
                elements.deepSeekStreamingOutputCheckbox.checked = state.settings.deepSeekStreamingOutput;
                elements.deepSeekStreamingSpeedInput.value = state.settings.deepSeekStreamingSpeed ?? DEFAULT_STREAMING_SPEED;

                elements.claudeSystemPromptDefaultTextarea.value = state.settings.claudeSystemPrompt || '';
                elements.claudeEnableSystemPromptDefaultCheckbox.checked = state.settings.claudeEnableSystemPromptDefault;
                setupParamUI('claude-max-tokens', 'claudeMaxTokensSliderMax');
                setupParamUI('claude-temperature');
                setupParamUI('claude-top-k', 'claudeTopKSliderMax');
                setupParamUI('claude-top-p');
                setupParamUI('claude-thinking-budget', 'claudeThinkingBudgetSliderMax');
                elements.claudeStreamingOutputCheckbox.checked = state.settings.claudeStreamingOutput;
                elements.claudeStreamingSpeedInput.value = state.settings.claudeStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.claudeIncludeThoughtsToggle.checked = state.settings.claudeIncludeThoughts;
                elements.claudeExpandThoughtsByDefaultToggle.checked = state.settings.claudeExpandThoughtsByDefault;
                elements.claudeThinkingBudgetInput.value = state.settings.claudeThinkingBudget === null ? '' : state.settings.claudeThinkingBudget;

                elements.openaiSystemPromptDefaultTextarea.value = state.settings.openaiSystemPrompt || '';
                elements.openaiEnableSystemPromptDefaultCheckbox.checked = state.settings.openaiEnableSystemPromptDefault;
                setupParamUI('openai-max-tokens', 'openaiMaxTokensSliderMax');
                setupParamUI('openai-temperature');
                setupParamUI('openai-top-p');
                setupParamUI('openai-presence-penalty');
                setupParamUI('openai-frequency-penalty');
                elements.openaiStreamingOutputCheckbox.checked = state.settings.openaiStreamingOutput;
                elements.openaiStreamingSpeedInput.value = state.settings.openaiStreamingSpeed ?? DEFAULT_STREAMING_SPEED;

                elements.openrouterSystemPromptDefaultTextarea.value = state.settings.openrouterSystemPrompt || '';
                elements.openrouterEnableSystemPromptDefaultCheckbox.checked = state.settings.openrouterEnableSystemPromptDefault;
                setupParamUI('openrouter-max-tokens', 'openrouterMaxTokensSliderMax');
                setupParamUI('openrouter-temperature');
                setupParamUI('openrouter-top-p');
                setupParamUI('openrouter-presence-penalty');
                setupParamUI('openrouter-frequency-penalty');
                elements.openrouterStreamingOutputCheckbox.checked = state.settings.openrouterStreamingOutput;
                elements.openrouterStreamingSpeedInput.value = state.settings.openrouterStreamingSpeed ?? DEFAULT_STREAMING_SPEED;

                elements.xaiSystemPromptDefaultTextarea.value = state.settings.xaiSystemPrompt || '';
                elements.xaiEnableSystemPromptDefaultCheckbox.checked = state.settings.xaiEnableSystemPromptDefault;
                setupParamUI('xai-max-tokens', 'xaiMaxTokensSliderMax');
                setupParamUI('xai-temperature');
                setupParamUI('xai-top-p');
                setupParamUI('xai-presence-penalty');
                setupParamUI('xai-frequency-penalty');
                elements.xaiStreamingOutputCheckbox.checked = state.settings.xaiStreamingOutput;
                elements.xaiStreamingSpeedInput.value = state.settings.xaiStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.xaiVisionEnableCheckbox.checked = state.settings.xaiVisionEnable;
                elements.xaiIncludeThoughtsToggle.checked = state.settings.xaiIncludeThoughts;
                elements.xaiExpandThoughtsByDefaultToggle.checked = state.settings.xaiExpandThoughtsByDefault;
                elements.xaiReasoningEffortSelect.value = state.settings.xaiReasoningEffort;

                elements.llmAggregatorSystemPromptDefaultTextarea.value = state.settings.llmAggregatorSystemPrompt || '';
                elements.llmAggregatorEnableSystemPromptDefaultCheckbox.checked = state.settings.llmAggregatorEnableSystemPromptDefault;
                setupParamUI('llmaggregator-max-tokens', 'llmaggregatorMaxTokensSliderMax');
                setupParamUI('llmaggregator-temperature');
                setupParamUI('llmaggregator-top-p');
                setupParamUI('llmaggregator-top-k', 'llmaggregatorTopKSliderMax');
                setupParamUI('llmaggregator-presence-penalty');
                setupParamUI('llmaggregator-frequency-penalty');
                elements.llmAggregatorIncludeThoughtsToggle.checked = state.settings.llmAggregatorIncludeThoughts;
                elements.llmAggregatorExpandThoughtsByDefaultToggle.checked = state.settings.llmAggregatorExpandThoughtsByDefault;
                elements.llmAggregatorStreamingOutputCheckbox.checked = state.settings.llmAggregatorStreamingOutput;
                elements.llmAggregatorStreamingSpeedInput.value = state.settings.llmAggregatorStreamingSpeed ?? DEFAULT_STREAMING_SPEED;

                elements.enterToSendCheckbox.checked = state.settings.enterToSend;
elements.headerTapScrollToTopToggle.checked = state.settings.headerTapScrollToTop;
elements.footerTapScrollToBottomToggle.checked = state.settings.footerTapScrollToBottom;
                elements.showResponseTimerToggle.checked = state.settings.showResponseTimer;
                elements.autoScrollOnNewMessageCheckbox.checked = state.settings.autoScrollOnNewMessage;
                elements.autoScrollOnThoughtCheckbox.checked = state.settings.autoScrollOnThought;
                elements.historySortOrderSelect.value = state.settings.historySortOrder || 'updatedAt';
                if (elements.themeSelect) elements.themeSelect.value = state.settings.theme || 'light';
                elements.fontFamilyInput.value = state.settings.fontFamily || '';
                elements.messageBodyFontSizeInput.value = state.settings.messageBodyFontSize ?? '';
                elements.codeBlockFontSizeInput.value = state.settings.codeBlockFontSize ?? '';
                elements.thoughtSummaryFontSizeInput.value = state.settings.thoughtSummaryFontSize ?? '';

                document.getElementById('message-body-font-size-input-slider').value = state.settings.messageBodyFontSize ?? DEFAULT_MESSAGE_BODY_FONT_SIZE;
                document.getElementById('code-block-font-size-input-slider').value = state.settings.codeBlockFontSize ?? DEFAULT_CODE_BLOCK_FONT_SIZE;
                document.getElementById('thought-summary-font-size-slider').value = state.settings.thoughtSummaryFontSize ?? DEFAULT_THOUGHT_SUMMARY_FONT_SIZE;
                document.getElementById('chat-ui-scale-input').value = state.settings.chatUiScale || 1.0;
                document.getElementById('chat-ui-scale-input-slider').value = state.settings.chatUiScale || 1.0;
                document.getElementById('settings-ui-scale-input').value = state.settings.settingsUiScale || 1.0;
                document.getElementById('settings-ui-scale-input-slider').value = state.settings.settingsUiScale || 1.0;
                document.getElementById('history-ui-scale-input').value = state.settings.historyUiScale || 1.0;
                document.getElementById('history-ui-scale-input-slider').value = state.settings.historyUiScale || 1.0;
                elements.swipeNavigationToggle.checked = state.settings.enableSwipeNavigation;
                elements.preventZoomToggle.checked = state.settings.preventZoom;
                elements.minimizeHeaderFooterToggle.checked = state.settings.minimizeHeaderFooter;
                elements.extendAiBubbleWidthToggle.checked = state.settings.extendAiBubbleWidth;
                elements.extendUserBubbleWidthToggle.checked = state.settings.extendUserBubbleWidth;
                                elements.reduceMessageSpacingToggle.checked = state.settings.reduceMessageSpacing;
                elements.showChatTitleToggle.checked = state.settings.showChatTitle;
                elements.showHeaderMenuButtonToggle.checked = state.settings.showHeaderMenuButton;
                if (!['always', 'hidden', 'scroll'].includes(state.settings.messageNavigationButtonMode)) {
                    state.settings.messageNavigationButtonMode = 'scroll';
                }
                elements.messageNavigationModeSelect.value = state.settings.messageNavigationButtonMode;
                elements.showScrollToTopButtonToggle.checked = state.settings.showScrollToTopButton;
                elements.showScrollToBottomButtonToggle.checked = state.settings.showScrollToBottomButton;
                elements.showToggleAllContentButtonToggle.checked = state.settings.showToggleAllContentButton;
                elements.showBulkHistoryActionsToggle.checked = state.settings.showBulkHistoryActions;
                elements.showPasteButtonInEditToggle.checked = state.settings.showPasteButtonInEdit;
               elements.messageBubbleOpacityInput.value = state.settings.messageBubbleOpacity ?? DEFAULT_MESSAGE_BUBBLE_OPACITY;
                elements.chatOverlayOpacityInput.value = state.settings.chatOverlayOpacity ?? DEFAULT_CHAT_OVERLAY_OPACITY;
                elements.headerFooterOpacityInput.value = state.settings.headerFooterOpacity ?? DEFAULT_HEADER_FOOTER_OPACITY;
                elements.messageActionsBackgroundOpacityInput.value = state.settings.messageActionsBackgroundOpacity ?? DEFAULT_MESSAGE_ACTIONS_BACKGROUND_OPACITY;
                elements.toggleButtonTopOpacityInput.value = state.settings.toggleButtonTopOpacity ?? DEFAULT_TOGGLE_BUTTON_TOP_OPACITY;
                elements.thoughtSummaryOpacityInput.value = state.settings.thoughtSummaryOpacity ?? DEFAULT_THOUGHT_SUMMARY_OPACITY;
    elements.enableElevationToggle.checked = state.settings.enableElevation;
    elements.enableElevationHoverToggle.checked = state.settings.enableElevationHover;
    elements.elevationHoverOption.classList.toggle('hidden', !state.settings.enableElevation);
    this.applyElevationSetting();

                document.getElementById('message-bubble-opacity-slider').value = elements.messageBubbleOpacityInput.value;
                document.getElementById('chat-overlay-opacity-slider').value = elements.chatOverlayOpacityInput.value;
                document.getElementById('header-footer-opacity-slider').value = elements.headerFooterOpacityInput.value;
                document.getElementById('message-actions-background-opacity-slider').value = elements.messageActionsBackgroundOpacityInput.value;
                document.getElementById('toggle-button-top-opacity-slider').value = elements.toggleButtonTopOpacityInput.value;
                document.getElementById('thought-summary-opacity-slider').value = elements.thoughtSummaryOpacityInput.value;
                elements.showApiProviderToggleHeaderCheckbox.checked = state.settings.showApiProviderToggleHeader;
                elements.showHeaderCycleApiKeyBtnToggle.checked = state.settings.showHeaderCycleApiKeyBtn;
                elements.apiProviderCycleGeminiCheckbox.checked = state.settings.apiProviderCycle.gemini;
                elements.apiProviderCycleDeepSeekCheckbox.checked = state.settings.apiProviderCycle.deepseek;
                elements.apiProviderCycleClaudeCheckbox.checked = state.settings.apiProviderCycle.claude;
                elements.apiProviderCycleOpenAICheckbox.checked = state.settings.apiProviderCycle.openai;
                elements.apiProviderCycleOpenRouterCheckbox.checked = state.settings.apiProviderCycle.openrouter;
                elements.apiProviderCycleXaiCheckbox.checked = state.settings.apiProviderCycle.xai;
                elements.apiProviderCycleLlmAggregatorCheckbox.checked = state.settings.apiProviderCycle.llmaggregator;

                elements.showMemoButtonToggle.checked = state.settings.showMemoButton;
                elements.memoHeightInput.value = state.settings.memoHeight || '';
                elements.showClipboardStackButtonToggle.checked = state.settings.showClipboardStackButton;
                elements.disableRetryConfirmationToggle.checked = state.settings.disableRetryConfirmation;
                elements.disableDeleteMessageConfirmationToggle.checked = state.settings.disableDeleteMessageConfirmation;
                elements.disableAttachmentConfirmationToggle.checked = state.settings.disableAttachmentConfirmation;
                elements.addPrefixOnImportToggle.checked = state.settings.addPrefixOnImport;
                elements.showMultiApiKeysToggle.checked = state.settings.showMultiApiKeys;
                elements.disableSaveSettingsConfirmationToggle.checked = state.settings.disableSaveSettingsConfirmation;
                elements.autoSaveSettingsToggle.checked = state.settings.autoSaveSettings;
                elements.unmaskApiKeysToggle.checked = state.settings.unmaskApiKeys || false;
                this.updateApiKeyInputType();
                elements.disableLlmUrlWhitelistToggle.checked = state.settings.disableLlmUrlWhitelist || false;
                elements.showTopCollapseButtonToggle.checked = state.settings.showTopCollapseButton;
                elements.showBottomCollapseButtonToggle.checked = state.settings.showBottomCollapseButton;
                elements.persistMessageCollapseStateCheckbox.checked = state.settings.persistMessageCollapseState;

                elements.toggleButtonTopWidthInput.value = state.settings.toggleButtonTopWidth ?? DEFAULT_TOGGLE_BUTTON_TOP_WIDTH;
                elements.toggleButtonTopHeightInput.value = state.settings.toggleButtonTopHeight ?? DEFAULT_TOGGLE_BUTTON_TOP_HEIGHT;
                elements.toggleButtonTopFontSizeInput.value = state.settings.toggleButtonTopFontSize ?? DEFAULT_TOGGLE_BUTTON_TOP_FONT_SIZE;
                elements.toggleButtonTopOpacityInput.value = state.settings.toggleButtonTopOpacity ?? DEFAULT_TOGGLE_BUTTON_TOP_OPACITY;
                elements.toggleButtonTopTextCollapseInput.value = state.settings.toggleButtonTopTextCollapse || DEFAULT_TOGGLE_BUTTON_TOP_TEXT_COLLAPSE;
                elements.toggleButtonTopTextExpandInput.value = state.settings.toggleButtonTopTextExpand || DEFAULT_TOGGLE_BUTTON_TOP_TEXT_EXPAND;
                elements.toggleButtonBottomFontSizeInput.value = state.settings.toggleButtonBottomFontSize ?? DEFAULT_TOGGLE_BUTTON_BOTTOM_FONT_SIZE;
                elements.toggleButtonBottomTextCollapseInput.value = state.settings.toggleButtonBottomTextCollapse || DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_COLLAPSE;
                elements.toggleButtonBottomTextExpandInput.value = state.settings.toggleButtonBottomTextExpand || DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_EXPAND;
                document.documentElement.style.setProperty('--message-body-font-size', `${state.settings.messageBodyFontSize || DEFAULT_MESSAGE_BODY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--code-block-font-size', `${state.settings.codeBlockFontSize || DEFAULT_CODE_BLOCK_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--thought-summary-font-size', `${state.settings.thoughtSummaryFontSize || DEFAULT_THOUGHT_SUMMARY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-width', `${state.settings.toggleButtonTopWidth || DEFAULT_TOGGLE_BUTTON_TOP_WIDTH}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-height', `${state.settings.toggleButtonTopHeight || DEFAULT_TOGGLE_BUTTON_TOP_HEIGHT}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-font-size', `${state.settings.toggleButtonTopFontSize || DEFAULT_TOGGLE_BUTTON_TOP_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-opacity',
                    state.settings.enableToggleButtonTopOpacity ? state.settings.toggleButtonTopOpacity : 1
                );
                document.documentElement.style.setProperty('--message-toggle-button-bottom-font-size', `${state.settings.toggleButtonBottomFontSize || DEFAULT_TOGGLE_BUTTON_BOTTOM_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--thought-summary-opacity', state.settings.thoughtSummaryOpacity || DEFAULT_THOUGHT_SUMMARY_OPACITY);

                this.applySettingsUIDetailsOpenStates();
                this.updateChatScreenElementVisibility();
                appLogic.applyMessageNavigationMode();
                this.updateHistoryHeaderButtonVisibility();
                this.updateUserModelOptions();
                this.updateDeepSeekUserModelOptions();
                this.updateClaudeUserModelOptions();
                this.updateOpenAIUserModelOptions();
                this.updateOpenRouterUserModelOptions();
                this.updateXaiUserModelOptions();
                this.updateLlmAggregatorUserModelOptions();
                this.applyTheme();
                this.applyFontFamily();
                this.applySidePanelSettingsToUI();
                this.applyMinimizeUI();
                this.applyAiBubbleWidthSetting();
                    uiUtils.updateApiProviderSelectOptions();
                    uiUtils.updateApiKeyCycleButtons();
                    uiUtils.toggleMultiApiKeysVisibility(state.settings.showMultiApiKeys);
                    elements.settingsScreen.classList.toggle('auto-save-mode', state.settings.autoSaveSettings);



                const setupModelListener = (textareaElement, settingKey, updateFunction) => {
                    textareaElement.addEventListener('input', () => {
                        state.settings[settingKey] = textareaElement.value;
                        updateFunction();
                    });
                };


                setupModelListener(elements.geminiAdditionalModelsTextarea, 'additionalModels', uiUtils.updateUserModelOptions);
                setupModelListener(elements.deepSeekAdditionalModelsTextarea, 'deepSeekAdditionalModels', uiUtils.updateDeepSeekUserModelOptions);
                setupModelListener(elements.claudeAdditionalModelsTextarea, 'claudeAdditionalModels', uiUtils.updateClaudeUserModelOptions);
                setupModelListener(elements.openaiAdditionalModelsTextarea, 'openaiAdditionalModels', uiUtils.updateOpenAIUserModelOptions);
                setupModelListener(elements.openrouterAdditionalModelsTextarea, 'openrouterAdditionalModels', uiUtils.updateOpenRouterUserModelOptions);
                setupModelListener(elements.xaiAdditionalModelsTextarea, 'xaiAdditionalModels', uiUtils.updateXaiUserModelOptions);
                setupModelListener(elements.llmAggregatorAdditionalModelsTextarea, 'llmAggregatorAdditionalModels', uiUtils.updateLlmAggregatorUserModelOptions);

                this.updateMemoStackHeightSettingsVisibility();
                const deleteConfirmCheckboxes = document.querySelectorAll('.js-disable-delete-api-key-confirmation-toggle');
                deleteConfirmCheckboxes.forEach(checkbox => {
                    checkbox.checked = state.settings.disableDeleteApiKeyConfirmation;
                });

                const removeDuplicateCheckboxes = document.querySelectorAll('.js-remove-duplicate-api-keys-toggle');
                removeDuplicateCheckboxes.forEach(checkbox => {
                    checkbox.checked = state.settings.removeDuplicateApiKeys;
                });
            },
            applyMinimizeUI() {
                elements.appContainer.classList.toggle('minimized-ui', state.settings.minimizeHeaderFooter);
            },
            applyMessageSpacingSetting() {
                elements.appContainer.classList.toggle('reduced-message-spacing', state.settings.reduceMessageSpacing);
            },
            applyAiBubbleWidthSetting() {
                document.body.classList.toggle('ai-bubble-extended', state.settings.extendAiBubbleWidth);
            },
            applyUserBubbleWidthSetting() {
                document.body.classList.toggle('user-bubble-extended', state.settings.extendUserBubbleWidth);
            },
            applySettingsUIDetailsOpenStates() {
                const detailsElements = document.querySelectorAll('#settings-screen details[id]');
                detailsElements.forEach(detailsEl => {
                    if (state.settings.settingsUIDetailsOpenStates[detailsEl.id] === true) {
                        detailsEl.open = true;
                    } else if (state.settings.settingsUIDetailsOpenStates[detailsEl.id] === false) {
                        detailsEl.open = false;
                    }
                });
                document.querySelectorAll('#settings-screen .main-content > details.settings-group').forEach(topLevelDetails => {
                    topLevelDetails.open = true;
                    topLevelDetails.querySelectorAll('details').forEach(nestedDetails => {
                        nestedDetails.open = false;
                    });
                });
            },
            toggleApiSettingsVisibility(provider) {
                const showGemini = provider === 'gemini';
                const showDeepSeek = provider === 'deepseek';
                const showClaude = provider === 'claude';
                const showOpenAI = provider === 'openai';
                const showOpenRouter = provider === 'openrouter';
                const showXai = provider === 'xai';
                const showLlmAggregator = provider === 'llmaggregator';

                elements.geminiSettingsGroup.classList.toggle('hidden', !showGemini);
                elements.geminiParamsGroup.classList.toggle('hidden', !showGemini);
                elements.geminiAdvancedGroup.classList.toggle('hidden', !showGemini);
                elements.geminiGroundingParam.classList.toggle('hidden', !showGemini);

                elements.deepSeekSettingsGroup.classList.toggle('hidden', !showDeepSeek);
                elements.deepseekParamsGroup.classList.toggle('hidden', !showDeepSeek);
                elements.deepseekAdvancedGroup.classList.toggle('hidden', !showDeepSeek);

                elements.claudeSettingsGroup.classList.toggle('hidden', !showClaude);
                elements.claudeParamsGroup.classList.toggle('hidden', !showClaude);
                elements.claudeAdvancedGroup.classList.toggle('hidden', !showClaude);

                elements.openaiSettingsGroup.classList.toggle('hidden', !showOpenAI);
                elements.openaiParamsGroup.classList.toggle('hidden', !showOpenAI);
                elements.openaiAdvancedGroup.classList.toggle('hidden', !showOpenAI);

                elements.openrouterSettingsGroup.classList.toggle('hidden', !showOpenRouter);
                elements.openrouterParamsGroup.classList.toggle('hidden', !showOpenRouter);
                elements.openrouterAdvancedGroup.classList.toggle('hidden', !showOpenRouter);

                elements.xaiSettingsGroup.classList.toggle('hidden', !showXai);
                elements.xaiParamsGroup.classList.toggle('hidden', !showXai);
                elements.xaiAdvancedGroup.classList.toggle('hidden', !showXai);

                elements.llmAggregatorSettingsGroup.classList.toggle('hidden', !showLlmAggregator);
                elements.llmAggregatorParamsGroup.classList.toggle('hidden', !showLlmAggregator);
                elements.llmAggregatorAdvancedGroup.classList.toggle('hidden', !showLlmAggregator);

            },
});
