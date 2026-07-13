// @ts-nocheck -- Enable after shared application types are defined.
// Bundled into the generated index.html from this TypeScript source.
Object.assign(appLogic, {
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
                            } else if (msg.role === 'model' && msg.isCascaded) {
                                if (currentGroupId === null && lastUserIndex !== -1) {
                                    currentGroupId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                                }
                                if (currentGroupId) {
                                    msg.siblingGroupId = currentGroupId;
                                }
                            } else {
                                currentGroupId = null;
                            }
                        }
                        const groupIds = new Set(importedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                        groupIds.forEach(gid => {
                            const siblings = importedMessages.filter(m => m.siblingGroupId === gid);
                            const selected = siblings.filter(m => m.isSelected);
                            if (selected.length === 0 && siblings.length > 0) {
                                siblings[siblings.length - 1].isSelected = true;
                            } else if (selected.length > 1) {
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
                    } catch (error) {
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
                            } else if (attr) {
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
                } catch (error) {
                    alert(`エクスポートに失敗しました。データベースにアクセスできない可能性があります。\n\nエラー詳細: ${error.message}`);
                }
            },

            async exportAllSessions() {
                const confirmed = await uiUtils.showCustomConfirm("全てのセッションを1つのJSONファイルとしてエクスポートしますか？");
                if (!confirmed) return;

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
                            if (msg.isCascaded !== undefined) messageExport.isCascaded = msg.isCascaded;
                            if (msg.isSelected !== undefined) messageExport.isSelected = msg.isSelected;
                            if (msg.siblingGroupId !== undefined) messageExport.siblingGroupId = msg.siblingGroupId;
                            if (msg.groundingMetadata) messageExport.groundingMetadata = msg.groundingMetadata;
                            if (msg.usageMetadata) messageExport.usageMetadata = msg.usageMetadata;
                            if (msg.thoughtSummary) messageExport.thoughtSummary = msg.thoughtSummary;
                            if (msg.deepSeekThoughtSummary) messageExport.deepSeekThoughtSummary = msg.deepSeekThoughtSummary;
                            if (msg.thoughtSummaryOpen !== undefined) messageExport.thoughtSummaryOpen = msg.thoughtSummaryOpen;
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
                } catch (error) {
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

                        const confirmed = await uiUtils.showCustomConfirm(
                            `${importedData.length}件のセッションをインポートしますか？\n(既存の履歴とタイトルが重複する場合、別履歴として追加されます)`
                        );
                        if (!confirmed) return;

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
                                } else if (selectedSiblings.length > 1) {
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
                            } catch (e) {
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

                    } catch (error) {
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
                    if (value === null) return null;
                    if (['string', 'number', 'boolean'].includes(typeof value)) return value;
                    if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') return undefined;
                    if ((typeof Blob !== 'undefined' && value instanceof Blob) || (typeof File !== 'undefined' && value instanceof File)) return undefined;
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
                    if (excludedKeys.has(key)) return;
                    const cloned = cloneTextValue(value);
                    if (typeof cloned !== 'undefined') {
                        exportSettings[key] = cloned;
                    }
                });
                return exportSettings;
            },
            async exportSettings() {
                const confirmed = await uiUtils.showCustomConfirm("APIキーを含むテキスト設定をJSONファイルとしてエクスポートしますか？\n背景画像やアイコン画像は含まれません。");
                if (!confirmed) return;

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
                } catch (error) {
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
                        if (!confirmed) return;

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
                            if (value === null) return null;
                            if (['string', 'number', 'boolean'].includes(typeof value)) return value;
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
                            if (!allowedKeys.has(key)) return;
                            const sanitized = sanitizeImportedValue(value);
                            if (typeof sanitized === 'undefined') return;
                            const currentValue = state.settings[key];
                            settingsToImport[key] = isPlainObject(currentValue) && isPlainObject(sanitized)
                                ? { ...currentValue, ...sanitized }
                                : sanitized;
                        });

                        if (Object.keys(settingsToImport).length === 0) {
                            await uiUtils.showCustomAlert("インポート可能な設定項目がありません。");
                            return;
                        }

                        await Promise.all(Object.entries(settingsToImport).map(([key, value]) =>
                            dbUtils.saveSetting(key, value)
                        ));
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
                    } catch (error) {
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
                } catch (error) {
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
                } catch (error) {
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
                        if (state.userIconUrl) URL.revokeObjectURL(state.userIconUrl);
                        await dbUtils.saveSetting('userIconBlob', blob);
                        state.settings.userIconBlob = blob;
                        state.userIconUrl = URL.createObjectURL(blob);
                    } else if (type === 'ai') {
                        if (state.aiIconUrl) URL.revokeObjectURL(state.aiIconUrl);
                        await dbUtils.saveSetting('aiIconBlob', blob);
                        state.settings.aiIconBlob = blob;
                        state.aiIconUrl = URL.createObjectURL(blob);
                    }
                    uiUtils.updateIconSettingsUI();
                    uiUtils.renderChatMessages(true, true);
                } catch (error) {
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
                        if (state.userIconUrl) URL.revokeObjectURL(state.userIconUrl);
                        state.userIconUrl = null;
                        state.settings.userIconBlob = null;
                        await dbUtils.saveSetting('userIconBlob', null);
                    } else if (type === 'ai') {
                        if (state.aiIconUrl) URL.revokeObjectURL(state.aiIconUrl);
                        state.aiIconUrl = null;
                        state.settings.aiIconBlob = null;
                        await dbUtils.saveSetting('aiIconBlob', null);
                    }
                    uiUtils.updateIconSettingsUI();
                    uiUtils.renderChatMessages(true, true);
                } catch (error) {
                    await uiUtils.showCustomAlert(`${type === 'user' ? 'ユーザー' : 'AI'}アイコンの削除エラー: ${error}`);
                }
            },

           cycleActiveApiKey() {
                const provider = state.settings.apiProvider;

                if (provider === 'llmaggregator') {
                    const activeBackend = multiBackendUtils.getActiveBackend();
                    if (!activeBackend || !activeBackend.apiKeys || activeBackend.apiKeys.length < 2) return;

                    const keys = activeBackend.apiKeys;
                    let currentIndex = keys.findIndex(k => k.isActive);
                    if (currentIndex === -1) currentIndex = 0;

                    const nextIndex = (currentIndex + 1) % keys.length;
                    const nextKeyId = keys[nextIndex].id;

                    multiBackendUtils.selectApiKeyForBackend(activeBackend.id, nextKeyId);
                } else {
                    const keys = multiApiKeyUtils.getApiKeysArray(provider);
                    if (!state.settings.showMultiApiKeys || keys.length < 2) return;

                    let currentIndex = keys.findIndex(k => k.isActive);
                    if (currentIndex === -1) currentIndex = 0;

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

                    if (min !== undefined && num < min) num = min;
                    if (max !== undefined && num > max) num = max;

                    return num;
                };

                const getSliderMaxValue = (paramId) => {
                    const maxInput = document.querySelector(`.param-slider-max-input[data-target-id="${paramId}"]`);
                    if (maxInput) {
                        const value = maxInput.value.trim();
                        if (value === '') return null;
                        const numValue = parseInt(value, 10);
                        return isNaN(numValue) ? null : numValue;
                    }
                    return undefined;
                };

                newSettings.showMultiApiKeys = elements.showMultiApiKeysToggle.checked;
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
                newSettings.extendAiBubbleWidth = elements.extendAiBubbleWidthToggle.checked;
                                newSettings.extendUserBubbleWidth = elements.extendUserBubbleWidthToggle.checked;
                                newSettings.reduceMessageSpacing = elements.reduceMessageSpacingToggle.checked;
                newSettings.compactSettingsSpacing = elements.compactSettingsSpacingToggle.checked;
                newSettings.slimSettingsHeaders = elements.slimSettingsHeadersToggle.checked;
                newSettings.flatSettingsDesign = elements.flatSettingsDesignToggle.checked;


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
                newSettings.showPasteButtonInFooter = elements.showPasteButtonInFooterToggle.checked;
                newSettings.showPasteButtonInEdit = elements.showPasteButtonInEditToggle.checked;
                newSettings.showDiceButton = elements.showDiceButtonToggle.checked;
                newSettings.diceMinValue = elements.diceMinValueInput.value === '' ? null : parseInt(elements.diceMinValueInput.value, 10);
                newSettings.diceMaxValue = elements.diceMaxValueInput.value === '' ? null : parseInt(elements.diceMaxValueInput.value, 10);
                newSettings.showMemoButton = elements.showMemoButtonToggle.checked;
                newSettings.memoHeight = elements.memoHeightInput.value.trim() || DEFAULT_MEMO_HEIGHT;
                newSettings.showClipboardStackButton = elements.showClipboardStackButtonToggle.checked;
                newSettings.clipboardStackHeight = state.settings.clipboardStackHeight;
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
                };
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

                    const promises = Object.entries(settingsToSave).map(([key, value]) =>
                        dbUtils.saveSetting(key, value)
                    );

                    await Promise.all(promises);

                    state.settings = newSettings;

                    if (showNotice && !state.settings.disableSaveSettingsConfirmation) {
                        await uiUtils.showCustomAlert("設定を保存しました。");
                    }
                } catch (error) {
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
                        } else {
                            uiUtils.showCustomAlert("アクティブなService Workerが見つかりません。手動でリロードが必要かもしれません。");
                        }
                    }).catch(async err => {
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
                        } catch (e) {}

                        await uiUtils.showCustomAlert("すべてのデータが削除されました。初期状態に戻ります。");
                        window.location.reload();
                    } catch (error) {
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
                    } catch (error) {
                        await uiUtils.showCustomAlert(`チャット履歴の削除中にエラーが発生しました: ${error}`);
                    }
                }
            },

            async commitAllOpenEdits() {
                const editingElements = elements.messageContainer.querySelectorAll('.message.editing');
                if (editingElements.length === 0) return;
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

                if (needsDbSave) await dbUtils.saveChat();
            },
});
