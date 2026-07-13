// @ts-nocheck -- Enable after this legacy controller is split into typed features.
// src/app-controller.js is generated from this file. Edit this TypeScript source instead.
const appLogic = {
    toggleAllSettingsCheckboxes(checked) {
        const checkboxes = document.querySelectorAll('#settings-screen input[type="checkbox"]');
        checkboxes.forEach(cb => {
            if (cb.checked !== checked) {
                cb.checked = checked;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    },
    scrollToSettingsTop() {
        const mainContent = elements.settingsScreen.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },
    scrollToSettingsBottom() {
        const mainContent = elements.settingsScreen.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTo({ top: mainContent.scrollHeight, behavior: 'smooth' });
        }
    },
    _setupOpacitySlider(inputId, cssVar, defaultValue) {
        const numberInput = document.getElementById(inputId);
        const sliderInput = document.getElementById(inputId + '-slider');
        const enableCheckbox = document.querySelector(`.opacity-disable-checkbox[data-target-id="${inputId}"]`);
        const settingKey = `enable${inputId.replace(/-(\w)/g, (match, p1) => p1.toUpperCase()).replace(/^\w/, c => c.toUpperCase())}`;
        const updateValue = (value) => {
            const numValue = parseFloat(value);
            const finalValue = (isNaN(numValue) || value === '') ? defaultValue : numValue;
            if (String(numberInput.value) !== String(value))
                numberInput.value = value;
            if (String(sliderInput.value) !== String(value))
                sliderInput.value = value;
            if (state.settings[settingKey]) {
                document.documentElement.style.setProperty(cssVar, finalValue);
            }
        };
        const handleCheckboxChange = () => {
            const isEnabled = enableCheckbox.checked;
            state.settings[settingKey] = isEnabled;
            numberInput.disabled = !isEnabled;
            sliderInput.disabled = !isEnabled;
            if (isEnabled) {
                updateValue(numberInput.value);
            }
            else {
                document.documentElement.style.setProperty(cssVar, 1);
            }
        };
        const initialValue = state.settings[inputId.replace(/-(\w)/g, (match, p1) => p1.toUpperCase())];
        numberInput.value = (initialValue === null || initialValue === undefined) ? '' : initialValue;
        sliderInput.value = initialValue ?? defaultValue;
        enableCheckbox.checked = state.settings[settingKey];
        numberInput.addEventListener('input', (e) => updateValue(e.target.value));
        sliderInput.addEventListener('input', (e) => updateValue(e.target.value));
        enableCheckbox.addEventListener('change', handleCheckboxChange);
        handleCheckboxChange();
    },
    _setupFontSizeSlider(inputId, cssVar, defaultValue) {
        const numberInput = document.getElementById(inputId);
        const sliderInput = document.getElementById(inputId + '-slider');
        const updateValue = (value) => {
            const numValue = parseInt(value, 10);
            const finalValue = (isNaN(numValue) || value === '') ? defaultValue : numValue;
            if (numberInput.value !== value)
                numberInput.value = value;
            if (sliderInput.value !== value)
                sliderInput.value = value;
            document.documentElement.style.setProperty(cssVar, `${finalValue}px`);
        };
        numberInput.addEventListener('input', (e) => updateValue(e.target.value));
        sliderInput.addEventListener('input', (e) => updateValue(e.target.value));
    },
    _setupUiScaleSlider(inputId, cssVar, defaultValue) {
        const numberInput = document.getElementById(inputId);
        const sliderInput = document.getElementById(inputId + '-slider');
        const updateValue = (value) => {
            let numValue = parseFloat(value);
            if (isNaN(numValue))
                numValue = defaultValue;
            if (numValue < 0.5)
                numValue = 0.5;
            if (numValue > 3.0)
                numValue = 3.0;
            if (String(numberInput.value) !== String(value))
                numberInput.value = value;
            if (String(sliderInput.value) !== String(value))
                sliderInput.value = value;
            document.documentElement.style.setProperty(cssVar, numValue);
            state.settings.settingsUiScale = numValue;
        };
        numberInput.addEventListener('input', (e) => updateValue(e.target.value));
        sliderInput.addEventListener('input', (e) => updateValue(e.target.value));
    },
    _setupParamSlider(paramId, defaultValue, storageKey) {
        const numberInput = document.getElementById(paramId);
        const sliderInput = document.getElementById(paramId + '-slider');
        const defaultCheckbox = document.querySelector(`.param-default-checkbox[data-target-id="${paramId}"]`);
        const maxInput = document.querySelector(`.param-slider-max-input[data-target-id="${paramId}"]`);
        const updateValue = (value, from) => {
            if (numberInput.value !== value)
                numberInput.value = value;
            if (sliderInput.value !== value)
                sliderInput.value = value;
        };
        const handleCheckboxChange = () => {
            const isDefault = !defaultCheckbox.checked;
            numberInput.disabled = isDefault;
            sliderInput.disabled = isDefault;
            if (maxInput)
                maxInput.disabled = isDefault;
            if (isDefault) {
                sliderInput.value = defaultValue;
            }
        };
        const handleMaxInputChange = () => {
            const maxValStr = maxInput.value.trim();
            const maxVal = maxValStr === '' ? 99999999999999999 : parseFloat(maxValStr);
            if (!isNaN(maxVal) && maxVal > parseFloat(sliderInput.min)) {
                sliderInput.max = maxVal;
                if (parseFloat(sliderInput.value) > maxVal) {
                    sliderInput.value = maxVal;
                    numberInput.value = maxVal;
                }
                if (storageKey) {
                    state.settings[storageKey] = (maxValStr === '') ? null : parseFloat(maxValStr);
                }
            }
        };
        if (maxInput) {
            const storedMax = storageKey ? state.settings[storageKey] : null;
            maxInput.value = storedMax === null ? '' : storedMax;
            handleMaxInputChange();
        }
        numberInput.addEventListener('input', (e) => updateValue(e.target.value, 'number'));
        sliderInput.addEventListener('input', (e) => updateValue(e.target.value, 'slider'));
        defaultCheckbox.addEventListener('change', handleCheckboxChange);
        if (maxInput) {
            maxInput.addEventListener('change', handleMaxInputChange);
        }
        const buttons = document.querySelectorAll(`.set-claude-param-btn[data-target="${paramId}"]`);
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.dataset.value;
                if (value === 'null') {
                    numberInput.value = '';
                    if (!checkbox.checked) {
                        updateUIState(false);
                    }
                    else {
                        updateUIState(true);
                        sliderInput.value = defaultValue;
                    }
                }
                else {
                    if (!checkbox.checked) {
                        updateUIState(true);
                    }
                    syncValues(value);
                }
            });
        });
    },
    async sendWebhookNotification(responseMessage) {
        if (!state.settings.enableWebhookNotification || !state.settings.webhooks || state.settings.webhooks.length === 0) {
            return;
        }
        const enabledWebhooks = state.settings.webhooks.filter(w => w.enabled && w.url && w.url.trim());
        if (enabledWebhooks.length === 0) {
            return;
        }
        const promises = enabledWebhooks.map(webhook => {
            return (async () => {
                try {
                    new URL(webhook.url);
                }
                catch (e) {
                    console.error(`Webhook送信失敗 (無効なURL: ${webhook.label}):`, webhook.url);
                    return;
                }
                const format = webhook.format || 'json';
                let body;
                let headers;
                if (format === 'text') {
                    body = responseMessage.content;
                    headers = { 'Content-Type': 'text/plain' };
                }
                else {
                    const payload = {
                        type: "ai_response",
                        timestamp: new Date().toISOString(),
                        sessionId: state.currentChatId,
                        sessionTitle: elements.chatTitle.textContent.replace(/^: /, ''),
                        content: responseMessage.content,
                        provider: responseMessage.generatedByApiProvider,
                        webhookLabel: webhook.label
                    };
                    body = JSON.stringify(payload);
                    headers = { 'Content-Type': 'application/json' };
                }
                const fetchOptions = {
                    method: 'POST',
                    headers: headers,
                    body: body,
                    mode: 'cors'
                };
                if (format === 'json') {
                    fetchOptions.mode = 'no-cors';
                }
                try {
                    const response = await fetch(webhook.url, fetchOptions);
                    if (fetchOptions.mode === 'cors' && !response.ok) {
                        console.error(`Webhook送信失敗 (${webhook.label}): サーバーがエラーステータス ${response.status} を返しました`);
                    }
                }
                catch (error) {
                    console.error(`Webhook送信中にネットワークエラー (${webhook.label}):`, error);
                }
            })();
        });
        await Promise.allSettled(promises);
    },
    /**
      * 現在のチャットのメッセージからベースURLを検出し、stateを更新する
     * @param {Array<Object>} messages - 解析対象のメッセージ配列
     */
    updateChatBaseUrl(messages) {
        // 新機能のチェックボックスがOFFの場合は何もしない
        if (!state.settings.enableAutoBaseUrlDetection) {
            state.currentChatBaseUrl = null;
            console.log('[updateChatBaseUrl] Auto-detection is disabled. Base URL cleared.');
            return;
        }
        console.groupCollapsed(`[updateChatBaseUrl] Detecting base URL for current chat...`);
        // 最初のユーザーメッセージを探す
        const firstUserMessage = messages.find(msg => msg.role === 'user');
        if (!firstUserMessage || !firstUserMessage.content) {
            state.currentChatBaseUrl = null;
            console.log('  > No first user message found. Base URL set to null.');
            console.groupEnd();
            return;
        }
        console.log('  > Analyzing first user message:', `"${firstUserMessage.content.substring(0, 100)}..."`);
        const urlRegex = /(https?:\/\/[^\s\n　「」『』（）]+)/;
        const match = firstUserMessage.content.match(urlRegex);
        if (match && match[0]) {
            try {
                // ▼▼▼ ここから変更 ▼▼▼
                const url = new URL(match[0]);
                // パスやクエリパラメータを含まない、オリジン部分のみをベースURLとして採用する
                const baseUrl = url.origin;
                state.currentChatBaseUrl = baseUrl;
                console.log(`  > Base URL detected and set: "${state.currentChatBaseUrl}"`);
                // ▲▲▲ ここまで変更 ▲▲▲
            }
            catch (e) {
                state.currentChatBaseUrl = null;
                console.warn('  > Found a URL-like string, but it was invalid. Ignored.', match[0], e);
            }
        }
        else {
            state.currentChatBaseUrl = null;
            console.log('  > No valid URL found in the first message. Base URL set to null.');
        }
        console.groupEnd();
    },
    async initializeApp() {
        try {
            if (typeof marked !== 'undefined') {
                marked.setOptions({ breaks: true, gfm: true, sanitize: false, smartypants: false });
            }
            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose', fontFamily: 'var(--font-family)', flowchart: { useMaxWidth: true, htmlLabels: true }, sequence: { useMaxWidth: true }, gantt: { useMaxWidth: true }, journey: { useMaxWidth: true }, pie: { useMaxWidth: true } });
            }
            elements.appVersionSpan.textContent = APP_VERSION;
            window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); });
            registerServiceWorker();
            if (navigator.storage && navigator.storage.persist) {
                try {
                    const isPersisted = await navigator.storage.persisted();
                    if (!isPersisted) {
                        await navigator.storage.persist();
                    }
                }
                catch (e) {
                    console.warn("Storage persistence request failed:", e);
                }
            }
            await dbUtils.openDB();
            await dbUtils.loadSettings();
            if (navigator.storage && navigator.storage.persist) {
                navigator.storage.persist();
            }
            uiUtils.applyTheme();
            uiUtils.applyFontFamily();
            uiUtils.applySidePanelSettingsToUI();
            uiUtils.applyMinimizeUI();
            uiUtils.applyAiBubbleWidthSetting();
            uiUtils.applyUserBubbleWidthSetting();
            uiUtils.applyMessageSpacingSetting();
            uiUtils.applyCompactSettingsSpacing();
            if (state.settings.backgroundImageBlob instanceof Blob) {
                uiUtils.revokeExistingObjectUrl();
                try {
                    state.backgroundImageUrl = URL.createObjectURL(state.settings.backgroundImageBlob);
                    document.documentElement.style.setProperty('--chat-background-image', `url(${state.backgroundImageUrl})`);
                }
                catch (e) {
                    document.documentElement.style.setProperty('--chat-background-image', 'none');
                }
            }
            else {
                document.documentElement.style.setProperty('--chat-background-image', 'none');
            }
            if (state.settings.historyBackgroundImageBlob instanceof Blob) {
                try {
                    if (state.historyBackgroundImageUrl)
                        URL.revokeObjectURL(state.historyBackgroundImageUrl);
                    state.historyBackgroundImageUrl = URL.createObjectURL(state.settings.historyBackgroundImageBlob);
                    document.documentElement.style.setProperty('--history-background-image', `url(${state.historyBackgroundImageUrl})`);
                }
                catch (e) {
                    document.documentElement.style.setProperty('--history-background-image', 'none');
                }
            }
            else {
                document.documentElement.style.setProperty('--history-background-image', 'none');
            }
            if (state.settings.settingsBackgroundImageBlob instanceof Blob) {
                try {
                    if (state.settingsBackgroundImageUrl)
                        URL.revokeObjectURL(state.settingsBackgroundImageUrl);
                    state.settingsBackgroundImageUrl = URL.createObjectURL(state.settings.settingsBackgroundImageBlob);
                    document.documentElement.style.setProperty('--settings-background-image', `url(${state.settingsBackgroundImageUrl})`);
                }
                catch (e) {
                    document.documentElement.style.setProperty('--settings-background-image', 'none');
                }
            }
            else {
                document.documentElement.style.setProperty('--settings-background-image', 'none');
            }
            if (state.settings.userIconBlob instanceof Blob) {
                try {
                    state.userIconUrl = URL.createObjectURL(state.settings.userIconBlob);
                }
                catch (e) { }
            }
            if (state.settings.aiIconBlob instanceof Blob) {
                try {
                    state.aiIconUrl = URL.createObjectURL(state.settings.aiIconBlob);
                }
                catch (e) { }
            }
            uiUtils.applySettingsToUI();
            const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
            if (chats && chats.length > 0) {
                await this.loadChat(chats[0].id);
            }
            else {
                this.startNewChat();
            }
            uiUtils.showScreen('chat');
            history.replaceState({ screen: 'chat' }, '', '#chat');
            state.currentScreen = 'chat';
            updateMessageMaxWidthVar();
            webhookUtils.initialize();
            proofreadingApiConfigUtils.initialize();
            const deleteConfirmCheckboxes = document.querySelectorAll('.js-disable-delete-api-key-confirmation-toggle');
            deleteConfirmCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (event) => {
                    const isChecked = event.target.checked;
                    deleteConfirmCheckboxes.forEach(cb => {
                        if (cb !== event.target) {
                            cb.checked = isChecked;
                        }
                    });
                });
            });
            const removeDuplicateCheckboxes = document.querySelectorAll('.js-remove-duplicate-api-keys-toggle');
            removeDuplicateCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (event) => {
                    const isChecked = event.target.checked;
                    removeDuplicateCheckboxes.forEach(cb => {
                        if (cb !== event.target) {
                            cb.checked = isChecked;
                        }
                    });
                });
            });
            this.setupEventListeners();
            this.updateZoomState();
            uiUtils.adjustTextareaHeight();
            uiUtils.setSendingState(false);
            if (state.settings.autoScrollOnNewMessage) {
                uiUtils.scrollToBottom();
            }
            if (typeof window.initializationSuccess === 'function') {
                window.initializationSuccess();
            }
        }
        catch (error) {
            const userChoice = await uiUtils.showInitializationFailureDialog(`アプリの初期化に失敗しました: ${error.message}`);
            if (userChoice === 'export') {
                await this.safeExportAllSessions();
            }
            await this._showFatalErrorScreen(error);
        }
    },
    async _showFatalErrorScreen(error) {
        const errorHtml = `
                <div style="padding: 20px; text-align: center; color: var(--text-primary); height: 100%; overflow-y: auto; display: flex; flex-direction: column; justify-content: center;">
                    <div>
                        <h2 style="color: var(--text-error); margin-bottom: 15px;">アプリの起動に失敗しました。</h2>
                        <p style="font-size: 14px; margin-bottom: 25px;">
                            IndexedDBへの書き込みや読み込みが正常に機能しない、あるいはデータが破損している可能性があります。<br>
                            以下のボタンで問題を解決できる場合があります。また、ユーザーが何も操作しなくても、アプリが起動しない問題を自動検知し、段階的に復旧処理を試みます。
                        </p>
                        <div style="display: flex; flex-direction: column; gap: 20px; max-width: 450px; margin: 0 auto; text-align: left;">

                            <div>
                                <button id="recovery-export-all-btn" style="width: 100%; padding: 10px; background-color: var(--bg-button-gold); color: var(--text-button-gold); border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">全出力 (全セッションをJSON出力)</button>
                                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                                    ※ アプリが起動できなくても、履歴データが無事な場合に全チャット履歴をファイルとして出力します。
                                </p>
                            </div>

                            <div>
                                <button id="recovery-update-app-btn" style="width: 100%; padding: 10px; background-color: var(--bg-button-update); color: var(--text-light); border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">アプリを更新 (キャッシュクリア)</button>
                                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                                    ※ サーバー側のhtmlファイルなどはブラウザにキャッシュされるため、このボタンで明示的にサーバーから再取得しない限り更新されない。
                                </p>
                            </div>

                            <div>
                                <button id="recovery-force-reload-btn" style="width: 100%; padding: 10px; background-color: var(--bg-button-edit); color: var(--text-light); border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">🔄 強制復旧 (キャッシュクリア&リロード)</button>
                                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                                    ※ アプリが不安定な場合に使用。全キャッシュをクリアして強制的に再起動します。「アプリを更新」の処理に加えて、ブラウザが保持しているこの「GeminiPWA」アプリに関連する他の種類のキャッシュも可能な限り削除します。<br>※ ユーザーデータ（チャット履歴・設定）は保持されます。
                                </p>
                            </div>

                            <div>
                                <button id="recovery-clear-history-btn" style="width: 100%; padding: 10px; background-color: var(--bg-button-edit); color: var(--text-light); border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">全履歴削除</button>
                                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                                    ※ ブラウザに保存されているチャット履歴を全て削除します。設定は保持されます。
                                </p>
                            </div>

                            <div>
                                <button id="recovery-clear-data-btn" style="width: 100%; padding: 10px; background-color: var(--bg-button-delete); color: var(--text-light); border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">⚠⚠⚠全データクリア (履歴と設定)⚠⚠⚠</button>
                                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">
                                    ※ ブラウザに保存されている設定や履歴を全て削除。<br>！！間違えて押そうとしていないか注意！！
                                </p>
                            </div>

                        </div>
                        <p style="font-size: 12px; margin-top: 30px; color: var(--text-secondary); max-width: 600px; margin-left: auto; margin-right: auto; word-wrap: break-word;">エラー詳細: <span id="recovery-error-details"></span></p>
                    </div>
                </div>
            `;
        elements.appContainer.innerHTML = errorHtml;
        const errorDetailsEl = document.getElementById('recovery-error-details');
        if (errorDetailsEl) {
            errorDetailsEl.textContent = error.message || String(error);
        }
        document.getElementById('recovery-export-all-btn').addEventListener('click', () => this.safeExportAllSessions());
        document.getElementById('recovery-update-app-btn').addEventListener('click', () => this.updateApp());
        document.getElementById('recovery-force-reload-btn').addEventListener('click', () => {
            if (typeof errorRecovery !== 'undefined') {
                errorRecovery.manualRecovery();
            }
            else {
                alert("強制復旧機能が利用できません。手動でキャッシュをクリアしてリロードしてください。");
            }
        });
        document.getElementById('recovery-clear-history-btn').addEventListener('click', () => this.confirmClearAllHistory());
        document.getElementById('recovery-clear-data-btn').addEventListener('click', () => this.confirmClearAllData());
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        document.body.classList.remove('dark-mode', 'light-mode-forced', 'pastel-pink-mode', 'pastel-blue-mode', 'pastel-yellow-mode', 'pastel-purple-mode', 'pastel-rainbow-mode');
        document.body.classList.add(prefersDark ? 'dark-mode' : 'light-mode-forced');
    },
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
        elements.twinEngineSummaryBtn.addEventListener('click', () => this.toggleTwinEngineSummary());
        elements.twinEngineApiKeyCycleBtn.addEventListener('click', () => this.cycleTwinEngineApiKey());
        elements.copyTwinEngineSummaryBtn.addEventListener('click', () => this.copyTwinEngineSummaryText());
        elements.clearTwinEngineSummaryBtn.addEventListener('click', () => this.clearTwinEngineSummary());
        elements.resummarizeBtn.addEventListener('click', () => this.manualResummarize());
        elements.footerResummarizeBtn.addEventListener('click', () => this.manualResummarize());
        elements.twinEngineModeToggleBtn.addEventListener('click', () => this.toggleTwinEngineMode());
        elements.footerTwinEngineModeToggleBtn.addEventListener('click', () => this.toggleTwinEngineMode());
        elements.scrollToTopBtn.addEventListener('click', () => this.scrollToTop());
        elements.scrollToBottomBtn.addEventListener('click', () => this.scrollToBottom());
        elements.aiToAiChatBtn.addEventListener('click', () => this.initiateAiToAiStep());
        elements.pasteToInputBtn.addEventListener('click', () => this.pasteToUserInput());
        elements.rollDiceBtn.addEventListener('click', () => this.rollDiceAndInput());
        elements.newChatBtn.addEventListener('click', () => {
            uiUtils.showCustomConfirm("現在のチャットを保存して新規チャットを開始しますか？").then(confirmed => {
                if (confirmed)
                    this.confirmStartNewChat();
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
            if (state.isSending)
                this.abortRequest();
            else
                this.handleSend();
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
            if (file)
                this.handleHistoryImport(file);
            event.target.value = null;
        });
        elements.exportAllSessionsBtn.addEventListener('click', () => this.exportAllSessions());
        elements.importAllSessionsBtn.addEventListener('click', () => elements.importAllSessionsInput.click());
        elements.importAllSessionsInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file)
                this.handleAllSessionsImport(file);
            event.target.value = null;
        });
        elements.saveSettingsBtns.forEach(button => {
            button.addEventListener('click', () => this.saveSettings(true));
        });
        elements.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
        elements.importSettingsBtn.addEventListener('click', () => elements.importSettingsInput.click());
        elements.importSettingsInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file)
                this.handleSettingsImport(file);
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
                    if (el.id)
                        state.settings.settingsUIDetailsOpenStates[el.id] = true;
                });
            });
        }
        if (elements.debugCollapseAllBtn) {
            elements.debugCollapseAllBtn.addEventListener('click', () => {
                const parentDetails = elements.debugCollapseAllBtn.closest('details');
                document.querySelectorAll('#settings-screen details').forEach(el => {
                    if (el !== parentDetails) {
                        el.open = false;
                        if (el.id)
                            state.settings.settingsUIDetailsOpenStates[el.id] = false;
                    }
                });
            });
        }
        document.getElementById('force-recovery-btn').addEventListener('click', async () => {
            const confirmed = await uiUtils.showCustomConfirm("強制復旧を実行しますか？\n\n" +
                "この操作により：\n" +
                "• 全キャッシュがクリアされます\n" +
                "• アプリが自動的に再起動されます\n" +
                "• チャット履歴と設定は保持されます\n\n" +
                "アプリが不安定な場合にのみ実行してください。");
            if (confirmed) {
                if (typeof errorRecovery !== 'undefined') {
                    errorRecovery.manualRecovery();
                }
                else {
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
        if (elements.enableSessionLinkingCheckbox) {
            elements.enableSessionLinkingCheckbox.addEventListener('change', () => {
                state.settings.enableSessionLinking = elements.enableSessionLinkingCheckbox.checked;
                if (!state.settings.enableSessionLinking) {
                    state.linkedSessionIds = [];
                }
                uiUtils.updateSessionLinkingUI();
            });
        }
        elements.setThinkingBudgetBtns.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.dataset.value;
                const targetInput = elements.geminiThinkingBudgetInput;
                if (value === 'null') {
                    targetInput.value = '';
                }
                else {
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
                    }
                    else {
                        targetInput.value = value;
                    }
                }
            });
        });
        elements.showTwinEngineSettingsToggle.addEventListener('change', (e) => {
            state.settings.showTwinEngineSettings = e.target.checked;
            const isVisible = e.target.checked;
            const twinEngineSettingsGroup = document.getElementById('settings-group-twin-engine');
            if (twinEngineSettingsGroup) {
                twinEngineSettingsGroup.classList.toggle('hidden', !isVisible);
            }
            if (elements.twinEngineSummaryBtn) {
                const showButton = isVisible && state.settings.showTwinEngineSummaryButton;
                elements.twinEngineSummaryBtn.classList.toggle('hidden', !showButton);
            }
            uiUtils.updateChatScreenElementVisibility();
            uiUtils.updateTwinEngineModeButton();
        });
        const handleBgUpload = async (file, type) => {
            if (!file)
                return;
            if (file.size > MAX_FILE_SIZE) {
                await uiUtils.showCustomAlert(`ファイルサイズが大きすぎます (${formatFileSize(file.size)})。${formatFileSize(MAX_FILE_SIZE)}以下にしてください。`);
                return;
            }
            const objectUrl = URL.createObjectURL(file);
            if (type === 'chat') {
                if (state.backgroundImageUrl)
                    URL.revokeObjectURL(state.backgroundImageUrl);
                state.backgroundImageUrl = objectUrl;
                state.settings.backgroundImageBlob = file;
                document.documentElement.style.setProperty('--chat-background-image', `url(${objectUrl})`);
                await dbUtils.saveSetting('backgroundImageBlob', file);
            }
            else if (type === 'history') {
                if (state.historyBackgroundImageUrl)
                    URL.revokeObjectURL(state.historyBackgroundImageUrl);
                state.historyBackgroundImageUrl = objectUrl;
                state.settings.historyBackgroundImageBlob = file;
                document.documentElement.style.setProperty('--history-background-image', `url(${objectUrl})`);
                await dbUtils.saveSetting('historyBackgroundImageBlob', file);
            }
            else if (type === 'settings') {
                if (state.settingsBackgroundImageUrl)
                    URL.revokeObjectURL(state.settingsBackgroundImageUrl);
                state.settingsBackgroundImageUrl = objectUrl;
                state.settings.settingsBackgroundImageBlob = file;
                document.documentElement.style.setProperty('--settings-background-image', `url(${objectUrl})`);
                await dbUtils.saveSetting('settingsBackgroundImageBlob', file);
            }
            uiUtils.updateBackgroundSettingsUI();
            if (state.settings.autoSaveSettings)
                this.saveSettings(false);
        };
        const confirmDeleteBg = async (type) => {
            const confirmed = await uiUtils.showCustomConfirm("背景画像を削除しますか？");
            if (confirmed) {
                if (type === 'chat') {
                    if (state.backgroundImageUrl)
                        URL.revokeObjectURL(state.backgroundImageUrl);
                    state.backgroundImageUrl = null;
                    state.settings.backgroundImageBlob = null;
                    document.documentElement.style.setProperty('--chat-background-image', 'none');
                    await dbUtils.saveSetting('backgroundImageBlob', null);
                }
                else if (type === 'history') {
                    if (state.historyBackgroundImageUrl)
                        URL.revokeObjectURL(state.historyBackgroundImageUrl);
                    state.historyBackgroundImageUrl = null;
                    state.settings.historyBackgroundImageBlob = null;
                    document.documentElement.style.setProperty('--history-background-image', 'none');
                    await dbUtils.saveSetting('historyBackgroundImageBlob', null);
                }
                else if (type === 'settings') {
                    if (state.settingsBackgroundImageUrl)
                        URL.revokeObjectURL(state.settingsBackgroundImageUrl);
                    state.settingsBackgroundImageUrl = null;
                    state.settings.settingsBackgroundImageBlob = null;
                    document.documentElement.style.setProperty('--settings-background-image', 'none');
                    await dbUtils.saveSetting('settingsBackgroundImageBlob', null);
                }
                uiUtils.updateBackgroundSettingsUI();
                if (state.settings.autoSaveSettings)
                    this.saveSettings(false);
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
            if (file)
                this.handleIconUpload('user', file);
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
            if (file)
                this.handleIconUpload('ai', file);
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
            }
            else if (elements.iconNameFontSizeInput.value === '') {
                document.documentElement.style.setProperty('--icon-name-font-size', `${DEFAULT_ICON_NAME_FONT_SIZE}px`);
            }
        });
        elements.iconNameOffsetYInput.addEventListener('input', () => {
            const uiOffsetY = parseInt(elements.iconNameOffsetYInput.value, 10);
            const internalOffsetY = isNaN(uiOffsetY) ? DEFAULT_ICON_NAME_OFFSET_Y : (uiOffsetY * -1);
            if (internalOffsetY >= -20 && internalOffsetY <= 20) {
                document.documentElement.style.setProperty('--icon-name-offset-y', `${internalOffsetY}px`);
            }
            else if (elements.iconNameOffsetYInput.value === '') {
                document.documentElement.style.setProperty('--icon-name-offset-y', `${DEFAULT_ICON_NAME_OFFSET_Y}px`);
            }
        });
        elements.messageIconSizeInput.addEventListener('input', () => {
            const newSize = parseInt(elements.messageIconSizeInput.value, 10);
            if (newSize >= 16 && newSize <= 64) {
                document.documentElement.style.setProperty('--message-icon-size', `${newSize}px`);
            }
            else if (elements.messageIconSizeInput.value === '') {
                document.documentElement.style.setProperty('--message-icon-size', `${DEFAULT_MESSAGE_ICON_SIZE}px`);
            }
        });
        elements.messageIconOffsetYInput.addEventListener('input', () => {
            const uiOffsetY = parseInt(elements.messageIconOffsetYInput.value, 10);
            const internalOffsetY = isNaN(uiOffsetY) ? DEFAULT_MESSAGE_ICON_OFFSET_Y : (uiOffsetY * -1);
            if (internalOffsetY >= -50 && internalOffsetY <= 50) {
                document.documentElement.style.setProperty('--message-icon-offset-y', `${internalOffsetY}px`);
            }
            else if (elements.messageIconOffsetYInput.value === '') {
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
        this._setupOpacitySlider('cryscroller-scroll-opacity', '--cryscroller-scroll-opacity', DEFAULT_CRYSCROLLER_SCROLL_OPACITY);
        this._setupOpacitySlider('cryscroller-scroll-active-opacity', '--cryscroller-scroll-active-opacity', DEFAULT_CRYSCROLLER_SCROLL_ACTIVE_OPACITY);
        this._setupFontSizeSlider('message-body-font-size-input', '--message-body-font-size', DEFAULT_MESSAGE_BODY_FONT_SIZE);
        this._setupFontSizeSlider('code-block-font-size-input', '--code-block-font-size', DEFAULT_CODE_BLOCK_FONT_SIZE);
        this._setupFontSizeSlider('thought-summary-font-size', '--thought-summary-font-size', DEFAULT_THOUGHT_SUMMARY_FONT_SIZE);
        this._setupFontSizeSlider('cryscroller-scroll-width-input', '--cryscroller-scroll-width', DEFAULT_CRYSCROLLER_SCROLL_WIDTH);
        const delayVal = state.settings.cryscrollerObserverDelay || 500;
        elements.cryscrollerObserverDelayInput.value = delayVal;
        document.getElementById('cryscroller-observer-delay-slider').value = delayVal;
        elements.cryscrollerObserverDelayInput.oninput = (e) => document.getElementById('cryscroller-observer-delay-slider').value = e.target.value;
        document.getElementById('cryscroller-observer-delay-slider').oninput = (e) => elements.cryscrollerObserverDelayInput.value = e.target.value;
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
        elements.showTwinEngineSummaryButtonToggle.addEventListener('change', () => {
            state.settings.showTwinEngineSummaryButton = elements.showTwinEngineSummaryButtonToggle.checked;
            uiUtils.updateChatScreenElementVisibility();
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
        elements.showFooterTwinEngineToggleButtonToggle.addEventListener('change', () => {
            state.settings.showFooterTwinEngineToggleButton = elements.showFooterTwinEngineToggleButtonToggle.checked;
            uiUtils.updateChatScreenElementVisibility();
        });
        elements.preventZoomToggle.addEventListener('change', () => {
            state.settings.preventZoom = elements.preventZoomToggle.checked;
            uiUtils.applyZoomPreventionSetting();
        });
        document.getElementById('minimize-header-footer-toggle').addEventListener('change', (e) => {
            state.settings.minimizeHeaderFooter = e.target.checked;
            uiUtils.applyMinimizeUI();
        });
        elements.enableCryscrollerScrollToggle.addEventListener('change', (e) => {
            state.settings.enableCryscrollerScroll = e.target.checked;
            document.body.classList.toggle('cryscroller-scroll-enabled', state.settings.enableCryscrollerScroll);
        });
        elements.enableImmersiveScrollingToggle.addEventListener('change', (e) => {
            state.settings.enableImmersiveScrolling = e.target.checked;
            appLogic.updateImmersiveLayout();
        });
        elements.enableDynamicScrollMarkerColorToggle.addEventListener('change', (e) => {
            state.settings.enableDynamicScrollMarkerColor = e.target.checked;
            window.dispatchEvent(new Event('resize'));
        });
        appLogic.initCryscrollerScroll();
        elements.enableSettingsCryscrollerScrollToggle.addEventListener('change', (e) => {
            state.settings.enableSettingsCryscrollerScroll = e.target.checked;
            document.body.classList.toggle('settings-cryscroller-scroll-enabled', state.settings.enableSettingsCryscrollerScroll);
            window.dispatchEvent(new Event('resize'));
        });
        appLogic.initSettingsCryscrollerScroll();
        elements.enableHistoryCryscrollerScrollToggle.addEventListener('change', (e) => {
            state.settings.enableHistoryCryscrollerScroll = e.target.checked;
            document.body.classList.toggle('history-cryscroller-scroll-enabled', state.settings.enableHistoryCryscrollerScroll);
            window.dispatchEvent(new Event('resize'));
        });
        appLogic.initHistoryCryscrollerScroll();
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
        elements.showSessionLinkingSettingsToggle.addEventListener('change', (e) => {
            if (elements.sessionLinkingSettingsGroup) {
                elements.sessionLinkingSettingsGroup.classList.toggle('hidden', !e.target.checked);
            }
        });
        elements.showTwinEngineSettingsToggle.addEventListener('change', (e) => {
            const isVisible = e.target.checked;
            const twinEngineSettingsGroup = document.getElementById('settings-group-twin-engine');
            if (twinEngineSettingsGroup) {
                twinEngineSettingsGroup.classList.toggle('hidden', !isVisible);
            }
            if (elements.twinEngineSummaryBtn) {
                const showButton = isVisible && state.settings.showTwinEngineSummaryButton;
                elements.twinEngineSummaryBtn.classList.toggle('hidden', !showButton);
            }
        });
        elements.memoHeightInput.addEventListener('input', () => {
            const newHeight = elements.memoHeightInput.value.trim();
            if (newHeight) {
                document.documentElement.style.setProperty('--memo-height', newHeight);
                document.documentElement.style.setProperty('--clipboard-stack-height', newHeight);
            }
            else {
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
            }
            else if (elements.messageBubbleOpacityInput.value === '') {
                document.documentElement.style.setProperty('--message-bubble-opacity', DEFAULT_MESSAGE_BUBBLE_OPACITY);
            }
        });
        elements.chatOverlayOpacityInput.addEventListener('input', () => {
            const opacity = parseFloat(elements.chatOverlayOpacityInput.value);
            if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                document.documentElement.style.setProperty('--chat-overlay-alpha', opacity);
            }
            else if (elements.chatOverlayOpacityInput.value === '') {
                document.documentElement.style.setProperty('--chat-overlay-alpha', DEFAULT_CHAT_OVERLAY_OPACITY);
            }
        });
        elements.headerFooterOpacityInput.addEventListener('input', () => {
            const opacity = parseFloat(elements.headerFooterOpacityInput.value);
            if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                document.documentElement.style.setProperty('--header-footer-opacity', opacity);
            }
            else if (elements.headerFooterOpacityInput.value === '') {
                document.documentElement.style.setProperty('--header-footer-opacity', DEFAULT_HEADER_FOOTER_OPACITY);
            }
        });
        elements.messageActionsBackgroundOpacityInput.addEventListener('input', () => {
            const opacity = parseFloat(elements.messageActionsBackgroundOpacityInput.value);
            if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                document.documentElement.style.setProperty('--message-actions-bg-opacity', opacity);
            }
            else if (elements.messageActionsBackgroundOpacityInput.value === '') {
                document.documentElement.style.setProperty('--message-actions-bg-opacity', DEFAULT_MESSAGE_ACTIONS_BACKGROUND_OPACITY);
            }
        });
        elements.toggleButtonTopOpacityInput.addEventListener('input', () => {
            const opacity = parseFloat(elements.toggleButtonTopOpacityInput.value);
            if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                document.documentElement.style.setProperty('--message-toggle-button-top-opacity', opacity);
            }
            else if (elements.toggleButtonTopOpacityInput.value === '') {
                document.documentElement.style.setProperty('--message-toggle-button-top-opacity', DEFAULT_TOGGLE_BUTTON_TOP_OPACITY);
            }
        });
        elements.thoughtSummaryOpacityInput.addEventListener('input', () => {
            const opacity = parseFloat(elements.thoughtSummaryOpacityInput.value);
            if (!isNaN(opacity) && opacity >= 0 && opacity <= 1) {
                document.documentElement.style.setProperty('--thought-summary-opacity', opacity);
            }
            else if (elements.thoughtSummaryOpacityInput.value === '') {
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
        elements.showProofreadingSettingsToggle.addEventListener('change', (e) => {
            state.settings.showProofreadingSettings = e.target.checked;
            elements.proofreadingSettingsGroup.classList.toggle('hidden', !e.target.checked);
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
                    appLogic.navigateCascade(index, 'prev');
                    return;
                }
                if (button.classList.contains('cascade-next-btn')) {
                    appLogic.navigateCascade(index, 'next');
                    return;
                }
                if (button.classList.contains('cascade-delete-btn')) {
                    appLogic.confirmDeleteCascadeResponse(index);
                    return;
                }
                if (button.classList.contains('message-toggle-button')) {
                    uiUtils.toggleMessageCollapse(index);
                    return;
                }
                if (button.classList.contains('js-edit-btn')) {
                    appLogic.startEditMessage(index, clickedMessage);
                    return;
                }
                if (button.classList.contains('js-delete-btn')) {
                    appLogic.deleteMessage(index);
                    return;
                }
                if (button.classList.contains('js-copy-btn')) {
                    appLogic.copyMessageText(index, button);
                    return;
                }
                if (button.classList.contains('js-retry-btn')) {
                    const role = clickedMessage.classList.contains('model') ? 'model' : 'user';
                    const userIndexForRetry = (role === 'model' && index > 0) ? appLogic.findPreviousUserIndex(index) : index;
                    if (userIndexForRetry !== -1)
                        appLogic.retryFromMessage(userIndexForRetry);
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
            }
            else {
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
            if (autoScrollTimer)
                stopAutoScroll();
            const activeScreen = document.querySelector('.screen.active');
            if (!activeScreen)
                return;
            const scrollTarget = activeScreen.querySelector('.main-content');
            if (!scrollTarget || scrollTarget.contains(e.target))
                return;
            if (e.target.tagName === 'TEXTAREA' && e.target.scrollHeight > e.target.clientHeight)
                return;
            if (e.target.closest('.api-keys-list'))
                return;
            scrollTarget.scrollTop += e.deltaY;
        }, { passive: true });
        window.addEventListener('mousedown', (e) => {
            if (autoScrollTimer) {
                stopAutoScroll();
                return;
            }
            if (e.button !== 1)
                return;
            const activeScreen = document.querySelector('.screen.active');
            if (!activeScreen)
                return;
            const scrollTarget = activeScreen.querySelector('.main-content');
            if (!scrollTarget || scrollTarget.contains(e.target))
                return;
            if (e.target.tagName === 'TEXTAREA' || e.target.closest('button, input, select, a'))
                return;
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
                if (!state.settings.headerTapScrollToTop)
                    return;
                if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT')
                    return;
                const screenId = header.closest('.screen')?.id;
                if (screenId === 'chat-screen')
                    this.scrollToTop();
                else if (screenId === 'settings-screen')
                    this.scrollToSettingsTop();
                else if (screenId === 'history-screen') {
                    const main = document.querySelector('#history-screen .main-content');
                    if (main)
                        main.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
        const footer = document.querySelector('.chat-input-area');
        if (footer) {
            footer.addEventListener('click', (e) => {
                if (!state.settings.footerTapScrollToBottom)
                    return;
                if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'TEXTAREA')
                    return;
                if (state.currentScreen === 'chat')
                    this.scrollToBottom();
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
            }
            else {
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
        twinEngineApiConfigUtils.initialize();
        elements.enableWebhookNotificationToggle.addEventListener('change', (e) => {
            elements.webhookSettingsContainer.classList.toggle('hidden', !e.target.checked);
        });
        elements.enableProofreadingCheckbox.addEventListener('change', () => {
            elements.proofreadingOptionsDiv.classList.toggle('hidden', !elements.enableProofreadingCheckbox.checked);
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
    handlePopState(event) {
        const targetScreen = event.state?.screen || 'chat';
        uiUtils.showScreen(targetScreen, true);
    },
    updateZoomState() {
        if ('visualViewport' in window) {
            const newZoomState = window.visualViewport.scale > ZOOM_THRESHOLD;
            if (state.isZoomed !== newZoomState) {
                state.isZoomed = newZoomState;
                document.body.classList.toggle('zoomed', state.isZoomed);
            }
        }
    },
    handleTouchStart(event) {
        if (!state.settings.enableSwipeNavigation)
            return;
        if (window.getSelection().toString().length > 0) {
            state.touchStartX = 0;
            state.touchStartY = 0;
            state.isSwiping = false;
            return;
        }
        if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT')
            return;
        if (event.touches.length > 1 || state.isZoomed) {
            state.touchStartX = 0;
            state.touchStartY = 0;
            state.isSwiping = false;
            return;
        }
        state.touchStartX = event.touches[0].clientX;
        state.touchStartY = event.touches[0].clientY;
        state.isSwiping = false;
        state.touchEndX = state.touchStartX;
        state.touchEndY = state.touchStartY;
    },
    handleTouchMove(event) {
        if (!state.settings.enableSwipeNavigation)
            return;
        if (window.getSelection().toString().length > 0) {
            return;
        }
        if (!state.touchStartX || event.touches.length > 1 || state.isZoomed) {
            return;
        }
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const diffX = state.touchStartX - currentX;
        const diffY = state.touchStartY - currentY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            state.isSwiping = true;
            if (event.cancelable) {
                event.preventDefault();
            }
        }
        else {
            state.isSwiping = false;
        }
        state.touchEndX = currentX;
        state.touchEndY = currentY;
    },
    handleTouchEnd(event) {
        if (!state.settings.enableSwipeNavigation) {
            this.resetSwipeState();
            return;
        }
        this.updateZoomState();
        if (state.isZoomed) {
            this.resetSwipeState();
            return;
        }
        if (!state.isSwiping || !state.touchStartX) {
            this.resetSwipeState();
            return;
        }
        const diffX = state.touchStartX - state.touchEndX;
        const diffY = state.touchStartY - state.touchEndY;
        if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                uiUtils.showScreen('settings');
            }
            else {
                uiUtils.showScreen('history');
            }
        }
        this.resetSwipeState();
    },
    resetSwipeState() {
        state.touchStartX = 0;
        state.touchStartY = 0;
        state.touchEndX = 0;
        state.touchEndY = 0;
        state.isSwiping = false;
    },
    toggleMemo() {
        state.isMemoVisible = !state.isMemoVisible;
        elements.memoArea.classList.toggle('hidden', !state.isMemoVisible);
        if (state.isMemoVisible) {
            elements.memoEditor.focus();
        }
    },
    async copyMemoText() {
        const memoText = elements.memoEditor.value;
        if (!memoText.trim()) {
            const originalText = elements.copyMemoBtn.textContent;
            elements.copyMemoBtn.textContent = "空です";
            elements.copyMemoBtn.disabled = true;
            setTimeout(() => {
                elements.copyMemoBtn.textContent = originalText;
                elements.copyMemoBtn.disabled = false;
            }, 1500);
            return;
        }
        try {
            await navigator.clipboard.writeText(memoText);
            const originalText = elements.copyMemoBtn.textContent;
            elements.copyMemoBtn.textContent = "コピー完了";
            elements.copyMemoBtn.disabled = true;
            setTimeout(() => { elements.copyMemoBtn.textContent = originalText; elements.copyMemoBtn.disabled = false; }, 1500);
        }
        catch (err) {
            const originalText = elements.copyMemoBtn.textContent;
            elements.copyMemoBtn.textContent = "コピー失敗";
            elements.copyMemoBtn.disabled = true;
            setTimeout(() => { elements.copyMemoBtn.textContent = originalText; elements.copyMemoBtn.disabled = false; }, 2000);
        }
    },
    async pasteIntoMemo() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "非対応";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 2000);
                return;
            }
            const textToPaste = await navigator.clipboard.readText();
            if (textToPaste) {
                const currentText = elements.memoEditor.value;
                const selectionStart = elements.memoEditor.selectionStart;
                const selectionEnd = elements.memoEditor.selectionEnd;
                elements.memoEditor.value = currentText.substring(0, selectionStart) + textToPaste + currentText.substring(selectionEnd);
                elements.memoEditor.selectionStart = elements.memoEditor.selectionEnd = selectionStart + textToPaste.length;
                elements.memoEditor.focus();
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "貼付け完了";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 1500);
            }
            else {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "空です";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 1500);
            }
        }
        catch (err) {
            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "許可エラー";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 2000);
            }
            else {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "貼付け失敗";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 2000);
            }
        }
    },
    async confirmClearMemo() {
        if (!elements.memoEditor.value.trim()) {
            const originalText = elements.deleteMemoBtn.textContent;
            elements.deleteMemoBtn.textContent = "空です";
            elements.deleteMemoBtn.disabled = true;
            setTimeout(() => {
                elements.deleteMemoBtn.textContent = originalText;
                elements.deleteMemoBtn.disabled = false;
            }, 1500);
            return;
        }
        const confirmed = await uiUtils.showCustomConfirm("メモの内容を全てクリアしますか？\nこの操作は元に戻せません。");
        if (confirmed) {
            elements.memoEditor.value = '';
        }
    },
    toggleClipboardStack() {
        state.isClipboardStackVisible = !state.isClipboardStackVisible;
        elements.clipboardStackArea.classList.toggle('hidden', !state.isClipboardStackVisible);
        if (state.isClipboardStackVisible) {
            elements.clipboardStackEditor.value = state.clipboardStackContent;
            elements.clipboardStackEditor.focus();
            elements.clipboardStackEditor.scrollTop = elements.clipboardStackEditor.scrollHeight;
        }
    },
    async copyClipboardStackText() {
        const stackText = elements.clipboardStackEditor.value;
        if (!stackText.trim()) {
            const originalText = elements.copyClipboardStackBtn.textContent;
            elements.copyClipboardStackBtn.textContent = "空です";
            elements.copyClipboardStackBtn.disabled = true;
            setTimeout(() => {
                elements.copyClipboardStackBtn.textContent = originalText;
                elements.copyClipboardStackBtn.disabled = false;
            }, 1500);
            return;
        }
        try {
            await navigator.clipboard.writeText(stackText);
            const originalText = elements.copyClipboardStackBtn.textContent;
            elements.copyClipboardStackBtn.textContent = "コピー完了";
            elements.copyClipboardStackBtn.disabled = true;
            setTimeout(() => { elements.copyClipboardStackBtn.textContent = originalText; elements.copyClipboardStackBtn.disabled = false; }, 1500);
        }
        catch (err) {
            const originalText = elements.copyClipboardStackBtn.textContent;
            elements.copyClipboardStackBtn.textContent = "コピー失敗";
            elements.copyClipboardStackBtn.disabled = true;
            setTimeout(() => { elements.copyClipboardStackBtn.textContent = originalText; elements.copyClipboardStackBtn.disabled = false; }, 2000);
        }
    },
    async pasteIntoClipboardStack() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "非対応";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 2000);
                return;
            }
            const textToPaste = await navigator.clipboard.readText();
            if (textToPaste) {
                const currentText = elements.clipboardStackEditor.value;
                const separator = currentText.length > 0 && !currentText.endsWith('\n\n') ? "\n\n" : "";
                elements.clipboardStackEditor.value += separator + textToPaste;
                elements.clipboardStackEditor.scrollTop = elements.clipboardStackEditor.scrollHeight;
                elements.clipboardStackEditor.focus();
                state.clipboardStackContent = elements.clipboardStackEditor.value;
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "貼付け完了";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 1500);
            }
            else {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "空です";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 1500);
            }
        }
        catch (err) {
            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "許可エラー";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 2000);
            }
            else {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "貼付け失敗";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 2000);
            }
        }
    },
    async confirmClearClipboardStack() {
        if (!elements.clipboardStackEditor.value.trim()) {
            const originalText = elements.deleteClipboardStackBtn.textContent;
            elements.deleteClipboardStackBtn.textContent = "空です";
            elements.deleteClipboardStackBtn.disabled = true;
            setTimeout(() => {
                elements.deleteClipboardStackBtn.textContent = originalText;
                elements.deleteClipboardStackBtn.disabled = false;
            }, 1500);
            return;
        }
        const confirmed = await uiUtils.showCustomConfirm("クリップボードスタックの内容を全てクリアしますか？");
        if (confirmed) {
            elements.clipboardStackEditor.value = '';
            state.clipboardStackContent = '';
        }
    },
    toggleTwinEngineSummary() {
        state.isTwinEngineSummaryVisible = !state.isTwinEngineSummaryVisible;
        elements.twinEngineSummaryArea.classList.toggle('hidden', !state.isTwinEngineSummaryVisible);
        if (state.isTwinEngineSummaryVisible) {
            elements.twinEngineSummaryEditor.value = state.twinEngineSummaryContent;
            uiUtils.updateTwinEngineApiKeyCycleButton();
            elements.twinEngineSummaryEditor.focus();
            elements.twinEngineSummaryEditor.scrollTop = elements.twinEngineSummaryEditor.scrollHeight;
        }
    },
    async copyTwinEngineSummaryText() {
        const summaryText = elements.twinEngineSummaryEditor.value;
        if (!summaryText.trim()) {
            const originalText = elements.copyTwinEngineSummaryBtn.textContent;
            elements.copyTwinEngineSummaryBtn.textContent = "空です";
            elements.copyTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => {
                elements.copyTwinEngineSummaryBtn.textContent = originalText;
                elements.copyTwinEngineSummaryBtn.disabled = false;
            }, 1500);
            return;
        }
        try {
            await navigator.clipboard.writeText(summaryText);
            const originalText = elements.copyTwinEngineSummaryBtn.textContent;
            elements.copyTwinEngineSummaryBtn.textContent = "コピー完了";
            elements.copyTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => { elements.copyTwinEngineSummaryBtn.textContent = originalText; elements.copyTwinEngineSummaryBtn.disabled = false; }, 1500);
        }
        catch (err) {
            const originalText = elements.copyTwinEngineSummaryBtn.textContent;
            elements.copyTwinEngineSummaryBtn.textContent = "コピー失敗";
            elements.copyTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => { elements.copyTwinEngineSummaryBtn.textContent = originalText; elements.copyTwinEngineSummaryBtn.disabled = false; }, 2000);
        }
    },
    async clearTwinEngineSummary() {
        if (!elements.twinEngineSummaryEditor.value.trim()) {
            const originalText = elements.clearTwinEngineSummaryBtn.textContent;
            elements.clearTwinEngineSummaryBtn.textContent = "空です";
            elements.clearTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => {
                elements.clearTwinEngineSummaryBtn.textContent = originalText;
                elements.clearTwinEngineSummaryBtn.disabled = false;
            }, 1500);
            return;
        }
        elements.twinEngineSummaryEditor.value = '';
        state.twinEngineSummaryContent = '';
    },
    async toggleTwinEngineMode() {
        if (!state.settings.showTwinEngineSettings)
            return;
        const newValue = !state.settings.twinEngineEnableFullAuto;
        state.settings.twinEngineEnableFullAuto = newValue;
        elements.twinEngineEnableFullAutoToggle.checked = newValue;
        uiUtils.updateTwinEngineModeButton();
        await this.saveSettings(false);
    },
    async cycleTwinEngineApiKey() {
        const configs = state.settings.twinEngineApiConfigs;
        if (configs.length <= 1) {
            return;
        }
        const currentId = state.settings.twinEngineActiveConfigId;
        const currentIndex = configs.findIndex(c => c.id === currentId);
        const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % configs.length;
        const nextConfig = configs[nextIndex];
        if (nextConfig) {
            state.settings.twinEngineActiveConfigId = nextConfig.id;
        }
        uiUtils.updateTwinEngineApiKeyCycleButton();
        elements.headerCycleApiKeyBtn.classList.toggle('hidden', !state.settings.showHeaderCycleApiKeyBtn);
        elements.footerCycleApiKeyBtn.classList.toggle('hidden', !state.settings.showFooterCycleApiKeyBtn);
        this.updateApiKeyCycleButtons();
        twinEngineApiConfigUtils.renderList();
        if (state.settings.autoSaveSettings) {
            await this.saveSettings(false);
        }
    },
    async summarizeCurrentSession(messagesToSummarize) {
        if (!messagesToSummarize || messagesToSummarize.length === 0) {
            return null;
        }
        try {
            const activeConfig = state.settings.twinEngineApiConfigs.find(c => c.id === state.settings.twinEngineActiveConfigId);
            if (!activeConfig || (activeConfig.provider !== 'dummy' && !activeConfig.apiKey)) {
                throw new Error("Twin-engine用のアクティブなAPI設定（とAPIキー）がありません。設定画面を確認してください。");
            }
            const { provider, apiKey, modelName } = activeConfig;
            const contextForSummary = {
                sessionId: null,
                messages: messagesToSummarize,
                systemPrompt: state.settings.twinEngineSummaryPrompt || '以下の会話を簡潔に要約してください。',
                inputText: '',
                attachments: [],
                apiProvider: provider,
                _apiKeyOverride: apiKey,
                _modelNameOverride: modelName,
                temperature: activeConfig.temperature,
                maxTokens: activeConfig.maxTokens,
                topK: activeConfig.topK,
                topP: activeConfig.topP,
                presencePenalty: activeConfig.presencePenalty,
                frequencyPenalty: activeConfig.frequencyPenalty,
                thinkingBudget: activeConfig.thinkingBudget,
                dummyUser: state.settings.twinEngineDummyUser,
                enableDummyUser: state.settings.twinEngineEnableDummyUser,
                dummyModel: state.settings.twinEngineDummyModel,
                enableDummyModel: state.settings.twinEngineEnableDummyModel,
                concatDummyModel: state.settings.twinEngineConcatDummyModel
            };
            const response = await this.handleSend(false, -1, contextForSummary);
            if (response && response.content) {
                if (state.settings.twinEngineConcatDummyModel && state.settings.twinEngineDummyModel) {
                    const prefix = state.settings.twinEngineDummyModel.trim();
                    response.content = `${prefix}\n\n${response.content}`;
                }
                return response;
            }
            return null;
        }
        catch (error) {
            await uiUtils.showCustomAlert(`要約処理中にエラーが発生しました: ${error.message}`);
            return null;
        }
    },
    async manualResummarize() {
        if (!state.settings.showTwinEngineSettings) {
            await uiUtils.showCustomAlert("Twin-engine機能が無効です。設定画面から有効にしてください。");
            return;
        }
        if (state.isSending || state.isAiToAiChatProcessing || state.isSummarizing) {
            await uiUtils.showCustomAlert("現在他の処理を実行中です。完了後に再試行してください。");
            return;
        }
        if (state.currentMessages.length === 0) {
            await uiUtils.showCustomAlert("要約対象のチャット履歴がありません。");
            return;
        }
        const buttonsToUpdate = [elements.resummarizeBtn, elements.footerResummarizeBtn];
        const originalPanelBtnText = elements.resummarizeBtn.textContent;
        state.isSummarizing = true;
        uiUtils.updateLoadingIndicator();
        buttonsToUpdate.forEach(btn => {
            btn.disabled = true;
            if (btn.id === 'resummarize-btn') {
                btn.textContent = "要約中...";
            }
        });
        try {
            const response = await this.summarizeCurrentSession([...state.currentMessages]);
            if (response && response.content) {
                const newSummaryContent = response.content.trim() + "\n\n";
                state.twinEngineSummaryContent = newSummaryContent;
                elements.twinEngineSummaryEditor.value = state.twinEngineSummaryContent;
                if (state.isTwinEngineSummaryVisible) {
                    elements.twinEngineSummaryEditor.scrollTop = 0;
                }
                elements.resummarizeBtn.textContent = "要約完了";
            }
            else {
                elements.resummarizeBtn.textContent = "失敗";
            }
        }
        catch (error) {
            await uiUtils.showCustomAlert(`再要約エラー: ${error.message}`);
            elements.resummarizeBtn.textContent = "エラー";
        }
        finally {
            state.isSummarizing = false;
            uiUtils.updateLoadingIndicator();
            buttonsToUpdate.forEach(btn => btn.disabled = false);
            setTimeout(() => {
                elements.resummarizeBtn.textContent = originalPanelBtnText;
            }, 2000);
        }
    },
    async triggerTwinEngineSummaryInBackground() {
        if (state.currentMessages.length === 0 || state.isSending || state.isAiToAiChatProcessing || state.isSummarizing) {
            return;
        }
        state.isSummarizing = true;
        uiUtils.updateLoadingIndicator();
        try {
            const response = await this.summarizeCurrentSession([...state.currentMessages]);
            if (response && response.content) {
                const newSummaryContent = response.content.trim() + "\n\n";
                state.twinEngineSummaryContent = newSummaryContent;
                elements.twinEngineSummaryEditor.value = state.twinEngineSummaryContent;
                if (state.isTwinEngineSummaryVisible) {
                    elements.twinEngineSummaryEditor.scrollTop = 0;
                }
            }
        }
        catch (error) {
        }
        finally {
            state.isSummarizing = false;
            uiUtils.updateLoadingIndicator();
        }
    },
    scrollToTop() {
        requestAnimationFrame(() => {
            const mainContent = elements.chatScreen.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
        });
    },
    scrollToBottom() {
        requestAnimationFrame(() => {
            const mainContent = elements.chatScreen.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = mainContent.scrollHeight;
            }
        });
    },
    async pasteToUserInput() {
        const button = elements.pasteToInputBtn;
        const originalTextContent = button.textContent;
        const originalTitle = button.title;
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                button.textContent = "!";
                button.title = "クリップボードAPI非対応";
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = originalTextContent;
                    button.title = originalTitle;
                    button.disabled = false;
                }, 2000);
                return;
            }
            const textToPaste = await navigator.clipboard.readText();
            if (textToPaste) {
                const currentText = elements.userInput.value;
                const selectionStart = elements.userInput.selectionStart;
                const selectionEnd = elements.userInput.selectionEnd;
                elements.userInput.value = currentText.substring(0, selectionStart) + textToPaste + currentText.substring(selectionEnd);
                elements.userInput.selectionStart = elements.userInput.selectionEnd = selectionStart + textToPaste.length;
                elements.userInput.focus();
                uiUtils.adjustTextareaHeight();
                uiUtils.updateAttachmentBadgeVisibility();
                button.textContent = "✓";
                button.title = "貼り付け完了";
                setTimeout(() => {
                    button.textContent = originalTextContent;
                    button.title = originalTitle;
                }, 1500);
            }
            else {
                button.textContent = "空";
                button.title = "クリップボードは空です";
                setTimeout(() => {
                    button.textContent = originalTextContent;
                    button.title = originalTitle;
                }, 1500);
            }
        }
        catch (err) {
            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                button.textContent = "!";
                button.title = "クリップボードの許可なし";
            }
            else {
                button.textContent = "X";
                button.title = "貼り付け失敗";
            }
            button.disabled = true;
            setTimeout(() => {
                button.textContent = originalTextContent;
                button.title = originalTitle;
                button.disabled = false;
            }, 2000);
        }
    },
    rollDiceAndInput() {
        let min = parseInt(state.settings.diceMinValue, 10);
        let max = parseInt(state.settings.diceMaxValue, 10);
        if (isNaN(min))
            min = DEFAULT_DICE_MIN_VALUE;
        if (isNaN(max))
            max = DEFAULT_DICE_MAX_VALUE;
        if (min > max) {
            [min, max] = [max, min];
        }
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        const currentText = elements.userInput.value;
        const selectionStart = elements.userInput.selectionStart;
        const selectionEnd = elements.userInput.selectionEnd;
        elements.userInput.value = currentText.substring(0, selectionStart) + randomNumber + currentText.substring(selectionEnd);
        elements.userInput.selectionStart = elements.userInput.selectionEnd = selectionStart + String(randomNumber).length;
        uiUtils.adjustTextareaHeight();
        uiUtils.updateAttachmentBadgeVisibility();
    },
    async confirmStartNewChat() {
        if (state.isSending) {
            const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して新規チャットを開始しますか？");
            if (!confirmed)
                return;
            this.abortRequest();
        }
        if (state.editingMessageIndex !== null) {
            const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して新規チャットを開始しますか？");
            if (!confirmed)
                return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して新規チャットを開始しますか？");
            if (!confirmedAttach)
                return;
            state.pendingAttachments = [];
            uiUtils.updateAttachmentBadgeVisibility();
        }
        if ((state.currentMessages.length > 0) && state.currentChatId) {
            try {
                await dbUtils.saveChat();
            }
            catch (error) {
                const conf = await uiUtils.showCustomConfirm("現在のチャットの保存に失敗しました。新規チャットを開始しますか？");
                if (!conf)
                    return;
            }
        }
        this.startNewChat();
        uiUtils.showScreen('chat');
    },
    startNewChat() {
        state.currentChatId = null;
        state.currentMessages = [];
        state.currentChatBaseUrl = null;
        if (state.settings.commonSystemPrompt && state.settings.commonSystemPrompt.trim() !== '') {
        }
        state.pendingAttachments = [];
        state.isMemoVisible = false;
        elements.memoArea.classList.add('hidden');
        elements.memoEditor.value = '';
        state.isClipboardStackVisible = false;
        elements.clipboardStackArea.classList.add('hidden');
        state.clipboardStackContent = '';
        state.isTwinEngineSummaryVisible = false;
        elements.twinEngineSummaryArea.classList.add('hidden');
        state.twinEngineSummaryContent = '';
        elements.twinEngineSummaryEditor.value = '';
        state.areAllMessagesHidden = false;
        uiUtils.updateToggleAllContentButton();
        state.messageCollapsedStates.clear();
        state.thoughtSummaryOpenStates.clear();
        uiUtils.renderChatMessages();
        uiUtils.updateChatTitle();
        elements.userInput.value = '';
        uiUtils.adjustTextareaHeight();
        uiUtils.setSendingState(false);
        uiUtils.updateAttachmentBadgeVisibility();
        if (state.settings.autoScrollOnNewMessage) {
            uiUtils.scrollToBottom();
        }
    },
    async loadChat(id) {
        let confirmedLoad = true;
        if (state.isSending) {
            if (!state.settings.disableLoadChatConfirmationWhileSending) {
                confirmedLoad = await uiUtils.showCustomConfirm("送信中です。中断して別のチャットを読み込みますか？");
            }
            if (!confirmedLoad)
                return;
            this.abortRequest();
        }
        if (state.editingMessageIndex !== null) {
            const confirmedEdit = await uiUtils.showCustomConfirm("編集中です。変更を破棄して別のチャットを読み込みますか？");
            if (!confirmedEdit)
                return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して別のチャットを読み込みますか？");
            if (!confirmedAttach)
                return;
            state.pendingAttachments = [];
            uiUtils.updateAttachmentBadgeVisibility();
        }
        try {
            const chat = await dbUtils.getChat(id);
            if (chat) {
                state.currentChatId = chat.id;
                state.currentMessages = chat.messages?.map(msg => ({
                    ...msg,
                    attachments: msg.attachments || [],
                    thoughtSummaryOpen: msg.thoughtSummaryOpen || false,
                })) || [];
                // チャットのメッセージを基にベースURLを更新
                this.updateChatBaseUrl(state.currentMessages);
                let needsSave = false;
                const groupIds = new Set(state.currentMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = state.currentMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        siblings[siblings.length - 1].isSelected = true;
                        needsSave = true;
                    }
                    else if (selected.length > 1) {
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                        needsSave = true;
                    }
                });
                state.pendingAttachments = [];
                state.areAllMessagesHidden = false;
                uiUtils.updateToggleAllContentButton();
                state.messageCollapsedStates.clear();
                state.thoughtSummaryOpenStates.clear();
                if (state.settings.persistMessageCollapseState && chat.collapsedStates) {
                    Object.entries(chat.collapsedStates).forEach(([idx, isCollapsed]) => {
                        state.messageCollapsedStates.set(parseInt(idx, 10), isCollapsed);
                    });
                }
                (chat.messages || []).forEach((msg, idx) => {
                    if (msg.thoughtSummaryOpen !== undefined) {
                        state.thoughtSummaryOpenStates.set(idx, msg.thoughtSummaryOpen);
                    }
                });
                uiUtils.renderChatMessages();
                uiUtils.updateChatTitle(chat.title);
                elements.userInput.value = '';
                uiUtils.adjustTextareaHeight();
                uiUtils.setSendingState(false);
                uiUtils.updateAttachmentBadgeVisibility();
                elements.memoEditor.value = '';
                if (state.settings.showTwinEngineSettings && state.settings.twinEngineEnableFullAuto) {
                    const userTurnCount = (chat.messages || []).filter(msg => msg.role === 'user').length;
                    const summarizeAfterTurns = state.settings.twinEngineSummarizeAfterTurns || 0;
                    if (userTurnCount > summarizeAfterTurns) {
                        setTimeout(() => this.triggerTwinEngineSummaryInBackground(), 500);
                    }
                }
                if (needsSave) {
                    await dbUtils.saveChat();
                }
                history.replaceState({ screen: 'chat' }, '', '#chat');
                state.currentScreen = 'chat';
                if (state.settings.autoScrollOnNewMessage && state.currentMessages.length > 0) {
                    uiUtils.scrollToBottom();
                }
            }
            else {
                await uiUtils.showCustomAlert("チャット履歴が見つかりませんでした。");
                this.startNewChat();
                uiUtils.showScreen('chat');
            }
        }
        catch (error) {
            await uiUtils.showCustomAlert(`チャットの読み込みエラー: ${error}`);
            this.startNewChat();
            uiUtils.showScreen('chat');
        }
    },
    async duplicateChat(id) {
        if (state.isSending) {
            const conf = await uiUtils.showCustomConfirm("送信中です。中断してチャットを複製しますか？");
            if (!conf)
                return;
            this.abortRequest();
        }
        if (state.editingMessageIndex !== null) {
            const conf = await uiUtils.showCustomConfirm("編集中です。変更を破棄してチャットを複製しますか？");
            if (!conf)
                return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        if ((state.currentMessages.length > 0) && state.currentChatId && state.currentChatId !== id) {
            try {
                await dbUtils.saveChat();
            }
            catch (error) {
                const conf = await uiUtils.showCustomConfirm("現在のチャット保存に失敗しました。複製を続行しますか？");
                if (!conf)
                    return;
            }
        }
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄してチャットを複製しますか？");
            if (!confirmedAttach)
                return;
            state.pendingAttachments = [];
        }
        try {
            const chat = await dbUtils.getChat(id);
            if (chat) {
                const originalTitle = chat.title || "無題のチャット";
                const newTitle = originalTitle.replace(new RegExp(DUPLICATE_SUFFIX.replace(/([().])/g, '\\$1') + '$'), '').trim() + DUPLICATE_SUFFIX;
                const groupIdMap = new Map();
                const duplicatedMessages = [];
                (chat.messages || []).forEach(msg => {
                    const newMsg = JSON.parse(JSON.stringify(msg));
                    newMsg.attachments = msg.attachments ? JSON.parse(JSON.stringify(msg.attachments)) : [];
                    newMsg.isCascaded = msg.isCascaded ?? false;
                    newMsg.isSelected = msg.isSelected ?? false;
                    newMsg.thoughtSummaryOpen = msg.thoughtSummaryOpen || false;
                    if (msg.siblingGroupId) {
                        if (!groupIdMap.has(msg.siblingGroupId)) {
                            groupIdMap.set(msg.siblingGroupId, `dup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
                        }
                        newMsg.siblingGroupId = groupIdMap.get(msg.siblingGroupId);
                    }
                    else {
                        delete newMsg.siblingGroupId;
                    }
                    duplicatedMessages.push(newMsg);
                });
                const newGroupIds = new Set(duplicatedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                newGroupIds.forEach(gid => {
                    const siblings = duplicatedMessages.filter(m => m.siblingGroupId === gid);
                    siblings.forEach((m, idx) => {
                        m.isSelected = (idx === siblings.length - 1);
                    });
                });
                const newChatData = {
                    messages: duplicatedMessages,
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                    title: newTitle
                };
                if (state.settings.persistMessageCollapseState && chat.collapsedStates) {
                    newChatData.collapsedStates = { ...chat.collapsedStates };
                }
                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData);
                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });
                if (state.currentScreen === 'history') {
                    uiUtils.renderHistoryList();
                }
                else {
                    await uiUtils.showCustomAlert(`チャット「${newTitle}」を複製しました。`);
                }
            }
            else {
                await uiUtils.showCustomAlert("複製元のチャットが見つかりません。");
            }
        }
        catch (error) {
            await uiUtils.showCustomAlert(`チャット複製エラー: ${error}`);
        }
    },
    async exportChat(chatId, chatTitle) {
        const confirmed = await uiUtils.showCustomConfirm(`チャット「${chatTitle || 'この履歴'}」をテキスト出力しますか？`);
        if (!confirmed)
            return;
        try {
            const chat = await dbUtils.getChat(chatId);
            if (!chat || ((!chat.messages || chat.messages.length === 0))) {
                await uiUtils.showCustomAlert("チャットデータが空です。");
                return;
            }
            let exportText = '';
            if (chat.messages) {
                chat.messages.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'model') {
                        let attributes = '';
                        if (msg.role === 'model') {
                            if (msg.isCascaded)
                                attributes += ' isCascaded';
                            if (msg.isSelected)
                                attributes += ' isSelected';
                            if (msg.thoughtSummaryOpen)
                                attributes += ' thoughtOpen';
                        }
                        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                            const fileNames = msg.attachments.map(a => a.name).join(';');
                            attributes += ` attachments="${fileNames.replace(/"/g, '"')}"`;
                        }
                        exportText += `<|#|${msg.role}|#|${attributes.trim()}>\n${msg.content}\n<|#|/${msg.role}|#|>\n\n`;
                    }
                });
            }
            const blob = new Blob([exportText.trim()], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeTitle = (chatTitle || `chat_${chatId}_export`).replace(/[<>:"/\\|?*\s]/g, '_');
            a.href = url;
            a.download = `${safeTitle}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            await uiUtils.showCustomAlert(`エクスポートエラー: ${error}`);
        }
    },
    async confirmDeleteCurrentSession() {
        if (!state.currentChatId && state.currentMessages.length === 0) {
            await uiUtils.showCustomAlert("削除するチャットがありません（新規チャット状態です）。");
            return;
        }
        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中です。完了後に再度お試しください。");
            return;
        }
        if (state.editingMessageIndex !== null) {
            await uiUtils.showCustomAlert("メッセージ編集中です。完了後に再度お試しください。");
            return;
        }
        const chatTitle = elements.chatTitle.textContent.startsWith("新規チャット") ? "このチャット" : `チャット「${elements.chatTitle.textContent.replace(/^: /, '')}」`;
        const confirmed = await uiUtils.showCustomConfirm(`${chatTitle}を完全に削除しますか？\nこの操作は元に戻せません。`);
        if (confirmed) {
            await this.deleteCurrentSession();
        }
    },
    async deleteCurrentSession() {
        try {
            if (state.currentChatId) {
                await dbUtils.deleteChat(state.currentChatId);
            }
            this.startNewChat();
            await uiUtils.showCustomAlert("チャットを削除しました。");
        }
        catch (error) {
            await uiUtils.showCustomAlert(`チャットの削除中にエラーが発生しました: ${error}`);
        }
    },
    async copyCurrentSessionText() {
        if (state.currentMessages.length === 0) {
            await uiUtils.showCustomAlert("コピーする内容がありません。");
            return;
        }
        let sessionText = "";
        state.currentMessages.forEach(msg => {
            if (msg.role === 'user') {
                sessionText += `あなた:\n`;
            }
            else if (msg.role === 'model') {
                sessionText += `モデル:\n`;
            }
            else if (msg.role === 'error') {
                sessionText += `エラー:\n`;
            }
            sessionText += `${msg.content}\n\n`;
            if (msg.attachments && msg.attachments.length > 0) {
                sessionText += `  [添付ファイル: ${msg.attachments.map(a => a.name).join(', ')}]\n\n`;
            }
        });
        try {
            await navigator.clipboard.writeText(sessionText.trim());
            const buttonElement = elements.copySessionBtn;
            const originalText = buttonElement.textContent;
            buttonElement.textContent = '✓';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 1500);
        }
        catch (err) {
            await uiUtils.showCustomAlert("クリップボードへのコピーに失敗しました。\nお使いのブラウザが対応していないか、セキュリティ設定が原因の可能性があります。");
            const buttonElement = elements.copySessionBtn;
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'コピー失敗';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 2000);
        }
    },
    async confirmDeleteChat(id, title) {
        const confirmed = await uiUtils.showCustomConfirm(`「${title || 'この履歴'}」を削除しますか？`);
        if (confirmed) {
            const isDeletingCurrent = state.currentChatId === id;
            const currentScreenBeforeDelete = state.currentScreen;
            try {
                await dbUtils.deleteChat(id);
                if (isDeletingCurrent) {
                    this.startNewChat();
                }
                if (currentScreenBeforeDelete === 'history') {
                    await uiUtils.renderHistoryList();
                    const listIsEmpty = elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').length === 0;
                    if (listIsEmpty) {
                        if (!isDeletingCurrent) {
                            this.startNewChat();
                        }
                    }
                }
            }
            catch (error) {
                await uiUtils.showCustomAlert(`チャット削除エラー: ${error}`);
                uiUtils.setSendingState(false);
            }
        }
    },
    async editHistoryTitle(chatId, titleElement) {
        const currentTitle = titleElement.textContent;
        const newTitle = await uiUtils.showCustomPrompt("新しいタイトル:", currentTitle);
        const trimmedTitle = (newTitle !== null) ? sanitizeText(newTitle, 100).trim() : '';
        if (newTitle !== '' && trimmedTitle !== '' && trimmedTitle !== currentTitle) {
            const finalTitle = trimmedTitle;
            try {
                await dbUtils.updateChatTitleDb(chatId, finalTitle);
                titleElement.textContent = finalTitle;
                titleElement.title = finalTitle;
                const dateElement = titleElement.closest('.history-item')?.querySelector('.updated-date');
                if (dateElement)
                    dateElement.textContent = `更新: ${uiUtils.formatDate(Date.now())}`;
                if (state.currentChatId === chatId) {
                    uiUtils.updateChatTitle(finalTitle);
                }
            }
            catch (error) {
                await uiUtils.showCustomAlert(`タイトル更新エラー: ${error}`);
            }
        }
    },
    async proofreadText(textToProofread) {
        console.log("--- 校正処理開始 ---");
        const activeConfigId = state.settings.activeProofreadingConfigId;
        const activeConfig = state.settings.proofreadingApiConfigs.find(c => c.id === activeConfigId);
        if (!activeConfig) {
            throw new Error("アクティブな校正設定が見つかりません。");
        }
        const { provider, apiKey: apiKeyForProofreading, modelName, systemPrompt, temperature, maxTokens, topK, topP, presencePenalty, frequencyPenalty, thinkingBudget } = activeConfig;
        if (provider !== 'dummy' && !apiKeyForProofreading) {
            throw new Error(`校正用の${provider} APIキーが設定されていません。`);
        }
        const contextForProofreading = {
            sessionId: null,
            messages: [],
            systemPrompt: systemPrompt || '校正してください。',
            inputText: textToProofread,
            attachments: [],
            apiProvider: provider,
            _apiKeyOverride: apiKeyForProofreading,
            _modelNameOverride: modelName,
            temperature, maxTokens, topK, topP,
            presencePenalty, frequencyPenalty, thinkingBudget,
        };
        try {
            const response = await this.handleSend(false, -1, contextForProofreading, false);
            if (response && response.content) {
                console.log("--- 校正処理成功 ---");
                return response.content;
            }
            else {
                throw new Error("校正APIから有効なコンテンツが返されませんでした。");
            }
        }
        catch (error) {
            console.error("校正処理中にエラーが発生:", error);
            throw error;
        }
    },
    async handleSend(isRetry = false, retryUserMessageIndex = -1, sourceSessionContext = null, isTopLevelCall = true, retryCount = 0) {
        if (!sourceSessionContext && isTopLevelCall) {
            await this.commitAllOpenEdits();
        }
        const isBackgroundProcess = !!sourceSessionContext;
        let apiKeyToUse, modelNameToUse, selectedApiProvider;
        if (isBackgroundProcess) {
            selectedApiProvider = sourceSessionContext.apiProvider;
            apiKeyToUse = sourceSessionContext._apiKeyOverride;
            modelNameToUse = sourceSessionContext._modelNameOverride;
        }
        else {
            selectedApiProvider = state.settings.apiProvider;
            if (selectedApiProvider === 'llmaggregator') {
                const activeBackend = multiBackendUtils.getActiveBackend();
                apiKeyToUse = multiBackendUtils.getActiveApiKeyForBackend(activeBackend);
            }
            else if (state.settings.showMultiApiKeys) {
                apiKeyToUse = multiApiKeyUtils.getActiveApiKey(selectedApiProvider);
            }
            else {
                switch (selectedApiProvider) {
                    case 'gemini':
                        apiKeyToUse = state.settings.apiKey;
                        break;
                    case 'deepseek':
                        apiKeyToUse = state.settings.deepSeekApiKey;
                        break;
                    case 'claude':
                        apiKeyToUse = state.settings.claudeApiKey;
                        break;
                    case 'openai':
                        apiKeyToUse = state.settings.openaiApiKey;
                        break;
                    case 'xai':
                        apiKeyToUse = state.settings.xaiApiKey;
                        break;
                    case 'llmaggregator':
                        apiKeyToUse = state.settings.llmAggregatorApiKey;
                        break;
                }
            }
            switch (selectedApiProvider) {
                case 'gemini':
                    modelNameToUse = state.settings.modelName;
                    break;
                case 'deepseek':
                    modelNameToUse = state.settings.deepSeekModelName;
                    break;
                case 'claude':
                    modelNameToUse = state.settings.claudeModelName;
                    break;
                case 'openai':
                    modelNameToUse = state.settings.openaiModelName;
                    break;
                case 'xai':
                    modelNameToUse = state.settings.xaiModelName;
                    break;
                case 'llmaggregator':
                    modelNameToUse = state.settings.llmAggregatorModelName;
                    break;
            }
        }
        let text = '';
        let attachmentsToSend = [];
        if (isBackgroundProcess) {
            text = sourceSessionContext.inputText || '';
            attachmentsToSend = sourceSessionContext.attachments ? [...sourceSessionContext.attachments] : [];
        }
        else if (isRetry) {
            const retryUserMessage = state.currentMessages[retryUserMessageIndex];
            if (!retryUserMessage || retryUserMessage.role !== 'user') {
                uiUtils.setSendingState(false);
                return;
            }
            text = retryUserMessage.content || '';
            attachmentsToSend = retryUserMessage.attachments ? [...retryUserMessage.attachments] : [];
        }
        else {
            text = elements.userInput.value.trim();
            attachmentsToSend = [...state.pendingAttachments];
        }
        if (!isBackgroundProcess) {
            const isInputEmpty = text.trim() === '';
            const hasAttachments = attachmentsToSend.length > 0;
            const isDummyProvider = selectedApiProvider === 'dummy';
            if (state.isSending) {
                return;
            }
            if (!isDummyProvider && isInputEmpty && !hasAttachments) {
                return;
            }
        }
        if (selectedApiProvider === 'dummy') {
            if (!isBackgroundProcess) {
                uiUtils.setSendingState(true);
                if (isRetry) {
                    if (retryUserMessageIndex + 1 < state.currentMessages.length) {
                        state.currentMessages.splice(retryUserMessageIndex + 1);
                    }
                    uiUtils.renderChatMessages(true);
                }
                else {
                    const userMessage = {
                        role: 'user', content: text, timestamp: Date.now(),
                        attachments: attachmentsToSend, generatedByApiProvider: null
                    };
                    state.currentMessages.push(userMessage);
                    const userMessageIndex = state.currentMessages.length - 1;
                    uiUtils.appendMessage(userMessage.role, userMessage.content, userMessageIndex, false, null, userMessage.attachments);
                    elements.userInput.value = '';
                    state.pendingAttachments = [];
                    uiUtils.adjustTextareaHeight();
                    uiUtils.updateAttachmentBadgeVisibility();
                }
                await dbUtils.saveChat();
                await sleep(300 + Math.random() * 400);
            }
            let dummyResponseContent = '';
            if (state.settings.dummyTwinEngineDebugMode && !isBackgroundProcess) {
                const userTurnCount = state.currentMessages.filter(msg => msg.role === 'user').length;
                const summarizeAfterTurns = state.settings.twinEngineSummarizeAfterTurns || 0;
                const isTwinEngineActive = state.settings.showTwinEngineSettings && userTurnCount > summarizeAfterTurns;
                let debugOutput = "--- Twin-engine デバッグモード ---\n\n";
                if (isTwinEngineActive) {
                    debugOutput += `Twin-engineはアクティブです。\n(現在のユーザーターン数: ${userTurnCount} / 閾値: ${summarizeAfterTurns})\n\n`;
                    const messagesToSummarize = [...state.currentMessages];
                    const summaryPrompt = state.settings.twinEngineSummaryPrompt || '以下の会話を簡潔に要約してください。';
                    debugOutput += "--- システムプロンプト (要約指示) ---\n";
                    debugOutput += `${summaryPrompt}\n\n`;
                    debugOutput += "--- 会話履歴 ---\n";
                    messagesToSummarize.forEach(msg => {
                        debugOutput += `[${msg.role}]\n${msg.content}\n`;
                        if (msg.attachments && msg.attachments.length > 0) {
                            debugOutput += `  (添付ファイル: ${msg.attachments.map(a => a.name).join(', ')})\n`;
                        }
                        debugOutput += "\n";
                    });
                    const twinEngineDummyUser = state.settings.twinEngineDummyUser;
                    const twinEngineEnableDummyUser = state.settings.twinEngineEnableDummyUser;
                    if (twinEngineEnableDummyUser && twinEngineDummyUser) {
                        debugOutput += "--- ダミーUserプロンプト (Twin-engine) ---\n";
                        debugOutput += `[user]\n${twinEngineDummyUser}\n\n`;
                    }
                    const twinEngineDummyModel = state.settings.twinEngineDummyModel;
                    const twinEngineEnableDummyModel = state.settings.twinEngineEnableDummyModel;
                    if (twinEngineEnableDummyModel && twinEngineDummyModel) {
                        debugOutput += "--- ダミーModelプロンプト (Twin-engine) ---\n";
                        debugOutput += `[model]\n${twinEngineDummyModel}\n\n`;
                    }
                    dummyResponseContent = debugOutput.trim();
                }
                else {
                    dummyResponseContent = `--- Twin-engine デバッグモード ---\n\nTwin-engineはまだ起動していません。\n(Twin-engine有効: ${state.settings.showTwinEngineSettings}, 現在のユーザーターン数: ${userTurnCount}, 閾値: ${summarizeAfterTurns})`;
                }
            }
            else {
                if (state.settings.dummyEnableDummyModel && state.settings.dummyDummyModel) {
                    dummyResponseContent += state.settings.dummyDummyModel;
                }
                if (state.settings.dummyErrorDebugMode) {
                    const errorLog = errorRecovery.getErrorLogAsString();
                    if (dummyResponseContent) {
                        dummyResponseContent += '\n\n';
                    }
                    dummyResponseContent += errorLog;
                }
            }
            if (isBackgroundProcess) {
                return { content: dummyResponseContent, metadata: { finishReason: 'stop' } };
            }
            const modelMessage = {
                role: 'model', content: dummyResponseContent, timestamp: Date.now(), generatedByApiProvider: 'dummy'
            };
            state.currentMessages.push(modelMessage);
            const modelMessageIndex = state.currentMessages.length - 1;
            uiUtils.appendMessage(modelMessage.role, modelMessage.content, modelMessageIndex);
            await dbUtils.saveChat();
            uiUtils.setSendingState(false);
            if (state.settings.autoScrollOnNewMessage)
                uiUtils.scrollToBottom();
            return;
        }
        let currentContextSessionId = isBackgroundProcess ? sourceSessionContext.sessionId : state.currentChatId;
        let currentContextMessages = isBackgroundProcess ? [...sourceSessionContext.messages] : [...state.currentMessages];
        let currentContextSystemPrompt = '';
        if (isBackgroundProcess) {
            currentContextSystemPrompt = sourceSessionContext.systemPrompt || '';
        }
        else {
            let individualPrompt = '';
            let commonPrompt = '';
            if (selectedApiProvider === 'gemini' && state.settings.geminiEnableSystemPromptDefault) {
                individualPrompt = state.settings.geminiSystemPrompt.trim();
            }
            else if (selectedApiProvider === 'deepseek' && state.settings.deepSeekEnableSystemPromptDefault) {
                individualPrompt = state.settings.deepSeekSystemPrompt.trim();
            }
            else if (selectedApiProvider === 'claude' && state.settings.claudeEnableSystemPromptDefault) {
                individualPrompt = state.settings.claudeSystemPrompt.trim();
            }
            else if (selectedApiProvider === 'openai' && state.settings.openaiEnableSystemPromptDefault) {
                individualPrompt = state.settings.openaiSystemPrompt.trim();
            }
            else if (selectedApiProvider === 'xai' && state.settings.xaiEnableSystemPromptDefault) {
                individualPrompt = state.settings.xaiSystemPrompt.trim();
            }
            else if (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorEnableSystemPromptDefault) {
                individualPrompt = state.settings.llmAggregatorSystemPrompt.trim();
            }
            if (state.settings.enableCommonSystemPromptDefault) {
                commonPrompt = state.settings.commonSystemPrompt.trim();
            }
            if (individualPrompt) {
                currentContextSystemPrompt = individualPrompt;
            }
            else if (commonPrompt) {
                currentContextSystemPrompt = commonPrompt;
            }
            else {
                currentContextSystemPrompt = '';
            }
        }
        let contextTemperature, contextMaxTokens, contextTopP, contextPresencePenalty, contextFrequencyPenalty, contextStreamingOutput, contextStreamingSpeed, contextDummyUser, contextEnableDummyUser, contextDummyModel, contextEnableDummyModel, contextConcatDummyModel;
        let contextGeminiTopK, contextGeminiThinkingBudget, contextGeminiIncludeThoughts, contextGeminiPseudoStreaming, contextGeminiEnableGrounding;
        let contextDeepSeekIncludeThoughts;
        let contextClaudeTopK, contextClaudeIncludeThoughts, contextClaudeThinkingBudget, contextClaudeExpandThoughtsByDefault;
        let contextXaiVisionEnable, contextXaiIncludeThoughts, contextXaiReasoningEffort;
        let contextLlmAggregatorTopK;
        if (isBackgroundProcess) {
            const providerForSettingsB = sourceSessionContext.apiProvider || state.settings.apiProvider;
            if (providerForSettingsB === 'gemini') {
                contextTemperature = sourceSessionContext.temperature ?? state.settings.geminiTemperature;
                contextMaxTokens = sourceSessionContext.maxTokens ?? state.settings.geminiMaxTokens;
                contextGeminiTopK = sourceSessionContext.topK ?? state.settings.geminiTopK;
                contextTopP = sourceSessionContext.topP ?? state.settings.geminiTopP;
                contextPresencePenalty = sourceSessionContext.presencePenalty ?? state.settings.geminiPresencePenalty;
                contextFrequencyPenalty = sourceSessionContext.frequencyPenalty ?? state.settings.geminiFrequencyPenalty;
                contextGeminiThinkingBudget = sourceSessionContext.thinkingBudget ?? state.settings.geminiThinkingBudget;
                contextGeminiIncludeThoughts = sourceSessionContext.includeThoughts ?? state.settings.geminiIncludeThoughts;
                contextStreamingOutput = sourceSessionContext.streamingOutput ?? state.settings.geminiStreamingOutput;
                contextStreamingSpeed = sourceSessionContext.streamingSpeed ?? state.settings.geminiStreamingSpeed;
                contextDummyUser = sourceSessionContext.dummyUser ?? state.settings.geminiDummyUser;
                contextEnableDummyUser = sourceSessionContext.enableDummyUser ?? state.settings.geminiEnableDummyUser;
                contextDummyModel = sourceSessionContext.dummyModel ?? state.settings.geminiDummyModel;
                contextEnableDummyModel = sourceSessionContext.enableDummyModel ?? state.settings.geminiEnableDummyModel;
                contextConcatDummyModel = sourceSessionContext.concatDummyModel ?? state.settings.geminiConcatDummyModel;
                contextGeminiPseudoStreaming = sourceSessionContext.pseudoStreaming ?? state.settings.geminiPseudoStreaming;
                contextGeminiEnableGrounding = sourceSessionContext.enableGrounding ?? state.settings.geminiEnableGrounding;
            }
            else if (providerForSettingsB === 'deepseek') {
                contextTemperature = sourceSessionContext.temperature ?? state.settings.deepSeekTemperature;
                contextMaxTokens = sourceSessionContext.maxTokens ?? state.settings.deepSeekMaxTokens;
                contextTopP = sourceSessionContext.topP ?? state.settings.deepSeekTopP;
                contextPresencePenalty = sourceSessionContext.presencePenalty ?? state.settings.deepSeekPresencePenalty;
                contextFrequencyPenalty = sourceSessionContext.frequencyPenalty ?? state.settings.deepSeekFrequencyPenalty;
                contextDeepSeekIncludeThoughts = sourceSessionContext.includeDeepSeekThoughts ?? state.settings.deepSeekIncludeDeepSeekThoughts;
                contextStreamingOutput = sourceSessionContext.streamingOutput ?? state.settings.deepSeekStreamingOutput;
                contextStreamingSpeed = sourceSessionContext.streamingSpeed ?? state.settings.deepSeekStreamingSpeed;
                contextDummyUser = sourceSessionContext.dummyUser ?? state.settings.deepSeekDummyUser;
                contextEnableDummyUser = sourceSessionContext.enableDummyUser ?? state.settings.deepSeekEnableDummyUser;
                contextDummyModel = sourceSessionContext.dummyModel ?? state.settings.deepSeekDummyModel;
                contextEnableDummyModel = sourceSessionContext.enableDummyModel ?? state.settings.deepSeekEnableDummyModel;
                contextConcatDummyModel = sourceSessionContext.concatDummyModel ?? state.settings.deepSeekConcatDummyModel;
            }
            else if (providerForSettingsB === 'llmaggregator') {
                contextTemperature = sourceSessionContext.temperature ?? state.settings.llmAggregatorTemperature;
                contextMaxTokens = sourceSessionContext.maxTokens ?? state.settings.llmAggregatorMaxTokens;
                contextTopP = sourceSessionContext.topP ?? state.settings.llmAggregatorTopP;
                contextLlmAggregatorTopK = sourceSessionContext.topK ?? state.settings.llmAggregatorTopK;
                contextDeepSeekIncludeThoughts = sourceSessionContext.includeThoughts ?? state.settings.llmAggregatorIncludeThoughts;
                contextStreamingOutput = sourceSessionContext.streamingOutput ?? state.settings.llmAggregatorStreamingOutput;
                contextStreamingSpeed = sourceSessionContext.streamingSpeed ?? state.settings.llmAggregatorStreamingSpeed;
                contextDummyUser = sourceSessionContext.dummyUser ?? state.settings.llmAggregatorDummyUser;
                contextEnableDummyUser = sourceSessionContext.enableDummyUser ?? state.settings.llmAggregatorEnableDummyUser;
                contextDummyModel = sourceSessionContext.dummyModel ?? state.settings.llmAggregatorDummyModel;
                contextEnableDummyModel = sourceSessionContext.enableDummyModel ?? state.settings.llmAggregatorEnableDummyModel;
                contextConcatDummyModel = sourceSessionContext.concatDummyModel ?? state.settings.llmAggregatorConcatDummyModel;
            }
            else if (providerForSettingsB === 'claude') {
                contextTemperature = sourceSessionContext.temperature ?? state.settings.claudeTemperature;
                contextMaxTokens = sourceSessionContext.maxTokens ?? state.settings.claudeMaxTokens;
                contextClaudeTopK = sourceSessionContext.topK ?? state.settings.claudeTopK;
                contextTopP = sourceSessionContext.topP ?? state.settings.claudeTopP;
                contextStreamingOutput = sourceSessionContext.streamingOutput ?? state.settings.claudeStreamingOutput;
                contextStreamingSpeed = sourceSessionContext.streamingSpeed ?? state.settings.claudeStreamingSpeed;
                contextDummyUser = sourceSessionContext.dummyUser ?? state.settings.claudeDummyUser;
                contextEnableDummyUser = sourceSessionContext.enableDummyUser ?? state.settings.claudeEnableDummyUser;
                contextDummyModel = sourceSessionContext.dummyModel ?? state.settings.claudeDummyModel;
                contextEnableDummyModel = sourceSessionContext.enableDummyModel ?? state.settings.claudeEnableDummyModel;
                contextConcatDummyModel = sourceSessionContext.concatDummyModel ?? state.settings.claudeConcatDummyModel;
                contextClaudeIncludeThoughts = sourceSessionContext.includeThoughts ?? state.settings.claudeIncludeThoughts;
                contextClaudeThinkingBudget = sourceSessionContext.thinkingBudget ?? state.settings.claudeThinkingBudget;
                contextClaudeExpandThoughtsByDefault = sourceSessionContext.expandThoughtsByDefault ?? state.settings.claudeExpandThoughtsByDefault;
            }
            else if (providerForSettingsB === 'openai') {
                contextTemperature = sourceSessionContext.temperature ?? state.settings.openaiTemperature;
                contextMaxTokens = sourceSessionContext.maxTokens ?? state.settings.openaiMaxTokens;
                contextTopP = sourceSessionContext.topP ?? state.settings.openaiTopP;
                contextPresencePenalty = sourceSessionContext.presencePenalty ?? state.settings.openaiPresencePenalty;
                contextFrequencyPenalty = sourceSessionContext.frequencyPenalty ?? state.settings.openaiFrequencyPenalty;
                contextStreamingOutput = sourceSessionContext.streamingOutput ?? state.settings.openaiStreamingOutput;
                contextStreamingSpeed = sourceSessionContext.streamingSpeed ?? state.settings.openaiStreamingSpeed;
                contextDummyUser = sourceSessionContext.dummyUser ?? state.settings.openaiDummyUser;
                enableDummyUserB = state.settings.openaiEnableDummyUser;
                contextDummyModel = sourceSessionContext.dummyModel ?? state.settings.openaiDummyModel;
                contextEnableDummyModel = sourceSessionContext.enableDummyModel ?? state.settings.openaiEnableDummyModel;
                contextConcatDummyModel = sourceSessionContext.concatDummyModel ?? state.settings.openaiConcatDummyModel;
            }
            else if (providerForSettingsB === 'xai') {
                contextTemperature = sourceSessionContext.temperature ?? state.settings.xaiTemperature;
                contextMaxTokens = sourceSessionContext.maxTokens ?? state.settings.xaiMaxTokens;
                contextTopP = sourceSessionContext.topP ?? state.settings.xaiTopP;
                contextPresencePenalty = sourceSessionContext.presencePenalty ?? state.settings.xaiPresencePenalty;
                contextFrequencyPenalty = sourceSessionContext.frequencyPenalty ?? state.settings.xaiFrequencyPenalty;
                contextStreamingOutput = sourceSessionContext.streamingOutput ?? state.settings.xaiStreamingOutput;
                contextStreamingSpeed = sourceSessionContext.streamingSpeed ?? state.settings.xaiStreamingSpeed;
                contextDummyUser = sourceSessionContext.dummyUser ?? state.settings.xaiDummyUser;
                contextEnableDummyUser = sourceSessionContext.enableDummyUser ?? state.settings.xaiEnableDummyUser;
                contextDummyModel = sourceSessionContext.dummyModel ?? state.settings.xaiDummyModel;
                contextEnableDummyModel = sourceSessionContext.enableDummyModel ?? state.settings.xaiEnableDummyModel;
                contextConcatDummyModel = sourceSessionContext.concatDummyModel ?? state.settings.xaiConcatDummyModel;
                contextXaiVisionEnable = sourceSessionContext.visionEnable ?? state.settings.xaiVisionEnable;
                contextXaiIncludeThoughts = sourceSessionContext.includeThoughts ?? state.settings.xaiIncludeThoughts;
                contextXaiReasoningEffort = sourceSessionContext.reasoningEffort ?? state.settings.xaiReasoningEffort;
            }
        }
        else {
            if (selectedApiProvider === 'gemini') {
                contextTemperature = state.settings.geminiTemperature;
                contextMaxTokens = state.settings.geminiMaxTokens;
                contextGeminiTopK = state.settings.geminiTopK;
                contextTopP = state.settings.geminiTopP;
                contextPresencePenalty = state.settings.geminiPresencePenalty;
                contextFrequencyPenalty = state.settings.geminiFrequencyPenalty;
                contextGeminiThinkingBudget = state.settings.geminiThinkingBudget;
                contextGeminiIncludeThoughts = state.settings.geminiIncludeThoughts;
                contextStreamingOutput = state.settings.geminiStreamingOutput;
                contextStreamingSpeed = state.settings.geminiStreamingSpeed;
                contextDummyUser = state.settings.geminiDummyUser;
                contextEnableDummyUser = state.settings.geminiEnableDummyUser;
                contextDummyModel = state.settings.geminiDummyModel;
                contextEnableDummyModel = state.settings.geminiEnableDummyModel;
                contextConcatDummyModel = state.settings.geminiConcatDummyModel;
                contextGeminiPseudoStreaming = state.settings.geminiPseudoStreaming;
                contextGeminiEnableGrounding = state.settings.geminiEnableGrounding;
            }
            else if (selectedApiProvider === 'deepseek') {
                contextTemperature = state.settings.deepSeekTemperature;
                contextMaxTokens = state.settings.deepSeekMaxTokens;
                contextTopP = state.settings.deepSeekTopP;
                contextPresencePenalty = state.settings.deepSeekPresencePenalty;
                contextFrequencyPenalty = state.settings.deepSeekFrequencyPenalty;
                contextDeepSeekIncludeThoughts = state.settings.deepSeekIncludeDeepSeekThoughts;
                contextStreamingOutput = state.settings.deepSeekStreamingOutput;
                contextStreamingSpeed = state.settings.deepSeekStreamingSpeed;
                contextDummyUser = state.settings.deepSeekDummyUser;
                contextEnableDummyUser = state.settings.deepSeekEnableDummyUser;
                contextDummyModel = state.settings.deepSeekDummyModel;
                contextEnableDummyModel = state.settings.deepSeekEnableDummyModel;
                contextConcatDummyModel = state.settings.deepSeekConcatDummyModel;
            }
            else if (selectedApiProvider === 'claude') {
                contextTemperature = state.settings.claudeTemperature;
                contextMaxTokens = state.settings.claudeMaxTokens;
                contextClaudeTopK = state.settings.claudeTopK;
                contextTopP = state.settings.claudeTopP;
                contextStreamingOutput = state.settings.claudeStreamingOutput;
                contextStreamingSpeed = state.settings.claudeStreamingSpeed;
                contextDummyUser = state.settings.claudeDummyUser;
                contextEnableDummyUser = state.settings.claudeEnableDummyUser;
                contextDummyModel = state.settings.claudeDummyModel;
                contextEnableDummyModel = state.settings.claudeEnableDummyModel;
                contextConcatDummyModel = state.settings.claudeConcatDummyModel;
                contextClaudeIncludeThoughts = state.settings.claudeIncludeThoughts;
                contextClaudeThinkingBudget = state.settings.claudeThinkingBudget;
                contextClaudeExpandThoughtsByDefault = state.settings.claudeExpandThoughtsByDefault;
            }
            else if (selectedApiProvider === 'openai') {
                contextTemperature = state.settings.openaiTemperature;
                contextMaxTokens = state.settings.openaiMaxTokens;
                contextTopP = state.settings.openaiTopP;
                contextPresencePenalty = state.settings.openaiPresencePenalty;
                contextFrequencyPenalty = state.settings.openaiFrequencyPenalty;
                contextStreamingOutput = state.settings.openaiStreamingOutput;
                contextStreamingSpeed = state.settings.openaiStreamingSpeed;
                contextDummyUser = state.settings.openaiDummyUser;
                contextEnableDummyUser = state.settings.openaiEnableDummyUser;
                contextDummyModel = state.settings.openaiDummyModel;
                contextEnableDummyModel = state.settings.openaiEnableDummyModel;
                contextConcatDummyModel = state.settings.openaiConcatDummyModel;
            }
            else if (selectedApiProvider === 'xai') {
                contextTemperature = state.settings.xaiTemperature;
                contextMaxTokens = state.settings.xaiMaxTokens;
                contextTopP = state.settings.xaiTopP;
                contextPresencePenalty = state.settings.xaiPresencePenalty;
                contextFrequencyPenalty = state.settings.xaiFrequencyPenalty;
                contextStreamingOutput = state.settings.xaiStreamingOutput;
                contextStreamingSpeed = state.settings.xaiStreamingSpeed;
                contextDummyUser = state.settings.xaiDummyUser;
                contextEnableDummyUser = state.settings.xaiEnableDummyUser;
                contextDummyModel = state.settings.xaiDummyModel;
                contextEnableDummyModel = state.settings.xaiEnableDummyModel;
                contextConcatDummyModel = state.settings.xaiConcatDummyModel;
                contextXaiVisionEnable = state.settings.xaiVisionEnable;
                contextXaiIncludeThoughts = state.settings.xaiIncludeThoughts;
                contextXaiReasoningEffort = state.settings.xaiReasoningEffort;
            }
            else if (selectedApiProvider === 'llmaggregator') {
                contextTemperature = state.settings.llmAggregatorTemperature;
                contextMaxTokens = state.settings.llmAggregatorMaxTokens;
                contextTopP = state.settings.llmAggregatorTopP;
                contextLlmAggregatorTopK = state.settings.llmAggregatorTopK;
                contextPresencePenalty = state.settings.llmAggregatorPresencePenalty;
                contextFrequencyPenalty = state.settings.llmAggregatorFrequencyPenalty;
                contextDeepSeekIncludeThoughts = state.settings.llmAggregatorIncludeThoughts;
                contextStreamingOutput = state.settings.llmAggregatorStreamingOutput;
                contextStreamingSpeed = state.settings.llmAggregatorStreamingSpeed;
                contextDummyUser = state.settings.llmAggregatorDummyUser;
                contextEnableDummyUser = state.settings.llmAggregatorEnableDummyUser;
                contextDummyModel = state.settings.llmAggregatorDummyModel;
                contextEnableDummyModel = state.settings.llmAggregatorEnableDummyModel;
                contextConcatDummyModel = state.settings.llmAggregatorConcatDummyModel;
            }
        }
        if (!apiKeyToUse && selectedApiProvider !== 'dummy') {
            if (!isBackgroundProcess) {
                await uiUtils.showCustomAlert(`${selectedApiProvider} APIキーが設定されていません。設定画面を開きます。`);
                uiUtils.showScreen('settings');
            }
            return "APIキー未設定";
        }
        if (selectedApiProvider === 'llmaggregator') {
            const activeBackend = multiBackendUtils.getActiveBackend();
            if (!activeBackend || !activeBackend.url) {
                if (!isBackgroundProcess) {
                    await uiUtils.showCustomAlert('アクティブなLLM Aggregatorバックエンドが設定されていません。');
                    uiUtils.showScreen('settings');
                }
                return "バックエンド未設定";
            }
            if (!isAllowedAggregatorDomain(activeBackend.url)) {
                if (!isBackgroundProcess) {
                    await uiUtils.showCustomAlert('LLM AggregatorのバックエンドURLがホワイトリスト外のため、送信できません。設定を確認してください。');
                    uiUtils.showScreen('settings');
                }
                return "不正なドメイン";
            }
        }
        if (!isBackgroundProcess && isTopLevelCall) {
            uiUtils.setSendingState(true);
        }
        state.partialStreamContent = '';
        state.partialThoughtStreamContent = '';
        let userMessageIndex = isRetry ? retryUserMessageIndex : -1;
        let existingSiblingGroupId = null;
        let firstResponseIndexForRetry = -1;
        let siblingGroupIdToUse = null;
        let messagesToProcess;
        if (!isBackgroundProcess && !isRetry) {
            const userMessage = {
                role: 'user', content: text, timestamp: Date.now(),
                attachments: attachmentsToSend,
                generatedByApiProvider: null
            };
            state.currentMessages.push(userMessage);
            userMessageIndex = state.currentMessages.length - 1;
            state.messageCollapsedStates.set(userMessageIndex, false);
            // これが最初のユーザーメッセージの場合、ベースURLを検出する
            if (state.currentMessages.filter(m => m.role === 'user').length === 1) {
                this.updateChatBaseUrl(state.currentMessages);
            }
            uiUtils.appendMessage(userMessage.role, userMessage.content, userMessageIndex, false, null, userMessage.attachments);
            elements.userInput.value = '';
            state.pendingAttachments = [];
            uiUtils.adjustTextareaHeight();
            uiUtils.updateAttachmentBadgeVisibility();
            if (state.settings.autoScrollOnNewMessage)
                uiUtils.scrollToBottom();
            currentContextMessages = [...state.currentMessages];
        }
        else if (isBackgroundProcess && !isRetry) {
            const userMessage = {
                role: 'user', content: text, timestamp: Date.now(),
                attachments: attachmentsToSend,
                generatedByApiProvider: null
            };
            currentContextMessages.push(userMessage);
            userMessageIndex = currentContextMessages.length - 1;
        }
        else if (isRetry) {
            let siblingStartIndex = userMessageIndex + 1;
            while (siblingStartIndex < currentContextMessages.length && currentContextMessages[siblingStartIndex].role !== 'model') {
                siblingStartIndex++;
            }
            if (siblingStartIndex < currentContextMessages.length && currentContextMessages[siblingStartIndex].role === 'model') {
                firstResponseIndexForRetry = siblingStartIndex;
                const firstResponse = currentContextMessages[firstResponseIndexForRetry];
                if (firstResponse.isCascaded && firstResponse.siblingGroupId) {
                    existingSiblingGroupId = firstResponse.siblingGroupId;
                    currentContextMessages.forEach(msg => {
                        if (msg.siblingGroupId === existingSiblingGroupId) {
                            msg.isSelected = false;
                        }
                    });
                    siblingGroupIdToUse = existingSiblingGroupId;
                }
            }
        }
        const userTurnCount = isBackgroundProcess
            ? (sourceSessionContext.messages || []).filter(msg => msg.role === 'user').length
            : state.currentMessages.filter(msg => msg.role === 'user').length;
        const summarizeAfterTurns = state.settings.twinEngineSummarizeAfterTurns || 0;
        const shouldUseSummary = state.settings.showTwinEngineSettings &&
            !isBackgroundProcess &&
            userTurnCount > summarizeAfterTurns &&
            state.twinEngineSummaryContent &&
            state.twinEngineSummaryContent.trim() !== '';
        if (shouldUseSummary) {
            messagesToProcess = [];
            const summaryContent = state.twinEngineSummaryContent.trim();
            const initialTurnsToInclude = state.settings.twinEngineInitialTurnsToInclude || 0;
            const includedMessageIndices = new Set();
            if (initialTurnsToInclude > 0) {
                let userMessagesCounted = 0;
                for (let i = 0; i < state.currentMessages.length; i++) {
                    const msg = state.currentMessages[i];
                    messagesToProcess.push(msg);
                    includedMessageIndices.add(i);
                    if (msg.role === 'user') {
                        userMessagesCounted++;
                    }
                    if (userMessagesCounted >= initialTurnsToInclude) {
                        if (i + 1 < state.currentMessages.length && state.currentMessages[i + 1].role === 'model') {
                            messagesToProcess.push(state.currentMessages[i + 1]);
                            includedMessageIndices.add(i + 1);
                        }
                        break;
                    }
                }
            }
            if (summaryContent) {
                messagesToProcess.push({
                    role: 'user',
                    content: 'これまでの会話の要約は以下の通りです。この文脈を踏まえて、次の応答を生成してください。',
                    timestamp: Date.now() - 2,
                    attachments: [],
                });
                messagesToProcess.push({
                    role: 'model',
                    content: `承知いたしました。以下の要約を基に会話を継続します。\n\n---\n${summaryContent}\n---`,
                    timestamp: Date.now() - 1,
                });
            }
            const lastUserMessageIndex = currentContextMessages.map(m => m.role).lastIndexOf('user');
            if (lastUserMessageIndex !== -1 && !includedMessageIndices.has(lastUserMessageIndex)) {
                messagesToProcess.push(currentContextMessages[lastUserMessageIndex]);
            }
        }
        else {
            messagesToProcess = isRetry
                ? currentContextMessages.slice(0, userMessageIndex + 1)
                : [...currentContextMessages];
        }
        if (!isBackgroundProcess) {
            try {
                let titleToSave = null;
                let isNewChatForDBSave = !currentContextSessionId;
                let existingChatForDBSave = null;
                if (currentContextSessionId) {
                    existingChatForDBSave = await dbUtils.getChat(currentContextSessionId);
                    if (existingChatForDBSave) {
                        titleToSave = existingChatForDBSave.title;
                        isNewChatForDBSave = false;
                    }
                    else {
                        isNewChatForDBSave = true;
                        currentContextSessionId = null;
                        state.currentChatId = null;
                    }
                }
                if (isNewChatForDBSave || !titleToSave) {
                    const firstUserMsg = currentContextMessages.find(m => m.role === 'user');
                    titleToSave = firstUserMsg ? firstUserMsg.content.substring(0, 50) : "無題のチャット";
                }
                const chatToSave = {
                    messages: currentContextMessages.map(msg => ({
                        role: msg.role, content: msg.content, timestamp: msg.timestamp,
                        thoughtSummary: msg.thoughtSummary || null,
                        deepSeekThoughtSummary: msg.deepSeekThoughtSummary || null,
                        xaiThoughtSummary: msg.xaiThoughtSummary || null,
                        generatedByApiProvider: msg.generatedByApiProvider || null,
                        ...(msg.finishReason && { finishReason: msg.finishReason }),
                        ...(msg.safetyRatings && { safetyRatings: msg.safetyRatings }),
                        ...(msg.error && { error: msg.error }),
                        ...(msg.isCascaded !== undefined && { isCascaded: msg.isCascaded }),
                        ...(msg.isSelected !== undefined && { isSelected: msg.isSelected }),
                        ...(msg.siblingGroupId !== undefined && { siblingGroupId: msg.siblingGroupId }),
                        ...(msg.groundingMetadata && { groundingMetadata: msg.groundingMetadata }),
                        ...(msg.attachments && msg.attachments.length > 0 && { attachments: msg.attachments.map(att => ({ name: att.name, mimeType: att.mimeType, textData: att.textData })) }),
                        ...(msg.usageMetadata && { usageMetadata: msg.usageMetadata }),
                        ...(msg.thoughtSummaryOpen !== undefined && { thoughtSummaryOpen: msg.thoughtSummaryOpen }),
                    })),
                    updatedAt: Date.now(),
                    title: titleToSave
                };
                if (isNewChatForDBSave) {
                    chatToSave.createdAt = Date.now();
                }
                else if (existingChatForDBSave) {
                    chatToSave.id = currentContextSessionId;
                    chatToSave.createdAt = existingChatForDBSave.createdAt;
                }
                if (state.settings.persistMessageCollapseState) {
                    chatToSave.collapsedStates = Object.fromEntries(state.messageCollapsedStates);
                }
                const savedId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = chatToSave.id ? store.put(chatToSave) : store.add(chatToSave);
                    request.onsuccess = (event) => resolve(event.target.result || chatToSave.id);
                    request.onerror = (event) => reject(`チャット保存エラー: ${event.target.error.name} - ${event.target.error.message}`);
                });
                if (!state.currentChatId && savedId) {
                    state.currentChatId = savedId;
                    uiUtils.updateChatTitle(chatToSave.title);
                }
            }
            catch (error) {
                if (currentContextSessionId) {
                    uiUtils.displayError("チャットの保存に失敗しましたが、送信を試みます。", false);
                }
            }
        }
        const apiMessages = messagesToProcess
            .filter(msg => {
            if (msg.role === 'user')
                return true;
            if (msg.role === 'model')
                return !msg.isCascaded || (msg.isCascaded && msg.isSelected);
            return false;
        })
            .map(msg => {
            const parts = [];
            if (msg.content && msg.content.trim() !== '') {
                parts.push({ text: msg.content });
            }
            if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach(att => {
                    if (att.textData) {
                        parts.push({ text: att.textData });
                    }
                    else if (att.base64Data) {
                        parts.push({
                            inlineData: {
                                mimeType: att.mimeType,
                                data: att.base64Data
                            }
                        });
                    }
                });
            }
            return { role: msg.role, parts: parts.length > 0 ? parts : [{ text: '' }] };
        });
        const dummyUserTextToUse = contextEnableDummyUser && contextDummyUser?.trim() ? contextDummyUser.trim() : null;
        const dummyModelTextToUse = contextEnableDummyModel && contextDummyModel?.trim() ? contextDummyModel.trim() : null;
        if (dummyUserTextToUse)
            apiMessages.push({ role: 'user', parts: [{ text: dummyUserTextToUse }] });
        if (dummyModelTextToUse)
            apiMessages.push({ role: 'model', parts: [{ text: dummyModelTextToUse }] });
        const commonGenerationConfig = {};
        if (contextTemperature !== null)
            commonGenerationConfig.temperature = contextTemperature;
        if (contextMaxTokens !== null)
            commonGenerationConfig.maxOutputTokens = contextMaxTokens;
        if (contextTopP !== null)
            commonGenerationConfig.topP = contextTopP;
        if (contextPresencePenalty !== null)
            commonGenerationConfig.presencePenalty = contextPresencePenalty;
        if (contextFrequencyPenalty !== null)
            commonGenerationConfig.frequencyPenalty = contextFrequencyPenalty;
        if (selectedApiProvider === 'gemini') {
            if (contextGeminiTopK !== null)
                commonGenerationConfig.topK = contextGeminiTopK;
            if (contextGeminiThinkingBudget !== null || contextGeminiIncludeThoughts) {
                commonGenerationConfig.thinkingConfig = commonGenerationConfig.thinkingConfig || {};
                if (contextGeminiThinkingBudget !== null && Number.isInteger(contextGeminiThinkingBudget) && contextGeminiThinkingBudget >= 0) {
                    commonGenerationConfig.thinkingConfig.thinkingBudget = contextGeminiThinkingBudget;
                }
                if (contextGeminiIncludeThoughts) {
                    commonGenerationConfig.thinkingConfig.includeThoughts = true;
                }
                if (Object.keys(commonGenerationConfig.thinkingConfig).length === 0)
                    delete commonGenerationConfig.thinkingConfig;
            }
        }
        else if (selectedApiProvider === 'claude') {
            if (contextClaudeTopK !== null)
                commonGenerationConfig.topK = contextClaudeTopK;
            if (contextClaudeIncludeThoughts) {
                commonGenerationConfig.thinkingConfig = { "type": "enabled" };
                if (contextClaudeThinkingBudget !== null && Number.isInteger(contextClaudeThinkingBudget) && contextClaudeThinkingBudget >= 1024) {
                    commonGenerationConfig.thinkingConfig.budget_tokens = contextClaudeThinkingBudget;
                }
            }
        }
        else if (selectedApiProvider === 'llmaggregator') {
            if (contextLlmAggregatorTopK !== null)
                commonGenerationConfig.topK = contextLlmAggregatorTopK;
        }
        let systemInstructionForProvider = null;
        const systemPromptTextToUseForApi = currentContextSystemPrompt?.trim() ? currentContextSystemPrompt.trim() : null;
        if (systemPromptTextToUseForApi) {
            if (selectedApiProvider === 'gemini') {
                systemInstructionForProvider = { role: "system", parts: [{ text: systemPromptTextToUseForApi }] };
            }
            else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'claude' || selectedApiProvider === 'openai' || selectedApiProvider === 'xai' || selectedApiProvider === 'llmaggregator') {
                systemInstructionForProvider = { content: systemPromptTextToUseForApi, parts: [{ text: systemPromptTextToUseForApi }] };
            }
        }
        let modelResponseRawContent = '';
        let modelThoughtSummaryContent = '';
        let modelResponseMetadata = {};
        let currentGroundingMetadata = null;
        let finalUsageMetadataFromStream = null;
        let useStreamingForThisCall = isBackgroundProcess ? false : contextStreamingOutput;
        let usePseudoForThisCall = isBackgroundProcess ? false : (selectedApiProvider === 'gemini' && contextGeminiPseudoStreaming);
        let modelMessageObjectForStream = null;
        try {
            let apiResponseObject;
            if (selectedApiProvider === 'gemini') {
                apiResponseObject = await apiUtils.callGeminiApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, usePseudoForThisCall, contextGeminiEnableGrounding);
            }
            else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                apiResponseObject = await apiUtils.callDeepSeekApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, selectedApiProvider);
            }
            else if (selectedApiProvider === 'claude') {
                apiResponseObject = await apiUtils.callClaudeApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall);
            }
            else if (selectedApiProvider === 'openai') {
                const hasImage = apiMessages.some(m => m.parts.some(p => p.inlineData && p.inlineData.mimeType.startsWith('image/')));
                apiResponseObject = await apiUtils.callOpenAICompatibleApi(apiKeyToUse, modelNameToUse, 'openai', apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, hasImage);
            }
            else if (selectedApiProvider === 'xai') {
                const hasImage = apiMessages.some(m => m.parts.some(p => p.inlineData && p.inlineData.mimeType.startsWith('image/')));
                const enableVisionForThisCall = contextXaiVisionEnable || hasImage;
                apiResponseObject = await apiUtils.callXaiApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, enableVisionForThisCall);
            }
            else {
                throw new Error("不明なAPIプロバイダーが選択されています。");
            }
            const dummyModelPrefix = (contextConcatDummyModel && dummyModelTextToUse) ? dummyModelTextToUse : '';
            if (!isBackgroundProcess) {
                state.partialStreamContent = dummyModelPrefix;
                state.partialThoughtStreamContent = '';
            }
            if (useStreamingForThisCall && !isBackgroundProcess) {
                const tempPlaceholderIndex = state.currentMessages.length;
                modelMessageObjectForStream = {
                    role: 'model',
                    content: '',
                    thoughtSummary: null,
                    deepSeekThoughtSummary: null,
                    xaiThoughtSummary: null,
                    timestamp: Date.now(),
                    generatedByApiProvider: selectedApiProvider,
                    thoughtSummaryOpen: (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts && state.settings.geminiExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'deepseek' && contextDeepSeekIncludeThoughts && state.settings.deepSeekExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts && state.settings.claudeExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'xai' && contextXaiIncludeThoughts && state.settings.xaiExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorIncludeThoughts && state.settings.llmAggregatorExpandThoughtsByDefault),
                };
                if (isRetry && firstResponseIndexForRetry !== -1) {
                    if (siblingGroupIdToUse === null) {
                        siblingGroupIdToUse = `gid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                    }
                    modelMessageObjectForStream.isCascaded = true;
                    modelMessageObjectForStream.siblingGroupId = siblingGroupIdToUse;
                    modelMessageObjectForStream.isSelected = true;
                    if (state.currentMessages[firstResponseIndexForRetry] && !state.currentMessages[firstResponseIndexForRetry].isCascaded) {
                        state.currentMessages[firstResponseIndexForRetry].isCascaded = true;
                        state.currentMessages[firstResponseIndexForRetry].siblingGroupId = siblingGroupIdToUse;
                        state.currentMessages[firstResponseIndexForRetry].isSelected = false;
                    }
                }
                state.currentMessages.push(modelMessageObjectForStream);
                state.messageCollapsedStates.set(tempPlaceholderIndex, false);
                uiUtils.appendMessage('model', modelMessageObjectForStream.content, tempPlaceholderIndex, true);
            }
            if (useStreamingForThisCall) {
                let responseStreamIterator;
                if (selectedApiProvider === 'gemini') {
                    responseStreamIterator = apiUtils.handleGeminiStreamingResponse(apiResponseObject);
                }
                else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                    responseStreamIterator = apiUtils.handleDeepSeekStreamingResponse(apiResponseObject);
                }
                else if (selectedApiProvider === 'claude') {
                    responseStreamIterator = apiUtils.handleClaudeStreamingResponse(apiResponseObject);
                }
                else if (selectedApiProvider === 'openai') {
                    responseStreamIterator = apiUtils.handleOpenAICompatibleStreamingResponse(apiResponseObject, 'openai');
                }
                else if (selectedApiProvider === 'xai') {
                    responseStreamIterator = apiUtils.handleOpenAICompatibleStreamingResponse(apiResponseObject, 'xai');
                }
                const currentContextStreamSpeed = selectedApiProvider === 'gemini' ? contextStreamingSpeed :
                    selectedApiProvider === 'deepseek' ? state.settings.deepSeekStreamingSpeed :
                        selectedApiProvider === 'claude' ? state.settings.claudeStreamingSpeed :
                            selectedApiProvider === 'xai' ? state.settings.xaiStreamingSpeed :
                                selectedApiProvider === 'llmaggregator' ? state.settings.llmAggregatorStreamingSpeed :
                                    state.settings.openaiStreamingSpeed;
                const messageIndexForDisplay = isBackgroundProcess ? -1 : (modelMessageObjectForStream ? state.currentMessages.indexOf(modelMessageObjectForStream) : -1);
                for await (const streamData of responseStreamIterator) {
                    if (state.abortController?.signal.aborted) {
                        modelResponseMetadata.finishReason = 'ABORTED';
                        throw new Error("リクエストがキャンセルされました。");
                    }
                    if (streamData.type === 'chunk') {
                        if (streamData.thoughtText) {
                            if (isBackgroundProcess) {
                                modelThoughtSummaryContent += streamData.thoughtText;
                            }
                            else {
                                for (const char of streamData.thoughtText) {
                                    if (state.abortController?.signal.aborted)
                                        break;
                                    state.partialThoughtStreamContent += char;
                                    uiUtils.updateStreamingMessage(messageIndexForDisplay, char, true);
                                    if (currentContextStreamSpeed > 0)
                                        await sleep(currentContextStreamSpeed);
                                }
                            }
                        }
                        if (streamData.contentText) {
                            if (isBackgroundProcess) {
                                modelResponseRawContent += streamData.contentText;
                            }
                            else {
                                for (const char of streamData.contentText) {
                                    if (state.abortController?.signal.aborted)
                                        break;
                                    state.partialStreamContent += char;
                                    uiUtils.updateStreamingMessage(messageIndexForDisplay, char, false);
                                    if (currentContextStreamSpeed > 0)
                                        await sleep(currentContextStreamSpeed);
                                }
                            }
                        }
                        if (state.abortController?.signal.aborted) {
                            modelResponseMetadata.finishReason = 'ABORTED';
                            throw new Error("リクエストがキャンセルされました。");
                        }
                        if (streamData.groundingMetadata && selectedApiProvider === 'gemini') {
                            currentGroundingMetadata = streamData.groundingMetadata;
                            if (!isBackgroundProcess && modelMessageObjectForStream && state.currentMessages.includes(modelMessageObjectForStream)) {
                                const msgIndexForGrounding = state.currentMessages.indexOf(modelMessageObjectForStream);
                                if (state.currentMessages[msgIndexForGrounding]) {
                                    state.currentMessages[msgIndexForGrounding].groundingMetadata = currentGroundingMetadata;
                                }
                            }
                        }
                        if (streamData.usageMetadata)
                            finalUsageMetadataFromStream = streamData.usageMetadata;
                    }
                    else if (streamData.type === 'metadata') {
                        modelResponseMetadata = {
                            finishReason: streamData.finishReason,
                            safetyRatings: streamData.safetyRatings,
                        };
                        if (selectedApiProvider === 'gemini') {
                            if (streamData.groundingMetadata)
                                currentGroundingMetadata = streamData.groundingMetadata;
                            if (streamData.usageMetadata)
                                finalUsageMetadataFromStream = streamData.usageMetadata;
                        }
                        else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                            if (streamData.fullReasoningContent && contextDeepSeekIncludeThoughts) {
                                modelThoughtSummaryContent = streamData.fullReasoningContent;
                            }
                            if (streamData.usageMetadata)
                                finalUsageMetadataFromStream = streamData.usageMetadata;
                        }
                        else if (selectedApiProvider === 'claude' || selectedApiProvider === 'openai' || selectedApiProvider === 'xai') {
                            if (streamData.usageMetadata)
                                finalUsageMetadataFromStream = streamData.usageMetadata;
                        }
                        break;
                    }
                    else if (streamData.type === 'error') {
                        modelResponseMetadata.finishReason = 'ERROR';
                        modelResponseMetadata.error = streamData.error;
                        throw new Error(streamData.message || "ストリーム内でエラーが発生しました。");
                    }
                }
                if (!isBackgroundProcess) {
                    modelThoughtSummaryContent = state.partialThoughtStreamContent;
                    modelResponseRawContent = state.partialStreamContent;
                }
                let finalContent = modelResponseRawContent;
                const finishReason = modelResponseMetadata.finishReason;
                const isRetryableFinishReason = ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'OTHER'].includes(finishReason);
                if (!isBackgroundProcess && state.settings.showProofreadingSettings && state.settings.enableProofreading && finalContent && !isRetryableFinishReason && finishReason !== 'ERROR' && finishReason !== 'ABORTED') {
                    if (useStreamingForThisCall && modelMessageObjectForStream) {
                        const tempMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                        if (tempMessageIndex !== -1) {
                            const msgToUpdate = state.currentMessages[tempMessageIndex];
                            msgToUpdate.content = finalContent;
                            msgToUpdate.timestamp = Date.now();
                            msgToUpdate.finishReason = modelResponseMetadata.finishReason;
                            msgToUpdate.safetyRatings = modelResponseMetadata.safetyRatings;
                            msgToUpdate.usageMetadata = finalUsageMetadataFromStream;
                            uiUtils.finalizeStreamingMessage(tempMessageIndex);
                            await dbUtils.saveChat();
                        }
                    }
                    try {
                        state.isProofreading = true;
                        uiUtils.updateLoadingIndicator();
                        const proofreadContent = await this.proofreadText(finalContent);
                        finalContent = proofreadContent; // finalContentを校正済みのものに更新
                        if (modelMessageObjectForStream) {
                            const finalModelMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                            if (finalModelMessageIndex !== -1) {
                                state.currentMessages[finalModelMessageIndex].content = finalContent;
                                uiUtils.updateFinalizedMessageContent(finalModelMessageIndex, finalContent);
                                await dbUtils.saveChat(); // DBも更新
                            }
                        }
                    }
                    catch (proofreadError) {
                        console.error("校正処理中にエラーが発生しました:", proofreadError);
                        const errorMessage = `\n\n[校正処理に失敗しました: ${proofreadError.message}]`;
                        finalContent += errorMessage;
                        if (modelMessageObjectForStream) {
                            const finalModelMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                            if (finalModelMessageIndex !== -1) {
                                state.currentMessages[finalModelMessageIndex].content = finalContent;
                                uiUtils.updateFinalizedMessageContent(finalModelMessageIndex, finalContent);
                                await dbUtils.saveChat();
                            }
                        }
                    }
                    finally {
                        state.isProofreading = false;
                        uiUtils.updateLoadingIndicator();
                    }
                }
                if (finalContent || modelThoughtSummaryContent || modelResponseMetadata.finishReason) {
                    if (useStreamingForThisCall && modelMessageObjectForStream) {
                        const finalModelMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                        if (finalModelMessageIndex !== -1) {
                            const msgToUpdate = state.currentMessages[finalModelMessageIndex];
                            msgToUpdate.content = finalContent;
                            msgToUpdate.timestamp = Date.now();
                            msgToUpdate.finishReason = modelResponseMetadata.finishReason;
                            msgToUpdate.safetyRatings = modelResponseMetadata.safetyRatings;
                            msgToUpdate.usageMetadata = finalUsageMetadataFromStream;
                            if (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts) {
                                if (modelThoughtSummaryContent) {
                                    msgToUpdate.thoughtSummary = modelThoughtSummaryContent;
                                }
                                msgToUpdate.groundingMetadata = currentGroundingMetadata;
                            }
                            else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts && modelThoughtSummaryContent) {
                                msgToUpdate.deepSeekThoughtSummary = modelThoughtSummaryContent || null;
                            }
                            else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts && modelThoughtSummaryContent) {
                                msgToUpdate.thoughtSummary = modelThoughtSummaryContent || null;
                            }
                            else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts && modelThoughtSummaryContent) {
                                msgToUpdate.xaiThoughtSummary = modelThoughtSummaryContent || null;
                            }
                            uiUtils.finalizeStreamingMessage(finalModelMessageIndex);
                            await dbUtils.saveChat();
                        }
                    }
                    else {
                        const newModelMessage = {
                            role: 'model', content: finalContent,
                            timestamp: Date.now(),
                            ...modelResponseMetadata,
                            usageMetadata: finalUsageMetadataFromStream,
                            generatedByApiProvider: selectedApiProvider
                        };
                        if (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts) {
                            newModelMessage.thoughtSummary = modelThoughtSummaryContent || null;
                            newModelMessage.groundingMetadata = currentGroundingMetadata;
                        }
                        else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts && modelThoughtSummaryContent) {
                            newModelMessage.deepSeekThoughtSummary = modelThoughtSummaryContent || null;
                        }
                        else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts && modelThoughtSummaryContent) {
                            newModelMessage.thoughtSummary = modelThoughtSummaryContent || null;
                        }
                        else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts && modelThoughtSummaryContent) {
                            newModelMessage.xaiThoughtSummary = modelThoughtSummaryContent || null;
                        }
                        newModelMessage.thoughtSummaryOpen = (selectedApiProvider === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                            (selectedApiProvider === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                            (selectedApiProvider === 'claude' && state.settings.claudeExpandThoughtsByDefault) ||
                            (selectedApiProvider === 'xai' && state.settings.xaiExpandThoughtsByDefault) ||
                            (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorExpandThoughtsByDefault);
                        const targetUserIndexForCascade = userMessageIndex;
                        if (targetUserIndexForCascade !== -1 && !isBackgroundProcess) {
                            if (siblingGroupIdToUse === null) {
                                siblingGroupIdToUse = `gid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                            }
                            newModelMessage.isCascaded = true;
                            newModelMessage.isSelected = true;
                            newModelMessage.siblingGroupId = siblingGroupIdToUse;
                            if (isRetry && firstResponseIndexForRetry !== -1 && state.currentMessages[firstResponseIndexForRetry] && !state.currentMessages[firstResponseIndexForRetry].isCascaded) {
                                state.currentMessages[firstResponseIndexForRetry].isCascaded = true;
                                state.currentMessages[firstResponseIndexForRetry].siblingGroupId = siblingGroupIdToUse;
                            }
                        }
                        const newModelIndex = state.currentMessages.length;
                        state.currentMessages.push(newModelMessage);
                        state.messageCollapsedStates.set(newModelIndex, false);
                        state.thoughtSummaryOpenStates.set(newModelIndex, newModelMessage.thoughtSummaryOpen);
                        uiUtils.renderChatMessages();
                        await dbUtils.saveChat();
                    }
                }
                else {
                    if (useStreamingForThisCall && !isBackgroundProcess && modelMessageObjectForStream) {
                        const tempPlaceholderIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                        const placeholderElement = document.getElementById(`streaming-message-${tempPlaceholderIndex}`);
                        if (placeholderElement)
                            placeholderElement.remove();
                        if (tempPlaceholderIndex !== -1)
                            state.currentMessages.splice(tempPlaceholderIndex, 1);
                    }
                }
                if (!isBackgroundProcess) {
                    const currentUserTurnCountAfterSend = state.currentMessages.filter(msg => msg.role === 'user').length;
                    const currentSummarizeAfterTurns = state.settings.twinEngineSummarizeAfterTurns || 0;
                    if (state.settings.showTwinEngineSettings && state.settings.twinEngineEnableFullAuto && currentUserTurnCountAfterSend > currentSummarizeAfterTurns) {
                        setTimeout(() => this.triggerTwinEngineSummaryInBackground(), 0);
                    }
                }
                if (modelResponseMetadata.finishReason === 'ABORTED' || state.abortController?.signal.aborted) {
                    throw new Error("リクエストがキャンセルされました。");
                }
            }
            let finalContent = modelResponseRawContent;
            let finalThoughtSummary = modelThoughtSummaryContent;
            let finalMetadata = modelResponseMetadata;
            let finalUsage = finalUsageMetadataFromStream;
            let finalGrounding = currentGroundingMetadata;
            if (!useStreamingForThisCall) {
                const data = await apiResponseObject.json();
                let rawContentFromApi = "";
                if (selectedApiProvider === 'gemini') {
                    const candidate = data.candidates?.[0];
                    if (candidate) {
                        finalMetadata = { finishReason: candidate.finishReason, safetyRatings: candidate.safetyRatings };
                        candidate.content?.parts?.forEach(part => {
                            if (part.thought === true && contextGeminiIncludeThoughts)
                                finalThoughtSummary += (part.text || "") + "\n\n";
                            else if (part.thought !== true)
                                rawContentFromApi += (part.text || "") + "\n\n";
                        });
                        finalThoughtSummary = finalThoughtSummary.trim();
                        rawContentFromApi = rawContentFromApi.trim();
                        finalGrounding = candidate.groundingMetadata || null;
                        finalUsage = data.usageMetadata || null;
                        if (candidate.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS")
                            rawContentFromApi += `\n\n(理由: ${candidate.finishReason})`;
                        if (!rawContentFromApi && candidate.finishReason === "STOP" && !finalThoughtSummary)
                            rawContentFromApi = "(応答が空です)";
                    }
                    else {
                        rawContentFromApi = "応答候補がありません";
                        if (data.promptFeedback) {
                            rawContentFromApi += ` (理由: ${data.promptFeedback.blockReason || '不明'})`;
                            finalMetadata = { promptFeedback: data.promptFeedback, finishReason: data.promptFeedback.blockReason || 'ERROR' };
                        }
                        else {
                            finalMetadata.finishReason = 'ERROR';
                        }
                        finalUsage = data.usageMetadata || null;
                    }
                }
                else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                    const choice = data.choices?.[0];
                    if (choice) {
                        rawContentFromApi = choice.message?.content || "";
                        finalMetadata = { finishReason: choice.finish_reason };
                        if (data.usage)
                            finalUsage = { candidatesTokenCount: data.usage.completion_tokens, totalTokenCount: data.usage.total_tokens };
                        if (contextDeepSeekIncludeThoughts && data.parsedReasoningContent)
                            finalThoughtSummary = data.parsedReasoningContent;
                    }
                    else {
                        rawContentFromApi = `${selectedApiProvider.toUpperCase()}からの応答がありません。`;
                        finalMetadata = { finishReason: 'ERROR' };
                        if (data.error)
                            rawContentFromApi += ` (エラー: ${data.error.message})`;
                    }
                }
                else if (selectedApiProvider === 'claude') {
                    if (data.content && data.content.length > 0) {
                        data.content.forEach(block => {
                            if (block.type === 'text')
                                rawContentFromApi += block.text;
                            else if (block.type === 'thinking' && contextClaudeIncludeThoughts)
                                finalThoughtSummary += (block.thinking || "") + "\n\n";
                        });
                        finalThoughtSummary = finalThoughtSummary.trim();
                    }
                    finalMetadata = { finishReason: data.stop_reason || 'stop' };
                    if (data.usage)
                        finalUsage = { candidatesTokenCount: data.usage.output_tokens, totalTokenCount: data.usage.input_tokens + data.usage.output_tokens };
                    if (!rawContentFromApi && data.stop_reason === 'end_turn')
                        rawContentFromApi = "(応答が空です)";
                }
                else if (selectedApiProvider === 'openai' || selectedApiProvider === 'xai') {
                    if (data.choices && data.choices.length > 0) {
                        rawContentFromApi = data.choices[0].message?.content || "";
                        finalMetadata = { finishReason: data.choices[0].finish_reason };
                        if (selectedApiProvider === 'xai' && data.choices[0].message.reasoning_content)
                            finalThoughtSummary = data.choices[0].message.reasoning_content;
                    }
                    if (data.usage) {
                        let reasoningTokens = (selectedApiProvider === 'xai' && data.usage.completion_tokens_details?.reasoning_tokens) ? data.usage.completion_tokens_details.reasoning_tokens : 0;
                        finalUsage = { candidatesTokenCount: data.usage.completion_tokens + reasoningTokens, totalTokenCount: data.usage.prompt_tokens + data.usage.completion_tokens + reasoningTokens };
                    }
                    if (!rawContentFromApi && finalMetadata.finishReason === 'stop')
                        rawContentFromApi = "(応答が空です)";
                }
                finalContent = dummyModelPrefix + rawContentFromApi;
            }
            const finishReasonForProofreading = finalMetadata.finishReason;
            const isRetryableForProofreading = ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'OTHER'].includes(finishReasonForProofreading);
            if (!isBackgroundProcess && state.settings.showProofreadingSettings && state.settings.enableProofreading && finalContent && !isRetryableForProofreading && finishReasonForProofreading !== 'ERROR' && finishReasonForProofreading !== 'ABORTED') {
                try {
                    state.isProofreading = true;
                    uiUtils.updateLoadingIndicator();
                    const proofreadContent = await this.proofreadText(finalContent);
                    finalContent = proofreadContent;
                }
                catch (proofreadError) {
                    finalContent += `\n\n[校正処理に失敗しました: ${proofreadError.message}]`;
                }
                finally {
                    state.isProofreading = false;
                    uiUtils.updateLoadingIndicator();
                }
            }
            if (isBackgroundProcess) {
                if (finalContent || finalThoughtSummary || finalMetadata.finishReason) {
                    const result = {
                        content: finalContent, metadata: finalMetadata, usageMetadata: finalUsage, generatedByApiProvider: selectedApiProvider
                    };
                    if (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts) {
                        result.thoughtSummary = finalThoughtSummary || null;
                        result.groundingMetadata = finalGrounding;
                    }
                    else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts) {
                        result.deepSeekThoughtSummary = finalThoughtSummary || null;
                    }
                    else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts) {
                        result.thoughtSummary = finalThoughtSummary || null;
                    }
                    else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts) {
                        result.xaiThoughtSummary = finalThoughtSummary || null;
                    }
                    return result;
                }
                return { content: "", metadata: finalMetadata };
            }
            if (finalContent || finalThoughtSummary || finalMetadata.finishReason) {
                let finalModelMessageIndex;
                if (useStreamingForThisCall && modelMessageObjectForStream) {
                    finalModelMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                }
                else {
                    const newModelMessage = { role: 'model', content: '', timestamp: Date.now(), ...finalMetadata, usageMetadata: finalUsage, generatedByApiProvider: selectedApiProvider };
                    const targetUserIndexForCascade = userMessageIndex;
                    if (targetUserIndexForCascade !== -1 && !isBackgroundProcess) {
                        if (siblingGroupIdToUse === null)
                            siblingGroupIdToUse = `gid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                        newModelMessage.isCascaded = true;
                        newModelMessage.isSelected = true;
                        newModelMessage.siblingGroupId = siblingGroupIdToUse;
                        if (isRetry && firstResponseIndexForRetry !== -1 && state.currentMessages[firstResponseIndexForRetry] && !state.currentMessages[firstResponseIndexForRetry].isCascaded) {
                            state.currentMessages[firstResponseIndexForRetry].isCascaded = true;
                            state.currentMessages[firstResponseIndexForRetry].siblingGroupId = siblingGroupIdToUse;
                        }
                    }
                    finalModelMessageIndex = state.currentMessages.length;
                    state.currentMessages.push(newModelMessage);
                    state.messageCollapsedStates.set(finalModelMessageIndex, false);
                }
                if (finalModelMessageIndex !== -1) {
                    const msgToUpdate = state.currentMessages[finalModelMessageIndex];
                    msgToUpdate.content = finalContent;
                    msgToUpdate.timestamp = Date.now();
                    msgToUpdate.finishReason = finalMetadata.finishReason;
                    msgToUpdate.safetyRatings = finalMetadata.safetyRatings;
                    msgToUpdate.usageMetadata = finalUsage;
                    if (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts) {
                        msgToUpdate.thoughtSummary = finalThoughtSummary || null;
                        msgToUpdate.groundingMetadata = finalGrounding;
                    }
                    else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts) {
                        msgToUpdate.deepSeekThoughtSummary = finalThoughtSummary || null;
                    }
                    else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts) {
                        msgToUpdate.thoughtSummary = finalThoughtSummary || null;
                    }
                    else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts) {
                        msgToUpdate.xaiThoughtSummary = finalThoughtSummary || null;
                    }
                    msgToUpdate.thoughtSummaryOpen = (selectedApiProvider === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'claude' && state.settings.claudeExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'xai' && state.settings.xaiExpandThoughtsByDefault) ||
                        (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorExpandThoughtsByDefault);
                    state.thoughtSummaryOpenStates.set(finalModelMessageIndex, msgToUpdate.thoughtSummaryOpen);
                    if (useStreamingForThisCall) {
                        uiUtils.finalizeStreamingMessage(finalModelMessageIndex);
                    }
                    else {
                        const shouldMaintainScroll = !isBackgroundProcess && !state.settings.autoScrollOnNewMessage;
                        uiUtils.renderChatMessages(shouldMaintainScroll);
                    }
                    await dbUtils.saveChat();
                    const lastMessage = state.currentMessages[state.currentMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        this.sendWebhookNotification(lastMessage).catch(console.error);
                    }
                }
            }
            else {
                if (useStreamingForThisCall && modelMessageObjectForStream) {
                    const tempPlaceholderIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                    const placeholderElement = document.getElementById(`streaming-message-${tempPlaceholderIndex}`);
                    if (placeholderElement)
                        placeholderElement.remove();
                    if (tempPlaceholderIndex !== -1)
                        state.currentMessages.splice(tempPlaceholderIndex, 1);
                }
            }
            if (!isBackgroundProcess) {
                const currentUserTurnCountAfterSend = state.currentMessages.filter(msg => msg.role === 'user').length;
                const currentSummarizeAfterTurns = state.settings.twinEngineSummarizeAfterTurns || 0;
                if (state.settings.showTwinEngineSettings && state.settings.twinEngineEnableFullAuto && currentUserTurnCountAfterSend > currentSummarizeAfterTurns) {
                    setTimeout(() => this.triggerTwinEngineSummaryInBackground(), 0);
                }
            }
        }
        catch (error) {
            const isAbort = error.message === "リクエストがキャンセルされました。" || modelResponseMetadata.finishReason === 'ABORTED';
            const displayErrorMessage = isAbort ? error.message : (error.message || "不明なエラーが発生しました");
            let partialThoughtContentOnError = state.partialThoughtStreamContent;
            let partialContentOnError = state.partialStreamContent;
            if (isBackgroundProcess) {
                throw error;
            }
            if ((partialContentOnError || partialThoughtContentOnError) && useStreamingForThisCall && modelMessageObjectForStream) {
                const suffix = isAbort ? '\n\n(中断)' : '\n\n(通信が切断されました)';
                const finalPartialContent = partialContentOnError + suffix;
                let finalPartialThoughtValue = null;
                if (partialThoughtContentOnError) {
                    finalPartialThoughtValue = partialThoughtContentOnError + suffix;
                }
                const streamingMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                if (streamingMessageIndex !== -1) {
                    const msgToUpdate = state.currentMessages[streamingMessageIndex];
                    msgToUpdate.content = finalPartialContent;
                    msgToUpdate.timestamp = Date.now();
                    msgToUpdate.error = false;
                    msgToUpdate.finishReason = 'STOP';
                    msgToUpdate.safetyRatings = modelResponseMetadata.safetyRatings;
                    msgToUpdate.usageMetadata = finalUsageMetadataFromStream;
                    msgToUpdate.generatedByApiProvider = selectedApiProvider;
                    if (selectedApiProvider === 'gemini') {
                        msgToUpdate.thoughtSummary = finalPartialThoughtValue;
                        msgToUpdate.groundingMetadata = currentGroundingMetadata;
                    }
                    else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts) {
                        msgToUpdate.deepSeekThoughtSummary = finalPartialThoughtValue;
                    }
                    else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts) {
                        msgToUpdate.thoughtSummary = finalPartialThoughtValue;
                    }
                    else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts) {
                        msgToUpdate.xaiThoughtSummary = finalPartialThoughtValue;
                    }
                    try {
                        uiUtils.finalizeStreamingMessage(streamingMessageIndex);
                        await dbUtils.saveChat();
                    }
                    catch (saveError) {
                        uiUtils.displayError(displayErrorMessage, !isAbort);
                    }
                }
                else {
                    uiUtils.displayError(displayErrorMessage, !isAbort);
                }
            }
            else {
                if (useStreamingForThisCall && !isAbort && modelMessageObjectForStream) {
                    const tempPlaceholderIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                    const placeholderElement = document.getElementById(`streaming-message-${tempPlaceholderIndex}`);
                    if (placeholderElement)
                        placeholderElement.remove();
                    if (tempPlaceholderIndex !== -1)
                        state.currentMessages.splice(tempPlaceholderIndex, 1);
                }
                uiUtils.displayError(displayErrorMessage, !isAbort);
            }
        }
        finally {
            if (!isBackgroundProcess && isTopLevelCall) {
                uiUtils.setSendingState(false);
                state.abortController = null;
                state.partialStreamContent = '';
                state.partialThoughtStreamContent = '';
                if (state.settings.autoScrollOnNewMessage) {
                    // uiUtils.scrollToBottom();
                }
                uiUtils.updateAttachmentBadgeVisibility();
            }
        }
        if (isBackgroundProcess)
            return null;
    },
    async toggleApiProvider() {
        const providersInCycle = Object.entries(state.settings.apiProviderCycle)
            .filter(([, isEnabled]) => isEnabled)
            .map(([provider]) => provider);
        if (providersInCycle.length === 0) {
            await uiUtils.showCustomAlert('切り替え可能なAPIプロバイダーが選択されていません。設定を確認してください。');
            return;
        }
        const currentIndex = providersInCycle.indexOf(state.settings.apiProvider);
        const nextIndex = (currentIndex + 1) % providersInCycle.length;
        state.settings.apiProvider = providersInCycle[nextIndex];
        try {
            await dbUtils.saveSetting('apiProvider', state.settings.apiProvider);
            elements.apiProviderSelect.value = state.settings.apiProvider;
            uiUtils.updateChatScreenElementVisibility();
            uiUtils.toggleApiSettingsVisibility(state.settings.apiProvider);
            uiUtils.adjustTextareaHeight();
            uiUtils.updateApiKeyCycleButtons();
        }
        catch (error) {
            await uiUtils.showCustomAlert(`APIプロバイダー設定の保存に失敗しました: ${error.message}`);
            state.settings.apiProvider = providersInCycle[currentIndex >= 0 ? currentIndex : 0];
            elements.apiProviderSelect.value = state.settings.apiProvider;
            uiUtils.updateChatScreenElementVisibility();
        }
    },
    abortRequest() {
        if (state.abortController) {
            state.abortController.abort();
        }
    },
    async handleHistoryImport(file) {
        if (!file || !file.type.startsWith('text/plain')) {
            await uiUtils.showCustomAlert("テキストファイル (.txt) を選択してください。");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            const textContent = event.target.result;
            if (!textContent) {
                await uiUtils.showCustomAlert("ファイルの内容が空です。");
                return;
            }
            try {
                const { messages: importedMessages } = this.parseImportedHistory(textContent);
                if (importedMessages.length === 0) {
                    await uiUtils.showCustomAlert("ファイルから有効なメッセージまたはシステムプロンプトを読み込めませんでした。形式を確認してください。");
                    return;
                }
                let currentGroupId = null;
                let lastUserIndex = -1;
                for (let i = 0; i < importedMessages.length; i++) {
                    const msg = importedMessages[i];
                    if (msg.role === 'user') {
                        lastUserIndex = i;
                        currentGroupId = null;
                    }
                    else if (msg.role === 'model' && msg.isCascaded) {
                        if (currentGroupId === null && lastUserIndex !== -1) {
                            currentGroupId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                        }
                        if (currentGroupId) {
                            msg.siblingGroupId = currentGroupId;
                        }
                    }
                    else {
                        currentGroupId = null;
                    }
                }
                const groupIds = new Set(importedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = importedMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        siblings[siblings.length - 1].isSelected = true;
                    }
                    else if (selected.length > 1) {
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                    }
                });
                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const titlePrefix = state.settings.addPrefixOnImport ? IMPORT_PREFIX : '';
                const newTitle = titlePrefix + (fileNameWithoutExt || `Imported_${Date.now()}`);
                const newChatData = {
                    messages: importedMessages,
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                    title: newTitle.substring(0, 100)
                };
                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData);
                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });
                await uiUtils.showCustomAlert(`履歴「${newChatData.title}」をインポートしました。`);
                uiUtils.renderHistoryList();
            }
            catch (error) {
                await uiUtils.showCustomAlert(`履歴のインポート中にエラーが発生しました: ${error.message}`);
            }
        };
        reader.onerror = async (event) => {
            await uiUtils.showCustomAlert("ファイルの読み込みに失敗しました。");
        };
        reader.readAsText(file);
    },
    parseImportedHistory(text) {
        const messages = [];
        const blockRegex = /<\|#\|(system|user|model)\|#\|([^>]*)>([\s\S]*?)<\|#\|\/\1\|#\|>/g;
        let match;
        while ((match = blockRegex.exec(text)) !== null) {
            const role = match[1];
            const attributesString = match[2].trim();
            const content = match[3].trim();
            if ((role === 'user' || role === 'model') && (content || attributesString.includes('attachments'))) {
                const messageData = {
                    role: role, content: content, timestamp: Date.now(), attachments: []
                };
                const attributes = {};
                attributesString.split(/\s+/).forEach(attr => {
                    const eqIndex = attr.indexOf('=');
                    if (eqIndex > 0) {
                        const key = attr.substring(0, eqIndex);
                        let value = attr.substring(eqIndex + 1);
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.substring(1, value.length - 1);
                        }
                        attributes[key] = value.replace(/&quot;/g, '"');
                    }
                    else if (attr) {
                        attributes[attr] = true;
                    }
                });
                if (role === 'model') {
                    messageData.isCascaded = attributes['isCascaded'] === true;
                    messageData.isSelected = attributes['isSelected'] === true;
                    messageData.thoughtSummaryOpen = attributes['thoughtOpen'] === true;
                }
                if (role === 'user' && attributes['attachments']) {
                    const fileNames = attributes['attachments'].split(';');
                    messageData.attachments = fileNames.map(name => ({
                        name: name, mimeType: 'unknown/unknown', base64Data: ''
                    }));
                }
                messages.push(messageData);
            }
        }
        return { messages };
    },
    async safeExportAllSessions() {
        try {
            await this.exportAllSessions();
        }
        catch (error) {
            alert(`エクスポートに失敗しました。データベースにアクセスできない可能性があります。\n\nエラー詳細: ${error.message}`);
        }
    },
    async exportAllSessions() {
        const confirmed = await uiUtils.showCustomConfirm("全てのセッションを1つのJSONファイルとしてエクスポートしますか？");
        if (!confirmed)
            return;
        try {
            const chats = await dbUtils.getAllChats();
            if (!chats || chats.length === 0) {
                await uiUtils.showCustomAlert("エクスポートするセッションがありません。");
                return;
            }
            const exportableChats = chats.map(chat => ({
                title: chat.title,
                messages: chat.messages.map(msg => {
                    const messageExport = {
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp,
                        generatedByApiProvider: msg.generatedByApiProvider || null,
                    };
                    if (msg.isCascaded !== undefined)
                        messageExport.isCascaded = msg.isCascaded;
                    if (msg.isSelected !== undefined)
                        messageExport.isSelected = msg.isSelected;
                    if (msg.siblingGroupId !== undefined)
                        messageExport.siblingGroupId = msg.siblingGroupId;
                    if (msg.groundingMetadata)
                        messageExport.groundingMetadata = msg.groundingMetadata;
                    if (msg.usageMetadata)
                        messageExport.usageMetadata = msg.usageMetadata;
                    if (msg.thoughtSummary)
                        messageExport.thoughtSummary = msg.thoughtSummary;
                    if (msg.deepSeekThoughtSummary)
                        messageExport.deepSeekThoughtSummary = msg.deepSeekThoughtSummary;
                    if (msg.thoughtSummaryOpen !== undefined)
                        messageExport.thoughtSummaryOpen = msg.thoughtSummaryOpen;
                    if (msg.attachments && msg.attachments.length > 0) {
                        messageExport.attachments = msg.attachments.map(att => ({ name: att.name, mimeType: att.mimeType, textData: att.textData }));
                    }
                    return messageExport;
                }),
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
                ...(state.settings.persistMessageCollapseState && chat.collapsedStates && { collapsedStates: chat.collapsedStates })
            }));
            const jsonString = JSON.stringify(exportableChats, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            a.href = url;
            a.download = `gemini_pwa_all_sessions_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await uiUtils.showCustomAlert(`${chats.length}件のセッションをエクスポートしました。`);
        }
        catch (error) {
            await uiUtils.showCustomAlert(`全セッションのエクスポート中にエラーが発生しました: ${error.message || error}`);
        }
    },
    async handleAllSessionsImport(file) {
        if (!file || file.type !== 'application/json') {
            await uiUtils.showCustomAlert("JSONファイル (.json) を選択してください。");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            const textContent = event.target.result;
            if (!textContent) {
                await uiUtils.showCustomAlert("ファイルの内容が空です。");
                return;
            }
            try {
                const importedData = JSON.parse(textContent);
                if (!Array.isArray(importedData)) {
                    await uiUtils.showCustomAlert("無効なファイル形式です。チャットデータの配列ではありません。");
                    return;
                }
                if (importedData.length === 0) {
                    await uiUtils.showCustomAlert("ファイルにインポート対象のセッションデータが含まれていません。");
                    return;
                }
                const confirmed = await uiUtils.showCustomConfirm(`${importedData.length}件のセッションをインポートしますか？\n(既存の履歴とタイトルが重複する場合、別履歴として追加されます)`);
                if (!confirmed)
                    return;
                let importedCount = 0;
                let skippedCount = 0;
                const importTimestamp = Date.now();
                for (const chatData of importedData) {
                    if (typeof chatData.title !== 'string' || !Array.isArray(chatData.messages)) {
                        skippedCount++;
                        continue;
                    }
                    const titlePrefix = state.settings.addPrefixOnImport ? `${IMPORT_PREFIX}(全) ` : '';
                    const newChat = {
                        title: `${titlePrefix}${chatData.title}`.substring(0, 100),
                        messages: (chatData.messages || []).map(msg => ({
                            role: msg.role,
                            content: msg.content || '',
                            timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : importTimestamp,
                            isCascaded: msg.isCascaded === true,
                            isSelected: msg.isSelected === true,
                            siblingGroupId: msg.siblingGroupId || undefined,
                            thoughtSummary: msg.thoughtSummary || undefined,
                            deepSeekThoughtSummary: msg.deepSeekThoughtSummary || undefined,
                            thoughtSummaryOpen: msg.thoughtSummaryOpen || false,
                            generatedByApiProvider: msg.generatedByApiProvider || undefined,
                            attachments: (msg.attachments || []).map(att => ({
                                name: att.name || 'imported_file',
                                mimeType: att.mimeType || 'application/octet-stream',
                                base64Data: '',
                                textData: att.textData || ''
                            })),
                            groundingMetadata: msg.groundingMetadata || undefined,
                            usageMetadata: msg.usageMetadata || undefined,
                            error: msg.error || undefined,
                        })),
                        createdAt: typeof chatData.createdAt === 'number' ? chatData.createdAt : importTimestamp,
                        updatedAt: typeof chatData.updatedAt === 'number' ? chatData.updatedAt : importTimestamp,
                    };
                    if (state.settings.persistMessageCollapseState && chatData.collapsedStates) {
                        newChat.collapsedStates = { ...chatData.collapsedStates };
                    }
                    const groupIds = new Set(newChat.messages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                    groupIds.forEach(gid => {
                        const siblings = newChat.messages.filter(m => m.siblingGroupId === gid);
                        const selectedSiblings = siblings.filter(m => m.isSelected);
                        if (selectedSiblings.length === 0 && siblings.length > 0) {
                            siblings[siblings.length - 1].isSelected = true;
                        }
                        else if (selectedSiblings.length > 1) {
                            for (let i = 0; i < selectedSiblings.length - 1; i++) {
                                selectedSiblings[i].isSelected = false;
                            }
                        }
                    });
                    try {
                        await new Promise((resolve, reject) => {
                            const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                            const request = store.add(newChat);
                            request.onsuccess = () => {
                                importedCount++;
                                resolve();
                            };
                            request.onerror = (e) => {
                                skippedCount++;
                                resolve();
                            };
                        });
                    }
                    catch (e) {
                        skippedCount++;
                    }
                }
                let message = `${importedCount}件のセッションをインポートしました。`;
                if (skippedCount > 0) {
                    message += ` ${skippedCount}件は形式エラー等でスキップされました。`;
                }
                await uiUtils.showCustomAlert(message);
                if (importedCount > 0) {
                    uiUtils.renderHistoryList();
                }
            }
            catch (error) {
                await uiUtils.showCustomAlert(`全セッションのインポート中にエラーが発生しました: ${error.message || error}`);
            }
        };
        reader.onerror = async () => {
            await uiUtils.showCustomAlert("ファイルの読み込みに失敗しました。");
        };
        reader.readAsText(file);
    },
    getTextSettingsForExport() {
        const excludedKeys = new Set([
            'backgroundImageBlob',
            'historyBackgroundImageBlob',
            'settingsBackgroundImageBlob',
            'userIconBlob',
            'aiIconBlob'
        ]);
        const cloneTextValue = (value) => {
            if (value === null)
                return null;
            if (['string', 'number', 'boolean'].includes(typeof value))
                return value;
            if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol')
                return undefined;
            if ((typeof Blob !== 'undefined' && value instanceof Blob) || (typeof File !== 'undefined' && value instanceof File))
                return undefined;
            if (Array.isArray(value)) {
                return value
                    .map(item => cloneTextValue(item))
                    .filter(item => typeof item !== 'undefined');
            }
            if (typeof value === 'object') {
                const result = {};
                Object.entries(value).forEach(([key, childValue]) => {
                    const cloned = cloneTextValue(childValue);
                    if (typeof cloned !== 'undefined') {
                        result[key] = cloned;
                    }
                });
                return result;
            }
            return undefined;
        };
        const exportSettings = {};
        Object.entries(state.settings).forEach(([key, value]) => {
            if (excludedKeys.has(key))
                return;
            const cloned = cloneTextValue(value);
            if (typeof cloned !== 'undefined') {
                exportSettings[key] = cloned;
            }
        });
        return exportSettings;
    },
    async exportSettings() {
        const confirmed = await uiUtils.showCustomConfirm("APIキーを含むテキスト設定をJSONファイルとしてエクスポートしますか？\n背景画像やアイコン画像は含まれません。");
        if (!confirmed)
            return;
        try {
            await this.saveSettings(false);
            const exportData = {
                app: 'GeminiPWA',
                type: 'settings',
                formatVersion: 1,
                appVersion: APP_VERSION,
                exportedAt: new Date().toISOString(),
                includesApiKeys: true,
                excluded: ['backgroundImageBlob', 'historyBackgroundImageBlob', 'settingsBackgroundImageBlob', 'userIconBlob', 'aiIconBlob'],
                settings: this.getTextSettingsForExport()
            };
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            a.href = url;
            a.download = `gemini_pwa_settings_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await uiUtils.showCustomAlert("設定をエクスポートしました。");
        }
        catch (error) {
            await uiUtils.showCustomAlert(`設定のエクスポート中にエラーが発生しました: ${error.message || error}`);
        }
    },
    async handleSettingsImport(file) {
        if (!file || (file.type && file.type !== 'application/json') && !file.name.toLowerCase().endsWith('.json')) {
            await uiUtils.showCustomAlert("JSONファイル (.json) を選択してください。");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const textContent = event.target.result;
                if (!textContent) {
                    await uiUtils.showCustomAlert("ファイルの内容が空です。");
                    return;
                }
                const importedData = JSON.parse(textContent);
                const importedSettings = importedData?.type === 'settings' && importedData.settings
                    ? importedData.settings
                    : importedData;
                if (!importedSettings || typeof importedSettings !== 'object' || Array.isArray(importedSettings)) {
                    await uiUtils.showCustomAlert("無効な設定ファイルです。");
                    return;
                }
                const confirmed = await uiUtils.showCustomConfirm("APIキーを含む設定を現在の設定へ上書きインポートしますか？\n背景画像やアイコン画像は変更されません。");
                if (!confirmed)
                    return;
                const excludedKeys = new Set([
                    'backgroundImageBlob',
                    'historyBackgroundImageBlob',
                    'settingsBackgroundImageBlob',
                    'userIconBlob',
                    'aiIconBlob'
                ]);
                const allowedKeys = new Set(Object.keys(state.settings).filter(key => !excludedKeys.has(key)));
                const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
                const sanitizeImportedValue = (value) => {
                    if (value === null)
                        return null;
                    if (['string', 'number', 'boolean'].includes(typeof value))
                        return value;
                    if (Array.isArray(value)) {
                        return value
                            .map(item => sanitizeImportedValue(item))
                            .filter(item => typeof item !== 'undefined');
                    }
                    if (isPlainObject(value)) {
                        const result = {};
                        Object.entries(value).forEach(([key, childValue]) => {
                            const sanitized = sanitizeImportedValue(childValue);
                            if (typeof sanitized !== 'undefined') {
                                result[key] = sanitized;
                            }
                        });
                        return result;
                    }
                    return undefined;
                };
                const settingsToImport = {};
                Object.entries(importedSettings).forEach(([key, value]) => {
                    if (!allowedKeys.has(key))
                        return;
                    const sanitized = sanitizeImportedValue(value);
                    if (typeof sanitized === 'undefined')
                        return;
                    const currentValue = state.settings[key];
                    settingsToImport[key] = isPlainObject(currentValue) && isPlainObject(sanitized)
                        ? { ...currentValue, ...sanitized }
                        : sanitized;
                });
                if (Object.keys(settingsToImport).length === 0) {
                    await uiUtils.showCustomAlert("インポート可能な設定項目がありません。");
                    return;
                }
                await Promise.all(Object.entries(settingsToImport).map(([key, value]) => dbUtils.saveSetting(key, value)));
                await dbUtils.loadSettings();
                uiUtils.applyTheme();
                uiUtils.applyFontFamily();
                uiUtils.applySidePanelSettingsToUI();
                uiUtils.applyMinimizeUI();
                uiUtils.applyAiBubbleWidthSetting();
                uiUtils.applyUserBubbleWidthSetting();
                uiUtils.applyMessageSpacingSetting();
                uiUtils.applyCompactSettingsSpacing();
                uiUtils.applySettingsToUI();
                await uiUtils.showCustomAlert(`${Object.keys(settingsToImport).length}件の設定をインポートしました。`);
            }
            catch (error) {
                await uiUtils.showCustomAlert(`設定のインポート中にエラーが発生しました: ${error.message || error}`);
            }
        };
        reader.onerror = async () => {
            await uiUtils.showCustomAlert("ファイルの読み込みに失敗しました。");
        };
        reader.readAsText(file);
    },
    async handleBackgroundImageUpload(file) {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            await uiUtils.showCustomAlert(`画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下にしてください)`);
            return;
        }
        if (!file.type.startsWith('image/')) {
            await uiUtils.showCustomAlert("画像ファイルを選択してください (JPEG, PNG, GIF, WebPなど)");
            return;
        }
        try {
            uiUtils.revokeExistingObjectUrl();
            const blob = file;
            await dbUtils.saveSetting('backgroundImageBlob', blob);
            state.settings.backgroundImageBlob = blob;
            state.backgroundImageUrl = URL.createObjectURL(blob);
            document.documentElement.style.setProperty('--chat-background-image', `url(${state.backgroundImageUrl})`);
            uiUtils.updateBackgroundSettingsUI();
        }
        catch (error) {
            uiUtils.revokeExistingObjectUrl();
            document.documentElement.style.setProperty('--chat-background-image', 'none');
            state.settings.backgroundImageBlob = null;
            uiUtils.updateBackgroundSettingsUI();
        }
    },
    async confirmDeleteBackgroundImage() {
        const confirmed = await uiUtils.showCustomConfirm("背景画像を削除しますか？");
        if (confirmed) {
            await this.handleBackgroundImageDelete();
        }
    },
    async handleBackgroundImageDelete() {
        try {
            uiUtils.revokeExistingObjectUrl();
            await dbUtils.saveSetting('backgroundImageBlob', null);
            state.settings.backgroundImageBlob = null;
            document.documentElement.style.setProperty('--chat-background-image', 'none');
            uiUtils.updateBackgroundSettingsUI();
        }
        catch (error) {
        }
    },
    async handleIconUpload(type, file) {
        const maxSize = 1 * 1024 * 1024;
        if (file.size > maxSize) {
            await uiUtils.showCustomAlert(`画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下)。`);
            return;
        }
        if (!file.type.startsWith('image/')) {
            await uiUtils.showCustomAlert("画像ファイルを選択してください。");
            return;
        }
        try {
            const blob = file;
            if (type === 'user') {
                if (state.userIconUrl)
                    URL.revokeObjectURL(state.userIconUrl);
                await dbUtils.saveSetting('userIconBlob', blob);
                state.settings.userIconBlob = blob;
                state.userIconUrl = URL.createObjectURL(blob);
            }
            else if (type === 'ai') {
                if (state.aiIconUrl)
                    URL.revokeObjectURL(state.aiIconUrl);
                await dbUtils.saveSetting('aiIconBlob', blob);
                state.settings.aiIconBlob = blob;
                state.aiIconUrl = URL.createObjectURL(blob);
            }
            uiUtils.updateIconSettingsUI();
            uiUtils.renderChatMessages(true, true);
        }
        catch (error) {
            await uiUtils.showCustomAlert(`${type === 'user' ? 'ユーザー' : 'AI'}アイコンの処理エラー: ${error}`);
        }
    },
    async confirmDeleteIcon(type) {
        const iconName = type === 'user' ? 'ユーザー' : 'AI';
        const confirmed = await uiUtils.showCustomConfirm(`${iconName}アイコンを削除しますか？`);
        if (confirmed) {
            await this.handleIconDelete(type);
        }
    },
    async handleIconDelete(type) {
        try {
            if (type === 'user') {
                if (state.userIconUrl)
                    URL.revokeObjectURL(state.userIconUrl);
                state.userIconUrl = null;
                state.settings.userIconBlob = null;
                await dbUtils.saveSetting('userIconBlob', null);
            }
            else if (type === 'ai') {
                if (state.aiIconUrl)
                    URL.revokeObjectURL(state.aiIconUrl);
                state.aiIconUrl = null;
                state.settings.aiIconBlob = null;
                await dbUtils.saveSetting('aiIconBlob', null);
            }
            uiUtils.updateIconSettingsUI();
            uiUtils.renderChatMessages(true, true);
        }
        catch (error) {
            await uiUtils.showCustomAlert(`${type === 'user' ? 'ユーザー' : 'AI'}アイコンの削除エラー: ${error}`);
        }
    },
    cycleActiveApiKey() {
        const provider = state.settings.apiProvider;
        if (provider === 'llmaggregator') {
            const activeBackend = multiBackendUtils.getActiveBackend();
            if (!activeBackend || !activeBackend.apiKeys || activeBackend.apiKeys.length < 2)
                return;
            const keys = activeBackend.apiKeys;
            let currentIndex = keys.findIndex(k => k.isActive);
            if (currentIndex === -1)
                currentIndex = 0;
            const nextIndex = (currentIndex + 1) % keys.length;
            const nextKeyId = keys[nextIndex].id;
            multiBackendUtils.selectApiKeyForBackend(activeBackend.id, nextKeyId);
        }
        else {
            const keys = multiApiKeyUtils.getApiKeysArray(provider);
            if (!state.settings.showMultiApiKeys || keys.length < 2)
                return;
            let currentIndex = keys.findIndex(k => k.isActive);
            if (currentIndex === -1)
                currentIndex = 0;
            const nextIndex = (currentIndex + 1) % keys.length;
            const nextKeyId = keys[nextIndex].id;
            multiApiKeyUtils.selectApiKey(provider, nextKeyId);
        }
    },
    async saveSettings(showNotice = true) {
        const newSettings = { ...state.settings };
        const getParamValue = (paramId, isInteger = false, min, max) => {
            const checkbox = document.querySelector(`.param-default-checkbox[data-target-id="${paramId}"]`);
            if (!checkbox || !checkbox.checked) {
                return null;
            }
            const input = document.getElementById(paramId);
            const value = input.value.trim();
            if (value === '') {
                return null;
            }
            let num = isInteger ? parseInt(value, 10) : parseFloat(value);
            if (isNaN(num)) {
                return null;
            }
            if (min !== undefined && num < min)
                num = min;
            if (max !== undefined && num > max)
                num = max;
            return num;
        };
        const getSliderMaxValue = (paramId) => {
            const maxInput = document.querySelector(`.param-slider-max-input[data-target-id="${paramId}"]`);
            if (maxInput) {
                const value = maxInput.value.trim();
                if (value === '')
                    return null;
                const numValue = parseInt(value, 10);
                return isNaN(numValue) ? null : numValue;
            }
            return undefined;
        };
        newSettings.showMultiApiKeys = elements.showMultiApiKeysToggle.checked;
        newSettings.showProofreadingSettings = elements.showProofreadingSettingsToggle.checked;
        newSettings.disableSaveSettingsConfirmation = elements.disableSaveSettingsConfirmationToggle.checked;
        newSettings.autoSaveSettings = elements.autoSaveSettingsToggle.checked;
        newSettings.unmaskApiKeys = elements.unmaskApiKeysToggle.checked;
        newSettings.disableLlmUrlWhitelist = elements.disableLlmUrlWhitelistToggle.checked;
        elements.settingsScreen.classList.toggle('auto-save-mode', newSettings.autoSaveSettings);
        if (!newSettings.showMultiApiKeys) {
            newSettings.apiKey = elements.geminiApiKeyInput.value.trim();
            newSettings.deepSeekApiKey = elements.deepSeekApiKeyInput.value.trim();
            newSettings.claudeApiKey = elements.claudeApiKeyInput.value.trim();
            newSettings.openaiApiKey = elements.openaiApiKeyInput.value.trim();
            newSettings.xaiApiKey = elements.xaiApiKeyInput.value.trim();
            newSettings.llmAggregatorApiKey = elements.llmAggregatorApiKeyInput.value.trim();
        }
        newSettings.apiProvider = elements.apiProviderSelect.value;
        newSettings.commonSystemPrompt = elements.commonSystemPromptDefaultTextarea.value.trim();
        newSettings.enableCommonSystemPromptDefault = elements.enableCommonSystemPromptDefaultCheckbox.checked;
        newSettings.modelName = elements.geminiModelNameSelect.value;
        newSettings.additionalModels = elements.geminiAdditionalModelsTextarea.value.trim();
        newSettings.geminiSystemPrompt = elements.geminiSystemPromptDefaultTextarea.value.trim();
        newSettings.geminiEnableSystemPromptDefault = elements.geminiEnableSystemPromptDefaultCheckbox.checked;
        newSettings.geminiMaxTokens = getParamValue('gemini-max-tokens', true, 1);
        newSettings.geminiTemperature = getParamValue('gemini-temperature', false, 0, 2);
        newSettings.geminiTopK = getParamValue('gemini-top-k', true, 1);
        newSettings.geminiTopP = getParamValue('gemini-top-p', false, 0, 1);
        newSettings.geminiPresencePenalty = getParamValue('gemini-presence-penalty', false, -2.0, 2.0);
        newSettings.geminiFrequencyPenalty = getParamValue('gemini-frequency-penalty', false, -2.0, 2.0);
        newSettings.geminiThinkingBudget = getParamValue('gemini-thinking-budget', true, 0);
        newSettings.geminiMaxTokensSliderMax = getSliderMaxValue('gemini-max-tokens');
        newSettings.geminiTopKSliderMax = getSliderMaxValue('gemini-top-k');
        newSettings.geminiThinkingBudgetSliderMax = getSliderMaxValue('gemini-thinking-budget');
        newSettings.geminiIncludeThoughts = elements.geminiIncludeThoughtsToggle.checked;
        newSettings.geminiExpandThoughtsByDefault = elements.geminiExpandThoughtsByDefaultToggle.checked;
        newSettings.geminiStreamingOutput = elements.geminiStreamingOutputCheckbox.checked;
        newSettings.geminiStreamingSpeed = elements.geminiStreamingSpeedInput.value === '' ? DEFAULT_STREAMING_SPEED : parseInt(elements.geminiStreamingSpeedInput.value, 10);
        newSettings.geminiDummyUser = elements.geminiDummyUserInput.value.trim();
        newSettings.geminiEnableDummyUser = elements.geminiEnableDummyUserCheckbox.checked;
        newSettings.geminiDummyModel = elements.geminiDummyModelInput.value.trim();
        newSettings.geminiEnableDummyModel = elements.geminiEnableDummyModelCheckbox.checked;
        newSettings.geminiConcatDummyModel = elements.geminiConcatDummyModelCheckbox.checked;
        newSettings.geminiPseudoStreaming = elements.geminiPseudoStreamingCheckbox.checked;
        newSettings.geminiEnableGrounding = elements.geminiEnableGroundingToggle.checked;
        newSettings.deepSeekApiEndpoint = elements.deepSeekApiEndpointInput.value.trim();
        newSettings.deepSeekModelName = elements.deepSeekModelNameSelect.value;
        newSettings.deepSeekAdditionalModels = elements.deepSeekAdditionalModelsTextarea.value.trim();
        newSettings.deepSeekSystemPrompt = elements.deepSeekSystemPromptDefaultTextarea.value.trim();
        newSettings.deepSeekEnableSystemPromptDefault = elements.deepSeekEnableSystemPromptDefaultCheckbox.checked;
        newSettings.deepSeekMaxTokens = getParamValue('deepseek-max-tokens', true, 1);
        newSettings.deepSeekTemperature = getParamValue('deepseek-temperature', false, 0, 2);
        newSettings.deepSeekTopP = getParamValue('deepseek-top-p', false, 0, 1);
        newSettings.deepSeekPresencePenalty = getParamValue('deepseek-presence-penalty', false, -2.0, 2.0);
        newSettings.deepSeekFrequencyPenalty = getParamValue('deepseek-frequency-penalty', false, -2.0, 2.0);
        newSettings.deepSeekIncludeDeepSeekThoughts = elements.deepSeekIncludeThoughtsToggle.checked;
        newSettings.deepSeekExpandThoughtsByDefault = elements.deepSeekExpandThoughtsByDefaultToggle.checked;
        newSettings.deepSeekStreamingOutput = elements.deepSeekStreamingOutputCheckbox.checked;
        newSettings.deepSeekStreamingSpeed = elements.deepSeekStreamingSpeedInput.value === '' ? DEFAULT_STREAMING_SPEED : parseInt(elements.deepSeekStreamingSpeedInput.value, 10);
        newSettings.deepSeekDummyUser = elements.deepSeekDummyUserInput.value.trim();
        newSettings.deepSeekEnableDummyUser = elements.deepSeekEnableDummyUserCheckbox.checked;
        newSettings.deepSeekDummyModel = elements.deepSeekDummyModelInput.value.trim();
        newSettings.deepSeekEnableDummyModel = elements.deepSeekEnableDummyModelCheckbox.checked;
        newSettings.deepSeekConcatDummyModel = elements.deepSeekConcatDummyModelCheckbox.checked;
        newSettings.claudeModelName = elements.claudeModelNameSelect.value;
        newSettings.claudeAdditionalModels = elements.claudeAdditionalModelsTextarea.value.trim();
        newSettings.claudeSystemPrompt = elements.claudeSystemPromptDefaultTextarea.value.trim();
        newSettings.claudeEnableSystemPromptDefault = elements.claudeEnableSystemPromptDefaultCheckbox.checked;
        newSettings.claudeMaxTokens = getParamValue('claude-max-tokens', true, 1);
        newSettings.claudeTemperature = getParamValue('claude-temperature', false, 0, 1);
        newSettings.claudeTopK = getParamValue('claude-top-k', true, 1);
        newSettings.claudeTopP = getParamValue('claude-top-p', false, 0, 1);
        newSettings.claudeThinkingBudget = getParamValue('claude-thinking-budget', true, 1024);
        newSettings.claudeIncludeThoughts = elements.claudeIncludeThoughtsToggle.checked;
        newSettings.claudeExpandThoughtsByDefault = elements.claudeExpandThoughtsByDefaultToggle.checked;
        newSettings.claudeStreamingOutput = elements.claudeStreamingOutputCheckbox.checked;
        newSettings.claudeStreamingSpeed = elements.claudeStreamingSpeedInput.value === '' ? DEFAULT_STREAMING_SPEED : parseInt(elements.claudeStreamingSpeedInput.value, 10);
        newSettings.claudeDummyUser = elements.claudeDummyUserInput.value.trim();
        newSettings.claudeEnableDummyUser = elements.claudeEnableDummyUserCheckbox.checked;
        newSettings.claudeDummyModel = elements.claudeDummyModelInput.value.trim();
        newSettings.claudeEnableDummyModel = elements.claudeEnableDummyModelCheckbox.checked;
        newSettings.claudeConcatDummyModel = elements.claudeConcatDummyModelCheckbox.checked;
        newSettings.openaiModelName = elements.openaiModelNameSelect.value;
        newSettings.openaiAdditionalModels = elements.openaiAdditionalModelsTextarea.value.trim();
        newSettings.openaiSystemPrompt = elements.openaiSystemPromptDefaultTextarea.value.trim();
        newSettings.openaiEnableSystemPromptDefault = elements.openaiEnableSystemPromptDefaultCheckbox.checked;
        newSettings.openaiMaxTokens = getParamValue('openai-max-tokens', true, 1);
        newSettings.openaiTemperature = getParamValue('openai-temperature', false, 0, 2);
        newSettings.openaiTopP = getParamValue('openai-top-p', false, 0, 1);
        newSettings.openaiPresencePenalty = getParamValue('openai-presence-penalty', false, -2.0, 2.0);
        newSettings.openaiFrequencyPenalty = getParamValue('openai-frequency-penalty', false, -2.0, 2.0);
        newSettings.openaiStreamingOutput = elements.openaiStreamingOutputCheckbox.checked;
        newSettings.openaiStreamingSpeed = elements.openaiStreamingSpeedInput.value === '' ? DEFAULT_STREAMING_SPEED : parseInt(elements.openaiStreamingSpeedInput.value, 10);
        newSettings.openaiDummyUser = elements.openaiDummyUserInput.value.trim();
        newSettings.openaiEnableDummyUser = elements.openaiEnableDummyUserCheckbox.checked;
        newSettings.openaiDummyModel = elements.openaiDummyModelInput.value.trim();
        newSettings.openaiEnableDummyModel = elements.openaiEnableDummyModelCheckbox.checked;
        newSettings.openaiConcatDummyModel = elements.openaiConcatDummyModelCheckbox.checked;
        newSettings.xaiModelName = elements.xaiModelNameSelect.value;
        newSettings.xaiAdditionalModels = elements.xaiAdditionalModelsTextarea.value.trim();
        newSettings.xaiSystemPrompt = elements.xaiSystemPromptDefaultTextarea.value.trim();
        newSettings.xaiEnableSystemPromptDefault = elements.xaiEnableSystemPromptDefaultCheckbox.checked;
        newSettings.xaiMaxTokens = getParamValue('xai-max-tokens', true, 1);
        newSettings.xaiTemperature = getParamValue('xai-temperature', false, 0, 2);
        newSettings.xaiTopP = getParamValue('xai-top-p', false, 0, 1);
        newSettings.xaiPresencePenalty = getParamValue('xai-presence-penalty', false, -2.0, 2.0);
        newSettings.xaiFrequencyPenalty = getParamValue('xai-frequency-penalty', false, -2.0, 2.0);
        newSettings.xaiIncludeThoughts = elements.xaiIncludeThoughtsToggle.checked;
        newSettings.xaiExpandThoughtsByDefault = elements.xaiExpandThoughtsByDefaultToggle.checked;
        newSettings.xaiReasoningEffort = elements.xaiReasoningEffortSelect.value;
        newSettings.xaiStreamingOutput = elements.xaiStreamingOutputCheckbox.checked;
        newSettings.xaiStreamingSpeed = elements.xaiStreamingSpeedInput.value === '' ? DEFAULT_STREAMING_SPEED : parseInt(elements.xaiStreamingSpeedInput.value, 10);
        newSettings.xaiDummyUser = elements.xaiDummyUserInput.value.trim();
        newSettings.xaiEnableDummyUser = elements.xaiEnableDummyUserCheckbox.checked;
        newSettings.xaiDummyModel = elements.xaiDummyModelInput.value.trim();
        newSettings.xaiEnableDummyModel = elements.xaiEnableDummyModelCheckbox.checked;
        newSettings.xaiConcatDummyModel = elements.xaiConcatDummyModelCheckbox.checked;
        newSettings.xaiVisionEnable = elements.xaiVisionEnableCheckbox.checked;
        newSettings.llmAggregatorApiBackend = elements.llmAggregatorApiBackendInput.value.trim();
        newSettings.llmAggregatorModelName = elements.llmAggregatorModelNameSelect.value;
        newSettings.llmAggregatorSystemPrompt = elements.llmAggregatorSystemPromptDefaultTextarea.value.trim();
        newSettings.llmAggregatorEnableSystemPromptDefault = elements.llmAggregatorEnableSystemPromptDefaultCheckbox.checked;
        newSettings.llmAggregatorMaxTokens = getParamValue('llmaggregator-max-tokens', true, 1);
        newSettings.llmAggregatorTemperature = getParamValue('llmaggregator-temperature', false, 0, 2);
        newSettings.llmAggregatorTopP = getParamValue('llmaggregator-top-p', false, 0, 1);
        newSettings.llmAggregatorTopK = getParamValue('llmaggregator-top-k', true, 0);
        newSettings.llmAggregatorPresencePenalty = getParamValue('llmaggregator-presence-penalty', false, -2.0, 2.0);
        newSettings.llmAggregatorFrequencyPenalty = getParamValue('llmaggregator-frequency-penalty', false, -2.0, 2.0);
        newSettings.llmAggregatorIncludeThoughts = elements.llmAggregatorIncludeThoughtsToggle.checked;
        newSettings.llmAggregatorExpandThoughtsByDefault = elements.llmAggregatorExpandThoughtsByDefaultToggle.checked;
        newSettings.llmAggregatorStreamingOutput = elements.llmAggregatorStreamingOutputCheckbox.checked;
        newSettings.llmAggregatorStreamingSpeed = elements.llmAggregatorStreamingSpeedInput.value === '' ? DEFAULT_STREAMING_SPEED : parseInt(elements.llmAggregatorStreamingSpeedInput.value, 10);
        newSettings.llmAggregatorDummyUser = elements.llmAggregatorDummyUserInput.value.trim();
        newSettings.llmAggregatorEnableDummyUser = elements.llmAggregatorEnableDummyUserCheckbox.checked;
        newSettings.llmAggregatorDummyModel = elements.llmAggregatorDummyModelInput.value.trim();
        newSettings.llmAggregatorEnableDummyModel = elements.llmAggregatorEnableDummyModelCheckbox.checked;
        newSettings.llmAggregatorConcatDummyModel = elements.llmAggregatorConcatDummyModelCheckbox.checked;
        newSettings.llmAggregatorAdditionalModels = elements.llmAggregatorAdditionalModelsTextarea.value.trim();
        newSettings.llmAggregatorApiBackend = elements.llmAggregatorApiBackendInput.value.trim();
        newSettings.llmaggregatorBackends = state.settings.llmaggregatorBackends;
        newSettings.llmaggregatorActiveBackendIndex = state.settings.llmaggregatorActiveBackendIndex;
        newSettings.enterToSend = elements.enterToSendCheckbox.checked;
        newSettings.showResponseTimer = elements.showResponseTimerToggle.checked;
        newSettings.headerTapScrollToTop = elements.headerTapScrollToTopToggle.checked;
        newSettings.footerTapScrollToBottom = elements.footerTapScrollToBottomToggle.checked;
        newSettings.autoScrollOnNewMessage = elements.autoScrollOnNewMessageCheckbox.checked;
        newSettings.autoScrollOnThought = elements.autoScrollOnThoughtCheckbox.checked;
        newSettings.historySortOrder = elements.historySortOrderSelect.value;
        newSettings.theme = elements.themeSelect.value;
        newSettings.enableSessionLinking = elements.enableSessionLinkingCheckbox.checked;
        newSettings.fontFamily = elements.fontFamilyInput.value.trim();
        newSettings.messageBodyFontSize = elements.messageBodyFontSizeInput.value === '' ? null : parseInt(elements.messageBodyFontSizeInput.value, 10);
        newSettings.codeBlockFontSize = elements.codeBlockFontSizeInput.value === '' ? null : parseInt(elements.codeBlockFontSizeInput.value, 10);
        newSettings.thoughtSummaryFontSize = elements.thoughtSummaryFontSizeInput.value === '' ? null : parseInt(elements.thoughtSummaryFontSizeInput.value, 10);
        newSettings.chatUiScale = parseFloat(document.getElementById('chat-ui-scale-input').value) || 1.0;
        newSettings.settingsUiScale = parseFloat(document.getElementById('settings-ui-scale-input').value) || 1.0;
        newSettings.historyUiScale = parseFloat(document.getElementById('history-ui-scale-input').value) || 1.0;
        newSettings.enableSwipeNavigation = elements.swipeNavigationToggle.checked;
        newSettings.preventZoom = elements.preventZoomToggle.checked;
        newSettings.minimizeHeaderFooter = document.getElementById('minimize-header-footer-toggle').checked;
        newSettings.enableCryscrollerScroll = elements.enableCryscrollerScrollToggle.checked;
        newSettings.enableImmersiveScrolling = elements.enableImmersiveScrollingToggle.checked;
        newSettings.enableDynamicScrollMarkerColor = elements.enableDynamicScrollMarkerColorToggle.checked;
        const scrollWidth = parseInt(elements.cryscrollerScrollWidthInput.value, 10);
        newSettings.cryscrollerScrollWidth = (isNaN(scrollWidth) || scrollWidth < 10) ? DEFAULT_CRYSCROLLER_SCROLL_WIDTH : scrollWidth;
        newSettings.extendAiBubbleWidth = elements.extendAiBubbleWidthToggle.checked;
        newSettings.extendUserBubbleWidth = elements.extendUserBubbleWidthToggle.checked;
        newSettings.reduceMessageSpacing = elements.reduceMessageSpacingToggle.checked;
        newSettings.compactSettingsSpacing = elements.compactSettingsSpacingToggle.checked;
        newSettings.slimSettingsHeaders = elements.slimSettingsHeadersToggle.checked;
        newSettings.flatSettingsDesign = elements.flatSettingsDesignToggle.checked;
        newSettings.showSessionLinkingSettings = elements.showSessionLinkingSettingsToggle.checked;
        newSettings.showTwinEngineSettings = elements.showTwinEngineSettingsToggle.checked;
        newSettings.showChatTitle = elements.showChatTitleToggle.checked;
        newSettings.showNewChatButton = elements.showNewChatButtonToggle.checked;
        newSettings.showDeleteSessionButton = elements.showDeleteSessionButtonToggle.checked;
        newSettings.showCopySessionButton = elements.showCopySessionButtonToggle.checked;
        newSettings.showScrollToTopButton = elements.showScrollToTopButtonToggle.checked;
        newSettings.showScrollToBottomButton = elements.showScrollToBottomButtonToggle.checked;
        newSettings.showToggleAllContentButton = elements.showToggleAllContentButtonToggle.checked;
        newSettings.showBulkHistoryActions = elements.showBulkHistoryActionsToggle.checked;
        newSettings.showHistoryPreviewBubble = elements.showHistoryPreviewBubbleToggle.checked;
        newSettings.stripedHistoryList = elements.stripedHistoryListToggle.checked;
        newSettings.cryscrollerObserverDelay = parseInt(elements.cryscrollerObserverDelayInput.value, 10) || 500;
        newSettings.showPasteButtonInFooter = elements.showPasteButtonInFooterToggle.checked;
        newSettings.showPasteButtonInEdit = elements.showPasteButtonInEditToggle.checked;
        newSettings.showDiceButton = elements.showDiceButtonToggle.checked;
        newSettings.diceMinValue = elements.diceMinValueInput.value === '' ? null : parseInt(elements.diceMinValueInput.value, 10);
        newSettings.diceMaxValue = elements.diceMaxValueInput.value === '' ? null : parseInt(elements.diceMaxValueInput.value, 10);
        newSettings.showMemoButton = elements.showMemoButtonToggle.checked;
        newSettings.memoHeight = elements.memoHeightInput.value.trim() || DEFAULT_MEMO_HEIGHT;
        newSettings.showClipboardStackButton = elements.showClipboardStackButtonToggle.checked;
        newSettings.clipboardStackHeight = state.settings.clipboardStackHeight;
        newSettings.showTwinEngineSummaryButton = elements.showTwinEngineSummaryButtonToggle.checked;
        newSettings.showUserIcon = elements.showUserIconToggle.checked;
        newSettings.showUserName = elements.showUserNameToggle.checked;
        newSettings.userName = elements.userNameInput.value.trim() || DEFAULT_USER_NAME;
        newSettings.showAiIcon = elements.showAiIconToggle.checked;
        newSettings.showAiName = elements.showAiNameToggle.checked;
        newSettings.aiName = elements.aiNameInput.value.trim() || DEFAULT_AI_NAME;
        newSettings.iconNameFontSize = parseInt(elements.iconNameFontSizeInput.value, 10) || DEFAULT_ICON_NAME_FONT_SIZE;
        newSettings.iconNameOffsetY = (elements.iconNameOffsetYInput.value === '' ? DEFAULT_ICON_NAME_OFFSET_Y : parseInt(elements.iconNameOffsetYInput.value, 10) * -1);
        newSettings.messageIconSize = parseInt(elements.messageIconSizeInput.value, 10) || DEFAULT_MESSAGE_ICON_SIZE;
        newSettings.messageIconOffsetY = (elements.messageIconOffsetYInput.value === '' ? DEFAULT_MESSAGE_ICON_OFFSET_Y : parseInt(elements.messageIconOffsetYInput.value, 10) * -1);
        newSettings.showUserNameBubble = elements.userNameBubbleToggle.checked;
        newSettings.userNameBubbleUseThemeColor = elements.userNameBubbleUseThemeColorToggle.checked;
        newSettings.userNameBubbleColor = elements.userNameBubbleColorInput.value.trim() || DEFAULT_USER_NAME_BUBBLE_COLOR;
        newSettings.userNameBubbleOpacity = elements.userNameBubbleOpacityInput.value === '' ? DEFAULT_USER_NAME_BUBBLE_OPACITY : parseFloat(elements.userNameBubbleOpacityInput.value);
        newSettings.showAiNameBubble = elements.aiNameBubbleToggle.checked;
        newSettings.aiNameBubbleUseThemeColor = elements.aiNameBubbleUseThemeColorToggle.checked;
        newSettings.aiNameBubbleColor = elements.aiNameBubbleColorInput.value.trim() || DEFAULT_AI_NAME_BUBBLE_COLOR;
        newSettings.aiNameBubbleOpacity = elements.aiNameBubbleOpacityInput.value === '' ? DEFAULT_AI_NAME_BUBBLE_OPACITY : parseFloat(elements.aiNameBubbleOpacityInput.value);
        newSettings.disableRetryConfirmation = elements.disableRetryConfirmationToggle.checked;
        newSettings.disableLoadChatConfirmationWhileSending = elements.disableLoadChatConfirmationWhileSendingToggle.checked;
        newSettings.disableDeleteMessageConfirmation = elements.disableDeleteMessageConfirmationToggle.checked;
        newSettings.disableAttachmentConfirmation = elements.disableAttachmentConfirmationToggle.checked;
        newSettings.addPrefixOnImport = elements.addPrefixOnImportToggle.checked;
        newSettings.showTopCollapseButton = elements.showTopCollapseButtonToggle.checked;
        newSettings.showBottomCollapseButton = elements.showBottomCollapseButtonToggle.checked;
        newSettings.persistMessageCollapseState = elements.persistMessageCollapseStateCheckbox.checked;
        newSettings.messageBubbleOpacity = elements.messageBubbleOpacityInput.value === '' ? DEFAULT_MESSAGE_BUBBLE_OPACITY : parseFloat(elements.messageBubbleOpacityInput.value);
        newSettings.chatOverlayOpacity = elements.chatOverlayOpacityInput.value === '' ? DEFAULT_CHAT_OVERLAY_OPACITY : parseFloat(elements.chatOverlayOpacityInput.value);
        newSettings.headerFooterOpacity = elements.headerFooterOpacityInput.value === '' ? DEFAULT_HEADER_FOOTER_OPACITY : parseFloat(elements.headerFooterOpacityInput.value);
        newSettings.messageActionsBackgroundOpacity = elements.messageActionsBackgroundOpacityInput.value === '' ? DEFAULT_MESSAGE_ACTIONS_BACKGROUND_OPACITY : parseFloat(elements.messageActionsBackgroundOpacityInput.value);
        newSettings.toggleButtonTopWidth = parseInt(elements.toggleButtonTopWidthInput.value, 10) || DEFAULT_TOGGLE_BUTTON_TOP_WIDTH;
        newSettings.toggleButtonTopHeight = parseInt(elements.toggleButtonTopHeightInput.value, 10) || DEFAULT_TOGGLE_BUTTON_TOP_HEIGHT;
        newSettings.toggleButtonTopFontSize = parseInt(elements.toggleButtonTopFontSizeInput.value, 10) || DEFAULT_TOGGLE_BUTTON_TOP_FONT_SIZE;
        newSettings.toggleButtonTopOpacity = elements.toggleButtonTopOpacityInput.value === '' ? DEFAULT_TOGGLE_BUTTON_TOP_OPACITY : parseFloat(elements.toggleButtonTopOpacityInput.value);
        newSettings.toggleButtonTopTextCollapse = elements.toggleButtonTopTextCollapseInput.value.trim() || DEFAULT_TOGGLE_BUTTON_TOP_TEXT_COLLAPSE;
        newSettings.toggleButtonTopTextExpand = elements.toggleButtonTopTextExpandInput.value.trim() || DEFAULT_TOGGLE_BUTTON_TOP_TEXT_EXPAND;
        newSettings.toggleButtonBottomFontSize = parseInt(elements.toggleButtonBottomFontSizeInput.value, 10) || DEFAULT_TOGGLE_BUTTON_BOTTOM_FONT_SIZE;
        newSettings.toggleButtonBottomTextCollapse = elements.toggleButtonBottomTextCollapseInput.value.trim() || DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_COLLAPSE;
        newSettings.toggleButtonBottomTextExpand = elements.toggleButtonBottomTextExpandInput.value.trim() || DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_EXPAND;
        newSettings.thoughtSummaryOpacity = elements.thoughtSummaryOpacityInput.value === '' ? DEFAULT_THOUGHT_SUMMARY_OPACITY : parseFloat(elements.thoughtSummaryOpacityInput.value);
        const cryscrollerScrollOpacityInput = document.getElementById('cryscroller-scroll-opacity');
        newSettings.cryscrollerScrollOpacity = cryscrollerScrollOpacityInput.value === '' ? DEFAULT_CRYSCROLLER_SCROLL_OPACITY : parseFloat(cryscrollerScrollOpacityInput.value);
        newSettings.enableCryscrollerScrollOpacity = document.querySelector('.opacity-disable-checkbox[data-target-id="cryscroller-scroll-opacity"]').checked;
        const cryscrollerScrollActiveOpacityInput = document.getElementById('cryscroller-scroll-active-opacity');
        newSettings.cryscrollerScrollActiveOpacity = cryscrollerScrollActiveOpacityInput.value === '' ? DEFAULT_CRYSCROLLER_SCROLL_ACTIVE_OPACITY : parseFloat(cryscrollerScrollActiveOpacityInput.value);
        newSettings.enableCryscrollerScrollActiveOpacity = document.querySelector('.opacity-disable-checkbox[data-target-id="cryscroller-scroll-active-opacity"]').checked;
        newSettings.enableSettingsCryscrollerScroll = elements.enableSettingsCryscrollerScrollToggle.checked;
        newSettings.enableHistoryCryscrollerScroll = elements.enableHistoryCryscrollerScrollToggle.checked;
        newSettings.enableElevation = elements.enableElevationToggle.checked;
        newSettings.enableElevationHover = elements.enableElevationHoverToggle.checked;
        newSettings.autoCloseOtherSettings = elements.autoCloseOtherSettingsToggle.checked;
        newSettings.showSettingsScrollToTopButton = elements.showSettingsScrollToTopButtonToggle.checked;
        newSettings.showSettingsScrollToBottomButton = elements.showSettingsScrollToBottomButtonToggle.checked;
        newSettings.showApiProviderToggleHeader = elements.showApiProviderToggleHeaderCheckbox.checked;
        newSettings.showApiProviderToggleFooter = elements.showApiProviderToggleFooterCheckbox.checked;
        newSettings.showHeaderCycleApiKeyBtn = elements.showHeaderCycleApiKeyBtnToggle.checked;
        newSettings.showFooterCycleApiKeyBtn = elements.showFooterCycleApiKeyBtnToggle.checked;
        newSettings.apiProviderCycle = {
            gemini: elements.apiProviderCycleGeminiCheckbox.checked,
            deepseek: elements.apiProviderCycleDeepSeekCheckbox.checked,
            claude: elements.apiProviderCycleClaudeCheckbox.checked,
            openai: elements.apiProviderCycleOpenAICheckbox.checked,
            xai: elements.apiProviderCycleXaiCheckbox.checked,
            llmaggregator: elements.apiProviderCycleLlmAggregatorCheckbox.checked,
            dummy: elements.apiProviderCycleDummyCheckbox.checked,
        };
        newSettings.dummyErrorDebugMode = elements.dummyErrorDebugModeCheckbox.checked;
        newSettings.dummyTwinEngineDebugMode = elements.dummyTwinEngineDebugModeCheckbox.checked;
        newSettings.dummyDummyModel = elements.dummyDummyModelInput.value.trim();
        newSettings.dummyEnableDummyModel = elements.dummyEnableDummyModelCheckbox.checked;
        newSettings.enableProofreading = elements.enableProofreadingCheckbox.checked;
        newSettings.enableWebhookNotification = elements.enableWebhookNotificationToggle.checked;
        const firstDeleteConfirmCheckbox = document.querySelector('.js-disable-delete-api-key-confirmation-toggle');
        if (firstDeleteConfirmCheckbox) {
            newSettings.disableDeleteApiKeyConfirmation = firstDeleteConfirmCheckbox.checked;
        }
        const firstDuplicateRemoveCheckbox = document.querySelector('.js-remove-duplicate-api-keys-toggle');
        if (firstDuplicateRemoveCheckbox) {
            newSettings.removeDuplicateApiKeys = firstDuplicateRemoveCheckbox.checked;
        }
        document.querySelectorAll('#settings-screen details[id]').forEach(details => {
            newSettings.settingsUIDetailsOpenStates[details.id] = details.open;
        });
        if (!newSettings.apiProviderCycle[newSettings.apiProvider]) {
            const enabledProvider = Object.entries(newSettings.apiProviderCycle).find(([, enabled]) => enabled)?.[0];
            if (enabledProvider) {
                newSettings.apiProvider = enabledProvider;
            }
        }
        newSettings.twinEngineEnableFullAuto = elements.twinEngineEnableFullAutoToggle.checked;
        newSettings.showFooterTwinEngineToggleButton = elements.showFooterTwinEngineToggleButtonToggle.checked;
        newSettings.showFooterResummarizeButton = elements.showFooterResummarizeButtonToggle.checked;
        const summarizeAfter = parseInt(elements.twinEngineSummarizeAfterTurnsInput.value, 10);
        newSettings.twinEngineSummarizeAfterTurns = isNaN(summarizeAfter) || summarizeAfter < 0 ? DEFAULT_TWIN_ENGINE_SUMMARIZE_AFTER_TURNS : summarizeAfter;
        const initialTurnsToInclude = parseInt(document.getElementById('twin-engine-initial-turns-to-include').value, 10);
        newSettings.twinEngineInitialTurnsToInclude = isNaN(initialTurnsToInclude) || initialTurnsToInclude < 0 ? 0 : initialTurnsToInclude;
        newSettings.twinEngineSummaryPrompt = elements.twinEngineSummaryPromptInput.value.trim();
        newSettings.twinEngineDummyUser = elements.twinEngineDummyUserInput.value.trim();
        newSettings.twinEngineEnableDummyUser = elements.twinEngineEnableDummyUserCheckbox.checked;
        newSettings.twinEngineDummyModel = elements.twinEngineDummyModelInput.value.trim();
        newSettings.twinEngineEnableDummyModel = elements.twinEngineEnableDummyModelCheckbox.checked;
        newSettings.twinEngineConcatDummyModel = elements.twinEngineConcatDummyModelCheckbox.checked;
        newSettings.enableImageUrlReplacement = elements.enableImageUrlReplacementCheckbox.checked;
        newSettings.imageUrlReplacementBase = elements.imageUrlReplacementBaseInput.value.trim();
        newSettings.characterNamesList = elements.characterNamesListTextarea.value.trim();
        newSettings.enableRomajiToKatakanaConversion = elements.enableRomajiToKatakanaConversionCheckbox.checked;
        newSettings.enableAutoBaseUrlDetection = elements.enableAutoBaseUrlDetectionCheckbox.checked;
        newSettings.enableFuzzySearchNormalization = elements.enableFuzzySearchNormalizationCheckbox.checked;
        const threshold = parseInt(elements.fuzzySearchThresholdInput.value, 10);
        newSettings.fuzzySearchThreshold = isNaN(threshold) || threshold < 0 ? 1 : threshold;
        newSettings.proofreadingApiConfigs = state.settings.proofreadingApiConfigs;
        newSettings.activeProofreadingConfigId = state.settings.activeProofreadingConfigId;
        newSettings.webhooks = state.settings.webhooks.map(webhook => {
            const itemElement = elements.webhooksList.querySelector(`[data-webhook-id="${webhook.id}"]`);
            if (itemElement) {
                return {
                    ...webhook,
                    enabled: itemElement.querySelector('input[type="checkbox"]').checked,
                    label: itemElement.querySelector('.api-key-item-label').value.trim(),
                    url: itemElement.querySelector('.api-key-item-input').value.trim(),
                    format: itemElement.querySelector('select').value
                };
            }
            return webhook;
        });
        try {
            const oldSortOrder = state.settings.historySortOrder;
            const { backgroundImageBlob, historyBackgroundImageBlob, settingsBackgroundImageBlob, userIconBlob, aiIconBlob, ...settingsToSave } = newSettings;
            const promises = Object.entries(settingsToSave).map(([key, value]) => dbUtils.saveSetting(key, value));
            await Promise.all(promises);
            state.settings = newSettings;
            if (showNotice && !state.settings.disableSaveSettingsConfirmation) {
                await uiUtils.showCustomAlert("設定を保存しました。");
            }
        }
        catch (error) {
            await uiUtils.showCustomAlert(`設定の保存中にエラーが発生しました: ${error}`);
        }
    },
    async updateApp() {
        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
            await uiUtils.showCustomAlert("Service Workerが検出されませんでした。ページをリロードしてから再試行してください。");
            return;
        }
        const confirmed = await uiUtils.showCustomConfirm("アプリのキャッシュをクリアして最新版を再取得しますか？ (ページがリロードされます)");
        if (confirmed) {
            navigator.serviceWorker.ready.then(reg => {
                if (reg.active) {
                    reg.active.postMessage({ action: 'clearCache' });
                }
                else {
                    uiUtils.showCustomAlert("アクティブなService Workerが見つかりません。手動でリロードが必要かもしれません。");
                }
            }).catch(async (err) => {
                await uiUtils.showCustomAlert("Service Workerの準備中にエラーが発生しました。");
            });
        }
    },
    async confirmClearAllData() {
        const confirmed = await uiUtils.showCustomConfirm("本当にすべてのデータ（チャット履歴と設定）を削除しますか？この操作は元に戻せません。");
        if (confirmed) {
            try {
                uiUtils.revokeExistingObjectUrl();
                uiUtils.revokeExistingIconUrls();
                await dbUtils.clearAllData();
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                }
                catch (e) { }
                await uiUtils.showCustomAlert("すべてのデータが削除されました。初期状態に戻ります。");
                window.location.reload();
            }
            catch (error) {
                await uiUtils.showCustomAlert(`データ削除中にエラーが発生しました: ${error}`);
            }
        }
    },
    async confirmClearAllHistory() {
        const confirmed = await uiUtils.showCustomConfirm("本当にすべてのチャット履歴を削除しますか？\nこの操作は元に戻せません。設定は保持されます。");
        if (confirmed) {
            try {
                await dbUtils.clearAllChatsStore();
                await uiUtils.showCustomAlert("すべてのチャット履歴が削除されました。画面をリロードします。");
                window.location.reload();
            }
            catch (error) {
                await uiUtils.showCustomAlert(`チャット履歴の削除中にエラーが発生しました: ${error}`);
            }
        }
    },
    async commitAllOpenEdits() {
        const editingElements = elements.messageContainer.querySelectorAll('.message.editing');
        if (editingElements.length === 0)
            return;
        let needsDbSave = false;
        for (const messageElement of editingElements) {
            const index = parseInt(messageElement.dataset.index, 10);
            const textarea = messageElement.querySelector('.edit-textarea');
            if (textarea && state.currentMessages[index]) {
                const newContent = textarea.value;
                if (state.currentMessages[index].content !== newContent) {
                    state.currentMessages[index].content = newContent;
                    uiUtils.updateFinalizedMessageContent(index, newContent);
                    needsDbSave = true;
                }
            }
            this.finishEditing(messageElement);
        }
        if (needsDbSave)
            await dbUtils.saveChat();
    },
    async startEditMessage(index, messageElement) {
        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中は編集できません。");
            return;
        }
        if (state.editingMessageIndex === index) {
            messageElement.querySelector('.edit-textarea')?.focus();
            return;
        }
        const message = state.currentMessages[index];
        if (!message)
            return;
        const rawContent = message.content;
        const contentDiv = messageElement.querySelector('.message-content');
        const editArea = messageElement.querySelector('.message-edit-area');
        const cascadeControls = messageElement.querySelector('.message-cascade-controls');
        editArea.innerHTML = '';
        let horizontalPadding = 0;
        try {
            const computedStyle = window.getComputedStyle(messageElement);
            const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
            horizontalPadding = paddingLeft + paddingRight;
        }
        catch (e) {
        }
        messageElement.style.width = `calc(var(--message-max-width) + ${horizontalPadding}px + 17px)`;
        const textarea = document.createElement('textarea');
        textarea.value = rawContent;
        textarea.classList.add('edit-textarea');
        textarea.rows = 3;
        textarea.oninput = () => uiUtils.adjustTextareaHeight(textarea, 400);
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-edit-actions');
        if (state.settings.showPasteButtonInEdit) {
            const pasteButton = document.createElement('button');
            pasteButton.textContent = '貼';
            pasteButton.title = 'テキストエリアに貼り付け';
            pasteButton.style.backgroundColor = 'var(--bg-button-paste)';
            pasteButton.style.marginRight = 'auto';
            pasteButton.onclick = async () => {
                const originalText = pasteButton.textContent;
                const originalTitle = pasteButton.title;
                try {
                    if (!navigator.clipboard || !navigator.clipboard.readText) {
                        pasteButton.textContent = "!";
                        pasteButton.title = "クリップボードAPI非対応";
                        pasteButton.disabled = true;
                        setTimeout(() => {
                            pasteButton.textContent = originalText;
                            pasteButton.title = originalTitle;
                            pasteButton.disabled = false;
                        }, 2000);
                        return;
                    }
                    const textToPaste = await navigator.clipboard.readText();
                    if (textToPaste) {
                        const currentText = textarea.value;
                        const selectionStart = textarea.selectionStart;
                        const selectionEnd = textarea.selectionEnd;
                        textarea.value = currentText.substring(0, selectionStart) + textToPaste + currentText.substring(selectionEnd);
                        textarea.selectionStart = textarea.selectionEnd = selectionStart + textToPaste.length;
                        textarea.focus();
                        uiUtils.adjustTextareaHeight(textarea, 400);
                        pasteButton.textContent = "✓";
                        pasteButton.title = "貼り付け完了";
                        setTimeout(() => {
                            pasteButton.textContent = originalText;
                            pasteButton.title = originalTitle;
                        }, 1500);
                    }
                    else {
                        pasteButton.textContent = "空";
                        pasteButton.title = "クリップボードは空です";
                        setTimeout(() => {
                            pasteButton.textContent = originalText;
                            pasteButton.title = originalTitle;
                        }, 1500);
                    }
                }
                catch (err) {
                    if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                        pasteButton.textContent = "!";
                        pasteButton.title = "クリップボードの許可なし";
                    }
                    else {
                        pasteButton.textContent = "X";
                        pasteButton.title = "貼り付け失敗";
                    }
                    pasteButton.disabled = true;
                    setTimeout(() => {
                        pasteButton.textContent = originalText;
                        pasteButton.title = originalTitle;
                        pasteButton.disabled = false;
                    }, 2000);
                }
            };
            actionsDiv.appendChild(pasteButton);
        }
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.classList.add('save-edit-btn');
        saveButton.onclick = () => this.saveEditMessage(index, messageElement);
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'キャンセル';
        cancelButton.classList.add('cancel-edit-btn');
        cancelButton.onclick = () => this.cancelEditMessage(index, messageElement);
        actionsDiv.appendChild(saveButton);
        actionsDiv.appendChild(cancelButton);
        editArea.appendChild(textarea);
        editArea.appendChild(actionsDiv);
        messageElement.classList.add('editing');
        if (contentDiv)
            contentDiv.classList.add('hidden');
        if (cascadeControls)
            cascadeControls.classList.add('hidden');
        editArea.classList.remove('hidden');
        uiUtils.adjustTextareaHeight(textarea, 400);
        textarea.focus();
        textarea.select();
        this.uncollapseMessage(index, messageElement);
    },
    async saveEditMessage(originalIndex, messageElement) {
        // DOM上の位置から最新のインデックスを取得し直す
        const currentIndex = parseInt(messageElement.dataset.index, 10);
        // 念のため配列範囲チェック
        if (isNaN(currentIndex) || !state.currentMessages[currentIndex]) {
            // 見つからない場合は強制終了（UIだけ戻す）
            this.finishEditing(messageElement);
            return;
        }
        const textarea = messageElement.querySelector('.edit-textarea');
        if (!textarea) {
            this.cancelEditMessage(currentIndex, messageElement);
            return;
        }
        const newRawContent = textarea.value;
        const originalMessage = state.currentMessages[currentIndex];
        if (newRawContent === originalMessage.content) {
            this.cancelEditMessage(currentIndex, messageElement);
            return;
        }
        originalMessage.content = newRawContent;
        originalMessage.timestamp = Date.now();
        delete originalMessage.error;
        const contentDiv = messageElement.querySelector('.message-content');
        if (originalMessage.role === 'user') {
            contentDiv.innerHTML = '';
            if (originalMessage.attachments && originalMessage.attachments.length > 0) {
                const details = document.createElement('details');
                details.classList.add('attachment-details');
                const summary = document.createElement('summary');
                summary.textContent = `添付ファイル (${originalMessage.attachments.length}件)`;
                details.appendChild(summary);
                const list = document.createElement('ul');
                list.classList.add('attachment-list');
                originalMessage.attachments.forEach((att, attachmentIndex) => {
                    const listItem = document.createElement('li');
                    listItem.dataset.attachmentIndex = attachmentIndex;
                    const itemContainer = document.createElement('div');
                    itemContainer.classList.add('attachment-list-item-container');
                    const nameSpan = document.createElement('span');
                    nameSpan.classList.add('attachment-list-item-name');
                    nameSpan.textContent = sanitizeText(att.name);
                    nameSpan.title = `${sanitizeText(att.name)} (${sanitizeText(att.mimeType)})`;
                    const actionsDiv = document.createElement('div');
                    actionsDiv.classList.add('attachment-actions');
                    if (att.mimeType.startsWith('image/')) {
                        const previewBtn = document.createElement('button');
                        previewBtn.textContent = '表示';
                        previewBtn.classList.add('attachment-preview-btn');
                        previewBtn.onclick = (e) => { e.preventDefault(); appLogic.previewAttachment(index, attachmentIndex); };
                        actionsDiv.appendChild(previewBtn);
                    }
                    const editBtn = document.createElement('button');
                    editBtn.textContent = '編集';
                    editBtn.classList.add('attachment-edit-btn');
                    editBtn.onclick = (e) => { e.preventDefault(); appLogic.editAttachment(index, attachmentIndex); };
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '削除';
                    removeBtn.classList.add('attachment-remove-btn');
                    removeBtn.onclick = (e) => { e.preventDefault(); appLogic.removeAttachment(index, attachmentIndex, listItem); };
                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(removeBtn);
                    itemContainer.appendChild(nameSpan);
                    itemContainer.appendChild(actionsDiv);
                    listItem.appendChild(itemContainer);
                    list.appendChild(listItem);
                });
                details.appendChild(list);
                const addMoreBtn = document.createElement('button');
                addMoreBtn.textContent = 'ファイルを追加';
                addMoreBtn.classList.add('add-more-attachments-btn');
                addMoreBtn.onclick = (e) => { e.preventDefault(); appLogic.addMoreAttachments(index, list); };
                details.appendChild(addMoreBtn);
                contentDiv.appendChild(details);
            }
            if (newRawContent && newRawContent.trim() !== '') {
                const pre = document.createElement('pre');
                pre.textContent = newRawContent;
                pre.style.marginTop = (originalMessage.attachments && originalMessage.attachments.length > 0) ? '8px' : '0';
                contentDiv.appendChild(pre);
            }
        }
        else if (originalMessage.role === 'model') {
            if (contentDiv && typeof marked !== 'undefined') {
                try {
                    const safeHtml = uiUtils._sanitizeAndParseMarkdown(newRawContent || '');
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = safeHtml;
                    uiUtils.processInteractivePlaceholders(tempDiv);
                    uiUtils.processInteractiveTitles(tempDiv);
                    contentDiv.innerHTML = tempDiv.innerHTML;
                    uiUtils.addCopyButtonsToCodeBlocks(contentDiv, false);
                    uiUtils.addImageClickListeners(contentDiv);
                }
                catch (e) {
                    contentDiv.textContent = newRawContent;
                }
            }
            else if (contentDiv) {
                contentDiv.textContent = newRawContent;
            }
        }
        this.finishEditing(messageElement);
        const isFirstUserMessage = (index === state.currentMessages.findIndex(m => m.role === 'user'));
        let titleForSave = null;
        try {
            if (isFirstUserMessage) {
                const existingChat = state.currentChatId ? await dbUtils.getChat(state.currentChatId) : null;
                titleForSave = existingChat?.title || newRawContent.substring(0, 50) || "無題のチャット";
            }
            await dbUtils.saveChat(titleForSave);
            if (isFirstUserMessage) {
                uiUtils.updateChatTitle(titleForSave);
            }
        }
        catch (error) {
            await uiUtils.showCustomAlert("メッセージ編集後のチャット保存に失敗しました。");
        }
    },
    cancelEditMessage(index, messageElement = null) {
        if (!messageElement) {
            messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
        }
        if (messageElement) {
            this.finishEditing(messageElement);
        }
        else if (state.editingMessageIndex === index) {
            state.editingMessageIndex = null;
        }
    },
    finishEditing(messageElement) {
        if (!messageElement)
            return;
        const editArea = messageElement.querySelector('.message-edit-area');
        const contentDiv = messageElement.querySelector('.message-content');
        const cascadeControls = messageElement.querySelector('.message-cascade-controls');
        const textarea = messageElement.querySelector('.edit-textarea');
        messageElement.style.removeProperty('width');
        messageElement.classList.remove('editing');
        if (contentDiv)
            contentDiv.classList.remove('hidden');
        if (cascadeControls)
            cascadeControls.classList.remove('hidden');
        if (editArea) {
            editArea.classList.add('hidden');
            editArea.innerHTML = '';
        }
    },
    async copyMessageText(index, buttonElement) {
        const message = state.currentMessages[index];
        if (!message)
            return;
        let textToCopy = message.content;
        if (!textToCopy && message.role === 'user' && message.attachments && message.attachments.length > 0) {
            textToCopy = `[添付ファイル: ${message.attachments.map(a => a.name).join(', ')}]`;
        }
        else if (!textToCopy) {
            textToCopy = "";
        }
        try {
            await navigator.clipboard.writeText(textToCopy);
            const originalText = buttonElement.textContent;
            buttonElement.textContent = '完了！';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 1500);
        }
        catch (err) {
            await uiUtils.showCustomAlert("OSクリップボードへのコピーに失敗しました。");
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'コピー失敗';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 2000);
        }
        const currentStackContent = elements.clipboardStackEditor.value;
        const separator = currentStackContent.length > 0 && !currentStackContent.endsWith('\n\n') ? "\n\n" : "";
        elements.clipboardStackEditor.value += separator + textToCopy;
        state.clipboardStackContent = elements.clipboardStackEditor.value;
        elements.clipboardStackEditor.scrollTop = elements.clipboardStackEditor.scrollHeight;
    },
    async deleteMessage(index) {
        await this.commitAllOpenEdits();
        if (state.editingMessageIndex === index) {
            this.cancelEditMessage(index);
        }
        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中は削除できません。");
            return;
        }
        if (index < 0 || index >= state.currentMessages.length) {
            return;
        }
        const messageToDelete = state.currentMessages[index];
        const messageContentPreview = messageToDelete.content.substring(0, 30) + "...";
        let confirmMessage = "";
        let indicesToDelete = [];
        if (messageToDelete.role === 'model' && messageToDelete.isCascaded && messageToDelete.siblingGroupId) {
            const groupId = messageToDelete.siblingGroupId;
            const siblings = state.currentMessages.filter(msg => msg.role === 'model' && msg.isCascaded && msg.siblingGroupId === groupId);
            indicesToDelete = state.currentMessages
                .map((msg, i) => (msg.role === 'model' && msg.isCascaded && msg.siblingGroupId === groupId) ? i : -1)
                .filter(i => i !== -1);
            confirmMessage = `「${messageContentPreview}」を含む応答グループ全体 (${siblings.length}件) を削除しますか？`;
        }
        else {
            indicesToDelete.push(index);
            confirmMessage = `メッセージ「${messageContentPreview}」(${messageToDelete.role}) を削除しますか？`;
        }
        let confirmedDelete = true;
        if (!state.settings.disableDeleteMessageConfirmation) {
            confirmedDelete = await uiUtils.showCustomConfirm(confirmMessage);
        }
        if (confirmedDelete) {
            const originalFirstUserMsgIndex = state.currentMessages.findIndex(m => m.role === 'user');
            indicesToDelete.sort((a, b) => b - a).forEach(idx => {
                state.currentMessages.splice(idx, 1);
                state.messageCollapsedStates.delete(idx);
                state.thoughtSummaryOpenStates.delete(idx);
            });
            const oldCollapsedStates = new Map(state.messageCollapsedStates);
            state.messageCollapsedStates.clear();
            state.currentMessages.forEach((msg, newIdx) => {
                const oldIdxEquivalent = newIdx >= Math.min(...indicesToDelete) ? newIdx + indicesToDelete.filter(i => i <= newIdx).length : newIdx;
                if (oldCollapsedStates.has(oldIdxEquivalent)) {
                    state.messageCollapsedStates.set(newIdx, oldCollapsedStates.get(oldIdxEquivalent));
                }
                else {
                    state.messageCollapsedStates.set(newIdx, false);
                }
            });
            const oldThoughtOpenStates = new Map(state.thoughtSummaryOpenStates);
            state.thoughtSummaryOpenStates.clear();
            state.currentMessages.forEach((msg, newIdx) => {
                const oldIdxEquivalent = newIdx >= Math.min(...indicesToDelete) ? newIdx + indicesToDelete.filter(i => i <= newIdx).length : newIdx;
                if (oldThoughtOpenStates.has(oldIdxEquivalent)) {
                    state.thoughtSummaryOpenStates.set(newIdx, oldThoughtOpenStates.get(oldIdxEquivalent));
                }
                else {
                    const messageApiProvider = msg?.generatedByApiProvider || state.settings.apiProvider;
                    state.thoughtSummaryOpenStates.set(newIdx, (messageApiProvider === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                        (messageApiProvider === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                        (messageApiProvider === 'claude' && state.settings.claudeExpandThoughtsByDefault));
                }
            });
            uiUtils.renderChatMessages(true, true);
            const newFirstUserMsgIndex = state.currentMessages.findIndex(m => m.role === 'user');
            let requiresTitleUpdate = indicesToDelete.includes(originalFirstUserMsgIndex);
            try {
                let newTitleForSave = null;
                const currentChatData = state.currentChatId ? await dbUtils.getChat(state.currentChatId) : null;
                if (requiresTitleUpdate) {
                    const newFirstUserMessage = newFirstUserMsgIndex !== -1 ? state.currentMessages[newFirstUserMsgIndex] : null;
                    newTitleForSave = newFirstUserMessage ? newFirstUserMessage.content.substring(0, 50) : "無題のチャット";
                }
                else if (currentChatData) {
                    newTitleForSave = currentChatData.title;
                }
                await dbUtils.saveChat(newTitleForSave);
                if (requiresTitleUpdate) {
                    uiUtils.updateChatTitle(newTitleForSave);
                }
                if (state.currentMessages.length === 0 && state.currentChatId) {
                    this.startNewChat();
                }
            }
            catch (error) {
                await uiUtils.showCustomAlert("メッセージ削除後のチャット保存に失敗しました。");
            }
        }
    },
    findPreviousUserIndex(modelMessageIndex) {
        for (let i = modelMessageIndex - 1; i >= 0; i--) {
            if (state.currentMessages[i].role === 'user') {
                return i;
            }
        }
        return -1;
    },
    async retryFromMessage(index) {
        await this.commitAllOpenEdits();
        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中です。");
            return;
        }
        const userMessage = state.currentMessages[index];
        if (!userMessage || userMessage.role !== 'user')
            return;
        let confirmed = true;
        if (!state.settings.disableRetryConfirmation) {
            const messageContentPreview = userMessage.content.substring(0, 30) + "...";
            confirmed = await uiUtils.showCustomConfirm(`「${messageContentPreview}」から再生成しますか？\n(この入力に対する既存の応答は保持されますが、**これより未来の会話履歴は削除されます**)`);
        }
        if (confirmed) {
            const isTwinEngineAutoOn = state.settings.showTwinEngineSettings && state.settings.twinEngineEnableFullAuto;
            const messagesUpToRetryPoint = state.currentMessages.slice(0, index + 1);
            const userTurnsUpToRetryPoint = messagesUpToRetryPoint.filter(msg => msg.role === 'user').length;
            const summarizeAfterTurns = state.settings.twinEngineSummarizeAfterTurns || 0;
            if (isTwinEngineAutoOn && userTurnsUpToRetryPoint > summarizeAfterTurns) {
                state.isSummarizingForRetry = true;
                uiUtils.updateLoadingIndicator();
                elements.sendButton.disabled = true;
                elements.userInput.disabled = true;
                try {
                    const response = await this.summarizeCurrentSession(messagesUpToRetryPoint);
                    if (response && response.content) {
                        state.twinEngineSummaryContent = response.content.trim() + "\n\n";
                        elements.twinEngineSummaryEditor.value = state.twinEngineSummaryContent;
                    }
                }
                catch (error) {
                    await uiUtils.showCustomAlert(`リトライ前の要約処理中にエラーが発生しました: ${error.message}`);
                    state.isSummarizingForRetry = false;
                    uiUtils.updateLoadingIndicator();
                    elements.sendButton.disabled = false;
                    elements.userInput.disabled = false;
                    return;
                }
                finally {
                    state.isSummarizingForRetry = false;
                    uiUtils.updateLoadingIndicator();
                }
            }
            let deleteStartIndex = -1;
            let scanIndex = index + 1;
            let targetSiblingGroupId = null;
            if (scanIndex < state.currentMessages.length && state.currentMessages[scanIndex].role === 'model') {
                targetSiblingGroupId = state.currentMessages[scanIndex].siblingGroupId || null;
            }
            if (targetSiblingGroupId !== null) {
                while (scanIndex < state.currentMessages.length &&
                    state.currentMessages[scanIndex].role === 'model' &&
                    state.currentMessages[scanIndex].siblingGroupId === targetSiblingGroupId) {
                    scanIndex++;
                }
            }
            else {
                if (scanIndex < state.currentMessages.length && state.currentMessages[scanIndex].role === 'model') {
                    scanIndex++;
                }
            }
            if (scanIndex < state.currentMessages.length) {
                deleteStartIndex = scanIndex;
            }
            if (deleteStartIndex !== -1) {
                for (let i = deleteStartIndex; i < state.currentMessages.length; i++) {
                    state.messageCollapsedStates.delete(i);
                    state.thoughtSummaryOpenStates.delete(i);
                }
                state.currentMessages.splice(deleteStartIndex);
            }
            uiUtils.renderChatMessages();
            if (state.settings.autoScrollOnNewMessage)
                uiUtils.scrollToBottom();
            const elementsToHide = [];
            const messageContainer = elements.messageContainer;
            if (targetSiblingGroupId) {
                messageContainer.querySelectorAll(`.message.model[data-index]`).forEach(el => {
                    const msgIndex = parseInt(el.dataset.index, 10);
                    const potentialMsg = state.currentMessages[msgIndex];
                    if (potentialMsg && potentialMsg.role === 'model' && potentialMsg.siblingGroupId === targetSiblingGroupId) {
                        el.classList.add('retrying-hidden');
                        elementsToHide.push(el);
                    }
                });
            }
            else if (index + 1 < state.currentMessages.length && state.currentMessages[index + 1]?.role === 'model') {
                const element = messageContainer.querySelector(`.message.model[data-index="${index + 1}"]`);
                if (element) {
                    element.classList.add('retrying-hidden');
                    elementsToHide.push(element);
                }
            }
            await this.handleSend(true, index);
        }
    },
    getCascadedSiblings(index, includeSelf = false) {
        const targetMsg = state.currentMessages[index];
        if (!targetMsg || !targetMsg.isCascaded || !targetMsg.siblingGroupId) {
            return [];
        }
        const groupId = targetMsg.siblingGroupId;
        const siblings = state.currentMessages.filter((msg, i) => msg.role === 'model' &&
            msg.isCascaded &&
            msg.siblingGroupId === groupId &&
            (includeSelf || i !== index));
        return siblings;
    },
    async navigateCascade(currentIndex, direction) {
        await this.commitAllOpenEdits();
        const currentMsg = state.currentMessages[currentIndex];
        if (!currentMsg || !currentMsg.isCascaded || !currentMsg.siblingGroupId)
            return;
        const groupId = currentMsg.siblingGroupId;
        const siblingsWithIndices = state.currentMessages
            .map((msg, i) => ({ msg, originalIndex: i }))
            .filter(item => item.msg.role === 'model' && item.msg.isCascaded && item.msg.siblingGroupId === groupId);
        const currentSiblingIndexInGroup = siblingsWithIndices.findIndex(item => item.originalIndex === currentIndex);
        if (currentSiblingIndexInGroup === -1)
            return;
        let targetSiblingIndexInGroup = -1;
        if (direction === 'prev' && currentSiblingIndexInGroup > 0) {
            targetSiblingIndexInGroup = currentSiblingIndexInGroup - 1;
        }
        else if (direction === 'next' && currentSiblingIndexInGroup < siblingsWithIndices.length - 1) {
            targetSiblingIndexInGroup = currentSiblingIndexInGroup + 1;
        }
        if (targetSiblingIndexInGroup !== -1) {
            currentMsg.isSelected = false;
            const newlySelectedMessage = siblingsWithIndices[targetSiblingIndexInGroup].msg;
            newlySelectedMessage.isSelected = true;
            const newlySelectedIndex = siblingsWithIndices[targetSiblingIndexInGroup].originalIndex;
            uiUtils.renderChatMessages(true, true);
            requestAnimationFrame(() => {
                const newlySelectedElement = elements.messageContainer.querySelector(`.message[data-index="${newlySelectedIndex}"]`);
                if (newlySelectedElement && !newlySelectedElement.classList.contains('editing')) {
                    const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                    if (currentlyShown && currentlyShown !== newlySelectedElement) {
                        currentlyShown.classList.remove('show-actions');
                    }
                    newlySelectedElement.classList.add('show-actions');
                }
            });
            try {
                await dbUtils.saveChat();
            }
            catch (error) {
                await uiUtils.showCustomAlert("応答の切り替え状態の保存に失敗しました。");
            }
        }
    },
    async confirmDeleteCascadeResponse(indexToDelete) {
        await this.commitAllOpenEdits();
        const msgToDelete = state.currentMessages[indexToDelete];
        if (!msgToDelete || msgToDelete.role !== 'model' || !msgToDelete.isCascaded || !msgToDelete.siblingGroupId) {
            return;
        }
        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中は削除できません。");
            return;
        }
        const siblings = this.getCascadedSiblings(indexToDelete, true);
        const currentIndexInGroup = siblings.findIndex(m => m === msgToDelete) + 1;
        const totalSiblings = siblings.length;
        const contentPreview = msgToDelete.content.substring(0, 30) + "...";
        const confirmMsgText = `この応答 (${currentIndexInGroup}/${totalSiblings})「${contentPreview}」を削除しますか？\n(この応答のみが削除されます)`;
        let confirmed = true;
        if (!state.settings.disableDeleteMessageConfirmation) {
            confirmed = await uiUtils.showCustomConfirm(confirmMsgText);
        }
        if (confirmed) {
            const wasSelected = msgToDelete.isSelected;
            const groupId = msgToDelete.siblingGroupId;
            state.currentMessages.splice(indexToDelete, 1);
            state.messageCollapsedStates.delete(indexToDelete);
            state.thoughtSummaryOpenStates.delete(indexToDelete);
            const oldCollapsedStates = new Map(state.messageCollapsedStates);
            state.messageCollapsedStates.clear();
            state.currentMessages.forEach((msg, newIdx) => {
                const oldIdxEquivalent = newIdx >= indexToDelete ? newIdx + 1 : newIdx;
                if (oldCollapsedStates.has(oldIdxEquivalent)) {
                    state.messageCollapsedStates.set(newIdx, oldCollapsedStates.get(oldIdxEquivalent));
                }
                else {
                    state.messageCollapsedStates.set(newIdx, false);
                }
            });
            const oldThoughtOpenStates = new Map(state.thoughtSummaryOpenStates);
            state.thoughtSummaryOpenStates.clear();
            state.currentMessages.forEach((msg, newIdx) => {
                const oldIdxEquivalent = newIdx >= indexToDelete ? newIdx + 1 : newIdx;
                if (oldThoughtOpenStates.has(oldIdxEquivalent)) {
                    state.thoughtSummaryOpenStates.set(newIdx, oldThoughtOpenStates.get(oldIdxEquivalent));
                }
                else {
                    const messageApiProvider = msg?.generatedByApiProvider || state.settings.apiProvider;
                    state.thoughtSummaryOpenStates.set(newIdx, (messageApiProvider === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                        (messageApiProvider === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                        (messageApiProvider === 'claude' && state.settings.claudeExpandThoughtsByDefault));
                }
            });
            let newlySelectedIndex = -1;
            const remainingSiblingsWithIndices = state.currentMessages.map((msg, i) => ({ msg, originalIndex: i }))
                .filter(item => item.msg.role === 'model' && item.msg.isCascaded && item.msg.siblingGroupId === groupId);
            if (remainingSiblingsWithIndices.length > 0) {
                if (wasSelected) {
                    const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
                    if (!lastSiblingItem.msg.isSelected) {
                        lastSiblingItem.msg.isSelected = true;
                    }
                    newlySelectedIndex = lastSiblingItem.originalIndex;
                }
                else {
                    const stillSelectedItem = remainingSiblingsWithIndices.find(item => item.msg.isSelected);
                    if (stillSelectedItem) {
                        newlySelectedIndex = stillSelectedItem.originalIndex;
                    }
                    else {
                        const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
                        lastSiblingItem.msg.isSelected = true;
                        newlySelectedIndex = lastSiblingItem.originalIndex;
                    }
                }
            }
            uiUtils.renderChatMessages(true);
            requestAnimationFrame(() => {
                if (newlySelectedIndex !== -1) {
                    const elementToShowActions = elements.messageContainer.querySelector(`.message[data-index="${newlySelectedIndex}"]`);
                    if (elementToShowActions && !elementToShowActions.classList.contains('editing')) {
                        const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                        if (currentlyShown && currentlyShown !== elementToShowActions) {
                            currentlyShown.classList.remove('show-actions');
                        }
                        elementToShowActions.classList.add('show-actions');
                    }
                }
            });
            try {
                await dbUtils.saveChat();
            }
            catch (error) {
                await uiUtils.showCustomAlert("応答削除後のチャット状態の保存に失敗しました。");
            }
        }
    },
    async handleFileSelection(fileList) {
        if (!fileList || fileList.length === 0)
            return;
        const newFiles = Array.from(fileList);
        let currentTotalSize = state.selectedFilesForUpload.reduce((sum, item) => sum + item.file.size, 0);
        let addedCount = 0;
        let skippedCount = 0;
        let sizeError = false;
        elements.selectFilesBtn.disabled = true;
        elements.selectFilesBtn.textContent = '処理中...';
        for (const file of newFiles) {
            if (file.size > MAX_FILE_SIZE) {
                await uiUtils.showCustomAlert(`ファイル "${file.name}" はサイズが大きすぎます (${formatFileSize(MAX_FILE_SIZE)}以下)。`);
                skippedCount++;
                continue;
            }
            if (currentTotalSize + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
                sizeError = true;
                skippedCount++;
                continue;
            }
            if (state.selectedFilesForUpload.some(item => item.file.name === file.name)) {
                skippedCount++;
                continue;
            }
            state.selectedFilesForUpload.push({ file: file });
            currentTotalSize += file.size;
            addedCount++;
        }
        elements.selectFilesBtn.disabled = false;
        elements.selectFilesBtn.textContent = 'ファイルを選択';
        if (sizeError) {
            await uiUtils.showCustomAlert(`合計ファイルサイズの上限 (${formatFileSize(MAX_TOTAL_ATTACHMENT_SIZE)}) を超えるため、一部のファイルは追加されませんでした。`);
        }
        uiUtils.updateSelectedFilesUI();
    },
    removeSelectedFile(indexToRemove) {
        if (indexToRemove >= 0 && indexToRemove < state.selectedFilesForUpload.length) {
            const removedFile = state.selectedFilesForUpload.splice(indexToRemove, 1)[0];
            uiUtils.updateSelectedFilesUI();
        }
    },
    async confirmAttachment() {
        if (state.selectedFilesForUpload.length === 0) {
            state.pendingAttachments = [];
            elements.fileUploadDialog.close('ok');
            uiUtils.adjustTextareaHeight();
            uiUtils.updateAttachmentBadgeVisibility();
            return;
        }
        elements.confirmAttachBtn.disabled = true;
        elements.confirmAttachBtn.textContent = '処理中...';
        const attachmentsToAdd = [];
        let encodingError = false;
        for (const item of state.selectedFilesForUpload) {
            const file = item.file;
            try {
                const fileName = file.name;
                const fileExtension = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
                let browserMimeType = file.type || '';
                let guessedMimeType = extensionToMimeTypeMap[fileExtension] || browserMimeType || 'application/octet-stream';
                if (guessedMimeType.startsWith('text/')) {
                    const textData = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (error) => reject(error);
                        reader.readAsText(file);
                    });
                    attachmentsToAdd.push({
                        file: file,
                        name: fileName,
                        mimeType: guessedMimeType,
                        textData: textData,
                        base64Data: null
                    });
                }
                else {
                    const base64Data = await fileToBase64(file);
                    attachmentsToAdd.push({
                        file: file,
                        name: fileName,
                        mimeType: guessedMimeType,
                        base64Data: base64Data,
                        textData: null
                    });
                }
            }
            catch (error) {
                encodingError = true;
                await uiUtils.showCustomAlert(`ファイル "${item.file.name}" の処理中にエラーが発生しました。`);
                break;
            }
        }
        elements.confirmAttachBtn.disabled = false;
        elements.confirmAttachBtn.textContent = '添付して閉じる';
        if (!encodingError) {
            state.pendingAttachments = attachmentsToAdd;
            elements.fileUploadDialog.close('ok');
            uiUtils.adjustTextareaHeight();
            uiUtils.updateAttachmentBadgeVisibility();
        }
    },
    cancelAttachment() {
        state.selectedFilesForUpload = [];
        elements.fileUploadDialog.close('cancel');
        uiUtils.updateAttachmentBadgeVisibility();
    },
    toggleMessageCollapse(index) {
        const messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
        const contentDiv = messageElement?.querySelector('.message-content');
        const toggleButtons = messageElement?.querySelectorAll('.message-toggle-button[data-action="toggle-collapse"]');
        if (contentDiv && toggleButtons && toggleButtons.length > 0) {
            const isCollapsed = contentDiv.classList.toggle('collapsed');
            messageElement.classList.toggle('message-content-collapsed-fully', isCollapsed);
            state.messageCollapsedStates.set(index, isCollapsed);
            if (state.settings.persistMessageCollapseState && state.currentChatId) {
                dbUtils.saveChat();
            }
            toggleButtons.forEach(button => {
                let textCollapse, textExpand, baseTitle;
                if (button.classList.contains('top')) {
                    textCollapse = state.settings.toggleButtonTopTextCollapse;
                    textExpand = state.settings.toggleButtonTopTextExpand;
                }
                else {
                    textCollapse = state.settings.toggleButtonBottomTextCollapse;
                    textExpand = state.settings.toggleButtonBottomTextExpand;
                }
                baseTitle = isCollapsed ? 'メッセージを展開' : 'メッセージを折りたたむ';
                button.textContent = isCollapsed ? textExpand : textCollapse;
                button.title = baseTitle;
                button.setAttribute('aria-label', baseTitle);
            });
        }
    },
    uncollapseMessage(index, messageElement = null) {
        if (!messageElement) {
            messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
        }
        const contentDiv = messageElement?.querySelector('.message-content');
        const toggleButtons = messageElement?.querySelectorAll('.message-toggle-button[data-action="toggle-collapse"]');
        if (contentDiv && contentDiv.classList.contains('collapsed')) {
            contentDiv.classList.remove('collapsed');
            messageElement.classList.remove('message-content-collapsed-fully');
            state.messageCollapsedStates.set(index, false);
            if (state.settings.persistMessageCollapseState && state.currentChatId) {
                dbUtils.saveChat();
            }
            if (toggleButtons) {
                toggleButtons.forEach(button => {
                    let textCollapse;
                    if (button.classList.contains('top')) {
                        textCollapse = state.settings.toggleButtonTopTextCollapse;
                    }
                    else {
                        textCollapse = state.settings.toggleButtonBottomTextCollapse;
                    }
                    button.textContent = textCollapse;
                    button.title = 'メッセージを折りたたむ';
                    button.setAttribute('aria-label', 'メッセージを折りたたむ');
                });
            }
        }
    },
    toggleAllMessagesVisibility() {
        if (state.isSending) {
            uiUtils.showCustomAlert("送信中は操作できません。");
            return;
        }
        state.areAllMessagesHidden = !state.areAllMessagesHidden;
        uiUtils.updateToggleAllContentButton();
        const messages = elements.messageContainer.querySelectorAll('.message:not(.message-error)');
        messages.forEach(msgElement => {
            if (msgElement.id && msgElement.id.startsWith('streaming-message-')) {
                msgElement.classList.remove('message-hidden-by-toggle');
                return;
            }
            msgElement.classList.toggle('message-hidden-by-toggle', state.areAllMessagesHidden);
            if (state.areAllMessagesHidden) {
                msgElement.classList.remove('message-content-collapsed-fully');
                msgElement.querySelector('.message-content')?.classList.remove('collapsed');
            }
        });
        requestAnimationFrame(() => {
            uiUtils.scrollToBottom();
        });
    },
    toggleSessionLink(sessionId) {
        if (!state.settings.enableSessionLinking)
            return;
        const index = state.linkedSessionIds.indexOf(sessionId);
        if (index > -1) {
            state.linkedSessionIds.splice(index, 1);
        }
        else {
            if (state.linkedSessionIds.length >= 2) {
                state.linkedSessionIds.shift();
            }
            state.linkedSessionIds.push(sessionId);
        }
        uiUtils.updateSessionLinkingUI();
    },
    async initiateAiToAiStep() {
        if (state.isAiToAiChatProcessing || state.isSending) {
            await uiUtils.showCustomAlert("現在処理中です。");
            return;
        }
        if (state.linkedSessionIds.length !== 2 || !state.currentChatId || !state.linkedSessionIds.includes(state.currentChatId)) {
            await uiUtils.showCustomAlert("AI間会話を実行するには、現在のチャットを含む2つのセッションをリンクしてください。");
            return;
        }
        const selectedApiProvider = state.settings.apiProvider;
        if ((selectedApiProvider === 'gemini' && !state.settings.apiKey) ||
            (selectedApiProvider === 'deepseek' && !state.settings.deepSeekApiKey) ||
            (selectedApiProvider === 'claude' && !state.settings.claudeApiKey) ||
            (selectedApiProvider === 'openai' && !state.settings.openaiApiKey) ||
            (selectedApiProvider === 'xai' && !state.settings.xaiApiKey) ||
            (selectedApiProvider === 'llmaggregator' && !state.settings.llmAggregatorApiKey)) {
            await uiUtils.showCustomAlert("選択中のAPIプロバイダーのAPIキーが設定されていません。");
            uiUtils.showScreen('settings');
            return;
        }
        uiUtils.setAiToAiProcessingState(true, "AI間会話処理中 (ステップ1/2)...");
        const sessionA_Id = state.currentChatId;
        const sessionB_Id = state.linkedSessionIds.find(id => id !== sessionA_Id);
        try {
            const sessionA_Data = await dbUtils.getChat(sessionA_Id);
            if (!sessionA_Data || !sessionA_Data.messages || sessionA_Data.messages.length === 0) {
                throw new Error(`セッションA (${sessionA_Id}) のデータが取得できませんでした。`);
            }
            const lastAiMessageA = [...sessionA_Data.messages].reverse().find(msg => msg.role === 'model' && (!msg.isCascaded || msg.isSelected));
            if (!lastAiMessageA || !lastAiMessageA.content) {
                throw new Error(`セッションA (${sessionA_Id}) の最新のAI応答が見つかりません。`);
            }
            const inputForB = lastAiMessageA.content;
            const sessionB_Data = await dbUtils.getChat(sessionB_Id);
            if (!sessionB_Data) {
                throw new Error(`セッションB (${sessionB_Id}) のデータが取得できませんでした。`);
            }
            let apiKeyForB, modelNameForB;
            const providerForSettingsB = state.settings.apiProvider;
            if (state.settings.showMultiApiKeys) {
                apiKeyForB = multiApiKeyUtils.getActiveApiKey(providerForSettingsB);
            }
            else {
                switch (providerForSettingsB) {
                    case 'gemini':
                        apiKeyForB = state.settings.apiKey;
                        break;
                    case 'deepseek':
                        apiKeyForB = state.settings.deepSeekApiKey;
                        break;
                    case 'claude':
                        apiKeyForB = state.settings.claudeApiKey;
                        break;
                    case 'openai':
                        apiKeyForB = state.settings.openaiApiKey;
                        break;
                    case 'xai':
                        apiKeyForB = state.settings.xaiApiKey;
                        break;
                    case 'llmaggregator':
                        apiKeyForB = state.settings.llmAggregatorApiKey;
                        break;
                }
            }
            switch (providerForSettingsB) {
                case 'gemini':
                    modelNameForB = state.settings.modelName;
                    break;
                case 'deepseek':
                    modelNameForB = state.settings.deepSeekModelName;
                    break;
                case 'claude':
                    modelNameForB = state.settings.claudeModelName;
                    break;
                case 'openai':
                    modelNameForB = state.settings.openaiModelName;
                    break;
                case 'xai':
                    modelNameForB = state.settings.xaiModelName;
                    break;
                case 'llmaggregator':
                    modelNameForB = state.settings.llmAggregatorModelName;
                    break;
            }
            let systemPromptB, enableSystemPromptDefaultB, dummyUserB, enableDummyUserB, dummyModelB, enableDummyModelB, temperatureB, maxTokensB, topPB, streamingOutputB, streamingSpeedB, concatDummyModelB, geminiTopKB, geminiThinkingBudgetB, geminiIncludeThoughtsB, geminiPseudoStreamingB, geminiEnableGroundingB, deepSeekIncludeThoughtsB, presencePenaltyB, frequencyPenaltyB, claudeTopKB, claudeIncludeThoughtsB, claudeThinkingBudgetB, claudeExpandThoughtsByDefaultB, xaiVisionEnableB, xaiIncludeThoughtsB, xaiReasoningEffortB, llmAggregatorTopKB;
            if (providerForSettingsB === 'gemini') {
                systemPromptB = state.settings.geminiSystemPrompt;
                enableSystemPromptDefaultB = state.settings.geminiEnableSystemPromptDefault;
                temperatureB = state.settings.geminiTemperature;
                maxTokensB = state.settings.geminiMaxTokens;
                geminiTopKB = state.settings.geminiTopK;
                topPB = state.settings.geminiTopP;
                presencePenaltyB = state.settings.geminiPresencePenalty;
                frequencyPenaltyB = state.settings.geminiFrequencyPenalty;
                geminiThinkingBudgetB = state.settings.geminiThinkingBudget;
                geminiIncludeThoughtsB = state.settings.geminiIncludeThoughts;
                streamingOutputB = state.settings.geminiStreamingOutput;
                streamingSpeedB = state.settings.geminiStreamingSpeed;
                dummyUserB = state.settings.geminiDummyUser;
                enableDummyUserB = state.settings.geminiEnableDummyUser;
                dummyModelB = state.settings.geminiDummyModel;
                enableDummyModelB = state.settings.geminiEnableDummyModel;
                concatDummyModelB = state.settings.geminiConcatDummyModel;
                geminiPseudoStreamingB = state.settings.geminiPseudoStreaming;
                geminiEnableGroundingB = state.settings.geminiEnableGrounding;
            }
            else if (providerForSettingsB === 'deepseek') {
                systemPromptB = state.settings.deepSeekSystemPrompt;
                enableSystemPromptDefaultB = state.settings.deepSeekEnableSystemPromptDefault;
                temperatureB = state.settings.deepSeekTemperature;
                maxTokensB = state.settings.deepSeekMaxTokens;
                topPB = state.settings.deepSeekTopP;
                presencePenaltyB = state.settings.deepSeekPresencePenalty;
                frequencyPenaltyB = state.settings.deepSeekFrequencyPenalty;
                contextDeepSeekIncludeThoughts = state.settings.deepSeekIncludeDeepSeekThoughts;
                streamingOutputB = state.settings.deepSeekStreamingOutput;
                streamingSpeedB = state.settings.deepSeekStreamingSpeed;
                dummyUserB = state.settings.deepSeekDummyUser;
                enableDummyUserB = state.settings.deepSeekEnableDummyUser;
                dummyModelB = state.settings.deepSeekDummyModel;
                enableDummyModelB = state.settings.deepSeekEnableDummyModel;
                concatDummyModelB = state.settings.deepSeekConcatDummyModel;
            }
            else if (providerForSettingsB === 'llmaggregator') {
                systemPromptB = state.settings.llmAggregatorSystemPrompt;
                enableSystemPromptDefaultB = state.settings.llmAggregatorEnableSystemPromptDefault;
                temperatureB = state.settings.llmAggregatorTemperature;
                maxTokensB = state.settings.llmAggregatorMaxTokens;
                topPB = state.settings.llmAggregatorTopP;
                llmAggregatorTopKB = state.settings.llmAggregatorTopK;
                presencePenaltyB = state.settings.llmAggregatorPresencePenalty;
                frequencyPenaltyB = state.settings.llmAggregatorFrequencyPenalty;
                contextDeepSeekIncludeThoughts = state.settings.llmAggregatorIncludeThoughts;
                streamingOutputB = state.settings.llmAggregatorStreamingOutput;
                streamingSpeedB = state.settings.llmAggregatorStreamingSpeed;
                dummyUserB = state.settings.llmAggregatorDummyUser;
                enableDummyUserB = state.settings.llmAggregatorEnableDummyUser;
                dummyModelB = state.settings.llmAggregatorDummyModel;
                enableDummyModelB = state.settings.llmAggregatorEnableDummyModel;
                concatDummyModelB = state.settings.llmAggregatorConcatDummyModel;
            }
            else if (providerForSettingsB === 'claude') {
                systemPromptB = state.settings.claudeSystemPrompt;
                enableSystemPromptDefaultB = state.settings.claudeEnableSystemPromptDefault;
                temperatureB = state.settings.claudeTemperature;
                maxTokensB = state.settings.claudeMaxTokens;
                claudeTopKB = state.settings.claudeTopK;
                topPB = state.settings.claudeTopP;
                streamingOutputB = state.settings.claudeStreamingOutput;
                streamingSpeedB = state.settings.claudeStreamingSpeed;
                dummyUserB = state.settings.claudeDummyUser;
                enableDummyUserB = state.settings.claudeEnableDummyUser;
                dummyModelB = state.settings.claudeDummyModel;
                enableDummyModelB = state.settings.claudeEnableDummyModel;
                concatDummyModelB = state.settings.claudeConcatDummyModel;
                claudeIncludeThoughtsB = state.settings.claudeIncludeThoughts;
                claudeThinkingBudgetB = state.settings.claudeThinkingBudget;
                claudeExpandThoughtsByDefaultB = state.settings.claudeExpandThoughtsByDefault;
            }
            else if (providerForSettingsB === 'openai') {
                systemPromptB = state.settings.openaiSystemPrompt;
                enableSystemPromptDefaultB = state.settings.openaiEnableSystemPromptDefault;
                temperatureB = state.settings.openaiTemperature;
                maxTokensB = state.settings.openaiMaxTokens;
                topPB = state.settings.openaiTopP;
                presencePenaltyB = state.settings.openaiPresencePenalty;
                frequencyPenaltyB = state.settings.openaiFrequencyPenalty;
                streamingOutputB = state.settings.openaiStreamingOutput;
                streamingSpeedB = state.settings.openaiStreamingSpeed;
                dummyUserB = state.settings.openaiDummyUser;
                enableDummyUserB = state.settings.openaiEnableDummyUser;
                dummyModelB = state.settings.openaiDummyModel;
                enableDummyModelB = state.settings.openaiEnableDummyModel;
                concatDummyModelB = state.settings.openaiConcatDummyModel;
            }
            else if (providerForSettingsB === 'xai') {
                systemPromptB = state.settings.xaiSystemPrompt;
                enableSystemPromptDefaultB = state.settings.xaiEnableSystemPromptDefault;
                temperatureB = state.settings.xaiTemperature;
                maxTokensB = state.settings.xaiMaxTokens;
                topPB = state.settings.xaiTopP;
                presencePenaltyB = state.settings.xaiPresencePenalty;
                frequencyPenaltyB = state.settings.xaiFrequencyPenalty;
                streamingOutputB = state.settings.xaiStreamingOutput;
                streamingSpeedB = state.settings.xaiStreamingSpeed;
                dummyUserB = state.settings.xaiDummyUser;
                enableDummyUserB = state.settings.xaiEnableDummyUser;
                dummyModelB = state.settings.xaiDummyModel;
                enableDummyModelB = state.settings.xaiEnableDummyModel;
                concatDummyModelB = state.settings.xaiConcatDummyModel;
                xaiVisionEnableB = state.settings.xaiVisionEnable;
                xaiIncludeThoughtsB = state.settings.xaiIncludeThoughts;
                xaiReasoningEffortB = state.settings.xaiReasoningEffort;
            }
            const contextForB = {
                sessionId: sessionB_Id,
                messages: sessionB_Data.messages ? [...sessionB_Data.messages] : [],
                systemPrompt: systemPromptB,
                enableSystemPromptDefault: enableSystemPromptDefaultB,
                temperature: temperatureB, maxTokens: maxTokensB, topP: topPB,
                presencePenalty: presencePenaltyB, frequencyPenalty: frequencyPenaltyB,
                streamingOutput: streamingOutputB, streamingSpeed: streamingSpeedB,
                dummyUser: dummyUserB, enableDummyUser: enableDummyUserB,
                dummyModel: dummyModelB, enableDummyModelB: enableDummyModelB, concatDummyModel: concatDummyModelB,
                topK: providerForSettingsB === 'gemini' ? geminiTopKB :
                    providerForSettingsB === 'claude' ? claudeTopKB :
                        providerForSettingsB === 'llmaggregator' ? llmAggregatorTopKB : undefined,
                thinkingBudget: providerForSettingsB === 'gemini' ? geminiThinkingBudgetB :
                    providerForSettingsB === 'claude' ? claudeThinkingBudgetB : undefined,
                includeThoughts: providerForSettingsB === 'gemini' ? geminiIncludeThoughtsB :
                    (providerForSettingsB === 'deepseek' || providerForSettingsB === 'llmaggregator') ? contextDeepSeekIncludeThoughts :
                        providerForSettingsB === 'claude' ? claudeIncludeThoughtsB :
                            providerForSettingsB === 'xai' ? xaiIncludeThoughtsB : undefined,
                expandThoughtsByDefault: (providerForSettingsB === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                    (providerForSettingsB === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                    (providerForSettingsB === 'claude' ? claudeExpandThoughtsByDefaultB : undefined) ||
                    (providerForSettingsB === 'xai' && state.settings.xaiExpandThoughtsByDefault) ||
                    (providerForSettingsB === 'llmaggregator' && state.settings.llmAggregatorExpandThoughtsByDefault),
                reasoningEffort: providerForSettingsB === 'xai' ? xaiReasoningEffortB : undefined,
                pseudoStreaming: providerForSettingsB === 'gemini' ? geminiPseudoStreamingB : undefined,
                enableGrounding: providerForSettingsB === 'gemini' ? geminiEnableGroundingB : undefined,
                visionEnable: providerForSettingsB === 'xai' ? xaiVisionEnableB : undefined,
                inputText: inputForB,
                attachments: [],
                apiProvider: providerForSettingsB,
                _apiKeyOverride: apiKeyForB,
                _modelNameOverride: modelNameForB
            };
            const responseFromB = await this.handleSend(false, -1, contextForB);
            if (responseFromB === "APIキー未設定")
                throw new Error("APIキーが設定されていません。");
            if (!responseFromB || !responseFromB.content) {
                throw new Error(`セッションB (${sessionB_Id}) からの応答がありませんでした。`);
            }
            const inputForA = responseFromB.content;
            uiUtils.setAiToAiProcessingState(true, "AI間会話処理中 (ステップ2/2)...");
            elements.userInput.value = inputForA;
            uiUtils.adjustTextareaHeight();
            await this.handleSend();
        }
        catch (error) {
            await uiUtils.showCustomAlert(`AI間会話処理中にエラーが発生しました: ${error.message}`);
            if (state.currentChatId === sessionA_Id && elements.chatScreen.classList.contains('active')) {
                uiUtils.displayError(`AI間会話エラー: ${error.message}`, false);
            }
        }
        finally {
            uiUtils.setAiToAiProcessingState(false);
        }
    },
    removeAttachment: async function (messageIndex, attachmentIndex, listItemElement) {
        const message = state.currentMessages[messageIndex];
        if (!message || !message.attachments || !message.attachments[attachmentIndex])
            return;
        const attachmentName = message.attachments[attachmentIndex].name;
        let confirmed = true;
        if (!state.settings.disableAttachmentConfirmation) {
            confirmed = await uiUtils.showCustomConfirm(`添付ファイル「${attachmentName}」を削除しますか？`);
        }
        if (confirmed) {
            message.attachments.splice(attachmentIndex, 1);
            const list = listItemElement.parentElement;
            listItemElement.remove();
            const summary = list.closest('.attachment-details').querySelector('summary');
            summary.textContent = `添付ファイル (${message.attachments.length}件)`;
            try {
                await dbUtils.saveChat();
            }
            catch (e) {
                await uiUtils.showCustomAlert('添付ファイルの削除状態の保存に失敗しました。');
            }
        }
    },
    editAttachment: function (messageIndex, attachmentIndex) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.accept = "image/*,text/*,application/pdf,video/*,audio/*,.txt,.md,.csv,.json,.html,.css,.js,.py";
        hiddenInput.style.display = 'none';
        hiddenInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file)
                return;
            if (file.size > MAX_FILE_SIZE) {
                await uiUtils.showCustomAlert(`ファイルサイズが大きすぎます (${formatFileSize(MAX_FILE_SIZE)}以下)。`);
                return;
            }
            try {
                let textData = null;
                let base64Data = null;
                const fileName = file.name;
                const fileExtension = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
                let browserMimeType = file.type || '';
                let guessedMimeType = extensionToMimeTypeMap[fileExtension] || browserMimeType || 'application/octet-stream';
                if (guessedMimeType.startsWith('text/')) {
                    textData = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (error) => reject(error);
                        reader.readAsText(file);
                    });
                }
                else {
                    base64Data = await fileToBase64(file);
                }
                const message = state.currentMessages[messageIndex];
                message.attachments[attachmentIndex] = {
                    file: file,
                    name: fileName,
                    mimeType: guessedMimeType,
                    base64Data: base64Data,
                    textData: textData,
                };
                const messageElement = elements.messageContainer.querySelector(`.message[data-index="${messageIndex}"]`);
                if (messageElement) {
                    const listItem = messageElement.querySelector(`li[data-attachment-index="${attachmentIndex}"] .attachment-list-item-name`);
                    if (listItem) {
                        listItem.textContent = sanitizeText(fileName);
                        listItem.title = `${sanitizeText(fileName)} (${sanitizeText(guessedMimeType)})`;
                    }
                }
                await dbUtils.saveChat();
            }
            catch (error) {
                await uiUtils.showCustomAlert(`ファイルの処理中にエラーが発生しました: ${error.message}`);
            }
            document.body.removeChild(hiddenInput);
        };
        document.body.appendChild(hiddenInput);
        hiddenInput.click();
    },
    addMoreAttachments: function (messageIndex, listElement) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.multiple = true;
        hiddenInput.accept = "image/*,text/*,application/pdf,video/*,audio/*,.txt,.md,.csv,.json,.html,.css,.js,.py";
        hiddenInput.style.display = 'none';
        hiddenInput.onchange = async (event) => {
            const files = event.target.files;
            if (!files || files.length === 0)
                return;
            const message = state.currentMessages[messageIndex];
            let currentTotalSize = message.attachments.reduce((sum, att) => sum + (att.file?.size || 0), 0);
            let encodingError = false;
            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) {
                    await uiUtils.showCustomAlert(`ファイル "${file.name}" はサイズが大きすぎます。`);
                    continue;
                }
                if (currentTotalSize + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
                    await uiUtils.showCustomAlert('合計ファイルサイズの上限を超えたため、一部のファイルは追加されませんでした。');
                    break;
                }
                try {
                    let textData = null;
                    let base64Data = null;
                    const fileName = file.name;
                    const fileExtension = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
                    let browserMimeType = file.type || '';
                    let guessedMimeType = extensionToMimeTypeMap[fileExtension] || browserMimeType || 'application/octet-stream';
                    if (guessedMimeType.startsWith('text/')) {
                        textData = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = (error) => reject(error);
                            reader.readAsText(file);
                        });
                    }
                    else {
                        base64Data = await fileToBase64(file);
                    }
                    const newAttachment = {
                        file: file,
                        name: fileName,
                        mimeType: guessedMimeType,
                        base64Data: base64Data,
                        textData: textData,
                    };
                    message.attachments.push(newAttachment);
                    currentTotalSize += file.size;
                    const newAttachmentIndex = message.attachments.length - 1;
                    const listItem = document.createElement('li');
                    listItem.dataset.attachmentIndex = newAttachmentIndex;
                    const itemContainer = document.createElement('div');
                    itemContainer.classList.add('attachment-list-item-container');
                    const nameSpan = document.createElement('span');
                    nameSpan.classList.add('attachment-list-item-name');
                    nameSpan.textContent = sanitizeText(fileName);
                    nameSpan.title = `${sanitizeText(fileName)} (${sanitizeText(guessedMimeType)})`;
                    const actionsDiv = document.createElement('div');
                    actionsDiv.classList.add('attachment-actions');
                    if (guessedMimeType.startsWith('image/')) {
                        const previewBtn = document.createElement('button');
                        previewBtn.textContent = '表示';
                        previewBtn.classList.add('attachment-preview-btn');
                        previewBtn.onclick = (e) => { e.preventDefault(); appLogic.previewAttachment(messageIndex, newAttachmentIndex); };
                        actionsDiv.appendChild(previewBtn);
                    }
                    const editBtn = document.createElement('button');
                    editBtn.textContent = '編集';
                    editBtn.classList.add('attachment-edit-btn');
                    editBtn.onclick = (e) => { e.preventDefault(); appLogic.editAttachment(messageIndex, newAttachmentIndex); };
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '削除';
                    removeBtn.classList.add('attachment-remove-btn');
                    removeBtn.onclick = (e) => { e.preventDefault(); appLogic.removeAttachment(messageIndex, newAttachmentIndex, listItem); };
                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(removeBtn);
                    itemContainer.appendChild(nameSpan);
                    itemContainer.appendChild(actionsDiv);
                    listItem.appendChild(itemContainer);
                    listElement.appendChild(listItem);
                }
                catch (error) {
                    encodingError = true;
                    await uiUtils.showCustomAlert(`ファイル "${file.name}" の処理中にエラーが発生しました。`);
                    break;
                }
            }
            if (!encodingError) {
                const summary = listElement.closest('.attachment-details').querySelector('summary');
                summary.textContent = `添付ファイル (${message.attachments.length}件)`;
                await dbUtils.saveChat();
            }
            document.body.removeChild(hiddenInput);
        };
        document.body.appendChild(hiddenInput);
        hiddenInput.click();
    },
    previewAttachment: async function (messageIndex, attachmentIndex) {
        const message = state.currentMessages[messageIndex];
        const attachment = message?.attachments?.[attachmentIndex];
        if (!attachment || !attachment.mimeType.startsWith('image/'))
            return;
        const dialog = elements.imagePreviewDialog;
        const img = dialog.querySelector('img');
        const okBtn = dialog.querySelector('.dialog-ok-btn');
        img.src = `data:${attachment.mimeType};base64,${attachment.base64Data}`;
        img.alt = attachment.name;
        okBtn.onclick = () => dialog.close();
        dialog.showModal();
    },
    initCryscrollerScroll() {
        const mainContent = elements.chatScreen.querySelector('.main-content');
        const zone = elements.cryscrollerScrollZone;
        const handle = elements.cryscrollerScrollHandle;
        const updateMarkers = () => {
            if (!state.settings.enableCryscrollerScroll)
                return;
            zone.querySelectorAll('.scroll-marker').forEach(el => el.remove());
            const messages = elements.messageContainer.querySelectorAll('.message');
            const contentHeight = mainContent.scrollHeight;
            const zoneHeight = zone.clientHeight;
            if (contentHeight === 0 || zoneHeight === 0)
                return;
            const TURF_USER_RGB = "102, 215, 19";
            const TURF_MODEL_RGB = "253, 110, 163";
            const MAX_INTENSITY_LENGTH = 1000;
            messages.forEach(msg => {
                const marker = document.createElement('div');
                marker.classList.add('scroll-marker');
                let isUser = false;
                let isModel = false;
                if (msg.classList.contains('user')) {
                    marker.classList.add('user');
                    isUser = true;
                }
                else if (msg.classList.contains('model')) {
                    marker.classList.add('model');
                    isModel = true;
                }
                else {
                    return;
                }
                const relativeTop = (msg.offsetTop / contentHeight) * zoneHeight;
                marker.style.top = `${relativeTop}px`;
                if (state.settings.enableDynamicScrollMarkerColor) {
                    const index = parseInt(msg.dataset.index, 10);
                    const messageData = state.currentMessages[index];
                    const contentText = messageData ? (messageData.content || "") : msg.innerText;
                    const textLength = contentText.length;
                    if (textLength > 0) {
                        const intensity = Math.min(1, textLength / MAX_INTENSITY_LENGTH);
                        const alpha = 0.3 + (0.7 * intensity);
                        if (isUser) {
                            marker.style.backgroundColor = `rgba(${TURF_USER_RGB}, ${alpha})`;
                        }
                        else if (isModel) {
                            marker.style.backgroundColor = `rgba(${TURF_MODEL_RGB}, ${alpha})`;
                        }
                    }
                    else {
                        marker.style.backgroundColor = "";
                    }
                }
                const onMarkerClick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    mainContent.scrollTop = msg.offsetTop - 10;
                };
                marker.addEventListener('click', onMarkerClick);
                zone.appendChild(marker);
            });
        };
        const updateHandle = () => {
            if (!state.settings.enableCryscrollerScroll)
                return;
            if (!document.body.classList.contains('immersive-mode')) {
                zone.style.top = `${mainContent.offsetTop}px`;
                zone.style.height = `${mainContent.offsetHeight}px`;
            }
            else {
                zone.style.removeProperty('top');
                zone.style.removeProperty('height');
            }
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const zoneHeight = zone.clientHeight;
            const scrollTop = mainContent.scrollTop;
            if (contentHeight <= viewHeight) {
                handle.style.display = 'none';
                zone.querySelectorAll('.scroll-marker').forEach(el => el.style.display = 'none');
                return;
            }
            handle.style.display = 'block';
            zone.querySelectorAll('.scroll-marker').forEach(el => el.style.display = 'block');
            let handleHeight = (viewHeight / contentHeight) * zoneHeight;
            handleHeight = Math.max(handleHeight, 40);
            const maxScrollTop = contentHeight - viewHeight;
            const maxHandleTop = zoneHeight - handleHeight;
            let handleTop = 0;
            if (maxScrollTop > 0) {
                handleTop = (scrollTop / maxScrollTop) * maxHandleTop;
            }
            handle.style.height = `${handleHeight}px`;
            handle.style.transform = `translateY(${handleTop}px)`;
        };
        const updateAll = () => {
            updateHandle();
            updateMarkers();
        };
        let scrollTimeout;
        const onScroll = () => {
            updateHandle();
            zone.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                zone.classList.remove('is-scrolling');
            }, 0);
        };
        mainContent.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateAll);
        let observerTimeout;
        const observer = new MutationObserver(() => {
            if (observerTimeout)
                return;
            observerTimeout = setTimeout(() => {
                updateAll();
                observerTimeout = null;
            }, state.isSending ? (state.settings.cryscrollerObserverDelay || 500) : 50);
        });
        observer.observe(elements.messageContainer, { childList: true, subtree: true, attributes: true });
        let isDragging = false;
        const scrollByZone = (clientY) => {
            const rect = zone.getBoundingClientRect();
            const relativeY = clientY - rect.top;
            const zoneHeight = zone.clientHeight;
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const percentage = Math.min(Math.max(relativeY / zoneHeight, 0), 1);
            const targetScrollTop = percentage * (contentHeight - viewHeight);
            mainContent.scrollTop = targetScrollTop;
        };
        const startDrag = (e) => {
            if (!state.settings.enableCryscrollerScroll)
                return;
            isDragging = true;
            zone.classList.add('is-dragging');
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const doDrag = (e) => {
            if (!isDragging)
                return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const endDrag = () => {
            isDragging = false;
            zone.classList.remove('is-dragging');
        };
        zone.addEventListener('touchstart', startDrag, { passive: false });
        zone.addEventListener('touchmove', doDrag, { passive: false });
        zone.addEventListener('touchend', endDrag);
        zone.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        setTimeout(updateAll, 100);
    },
    initSettingsCryscrollerScroll() {
        const mainContent = elements.settingsScreen.querySelector('.main-content');
        const zone = elements.settingsCryscrollerScrollZone;
        const handle = elements.settingsCryscrollerScrollHandle;
        const updateHandle = () => {
            if (!state.settings.enableSettingsCryscrollerScroll)
                return;
            if (!document.body.classList.contains('immersive-mode')) {
                const headerHeight = elements.settingsScreen.querySelector('.app-header').offsetHeight;
                zone.style.top = `${headerHeight}px`;
                zone.style.height = `calc(100% - ${headerHeight}px)`;
            }
            else {
                zone.style.removeProperty('top');
                zone.style.removeProperty('height');
            }
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const zoneHeight = zone.clientHeight;
            const scrollTop = mainContent.scrollTop;
            if (contentHeight <= viewHeight) {
                handle.style.display = 'none';
                return;
            }
            handle.style.display = 'block';
            let handleHeight = (viewHeight / contentHeight) * zoneHeight;
            handleHeight = Math.max(handleHeight, 40);
            const maxScrollTop = contentHeight - viewHeight;
            const maxHandleTop = zoneHeight - handleHeight;
            let handleTop = 0;
            if (maxScrollTop > 0) {
                handleTop = (scrollTop / maxScrollTop) * maxHandleTop;
            }
            handle.style.height = `${handleHeight}px`;
            handle.style.transform = `translateY(${handleTop}px)`;
        };
        let scrollTimeout;
        const onScroll = () => {
            updateHandle();
            zone.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                zone.classList.remove('is-scrolling');
            }, 0);
        };
        mainContent.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateHandle);
        let observerTimeout;
        const observer = new MutationObserver(() => {
            if (observerTimeout)
                return;
            observerTimeout = setTimeout(() => {
                updateHandle();
                observerTimeout = null;
            }, 100);
        });
        observer.observe(mainContent, { childList: true, subtree: true, attributes: true });
        let isDragging = false;
        const scrollByZone = (clientY) => {
            const rect = zone.getBoundingClientRect();
            const relativeY = clientY - rect.top;
            const zoneHeight = zone.clientHeight;
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const percentage = Math.min(Math.max(relativeY / zoneHeight, 0), 1);
            const targetScrollTop = percentage * (contentHeight - viewHeight);
            mainContent.scrollTop = targetScrollTop;
        };
        const startDrag = (e) => {
            if (!state.settings.enableSettingsCryscrollerScroll)
                return;
            isDragging = true;
            zone.classList.add('is-dragging');
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const doDrag = (e) => {
            if (!isDragging)
                return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const endDrag = () => {
            isDragging = false;
            zone.classList.remove('is-dragging');
        };
        zone.addEventListener('touchstart', startDrag, { passive: false });
        zone.addEventListener('touchmove', doDrag, { passive: false });
        zone.addEventListener('touchend', endDrag);
        zone.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        setTimeout(updateHandle, 500);
    },
    initHistoryCryscrollerScroll() {
        const mainContent = elements.historyScreen.querySelector('.main-content');
        const zone = elements.historyCryscrollerScrollZone;
        const handle = elements.historyCryscrollerScrollHandle;
        const updateHandle = () => {
            if (!state.settings.enableHistoryCryscrollerScroll)
                return;
            if (!document.body.classList.contains('immersive-mode')) {
                const headerHeight = elements.historyScreen.querySelector('.app-header').offsetHeight;
                zone.style.top = `${headerHeight}px`;
                zone.style.height = `calc(100% - ${headerHeight}px)`;
            }
            else {
                zone.style.removeProperty('top');
                zone.style.removeProperty('height');
            }
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const zoneHeight = zone.clientHeight;
            const scrollTop = mainContent.scrollTop;
            if (contentHeight <= viewHeight) {
                handle.style.display = 'none';
                return;
            }
            handle.style.display = 'block';
            let handleHeight = (viewHeight / contentHeight) * zoneHeight;
            handleHeight = Math.max(handleHeight, 40);
            const maxScrollTop = contentHeight - viewHeight;
            const maxHandleTop = zoneHeight - handleHeight;
            let handleTop = 0;
            if (maxScrollTop > 0) {
                handleTop = (scrollTop / maxScrollTop) * maxHandleTop;
            }
            handle.style.height = `${handleHeight}px`;
            handle.style.transform = `translateY(${handleTop}px)`;
        };
        let scrollTimeout;
        const onScroll = () => {
            updateHandle();
            zone.classList.add('is-scrolling');
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                zone.classList.remove('is-scrolling');
            }, 0);
        };
        mainContent.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', updateHandle);
        let observerTimeout;
        const observer = new MutationObserver(() => {
            if (observerTimeout)
                return;
            observerTimeout = setTimeout(() => {
                updateHandle();
                observerTimeout = null;
            }, 100);
        });
        observer.observe(mainContent, { childList: true, subtree: true, attributes: true });
        let isDragging = false;
        const scrollByZone = (clientY) => {
            const rect = zone.getBoundingClientRect();
            const relativeY = clientY - rect.top;
            const zoneHeight = zone.clientHeight;
            const contentHeight = mainContent.scrollHeight;
            const viewHeight = mainContent.clientHeight;
            const percentage = Math.min(Math.max(relativeY / zoneHeight, 0), 1);
            const targetScrollTop = percentage * (contentHeight - viewHeight);
            mainContent.scrollTop = targetScrollTop;
        };
        const startDrag = (e) => {
            if (!state.settings.enableHistoryCryscrollerScroll)
                return;
            isDragging = true;
            zone.classList.add('is-dragging');
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const doDrag = (e) => {
            if (!isDragging)
                return;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            scrollByZone(clientY);
            e.preventDefault();
        };
        const endDrag = () => {
            isDragging = false;
            zone.classList.remove('is-dragging');
        };
        zone.addEventListener('touchstart', startDrag, { passive: false });
        zone.addEventListener('touchmove', doDrag, { passive: false });
        zone.addEventListener('touchend', endDrag);
        zone.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);
        setTimeout(updateHandle, 500);
    },
    updateImmersiveLayout() {
        if (!state.settings.enableImmersiveScrolling) {
            document.body.classList.remove('immersive-mode');
            if (elements.cryscrollerScrollZone) {
                elements.cryscrollerScrollZone.style.removeProperty('top');
                elements.cryscrollerScrollZone.style.removeProperty('height');
            }
            if (this.layoutObserver) {
                this.layoutObserver.disconnect();
                this.layoutObserver = null;
            }
            return;
        }
        document.body.classList.add('immersive-mode');
        const updateHeights = () => {
            const activeScreen = document.querySelector('.screen.active');
            const isChatScreen = activeScreen && activeScreen.id === 'chat-screen';
            const header = activeScreen ? activeScreen.querySelector('.app-header') : null;
            const footer = document.querySelector('.chat-input-area');
            const headerHeight = header ? header.offsetHeight : 50;
            const footerHeight = (isChatScreen && footer) ? footer.offsetHeight : 0;
            document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
            document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
            if (state.settings.enableCryscrollerScroll) {
                window.dispatchEvent(new Event('resize'));
            }
        };
        if (!this.layoutObserver) {
            this.layoutObserver = new ResizeObserver(() => {
                requestAnimationFrame(updateHeights);
            });
            document.querySelectorAll('.app-header').forEach(el => this.layoutObserver.observe(el));
            const footer = document.querySelector('.chat-input-area');
            if (footer)
                this.layoutObserver.observe(footer);
        }
        updateHeights();
    },
};
