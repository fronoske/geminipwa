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
});
