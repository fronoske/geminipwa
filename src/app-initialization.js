// @ts-nocheck -- Enable after shared application types are defined.
// src/app-initialization.js is generated from this file. Edit this TypeScript source instead.
Object.assign(appLogic, {
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
});
