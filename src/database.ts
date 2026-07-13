// @ts-nocheck -- Enable after application state and persisted record types are defined.
// src/database.js is generated from this file. Edit this TypeScript source instead.
const dbUtils = {
            _initPromise: null,

            async openDB() {
                if (state.db) {
                    try {
                        const tx = state.db.transaction([SETTINGS_STORE], 'readonly');
                        tx.abort();
                        return state.db;
                    } catch (e) {
                        state.db = null;
                    }
                }

                if (this._initPromise) return this._initPromise;

                this._initPromise = new Promise((resolve, reject) => {
                    const request = indexedDB.open(DB_NAME, DB_VERSION);

                    request.onerror = (event) => {
                        this._initPromise = null;
                        reject(`IndexedDBエラー: ${event.target.error}`);
                    };

                    request.onsuccess = (event) => {
                        state.db = event.target.result;
                        state.db.onclose = () => {
                            state.db = null;
                        };
                        state.db.onversionchange = () => {
                            if (state.db) { state.db.close(); state.db = null; }
                            uiUtils.showCustomAlert("アプリの新しいバージョンが利用可能です。データを保護するため、ページをリロードしてください。")
                                .then(() => window.location.reload());
                        };
                        state.db.onerror = (event) => {
                            console.error(`IndexedDBの予期せぬエラー: ${event.target.error}`);
                        };
                        this._initPromise = null;
                        resolve(state.db);
                    };

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                            db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                        }
                        let chatStore;
                        if (!db.objectStoreNames.contains(CHATS_STORE)) {
                            chatStore = db.createObjectStore(CHATS_STORE, { keyPath: 'id', autoIncrement: true });
                        } else {
                            chatStore = event.target.transaction.objectStore(CHATS_STORE);
                        }
                        if (chatStore && !chatStore.indexNames.contains(CHAT_UPDATEDAT_INDEX)) {
                            chatStore.createIndex(CHAT_UPDATEDAT_INDEX, 'updatedAt', { unique: false });
                        }
                        if (chatStore && !chatStore.indexNames.contains(CHAT_CREATEDAT_INDEX)) {
                            chatStore.createIndex(CHAT_CREATEDAT_INDEX, 'createdAt', { unique: false });
                        }
                    };
                });
                return this._initPromise;
            },

            _getStore(storeName, mode = 'readonly') {
                if (!state.db) throw new Error("データベースが開かれていません");
                try {
                    const transaction = state.db.transaction([storeName], mode);
                    return transaction.objectStore(storeName);
                } catch (e) {
                    state.db = null;
                    throw new Error("データベース接続エラーが発生しました。もう一度操作してください。");
                }
            },

            async saveSetting(key, value) {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(SETTINGS_STORE, 'readwrite');
                        const request = store.put({ key, value });
                        request.onsuccess = () => resolve();
                        request.onerror = (event) => reject(`設定 ${key} の保存エラー: ${event.target.error}`);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async loadSettings() {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(SETTINGS_STORE);
                        const request = store.getAll();
                        request.onsuccess = (event) => {
                            const settingsArray = event.target.result;
                            const loadedSettings = {};
                            settingsArray.forEach(item => { loadedSettings[item.key] = item.value; });

                            const defaultSettings = { ...state.settings };
                            state.settings = { ...defaultSettings };

                            if (loadedSettings.hasOwnProperty('darkMode') && !loadedSettings.hasOwnProperty('theme')) {
                                state.settings.theme = loadedSettings.darkMode === true ? 'dark' : 'light';
                            }

                            const oldGlobalParams = ['temperature', 'maxTokens', 'topP', 'presencePenalty', 'frequencyPenalty', 'systemPrompt', 'enableSystemPromptDefault'];
                            const oldGlobalAdvanced = ['streamingOutput', 'streamingSpeed', 'dummyUser', 'enableDummyUser', 'dummyModel', 'enableDummyModel', 'concatDummyModel'];
                            const providerPrefixes = ['gemini', 'deepSeek', 'claude', 'openai', 'xai', 'llmaggregator'];

                            oldGlobalParams.forEach(param => {
                                if (loadedSettings.hasOwnProperty(param)) {
                                    providerPrefixes.forEach(prefix => {
                                        const newKey = prefix + param.charAt(0).toUpperCase() + param.slice(1);
                                        if (state.settings.hasOwnProperty(newKey) && !loadedSettings.hasOwnProperty(newKey)) {
                                            state.settings[newKey] = loadedSettings[param];
                                        }
                                    });
                                }
                            });
                            oldGlobalAdvanced.forEach(advParam => {
                                if (loadedSettings.hasOwnProperty(advParam)) {
                                    providerPrefixes.forEach(prefix => {
                                        const newKey = prefix + advParam.charAt(0).toUpperCase() + advParam.slice(1);
                                        if (state.settings.hasOwnProperty(newKey) && !loadedSettings.hasOwnProperty(newKey)) {
                                            state.settings[newKey] = loadedSettings[advParam];
                                        }
                                    });
                                }
                            });

                            if (loadedSettings.hasOwnProperty('includeThoughts') && !loadedSettings.hasOwnProperty('geminiIncludeThoughts')) state.settings.geminiIncludeThoughts = loadedSettings.includeThoughts;
                            if (loadedSettings.hasOwnProperty('expandThoughtsByDefault') && !loadedSettings.hasOwnProperty('geminiExpandThoughtsByDefault')) state.settings.geminiExpandThoughtsByDefault = loadedSettings.expandThoughtsByDefault;
                            if (loadedSettings.hasOwnProperty('pseudoStreaming') && !loadedSettings.hasOwnProperty('geminiPseudoStreaming')) state.settings.geminiPseudoStreaming = loadedSettings.pseudoStreaming;
                            if (loadedSettings.hasOwnProperty('enableGrounding') && !loadedSettings.hasOwnProperty('geminiEnableGrounding')) state.settings.geminiEnableGrounding = loadedSettings.enableGrounding;
                            if (loadedSettings.hasOwnProperty('includeDeepSeekThoughts') && !loadedSettings.hasOwnProperty('deepSeekIncludeDeepSeekThoughts')) state.settings.deepSeekIncludeDeepSeekThoughts = loadedSettings.includeDeepSeekThoughts;
                            if (loadedSettings.hasOwnProperty('expandDeepSeekThoughtsByDefault') && !loadedSettings.hasOwnProperty('deepSeekExpandThoughtsByDefault')) state.settings.deepSeekExpandThoughtsByDefault = loadedSettings.expandDeepSeekThoughtsByDefault;

                            let backends = loadedSettings.llmaggregatorBackends || [];
                            if (backends.length === 0 && loadedSettings.llmAggregatorApiBackend) {
                                backends.push({
                                    id: `migrated-backend-${Date.now()}`,
                                    label: 'デフォルトURL',
                                    url: loadedSettings.llmAggregatorApiBackend,
                                    isActive: true,
                                    apiKeys: [],
                                    activeApiKeyIndex: -1
                                });
                            }
                            if (backends.length > 0) {
                                const firstBackend = backends[0];
                                if ((!firstBackend.apiKeys || firstBackend.apiKeys.length === 0) && loadedSettings.llmAggregatorApiKey) {
                                    firstBackend.apiKeys = [{
                                        id: `rescued-key-${Date.now()}`,
                                        label: 'キー 1',
                                        value: loadedSettings.llmAggregatorApiKey,
                                        isActive: true
                                    }];
                                    firstBackend.activeApiKeyIndex = 0;
                                }
                            }
                            state.settings.llmaggregatorBackends = backends;
                            state.settings.llmaggregatorActiveBackendIndex = (backends.length > 0) ? 0 : -1;

                            if (loadedSettings.webhookUrl && !loadedSettings.webhooks) {
                                loadedSettings.webhooks = [{
                                    id: 'migrated-' + Date.now(),
                                    label: '以前の設定',
                                    url: loadedSettings.webhookUrl,
                                    enabled: loadedSettings.enableWebhookNotification,
                                    format: loadedSettings.webhookFormat || 'json'
                                }];
                            }

                            for (const key in loadedSettings) {
                                if (key === 'darkMode' || key === 'memoWidth' || key === 'showCollapseButtons') continue;
                                if (key in defaultSettings) {
                                    const loadedValue = loadedSettings[key];
                                    const defaultValue = defaultSettings[key];

                                                                                                            if (['backgroundImageBlob', 'userIconBlob', 'aiIconBlob', 'historyBackgroundImageBlob', 'settingsBackgroundImageBlob'].includes(key)) {
                                        state.settings[key] = (loadedValue instanceof Blob) ? loadedValue : null;
                                    } else if (typeof defaultValue === 'boolean') {


                                        state.settings[key] = loadedValue === true;
                                    } else if (typeof defaultValue === 'number' || defaultValue === null) {
                                        let num = parseFloat(loadedValue);
                                        if (isNaN(num)) {
                                            state.settings[key] = defaultValue;
                                        } else {
                                            state.settings[key] = num;
                                        }
                                    } else {
                                        state.settings[key] = loadedValue;
                                    }
                                }
                            }

                            if ((!loadedSettings.twinEngineApiConfigs || loadedSettings.twinEngineApiConfigs.length === 0) && loadedSettings.twinEngineProvider) {
                                const provider = loadedSettings.twinEngineProvider;
                                if (provider !== 'dummy') {
                                    let apiKey = '', modelName = '';
                                    if (provider === 'gemini') { apiKey = loadedSettings.twinEngineGeminiApiKey; modelName = loadedSettings.twinEngineGeminiModelName; }
                                    else if (provider === 'deepseek') { apiKey = loadedSettings.twinEngineDeepseekApiKey; modelName = loadedSettings.twinEngineDeepseekModelName; }
                                    const oldConfig = {
                                        id: `migrated-${Date.now()}`,
                                        label: `移行した設定 (${provider})`,
                                        provider: provider,
                                        apiKey: apiKey || '',
                                        modelName: modelName || '',
                                    };
                                    state.settings.twinEngineApiConfigs = [oldConfig];
                                    state.settings.twinEngineActiveConfigId = oldConfig.id;
                                }
                            } else if (loadedSettings.twinEngineApiConfigs) {
                                state.settings.twinEngineApiConfigs = loadedSettings.twinEngineApiConfigs;
                                state.settings.twinEngineActiveConfigId = loadedSettings.twinEngineActiveConfigId;
                            }

                            if (loadedSettings.hasOwnProperty('proofreadingModelName') && (!state.settings.proofreadingApiConfigs || state.settings.proofreadingApiConfigs.length === 0)) {
                                const oldConfig = {
                                    id: `migrated-proofreading-${Date.now()}`,
                                    label: '（移行された設定）',
                                    provider: 'gemini',
                                    apiKey: state.settings.apiKey || '',
                                    modelName: loadedSettings.proofreadingModelName,
                                    systemPrompt: loadedSettings.proofreadingSystemInstruction || '',
                                    temperature: null, maxTokens: null, topK: null, topP: null
                                };
                                state.settings.proofreadingApiConfigs = [oldConfig];
                                state.settings.activeProofreadingConfigId = oldConfig.id;
                            }

                            resolve(state.settings);
                        };
                        request.onerror = (event) => reject(`設定読み込みエラー: ${event.target.error}`);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async saveChat(optionalTitle = null) {
                await this.openDB();
                if ((!state.currentMessages || state.currentMessages.length === 0)) {
                    return Promise.resolve(state.currentChatId);
                }
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(CHATS_STORE, 'readwrite');
                        const now = Date.now();

                        const messagesToSave = state.currentMessages.map(msg => ({
                            role: msg.role, content: msg.content, timestamp: msg.timestamp,
                            thoughtSummary: msg.thoughtSummary || null,
                            deepSeekThoughtSummary: msg.deepSeekThoughtSummary || null,
                            xaiThoughtSummary: msg.xaiThoughtSummary || null,
                            generatedByApiProvider: msg.generatedByApiProvider || null,
                            finishReason: msg.finishReason, safetyRatings: msg.safetyRatings, error: msg.error,
                            isCascaded: msg.isCascaded, isSelected: msg.isSelected, siblingGroupId: msg.siblingGroupId,
                            groundingMetadata: msg.groundingMetadata, attachments: msg.attachments,
                            usageMetadata: msg.usageMetadata, thoughtSummaryOpen: msg.thoughtSummaryOpen
                        }));

                        const executeSave = (chatIdToUse, existingData) => {
                            let title = optionalTitle;
                            if (title === null) {
                                if (existingData && existingData.title) title = existingData.title;
                                else {
                                    const firstUserMessage = state.currentMessages.find(m => m.role === 'user');
                                    title = firstUserMessage ? firstUserMessage.content.substring(0, 50) : "無題のチャット";
                                }
                            }

                            const chatData = {
                                messages: messagesToSave,
                                updatedAt: now,
                                createdAt: existingData ? existingData.createdAt : now,
                                title: title,
                            };

                            if (state.settings.persistMessageCollapseState) {
                                chatData.collapsedStates = Object.fromEntries(state.messageCollapsedStates);
                            }

                            if (chatIdToUse) {
                                chatData.id = chatIdToUse;
                            }

                            const putRequest = store.put(chatData);
                            putRequest.onsuccess = (event) => {
                                const savedId = event.target.result;
                                if (!state.currentChatId && savedId) {
                                    state.currentChatId = savedId;
                                }
                                if ((state.currentChatId || savedId) === (chatIdToUse || savedId)) {
                                    uiUtils.updateChatTitle(chatData.title);
                                }
                                resolve(state.currentChatId || savedId);
                            };
                            putRequest.onerror = (e) => reject(`チャット保存putエラー: ${e.target.error}`);
                        };

                        if (state.currentChatId) {
                            const getRequest = store.get(state.currentChatId);
                            getRequest.onsuccess = (e) => {
                                const existing = e.target.result;
                                if (!existing) {
                                    state.currentChatId = null;
                                    executeSave(null, null);
                                } else {
                                    executeSave(state.currentChatId, existing);
                                }
                            };
                            getRequest.onerror = () => {
                                state.currentChatId = null;
                                executeSave(null, null);
                            };
                        } else {
                            executeSave(null, null);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async updateChatTitleDb(id, newTitle) {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(CHATS_STORE, 'readwrite');
                        const getRequest = store.get(id);
                        getRequest.onsuccess = (event) => {
                            const chatData = event.target.result;
                            if (chatData) {
                                chatData.title = newTitle;
                                chatData.updatedAt = Date.now();
                                const putRequest = store.put(chatData);
                                putRequest.onsuccess = () => resolve();
                                putRequest.onerror = (e) => reject(`タイトル更新putエラー: ${e.target.error}`);
                            } else {
                                reject(`チャットが見つかりません: ${id}`);
                            }
                        };
                        getRequest.onerror = (e) => reject(`タイトル更新取得エラー: ${e.target.error}`);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async getChat(id) {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(CHATS_STORE);
                        const request = store.get(id);
                        request.onsuccess = (event) => resolve(event.target.result);
                        request.onerror = (event) => reject(`チャット取得エラー: ${event.target.error}`);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async getAllChats(sortBy = 'updatedAt') {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(CHATS_STORE);
                        const indexName = sortBy === 'createdAt' ? CHAT_CREATEDAT_INDEX : CHAT_UPDATEDAT_INDEX;

                        if (!store.indexNames.contains(indexName)) {
                            const getAllRequest = store.getAll();
                            getAllRequest.onsuccess = (event) => resolve(event.target.result.reverse());
                            getAllRequest.onerror = (e) => reject(e.target.error);
                            return;
                        }

                        const index = store.index(indexName);
                        const request = index.openCursor(null, 'prev');
                        const chats = [];
                        request.onsuccess = (event) => {
                            const cursor = event.target.result;
                            if (cursor) {
                                chats.push(cursor.value);
                                cursor.continue();
                            } else {
                                resolve(chats);
                            }
                        };
                        request.onerror = (event) => reject(`一覧取得エラー: ${event.target.error}`);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async deleteChat(id) {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(CHATS_STORE, 'readwrite');
                        const request = store.delete(id);
                        request.onsuccess = () => resolve();
                        request.onerror = (event) => reject(`チャット削除エラー: ${event.target.error}`);
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async clearAllData() {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const transaction = state.db.transaction([SETTINGS_STORE, CHATS_STORE], 'readwrite');
                        const settingsStore = transaction.objectStore(SETTINGS_STORE);
                        const chatsStore = transaction.objectStore(CHATS_STORE);

                        transaction.oncomplete = () => resolve();
                        transaction.onerror = (e) => reject(`データ全消去エラー: ${e.target.error}`);

                        settingsStore.clear();
                        chatsStore.clear();
                    } catch (error) {
                        reject(error);
                    }
                });
            },

            async clearAllChatsStore() {
                await this.openDB();
                return new Promise((resolve, reject) => {
                    try {
                        const store = this._getStore(CHATS_STORE, 'readwrite');
                        const request = store.clear();
                        request.onsuccess = () => resolve();
                        request.onerror = (e) => reject(`履歴全消去エラー: ${e.target.error}`);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        };
