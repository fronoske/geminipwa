// @ts-nocheck -- Enable after shared application types are defined.
// src/twin-engine-runtime.js is generated from this file. Edit this TypeScript source instead.
Object.assign(appLogic, {
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
                    (selectedApiProvider === 'llmaggregator' && !state.settings.llmAggregatorApiKey)
                ) {
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
                    } else {
                        switch (providerForSettingsB) {
                            case 'gemini': apiKeyForB = state.settings.apiKey; break;
                            case 'deepseek': apiKeyForB = state.settings.deepSeekApiKey; break;
                            case 'claude': apiKeyForB = state.settings.claudeApiKey; break;
                            case 'openai': apiKeyForB = state.settings.openaiApiKey; break;
                            case 'xai': apiKeyForB = state.settings.xaiApiKey; break;
                            case 'llmaggregator': apiKeyForB = state.settings.llmAggregatorApiKey; break;
                        }
                    }

                    switch (providerForSettingsB) {
                        case 'gemini': modelNameForB = state.settings.modelName; break;
                        case 'deepseek': modelNameForB = state.settings.deepSeekModelName; break;
                        case 'claude': modelNameForB = state.settings.claudeModelName; break;
                        case 'openai': modelNameForB = state.settings.openaiModelName; break;
                        case 'xai': modelNameForB = state.settings.xaiModelName; break;
                        case 'llmaggregator': modelNameForB = state.settings.llmAggregatorModelName; break;
                    }
                    let systemPromptB, enableSystemPromptDefaultB, dummyUserB, enableDummyUserB, dummyModelB, enableDummyModelB,
                        temperatureB, maxTokensB, topPB,
                        streamingOutputB, streamingSpeedB, concatDummyModelB,
                        geminiTopKB, geminiThinkingBudgetB, geminiIncludeThoughtsB, geminiPseudoStreamingB, geminiEnableGroundingB,
                        deepSeekIncludeThoughtsB, presencePenaltyB, frequencyPenaltyB,
                        claudeTopKB, claudeIncludeThoughtsB, claudeThinkingBudgetB, claudeExpandThoughtsByDefaultB,
                        xaiVisionEnableB, xaiIncludeThoughtsB, xaiReasoningEffortB, llmAggregatorTopKB;

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
                    } else if (providerForSettingsB === 'deepseek') {
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
                    } else if (providerForSettingsB === 'llmaggregator') {
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
                    } else if (providerForSettingsB === 'claude') {
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
                    } else if (providerForSettingsB === 'openai') {
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
                    } else if (providerForSettingsB === 'xai') {
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
                    if (responseFromB === "APIキー未設定") throw new Error("APIキーが設定されていません。");
                    if (!responseFromB || !responseFromB.content) {
                        throw new Error(`セッションB (${sessionB_Id}) からの応答がありませんでした。`);
                    }
                    const inputForA = responseFromB.content;

                    uiUtils.setAiToAiProcessingState(true, "AI間会話処理中 (ステップ2/2)...");

                    elements.userInput.value = inputForA;
                    uiUtils.adjustTextareaHeight();

                    await this.handleSend();

                } catch (error) {
                    await uiUtils.showCustomAlert(`AI間会話処理中にエラーが発生しました: ${error.message}`);
                    if (state.currentChatId === sessionA_Id && elements.chatScreen.classList.contains('active')) {
                        uiUtils.displayError(`AI間会話エラー: ${error.message}`, false);
                    }
                } finally {
                    uiUtils.setAiToAiProcessingState(false);
                }
            },
            removeAttachment: async function (messageIndex, attachmentIndex, listItemElement) {
                const message = state.currentMessages[messageIndex];
                if (!message || !message.attachments || !message.attachments[attachmentIndex]) return;

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
                    } catch (e) {
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
                    if (!file) return;

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
                        } else {
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

                    } catch (error) {
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
                    if (!files || files.length === 0) return;

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
                            } else {
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

                        } catch (error) {
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
                if (!attachment || !attachment.mimeType.startsWith('image/')) return;

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
                    if (!state.settings.enableCryscrollerScroll) return;

                    zone.querySelectorAll('.scroll-marker').forEach(el => el.remove());

                    const messages = elements.messageContainer.querySelectorAll('.message');
                    const contentHeight = mainContent.scrollHeight;
                    const zoneHeight = zone.clientHeight;

                    if (contentHeight === 0 || zoneHeight === 0) return;

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
                        } else if (msg.classList.contains('model')) {
                            marker.classList.add('model');
                            isModel = true;
                        } else {
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
                                } else if (isModel) {
                                    marker.style.backgroundColor = `rgba(${TURF_MODEL_RGB}, ${alpha})`;
                                }
                            } else {
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
                    if (!state.settings.enableCryscrollerScroll) return;

                    if (!document.body.classList.contains('immersive-mode')) {
                        zone.style.top = `${mainContent.offsetTop}px`;
                        zone.style.height = `${mainContent.offsetHeight}px`;
                    } else {
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
                    if (observerTimeout) return;
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
                    if (!state.settings.enableCryscrollerScroll) return;
                    isDragging = true;
                    zone.classList.add('is-dragging');
                    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                    scrollByZone(clientY);
                    e.preventDefault();
                };

                const doDrag = (e) => {
                    if (!isDragging) return;
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
});
