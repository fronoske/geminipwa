// @ts-nocheck -- Enable after typed DOM event maps are defined.
// Bundled into the generated index.html from this TypeScript source.
Object.assign(appLogic, {
            setupEventListeners() {
                elements.gotoHistoryBtn.addEventListener('click', () => uiUtils.showScreen('history'));
                elements.gotoSettingsBtn.addEventListener('click', () => uiUtils.showScreen('settings'));
                elements.backToChatFromHistoryBtn.addEventListener('click', () => history.back());
                elements.backToChatFromSettingsBtn.addEventListener('click', () => history.back());
                elements.toggleMemoBtn.addEventListener('click', () => this.toggleMemo());
                elements.copyMemoBtn.addEventListener('click', () => this.copyMemoText());
                elements.pasteMemoBtn.addEventListener('click', () => this.pasteIntoMemo());
                elements.deleteMemoBtn.addEventListener('click', () => this.confirmClearMemo());

                elements.toggleClipboardStackBtn.addEventListener('click', () => this.toggleClipboardStack());
                elements.deleteClipboardStackBtn.addEventListener('click', () => this.confirmClearClipboardStack());
                elements.copyClipboardStackBtn.addEventListener('click', () => this.copyClipboardStackText());
                elements.pasteClipboardStackBtn.addEventListener('click', () => this.pasteIntoClipboardStack());

                elements.scrollToTopBtn.addEventListener('click', () => this.scrollToTop());
                elements.scrollToBottomBtn.addEventListener('click', () => this.scrollToBottom());
                elements.pasteToInputBtn.addEventListener('click', () => this.pasteToUserInput());
                elements.rollDiceBtn.addEventListener('click', () => this.rollDiceAndInput());

                elements.newChatBtn.addEventListener('click', () => {
                    uiUtils.showCustomConfirm("現在のチャットを保存して新規チャットを開始しますか？").then(confirmed => {
                        if (confirmed) this.confirmStartNewChat();
                    });
                });
                elements.deleteSessionBtn.addEventListener('click', () => this.confirmDeleteCurrentSession());
                elements.copySessionBtn.addEventListener('click', () => this.copyCurrentSessionText());
                elements.toggleAllContentBtn.addEventListener('click', () => this.toggleAllMessagesVisibility());
                elements.headerApiProviderToggleBtn.addEventListener('click', () => this.toggleApiProvider());
                elements.footerApiProviderToggleBtn.addEventListener('click', () => this.toggleApiProvider());
                elements.headerCycleApiKeyBtn.addEventListener('click', () => this.cycleActiveApiKey());
                elements.footerCycleApiKeyBtn.addEventListener('click', () => this.cycleActiveApiKey());
                elements.sendButton.addEventListener('click', () => {
                    if (state.isSending) this.abortRequest();
                    else this.handleSend();
                });
                elements.userInput.addEventListener('input', () => uiUtils.adjustTextareaHeight());
                elements.userInput.addEventListener('keypress', (e) => {
                    if (state.settings.enterToSend && e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const canSend = state.settings.apiProvider === 'dummy' || !(elements.userInput.value.trim() === '' && state.pendingAttachments.length === 0);
                        if (canSend && !state.isSending) {
                            this.handleSend();
                        }
                    }
                });
                elements.userInput.addEventListener('input', () => uiUtils.updateAttachmentBadgeVisibility());

                elements.importHistoryBtn.addEventListener('click', () => elements.importHistoryInput.click());
                elements.importHistoryInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) this.handleHistoryImport(file);
                    event.target.value = null;
                });
                elements.exportAllSessionsBtn.addEventListener('click', () => this.exportAllSessions());
                elements.importAllSessionsBtn.addEventListener('click', () => elements.importAllSessionsInput.click());
                elements.importAllSessionsInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) this.handleAllSessionsImport(file);
                    event.target.value = null;
                });

                elements.saveSettingsBtns.forEach(button => {
                    button.addEventListener('click', () => this.saveSettings(true));
                });
                elements.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
                elements.importSettingsBtn.addEventListener('click', () => elements.importSettingsInput.click());
                elements.importSettingsInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) this.handleSettingsImport(file);
                    event.target.value = null;
                });
                elements.updateAppBtn.addEventListener('click', () => this.updateApp());
                elements.clearDataBtn.addEventListener('click', () => this.confirmClearAllData());
                elements.clearHistoryBtn.addEventListener('click', () => this.confirmClearAllHistory());
                if (elements.debugCheckAllBtn) {
                    elements.debugCheckAllBtn.addEventListener('click', () => this.toggleAllSettingsCheckboxes(true));
                }
                                if (elements.debugUncheckAllBtn) {
                    elements.debugUncheckAllBtn.addEventListener('click', () => this.toggleAllSettingsCheckboxes(false));
                }
                if (elements.debugExpandAllBtn) {
                    elements.debugExpandAllBtn.addEventListener('click', () => {
                        document.querySelectorAll('#settings-screen details').forEach(el => {
                            el.open = true;
                            if (el.id) state.settings.settingsUIDetailsOpenStates[el.id] = true;
                        });
                    });
                }
                if (elements.debugCollapseAllBtn) {
                    elements.debugCollapseAllBtn.addEventListener('click', () => {

                        const parentDetails = elements.debugCollapseAllBtn.closest('details');
                        document.querySelectorAll('#settings-screen details').forEach(el => {
                            if (el !== parentDetails) {
                                el.open = false;
                                if (el.id) state.settings.settingsUIDetailsOpenStates[el.id] = false;
                            }
                        });
                    });
                }
                document.getElementById('force-recovery-btn').addEventListener('click', async () => {

                    const confirmed = await uiUtils.showCustomConfirm(
                        "強制復旧を実行しますか？\n\n" +
                        "この操作により：\n" +
                        "• 全キャッシュがクリアされます\n" +
                        "• アプリが自動的に再起動されます\n" +
                        "• チャット履歴と設定は保持されます\n\n" +
                        "アプリが不安定な場合にのみ実行してください。"
                    );

                    if (confirmed) {
                        if (typeof errorRecovery !== 'undefined') {
                            errorRecovery.manualRecovery();
                        } else {
                            await uiUtils.showCustomAlert("キャッシュをクリアして再起動します...");
                            window.location.reload(true);
                        }
                    }
                });

                if (elements.themeSelect) {
                    elements.themeSelect.addEventListener('change', () => {
                        state.settings.theme = elements.themeSelect.value;
                        uiUtils.applyTheme();
                    });
                }
                if (elements.apiProviderSelect) {
                    elements.apiProviderSelect.addEventListener('change', (event) => {
                        const selectedProvider = event.target.value;
                        state.settings.apiProvider = selectedProvider;
                        uiUtils.toggleApiSettingsVisibility(selectedProvider);
                    });
                }
                elements.setThinkingBudgetBtns.forEach(button => {
                    button.addEventListener('click', () => {
                        const value = button.dataset.value;
                        const targetInput = elements.geminiThinkingBudgetInput;
                        if (value === 'null') {
                            targetInput.value = '';
                        } else {
                            targetInput.value = value;
                        }
                    });
                });
                elements.setClaudeParamBtns.forEach(button => {
                    button.addEventListener('click', () => {
                        const targetId = button.dataset.target;
                        const value = button.dataset.value;
                        const targetInput = document.getElementById(targetId);
                        if (targetInput) {
                            if (value === 'null') {
                                targetInput.value = '';
                            } else {
                                targetInput.value = value;
                            }
                        }
                    });
                });

                                const handleBgUpload = async (file, type) => {
                    if (!file) return;
                    if (file.size > MAX_FILE_SIZE) {
                        await uiUtils.showCustomAlert(`ファイルサイズが大きすぎます (${formatFileSize(file.size)})。${formatFileSize(MAX_FILE_SIZE)}以下にしてください。`);
                        return;
                    }
                    const objectUrl = URL.createObjectURL(file);
                    if (type === 'chat') {
                        if (state.backgroundImageUrl) URL.revokeObjectURL(state.backgroundImageUrl);
                        state.backgroundImageUrl = objectUrl;
                        state.settings.backgroundImageBlob = file;
                        document.documentElement.style.setProperty('--chat-background-image', `url(${objectUrl})`);
                        await dbUtils.saveSetting('backgroundImageBlob', file);
                    } else if (type === 'history') {
                        if (state.historyBackgroundImageUrl) URL.revokeObjectURL(state.historyBackgroundImageUrl);
                        state.historyBackgroundImageUrl = objectUrl;
                        state.settings.historyBackgroundImageBlob = file;
                        document.documentElement.style.setProperty('--history-background-image', `url(${objectUrl})`);
                        await dbUtils.saveSetting('historyBackgroundImageBlob', file);
                    } else if (type === 'settings') {
                        if (state.settingsBackgroundImageUrl) URL.revokeObjectURL(state.settingsBackgroundImageUrl);
                        state.settingsBackgroundImageUrl = objectUrl;
                        state.settings.settingsBackgroundImageBlob = file;
                        document.documentElement.style.setProperty('--settings-background-image', `url(${objectUrl})`);
                        await dbUtils.saveSetting('settingsBackgroundImageBlob', file);
                    }
                    uiUtils.updateBackgroundSettingsUI();
                    if (state.settings.autoSaveSettings) this.saveSettings(false);
                };

                const confirmDeleteBg = async (type) => {
                    const confirmed = await uiUtils.showCustomConfirm("背景画像を削除しますか？");
                    if (confirmed) {
                        if (type === 'chat') {
                            if (state.backgroundImageUrl) URL.revokeObjectURL(state.backgroundImageUrl);
                            state.backgroundImageUrl = null;
                            state.settings.backgroundImageBlob = null;
                            document.documentElement.style.setProperty('--chat-background-image', 'none');
                            await dbUtils.saveSetting('backgroundImageBlob', null);
                        } else if (type === 'history') {
                            if (state.historyBackgroundImageUrl) URL.revokeObjectURL(state.historyBackgroundImageUrl);
                            state.historyBackgroundImageUrl = null;
                            state.settings.historyBackgroundImageBlob = null;
                            document.documentElement.style.setProperty('--history-background-image', 'none');
                            await dbUtils.saveSetting('historyBackgroundImageBlob', null);
                        } else if (type === 'settings') {
                            if (state.settingsBackgroundImageUrl) URL.revokeObjectURL(state.settingsBackgroundImageUrl);
                            state.settingsBackgroundImageUrl = null;
                            state.settings.settingsBackgroundImageBlob = null;
                            document.documentElement.style.setProperty('--settings-background-image', 'none');
                            await dbUtils.saveSetting('settingsBackgroundImageBlob', null);
                        }
                        uiUtils.updateBackgroundSettingsUI();
                        if (state.settings.autoSaveSettings) this.saveSettings(false);
                    }
                };

                elements.uploadBackgroundBtn.addEventListener('click', () => elements.backgroundImageInput.click());
                elements.backgroundImageInput.addEventListener('change', (e) => { handleBgUpload(e.target.files[0], 'chat'); e.target.value = null; });
                elements.deleteBackgroundBtn.addEventListener('click', () => confirmDeleteBg('chat'));

                if (elements.uploadHistoryBgBtn) {
                    elements.uploadHistoryBgBtn.addEventListener('click', () => elements.historyBgInput.click());
                    elements.historyBgInput.addEventListener('change', (e) => { handleBgUpload(e.target.files[0], 'history'); e.target.value = null; });
                    elements.deleteHistoryBgBtn.addEventListener('click', () => confirmDeleteBg('history'));
                }
                if (elements.uploadSettingsBgBtn) {
                    elements.uploadSettingsBgBtn.addEventListener('click', () => elements.settingsBgInput.click());
                    elements.settingsBgInput.addEventListener('change', (e) => { handleBgUpload(e.target.files[0], 'settings'); e.target.value = null; });
                    elements.deleteSettingsBgBtn.addEventListener('click', () => confirmDeleteBg('settings'));
                }


                elements.showUserIconToggle.addEventListener('change', () => {
                    state.settings.showUserIcon = elements.showUserIconToggle.checked;
                    uiUtils.renderChatMessages(true, true);
                });
                elements.uploadUserIconBtn.addEventListener('click', () => elements.userIconInput.click());
                elements.userIconInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) this.handleIconUpload('user', file);
                    event.target.value = null;
                });
                elements.deleteUserIconBtn.addEventListener('click', () => this.confirmDeleteIcon('user'));
                elements.showUserNameToggle.addEventListener('change', () => {
                    state.settings.showUserName = elements.showUserNameToggle.checked;
                    uiUtils.renderChatMessages(true, true);
                });

                elements.showAiIconToggle.addEventListener('change', () => {
                    state.settings.showAiIcon = elements.showAiIconToggle.checked;
                    uiUtils.renderChatMessages(true, true);
                });
                elements.uploadAiIconBtn.addEventListener('click', () => elements.aiIconInput.click());
                elements.aiIconInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) this.handleIconUpload('ai', file);
                    event.target.value = null;
                });
                elements.deleteAiIconBtn.addEventListener('click', () => this.confirmDeleteIcon('ai'));
                elements.showAiNameToggle.addEventListener('change', () => {
                    state.settings.showAiName = elements.showAiNameToggle.checked;
                    uiUtils.renderChatMessages(true, true);
                });
                elements.iconNameFontSizeInput.addEventListener('input', () => {
                    const newSize = parseInt(elements.iconNameFontSizeInput.value, 10);
                    if (newSize >= 6 && newSize <= 16) {
                        document.documentElement.style.setProperty('--icon-name-font-size', `${newSize}px`);
                    } else if (elements.iconNameFontSizeInput.value === '') {
                        document.documentElement.style.setProperty('--icon-name-font-size', `${DEFAULT_ICON_NAME_FONT_SIZE}px`);
                    }
                });
                elements.iconNameOffsetYInput.addEventListener('input', () => {
                    const uiOffsetY = parseInt(elements.iconNameOffsetYInput.value, 10);
                    const internalOffsetY = isNaN(uiOffsetY) ? DEFAULT_ICON_NAME_OFFSET_Y : (uiOffsetY * -1);
                    if (internalOffsetY >= -20 && internalOffsetY <= 20) {
                        document.documentElement.style.setProperty('--icon-name-offset-y', `${internalOffsetY}px`);
                    } else if (elements.iconNameOffsetYInput.value === '') {
                        document.documentElement.style.setProperty('--icon-name-offset-y', `${DEFAULT_ICON_NAME_OFFSET_Y}px`);
                    }
                });

                elements.messageIconSizeInput.addEventListener('input', () => {
                    const newSize = parseInt(elements.messageIconSizeInput.value, 10);
                    if (newSize >= 16 && newSize <= 64) {
                        document.documentElement.style.setProperty('--message-icon-size', `${newSize}px`);
                    } else if (elements.messageIconSizeInput.value === '') {
                        document.documentElement.style.setProperty('--message-icon-size', `${DEFAULT_MESSAGE_ICON_SIZE}px`);
                    }
                });
                elements.messageIconOffsetYInput.addEventListener('input', () => {
                    const uiOffsetY = parseInt(elements.messageIconOffsetYInput.value, 10);
                    const internalOffsetY = isNaN(uiOffsetY) ? DEFAULT_MESSAGE_ICON_OFFSET_Y : (uiOffsetY * -1);

                    if (internalOffsetY >= -50 && internalOffsetY <= 50) {
                        document.documentElement.style.setProperty('--message-icon-offset-y', `${internalOffsetY}px`);
                    } else if (elements.messageIconOffsetYInput.value === '') {
                        document.documentElement.style.setProperty('--message-icon-offset-y', `${DEFAULT_MESSAGE_ICON_OFFSET_Y}px`);
                    }
                });
                elements.userNameBubbleToggle.addEventListener('change', () => {
                    state.settings.showUserNameBubble = elements.userNameBubbleToggle.checked;
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });
                elements.userNameBubbleUseThemeColorToggle.addEventListener('change', () => {
                    state.settings.userNameBubbleUseThemeColor = elements.userNameBubbleUseThemeColorToggle.checked;
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });
                elements.userNameBubbleColorInput.addEventListener('input', () => {
                    state.settings.userNameBubbleColor = elements.userNameBubbleColorInput.value.trim() || DEFAULT_USER_NAME_BUBBLE_COLOR;
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });
                elements.userNameBubbleOpacityInput.addEventListener('input', () => {
                    state.settings.userNameBubbleOpacity = elements.userNameBubbleOpacityInput.value === '' ? DEFAULT_USER_NAME_BUBBLE_OPACITY : parseFloat(elements.userNameBubbleOpacityInput.value);
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });
                elements.aiNameBubbleToggle.addEventListener('change', () => {
                    state.settings.showAiNameBubble = elements.aiNameBubbleToggle.checked;
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });
                elements.aiNameBubbleUseThemeColorToggle.addEventListener('change', () => {
                    state.settings.aiNameBubbleUseThemeColor = elements.aiNameBubbleUseThemeColorToggle.checked;
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });
                elements.aiNameBubbleColorInput.addEventListener('input', () => {
                    state.settings.aiNameBubbleColor = elements.aiNameBubbleColorInput.value.trim() || DEFAULT_AI_NAME_BUBBLE_COLOR;
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });
                elements.aiNameBubbleOpacityInput.addEventListener('input', () => {
                    state.settings.aiNameBubbleOpacity = elements.aiNameBubbleOpacityInput.value === '' ? DEFAULT_AI_NAME_BUBBLE_OPACITY : parseFloat(elements.aiNameBubbleOpacityInput.value);
                    uiUtils.applySidePanelSettingsToUI();
                    uiUtils.renderChatMessages(true, true);
                });

                this._setupOpacitySlider('message-bubble-opacity', '--message-bubble-opacity', DEFAULT_MESSAGE_BUBBLE_OPACITY);
                this._setupOpacitySlider('message-actions-background-opacity', '--message-actions-bg-opacity', DEFAULT_MESSAGE_ACTIONS_BACKGROUND_OPACITY);
                this._setupOpacitySlider('chat-overlay-opacity', '--chat-overlay-alpha', DEFAULT_CHAT_OVERLAY_OPACITY);
                this._setupOpacitySlider('header-footer-opacity', '--header-footer-opacity', DEFAULT_HEADER_FOOTER_OPACITY);
                this._setupOpacitySlider('toggle-button-top-opacity', '--message-toggle-button-top-opacity', DEFAULT_TOGGLE_BUTTON_TOP_OPACITY);
                this._setupOpacitySlider('thought-summary-opacity', '--thought-summary-opacity', DEFAULT_THOUGHT_SUMMARY_OPACITY);
                this._setupFontSizeSlider('message-body-font-size-input', '--message-body-font-size', DEFAULT_MESSAGE_BODY_FONT_SIZE);
                this._setupFontSizeSlider('code-block-font-size-input', '--code-block-font-size', DEFAULT_CODE_BLOCK_FONT_SIZE);
                this._setupFontSizeSlider('thought-summary-font-size', '--thought-summary-font-size', DEFAULT_THOUGHT_SUMMARY_FONT_SIZE);
                this._setupUiScaleSlider('chat-ui-scale-input', '--chat-ui-scale', 1.0);
                this._setupUiScaleSlider('settings-ui-scale-input', '--settings-ui-scale', 1.0);
                this._setupUiScaleSlider('history-ui-scale-input', '--history-ui-scale', 1.0);
                // Gemini Params
                this._setupParamSlider('gemini-max-tokens', 8192, 'geminiMaxTokensSliderMax');
                this._setupParamSlider('gemini-temperature', 0.9, null);
                this._setupParamSlider('gemini-top-k', 40, 'geminiTopKSliderMax');
                this._setupParamSlider('gemini-top-p', 0.95, null);
                this._setupParamSlider('gemini-presence-penalty', 0.0, null);
                this._setupParamSlider('gemini-frequency-penalty', 0.0, null);
                this._setupParamSlider('gemini-thinking-budget', 8192, 'geminiThinkingBudgetSliderMax');

                // DeepSeek Params
                this._setupParamSlider('deepseek-max-tokens', 4096, 'deepseekMaxTokensSliderMax');
                this._setupParamSlider('deepseek-temperature', 0.9, null);
                this._setupParamSlider('deepseek-top-p', 0.95, null);
                this._setupParamSlider('deepseek-presence-penalty', 0.0, null);
                this._setupParamSlider('deepseek-frequency-penalty', 0.0, null);

                // Claude Params
                this._setupParamSlider('claude-max-tokens', 4096, 'claudeMaxTokensSliderMax');
                this._setupParamSlider('claude-temperature', 0.7, null);
                this._setupParamSlider('claude-top-k', 5, 'claudeTopKSliderMax');
                this._setupParamSlider('claude-top-p', 1.0, null);
                this._setupParamSlider('claude-thinking-budget', 2048, 'claudeThinkingBudgetSliderMax');

                // OpenAI Params
                this._setupParamSlider('openai-max-tokens', 4096, 'openaiMaxTokensSliderMax');
                this._setupParamSlider('openai-temperature', 1.0, null);
                this._setupParamSlider('openai-top-p', 1.0, null);
                this._setupParamSlider('openai-presence-penalty', 0.0, null);
                this._setupParamSlider('openai-frequency-penalty', 0.0, null);

                // xAI Params
                this._setupParamSlider('xai-max-tokens', 4096, 'xaiMaxTokensSliderMax');
                this._setupParamSlider('xai-temperature', 1.0, null);
                this._setupParamSlider('xai-top-p', 1.0, null);
                this._setupParamSlider('xai-presence-penalty', 0.0, null);
                this._setupParamSlider('xai-frequency-penalty', 0.0, null);

                // LLM Aggregator Params
                this._setupParamSlider('llmaggregator-max-tokens', 4096, 'llmaggregatorMaxTokensSliderMax');
                this._setupParamSlider('llmaggregator-temperature', 1.0, null);
                this._setupParamSlider('llmaggregator-top-p', 1.0, null);
                this._setupParamSlider('llmaggregator-top-k', 0, 'llmaggregatorTopKSliderMax');
                this._setupParamSlider('llmaggregator-presence-penalty', 0.0, null);
                this._setupParamSlider('llmaggregator-frequency-penalty', 0.0, null);


                elements.enableCommonSystemPromptDefaultCheckbox.addEventListener('change', () => {
                    state.settings.enableCommonSystemPromptDefault = elements.enableCommonSystemPromptDefaultCheckbox.checked;
                });
                elements.showChatTitleToggle.addEventListener('change', () => {
                    state.settings.showChatTitle = elements.showChatTitleToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showMemoButtonToggle.addEventListener('change', () => {
                    state.settings.showMemoButton = elements.showMemoButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                    uiUtils.updateMemoStackHeightSettingsVisibility();
                });
                elements.showClipboardStackButtonToggle.addEventListener('change', () => {
                    state.settings.showClipboardStackButton = elements.showClipboardStackButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                    uiUtils.updateMemoStackHeightSettingsVisibility();
                });
                elements.showNewChatButtonToggle.addEventListener('change', () => {
                    state.settings.showNewChatButton = elements.showNewChatButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showDeleteSessionButtonToggle.addEventListener('change', () => {
                    state.settings.showDeleteSessionButton = elements.showDeleteSessionButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showCopySessionButtonToggle.addEventListener('change', () => {
                    state.settings.showCopySessionButton = elements.showCopySessionButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showScrollToTopButtonToggle.addEventListener('change', () => {
                    state.settings.showScrollToTopButton = elements.showScrollToTopButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showScrollToBottomButtonToggle.addEventListener('change', () => {
                    state.settings.showScrollToBottomButton = elements.showScrollToBottomButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showToggleAllContentButtonToggle.addEventListener('change', () => {
                    state.settings.showToggleAllContentButton = elements.showToggleAllContentButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });

                elements.showPasteButtonInFooterToggle.addEventListener('change', () => {
                    state.settings.showPasteButtonInFooter = elements.showPasteButtonInFooterToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showPasteButtonInEditToggle.addEventListener('change', () => {
                    state.settings.showPasteButtonInEdit = elements.showPasteButtonInEditToggle.checked;
                });
                elements.showDiceButtonToggle.addEventListener('change', () => {
                    state.settings.showDiceButton = elements.showDiceButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                    document.getElementById('dice-value-settings').classList.toggle('hidden', !state.settings.showDiceButton);
                });
                elements.preventZoomToggle.addEventListener('change', () => {
                    state.settings.preventZoom = elements.preventZoomToggle.checked;
                    uiUtils.applyZoomPreventionSetting();
                });
                document.getElementById('minimize-header-footer-toggle').addEventListener('change', (e) => {
                    state.settings.minimizeHeaderFooter = e.target.checked;
                    uiUtils.applyMinimizeUI();
                });
                elements.extendAiBubbleWidthToggle.addEventListener('change', (e) => {
                    state.settings.extendAiBubbleWidth = e.target.checked;
                    uiUtils.applyAiBubbleWidthSetting();
                });
                elements.extendUserBubbleWidthToggle.addEventListener('change', (e) => {
                    state.settings.extendUserBubbleWidth = e.target.checked;
                    uiUtils.applyUserBubbleWidthSetting();
                });
                elements.reduceMessageSpacingToggle.addEventListener('change', (e) => {
                    state.settings.reduceMessageSpacing = e.target.checked;
                    uiUtils.applyMessageSpacingSetting();
                });
                                elements.compactSettingsSpacingToggle.addEventListener('change', (e) => {
                    state.settings.compactSettingsSpacing = e.target.checked;
                    uiUtils.applyCompactSettingsSpacing();
                });
                                elements.slimSettingsHeadersToggle.addEventListener('change', (e) => {
                    state.settings.slimSettingsHeaders = e.target.checked;
                    document.body.classList.toggle('slim-settings-headers', e.target.checked);
                });
                elements.flatSettingsDesignToggle.addEventListener('change', (e) => {
                    state.settings.flatSettingsDesign = e.target.checked;
                    document.body.classList.toggle('flat-settings-mode', e.target.checked);
                });
                elements.memoHeightInput.addEventListener('input', () => {
                    const newHeight = elements.memoHeightInput.value.trim();
                    if (newHeight) {
                        document.documentElement.style.setProperty('--memo-height', newHeight);
                        document.documentElement.style.setProperty('--clipboard-stack-height', newHeight);
                    } else {
                        document.documentElement.style.setProperty('--memo-height', DEFAULT_MEMO_HEIGHT);
                        document.documentElement.style.setProperty('--clipboard-stack-height', DEFAULT_CLIPBOARD_STACK_HEIGHT);
                    }
                });
                elements.messageBodyFontSizeInput.addEventListener('input', () => {
                    const newSize = elements.messageBodyFontSizeInput.value.trim();
                    document.documentElement.style.setProperty('--message-body-font-size', newSize ? `${newSize}px` : `${DEFAULT_MESSAGE_BODY_FONT_SIZE}px`);
                });
                elements.codeBlockFontSizeInput.addEventListener('input', () => {
                    const newSize = elements.codeBlockFontSizeInput.value.trim();
                    document.documentElement.style.setProperty('--code-block-font-size', newSize ? `${newSize}px` : `${DEFAULT_CODE_BLOCK_FONT_SIZE}px`);
                });
                elements.thoughtSummaryFontSizeInput.addEventListener('input', () => {
                    const newSize = elements.thoughtSummaryFontSizeInput.value.trim();
                    document.documentElement.style.setProperty('--thought-summary-font-size', newSize ? `${newSize}px` : `${DEFAULT_THOUGHT_SUMMARY_FONT_SIZE}px`);
                });
                elements.showToggleAllContentButtonToggle.addEventListener('change', () => {
                    state.settings.showToggleAllContentButton = elements.showToggleAllContentButtonToggle.checked;
                    uiUtils.updateChatScreenElementVisibility();
                });
                elements.showBulkHistoryActionsToggle.addEventListener('change', () => {
                    state.settings.showBulkHistoryActions = elements.showBulkHistoryActionsToggle.checked;
                    uiUtils.updateHistoryHeaderButtonVisibility();
                });
                elements.showHistoryPreviewBubbleToggle.checked = state.settings.showHistoryPreviewBubble;
                elements.showHistoryPreviewBubbleToggle.addEventListener('change', () => {
                    state.settings.showHistoryPreviewBubble = elements.showHistoryPreviewBubbleToggle.checked;
                    uiUtils.renderHistoryList();
                });
                elements.stripedHistoryListToggle.checked = state.settings.stripedHistoryList;
                elements.historyList.classList.toggle('striped', state.settings.stripedHistoryList);
                elements.stripedHistoryListToggle.addEventListener('change', () => {
                    state.settings.stripedHistoryList = elements.stripedHistoryListToggle.checked;
                    elements.historyList.classList.toggle('striped', state.settings.stripedHistoryList);
                });
                elements.messageBubbleOpacityInput.addEventListener('input', () => {
                    const opacity = parseFloat(elements.messageBubbleOpacityInput.value);
                    if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                        document.documentElement.style.setProperty('--message-bubble-opacity', opacity);
                    } else if (elements.messageBubbleOpacityInput.value === '') {
                        document.documentElement.style.setProperty('--message-bubble-opacity', DEFAULT_MESSAGE_BUBBLE_OPACITY);
                    }
                });
                elements.chatOverlayOpacityInput.addEventListener('input', () => {
                    const opacity = parseFloat(elements.chatOverlayOpacityInput.value);
                    if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                        document.documentElement.style.setProperty('--chat-overlay-alpha', opacity);
                    } else if (elements.chatOverlayOpacityInput.value === '') {
                        document.documentElement.style.setProperty('--chat-overlay-alpha', DEFAULT_CHAT_OVERLAY_OPACITY);
                    }
                });
                elements.headerFooterOpacityInput.addEventListener('input', () => {
                    const opacity = parseFloat(elements.headerFooterOpacityInput.value);
                    if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                        document.documentElement.style.setProperty('--header-footer-opacity', opacity);
                    } else if (elements.headerFooterOpacityInput.value === '') {
                        document.documentElement.style.setProperty('--header-footer-opacity', DEFAULT_HEADER_FOOTER_OPACITY);
                    }
                });
                elements.messageActionsBackgroundOpacityInput.addEventListener('input', () => {
                    const opacity = parseFloat(elements.messageActionsBackgroundOpacityInput.value);
                    if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                        document.documentElement.style.setProperty('--message-actions-bg-opacity', opacity);
                    } else if (elements.messageActionsBackgroundOpacityInput.value === '') {
                        document.documentElement.style.setProperty('--message-actions-bg-opacity', DEFAULT_MESSAGE_ACTIONS_BACKGROUND_OPACITY);
                    }
                });
                elements.toggleButtonTopOpacityInput.addEventListener('input', () => {
                    const opacity = parseFloat(elements.toggleButtonTopOpacityInput.value);
                    if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                        document.documentElement.style.setProperty('--message-toggle-button-top-opacity', opacity);
                    } else if (elements.toggleButtonTopOpacityInput.value === '') {
                        document.documentElement.style.setProperty('--message-toggle-button-top-opacity', DEFAULT_TOGGLE_BUTTON_TOP_OPACITY);
                    }
                });
                elements.thoughtSummaryOpacityInput.addEventListener('input', () => {
                    const opacity = parseFloat(elements.thoughtSummaryOpacityInput.value);
                    if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                        document.documentElement.style.setProperty('--thought-summary-opacity', opacity);
                    } else if (elements.thoughtSummaryOpacityInput.value === '') {
                        document.documentElement.style.setProperty('--thought-summary-opacity', DEFAULT_THOUGHT_SUMMARY_OPACITY);
                    }
                });
                elements.showTopCollapseButtonToggle.addEventListener('change', () => {
                    state.settings.showTopCollapseButton = elements.showTopCollapseButtonToggle.checked;
                    uiUtils.renderChatMessages(true);
                });
                elements.showBottomCollapseButtonToggle.addEventListener('change', () => {
                    state.settings.showBottomCollapseButton = elements.showBottomCollapseButtonToggle.checked;
                    uiUtils.renderChatMessages(true);
                });
                elements.persistMessageCollapseStateCheckbox.addEventListener('change', () => {
                    state.settings.persistMessageCollapseState = elements.persistMessageCollapseStateCheckbox.checked;
                });
                elements.showMultiApiKeysToggle.addEventListener('change', (e) => {
                    state.settings.showMultiApiKeys = e.target.checked;
                    uiUtils.toggleMultiApiKeysVisibility(e.target.checked);
                });
                elements.unmaskApiKeysToggle.addEventListener('change', () => {
                    state.settings.unmaskApiKeys = elements.unmaskApiKeysToggle.checked;
                    uiUtils.updateApiKeyInputType();
                });
                elements.disableLlmUrlWhitelistToggle.addEventListener('change', () => {
                    state.settings.disableLlmUrlWhitelist = elements.disableLlmUrlWhitelistToggle.checked;
                    const llmUrlInput = elements.llmAggregatorApiBackendInput;
                    llmUrlInput.dispatchEvent(new Event('input'));
                });
                const settingsScreenElement = document.getElementById('settings-screen');
                let autoSaveTimer;
                const handleSettingsChange = () => {
                    if (state.settings.autoSaveSettings) {
                        clearTimeout(autoSaveTimer);
                        autoSaveTimer = setTimeout(() => {
                            this.saveSettings(false);
                        }, 500);
                    }
                };

                settingsScreenElement.addEventListener('change', (event) => {
                    if (event.target.closest('.settings-group, .danger-zone')) {
                        handleSettingsChange();
                    }
                });

                settingsScreenElement.addEventListener('input', (event) => {
                    if (event.target.matches('input[type="text"], input[type="password"], input[type="number"], textarea')) {
                        handleSettingsChange();
                    }
                });

                settingsScreenElement.addEventListener('toggle', (event) => {
                    if (event.target.tagName === 'DETAILS' && event.target.closest('#settings-screen')) {
                        handleSettingsChange();
                    }
                }, true);

                elements.messageContainer.addEventListener('click', (event) => {
                    const target = event.target;
                    const button = target.closest('button');
                    const clickedMessage = target.closest('.message');

                    if (button && clickedMessage) {
                        const index = parseInt(clickedMessage.dataset.index, 10);

                        if (button.classList.contains('cascade-prev-btn')) {
                            appLogic.navigateCascade(index, 'prev'); return;
                        }
                        if (button.classList.contains('cascade-next-btn')) {
                            appLogic.navigateCascade(index, 'next'); return;
                        }
                        if (button.classList.contains('cascade-delete-btn')) {
                            appLogic.confirmDeleteCascadeResponse(index); return;
                        }

                        if (button.classList.contains('message-toggle-button')) {
                            uiUtils.toggleMessageCollapse(index); return;
                        }

                        if (button.classList.contains('js-edit-btn')) {
                            appLogic.startEditMessage(index, clickedMessage); return;
                        }
                        if (button.classList.contains('js-delete-btn')) {
                            appLogic.deleteMessage(index); return;
                        }
                        if (button.classList.contains('js-copy-btn')) {
                            appLogic.copyMessageText(index, button); return;
                        }
                        if (button.classList.contains('js-retry-btn')) {
                            const role = clickedMessage.classList.contains('model') ? 'model' : 'user';
                            const userIndexForRetry = (role === 'model' && index > 0) ? appLogic.findPreviousUserIndex(index) : index;
                            if (userIndexForRetry !== -1) appLogic.retryFromMessage(userIndexForRetry);
                            return;
                        }
                    }

                    if (target.closest('.interactive-title-content, .code-copy-button, a[href="#"], .thought-summary-details summary, .attachment-actions button, .add-more-attachments-btn')) {
                        return;
                    }

                    if (clickedMessage) {
                        const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                        if (currentlyShown && currentlyShown !== clickedMessage) {
                            currentlyShown.classList.remove('show-actions');
                        }
                        if (!clickedMessage.classList.contains('editing')) {
                            clickedMessage.classList.toggle('show-actions');
                        }
                    } else {
                        const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                        if (currentlyShown) {
                            currentlyShown.classList.remove('show-actions');
                        }
                    }
                }, true);
                document.body.addEventListener('click', (event) => {
                    if (!elements.messageContainer.contains(event.target) &&
                        !elements.memoArea.contains(event.target) &&
                        !elements.clipboardStackArea.contains(event.target) &&
                        !event.target.closest('.custom-dialog')) {
                        const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                        if (currentlyShown) {
                            currentlyShown.classList.remove('show-actions');
                        }
                    }
                }, true);

                                elements.chatScreen.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
                elements.chatScreen.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
                elements.chatScreen.addEventListener('touchend', this.handleTouchEnd.bind(this));

                let mouseGlobalY = 0;
                let autoScrollTimer = null;

                const stopAutoScroll = () => {
                    if (autoScrollTimer) {
                        clearInterval(autoScrollTimer);
                        autoScrollTimer = null;
                        document.body.style.cursor = '';
                    }
                };

                window.addEventListener('mousemove', (e) => { mouseGlobalY = e.clientY; });

                window.addEventListener('wheel', (e) => {
                    if (autoScrollTimer) stopAutoScroll();
                    const activeScreen = document.querySelector('.screen.active');
                    if (!activeScreen) return;
                    const scrollTarget = activeScreen.querySelector('.main-content');
                    if (!scrollTarget || scrollTarget.contains(e.target)) return;
                    if (e.target.tagName === 'TEXTAREA' && e.target.scrollHeight > e.target.clientHeight) return;
                    if (e.target.closest('.api-keys-list')) return;
                    scrollTarget.scrollTop += e.deltaY;
                }, { passive: true });

                window.addEventListener('mousedown', (e) => {
                    if (autoScrollTimer) {
                        stopAutoScroll();
                        return;
                    }
                    if (e.button !== 1) return;

                    const activeScreen = document.querySelector('.screen.active');
                    if (!activeScreen) return;
                    const scrollTarget = activeScreen.querySelector('.main-content');
                    if (!scrollTarget || scrollTarget.contains(e.target)) return;
                    if (e.target.tagName === 'TEXTAREA' || e.target.closest('button, input, select, a')) return;

                    e.preventDefault();
                    const originY = e.clientY;
                    document.body.style.cursor = 'ns-resize';

                    autoScrollTimer = setInterval(() => {
                        const delta = mouseGlobalY - originY;
                        if (Math.abs(delta) > 10) {
                            scrollTarget.scrollTop += delta * 0.25;
                        }
                    }, 16);
                });

                if ('visualViewport' in window) {

                    window.visualViewport.addEventListener('resize', this.updateZoomState.bind(this));
                    window.visualViewport.addEventListener('scroll', this.updateZoomState.bind(this));
                }

                document.querySelectorAll('.app-header').forEach(header => {
                    header.addEventListener('click', (e) => {
                        if (!state.settings.headerTapScrollToTop) return;
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;

                        const screenId = header.closest('.screen')?.id;
                        if (screenId === 'chat-screen') this.scrollToTop();
                        else if (screenId === 'settings-screen') this.scrollToSettingsTop();
                        else if (screenId === 'history-screen') {
                            const main = document.querySelector('#history-screen .main-content');
                            if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    });
                });

                const footer = document.querySelector('.chat-input-area');
                if (footer) {
                    footer.addEventListener('click', (e) => {
                        if (!state.settings.footerTapScrollToBottom) return;
                        if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'TEXTAREA') return;
                        if (state.currentScreen === 'chat') this.scrollToBottom();
                    });
                }

                window.addEventListener('popstate', this.handlePopState.bind(this));

                elements.attachFileBtn.addEventListener('click', () => uiUtils.showFileUploadDialog());
                elements.selectFilesBtn.addEventListener('click', () => elements.fileInput.click());
                elements.fileInput.addEventListener('change', (event) => {
                    this.handleFileSelection(event.target.files);
                    event.target.value = null;
                });
                elements.confirmAttachBtn.addEventListener('click', () => this.confirmAttachment());
                elements.cancelAttachBtn.addEventListener('click', () => this.cancelAttachment());
                elements.fileUploadDialog.addEventListener('close', () => {
                    if (elements.fileUploadDialog.returnValue !== 'ok') {
                        this.cancelAttachment();
                    }
                });
                elements.messageContainer.addEventListener('click', (event) => {
                    const targetButton = event.target.closest('.message-toggle-button');
                    if (targetButton && targetButton.dataset.action === 'toggle-collapse') {
                        const index = parseInt(targetButton.dataset.index, 10);
                        this.toggleMessageCollapse(index);
                    }
                });
    elements.enableElevationToggle.addEventListener('change', () => {
        state.settings.enableElevation = elements.enableElevationToggle.checked;
        uiUtils.applyElevationSetting();
        elements.elevationHoverOption.classList.toggle('hidden', !state.settings.enableElevation);
    });
    elements.enableElevationHoverToggle.addEventListener('change', () => {
        state.settings.enableElevationHover = elements.enableElevationHoverToggle.checked;
        uiUtils.applyElevationSetting();
    });
    elements.settingsScrollToTopBtn.addEventListener('click', () => this.scrollToSettingsTop());
    elements.settingsScrollToBottomBtn.addEventListener('click', () => this.scrollToSettingsBottom());
    elements.showSettingsScrollToTopButtonToggle.addEventListener('change', () => {
        state.settings.showSettingsScrollToTopButton = elements.showSettingsScrollToTopButtonToggle.checked;
        uiUtils.updateSettingsScreenElementVisibility();
    });
    elements.showSettingsScrollToBottomButtonToggle.addEventListener('change', () => {
        state.settings.showSettingsScrollToBottomButton = elements.showSettingsScrollToBottomButtonToggle.checked;
        uiUtils.updateSettingsScreenElementVisibility();
    });
    document.querySelectorAll('#settings-screen details[id]').forEach(details => {
                    details.addEventListener('toggle', (event) => {
                        if (details.id) {
                            state.settings.settingsUIDetailsOpenStates[details.id] = details.open;
                        }
                    });
                });
                window.addEventListener('resize', uiUtils.adjustHeaderLayout);
                uiUtils.adjustHeaderLayout();

                elements.apiProviderCycleGeminiCheckbox.addEventListener('change', () => {
                    state.settings.apiProviderCycle.gemini = elements.apiProviderCycleGeminiCheckbox.checked;
                    uiUtils.updateApiProviderSelectOptions();
                });
                elements.apiProviderCycleDeepSeekCheckbox.addEventListener('change', () => {
                    state.settings.apiProviderCycle.deepseek = elements.apiProviderCycleDeepSeekCheckbox.checked;
                    uiUtils.updateApiProviderSelectOptions();
                });
                elements.apiProviderCycleClaudeCheckbox.addEventListener('change', () => {
                    state.settings.apiProviderCycle.claude = elements.apiProviderCycleClaudeCheckbox.checked;
                    uiUtils.updateApiProviderSelectOptions();
                });
                elements.apiProviderCycleOpenAICheckbox.addEventListener('change', () => {
                    state.settings.apiProviderCycle.openai = elements.apiProviderCycleOpenAICheckbox.checked;
                    uiUtils.updateApiProviderSelectOptions();
                });
                elements.apiProviderCycleXaiCheckbox.addEventListener('change', () => {
                    state.settings.apiProviderCycle.xai = elements.apiProviderCycleXaiCheckbox.checked;
                    uiUtils.updateApiProviderSelectOptions();
                });
                elements.apiProviderCycleLlmAggregatorCheckbox.addEventListener('change', () => {
                    state.settings.apiProviderCycle.llmaggregator = elements.apiProviderCycleLlmAggregatorCheckbox.checked;
                    uiUtils.updateApiProviderSelectOptions();
                });
                elements.apiProviderCycleDummyCheckbox.addEventListener('change', () => {
                    state.settings.apiProviderCycle.dummy = elements.apiProviderCycleDummyCheckbox.checked;
                    uiUtils.updateApiProviderSelectOptions();
                });

                const llmUrlInput = elements.llmAggregatorApiBackendInput;
                const llmUrlError = elements.llmAggregatorUrlError;

                const validateLlmUrl = () => {
                    const url = llmUrlInput.value;
                    const saveButtons = document.querySelectorAll('.js-save-settings-btn');
                    if (url && !isAllowedAggregatorDomain(url)) {
                        llmUrlError.textContent = 'このドメインは許可されていません。';
                        saveButtons.forEach(btn => btn.disabled = true);
                    } else {
                        llmUrlError.textContent = '';
                        saveButtons.forEach(btn => btn.disabled = false);
                    }
                };

                llmUrlInput.addEventListener('input', validateLlmUrl);
                llmUrlInput.addEventListener('blur', validateLlmUrl);

                multiApiKeyUtils.initializeMultiApiKeys();
                multiBackendUtils.initialize();
                elements.geminiApiKeyInput.addEventListener('input', () => multiApiKeyUtils.syncMainApiKeyInput('gemini'));
                elements.deepSeekApiKeyInput.addEventListener('input', () => multiApiKeyUtils.syncMainApiKeyInput('deepseek'));
                elements.claudeApiKeyInput.addEventListener('input', () => multiApiKeyUtils.syncMainApiKeyInput('claude'));
                elements.openaiApiKeyInput.addEventListener('input', () => multiApiKeyUtils.syncMainApiKeyInput('openai'));
                elements.xaiApiKeyInput.addEventListener('input', () => multiApiKeyUtils.syncMainApiKeyInput('xai'));
                elements.llmAggregatorApiKeyInput.addEventListener('input', () => multiApiKeyUtils.syncMainApiKeyInput('llmaggregator'));
                elements.showMultiApiKeysToggle.addEventListener('change', (e) => {
                    uiUtils.toggleMultiApiKeysVisibility(e.target.checked);
                });
                elements.enableWebhookNotificationToggle.addEventListener('change', (e) => {
                    elements.webhookSettingsContainer.classList.toggle('hidden', !e.target.checked);
                });
                elements.enableFuzzySearchNormalizationCheckbox.addEventListener('change', () => {
                    elements.fuzzySearchOptionsDiv.classList.toggle('hidden', !elements.enableFuzzySearchNormalizationCheckbox.checked);
                });
                // ▼「elements.geminiEnableGroundingToggle.addEventListener(...)」の(もしあれば)下あたりに追加▼
                elements.enableImageUrlReplacementCheckbox.addEventListener('change', () => {
                    elements.imageUrlReplacementOptionsDiv.classList.toggle('hidden', !elements.enableImageUrlReplacementCheckbox.checked);
                });
const helpIcons = document.querySelectorAll('.api-key-help-icon');
helpIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        const helpText = `
            <div style="text-align:left; font-size:13px; line-height:1.5;">
                <div style="margin-bottom:12px;">
                    <strong style="font-size:15px; color:var(--text-link);">💡 APIキーの自動振り分け</strong><br>
                    どの入力欄からでも、先頭に「<b>識別文字</b>」をつけることで、適切なプロバイダーへ自動的に振り分けて登録できます。
                </div>
                <div style="margin-bottom:12px; background-color:var(--bg-secondary); padding:10px; border-radius:6px; border:1px solid var(--border-secondary);">
                    <strong>📝 書式 (カンマ区切りで複数可)</strong><br>
                    <code>『識別文字』:『APIキー』</code><br>
                    <br>
                    <strong>🖋️ 入力例</strong><br>
                    <code>『google:AIzaSy……』, 『chatgpt:sk-prh……』,</code>
                </div>
                <div>
                    <strong>🔤 使用できる識別文字</strong> (大文字小文字OK)
                    <ul style="padding-left:20px; margin:5px 0 0 0;">
                        <li><b>Gemini</b>: g, go, ge, google</li>
                        <li><b>DeepSeek</b>: d, ds, de, deepseek</li>
                        <li><b>Claude</b>: c, cl, an, anthropic</li>
                        <li><b>OpenAI</b>: o, op, ch, chatgpt</li>
                        <li><b>xAI (Grok)</b>: x, gr, xa, grok</li>
                        <li>※LLM Aggregatorは適用対象外</li>
                    </ul>
                </div>
            </div>
        `;
        uiUtils.showCustomAlert(helpText);
    });
});
            },
});
