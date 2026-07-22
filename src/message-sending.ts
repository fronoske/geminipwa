// @ts-nocheck -- Enable after shared application types are defined.
// Bundled into the generated index.html from this TypeScript source.
Object.assign(appLogic, {
            async handleSend(isRetry = false, retryUserMessageIndex = -1) {
                await this.commitAllOpenEdits();

                let apiKeyToUse, modelNameToUse, selectedApiProvider;

                selectedApiProvider = state.settings.apiProvider;
                if (selectedApiProvider === 'llmaggregator') {
                    const activeBackend = multiBackendUtils.getActiveBackend();
                    apiKeyToUse = multiBackendUtils.getActiveApiKeyForBackend(activeBackend);
                } else if (state.settings.showMultiApiKeys) {
                    apiKeyToUse = multiApiKeyUtils.getActiveApiKey(selectedApiProvider);
                } else {
                    switch (selectedApiProvider) {
                        case 'gemini': apiKeyToUse = state.settings.apiKey; break;
                        case 'deepseek': apiKeyToUse = state.settings.deepSeekApiKey; break;
                        case 'claude': apiKeyToUse = state.settings.claudeApiKey; break;
                        case 'openai': apiKeyToUse = state.settings.openaiApiKey; break;
                        case 'openrouter': apiKeyToUse = state.settings.openrouterApiKey; break;
                        case 'xai': apiKeyToUse = state.settings.xaiApiKey; break;
                        case 'llmaggregator': apiKeyToUse = state.settings.llmAggregatorApiKey; break;
                    }
                }
                switch (selectedApiProvider) {
                    case 'gemini': modelNameToUse = state.settings.modelName; break;
                    case 'deepseek': modelNameToUse = state.settings.deepSeekModelName; break;
                    case 'claude': modelNameToUse = state.settings.claudeModelName; break;
                    case 'openai': modelNameToUse = state.settings.openaiModelName; break;
                    case 'openrouter': modelNameToUse = state.settings.openrouterModelName; break;
                    case 'xai': modelNameToUse = state.settings.xaiModelName; break;
                    case 'llmaggregator': modelNameToUse = state.settings.llmAggregatorModelName; break;
                }
                let text = '';
                let attachmentsToSend = [];
                if (isRetry) {
                    const retryUserMessage = state.currentMessages[retryUserMessageIndex];
                    if (!retryUserMessage || retryUserMessage.role !== 'user') {
                        uiUtils.setSendingState(false);
                        return;
                    }
                    text = retryUserMessage.content || '';
                    attachmentsToSend = retryUserMessage.attachments ? [...retryUserMessage.attachments] : [];
                } else {
                    text = elements.userInput.value.trim();
                    attachmentsToSend = [...state.pendingAttachments];
                }

                const isInputEmpty = text.trim() === '';
                const hasAttachments = attachmentsToSend.length > 0;
                if (state.isSending) {
                    return;
                }

                if (isInputEmpty && !hasAttachments) {
                    return;
                }

                let currentContextSessionId = state.currentChatId;
                let currentContextMessages = [...state.currentMessages];
                let currentContextSystemPrompt = '';

                let individualPrompt = '';
                let commonPrompt = '';

                if (selectedApiProvider === 'gemini' && state.settings.geminiEnableSystemPromptDefault) {
                    individualPrompt = state.settings.geminiSystemPrompt.trim();
                } else if (selectedApiProvider === 'deepseek' && state.settings.deepSeekEnableSystemPromptDefault) {
                    individualPrompt = state.settings.deepSeekSystemPrompt.trim();
                } else if (selectedApiProvider === 'claude' && state.settings.claudeEnableSystemPromptDefault) {
                    individualPrompt = state.settings.claudeSystemPrompt.trim();
                } else if (selectedApiProvider === 'openai' && state.settings.openaiEnableSystemPromptDefault) {
                    individualPrompt = state.settings.openaiSystemPrompt.trim();
                } else if (selectedApiProvider === 'openrouter' && state.settings.openrouterEnableSystemPromptDefault) {
                    individualPrompt = state.settings.openrouterSystemPrompt.trim();
                } else if (selectedApiProvider === 'xai' && state.settings.xaiEnableSystemPromptDefault) {
                    individualPrompt = state.settings.xaiSystemPrompt.trim();
                } else if (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorEnableSystemPromptDefault) {
                    individualPrompt = state.settings.llmAggregatorSystemPrompt.trim();
                }

                if (state.settings.enableCommonSystemPromptDefault) {
                    commonPrompt = state.settings.commonSystemPrompt.trim();
                }

                if (individualPrompt) {
                    currentContextSystemPrompt = individualPrompt;
                } else if (commonPrompt) {
                    currentContextSystemPrompt = commonPrompt;
                } else {
                    currentContextSystemPrompt = '';
                }

                let contextTemperature, contextMaxTokens, contextTopP,
                    contextPresencePenalty, contextFrequencyPenalty,
                    contextStreamingOutput, contextStreamingSpeed;

                let contextGeminiTopK, contextGeminiThinkingBudget, contextGeminiIncludeThoughts,
                    contextGeminiPseudoStreaming, contextGeminiEnableGrounding;

                let contextDeepSeekIncludeThoughts;

                let contextClaudeTopK, contextClaudeIncludeThoughts, contextClaudeThinkingBudget, contextClaudeExpandThoughtsByDefault;

                let contextXaiVisionEnable, contextXaiIncludeThoughts, contextXaiReasoningEffort;

                let contextLlmAggregatorTopK;

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
                        contextGeminiPseudoStreaming = state.settings.geminiPseudoStreaming;
                        contextGeminiEnableGrounding = state.settings.geminiEnableGrounding;
                    } else if (selectedApiProvider === 'deepseek') {
                        contextTemperature = state.settings.deepSeekTemperature;
                        contextMaxTokens = state.settings.deepSeekMaxTokens;
                        contextTopP = state.settings.deepSeekTopP;
                        contextPresencePenalty = state.settings.deepSeekPresencePenalty;
                        contextFrequencyPenalty = state.settings.deepSeekFrequencyPenalty;
                        contextDeepSeekIncludeThoughts = state.settings.deepSeekIncludeDeepSeekThoughts;
                        contextStreamingOutput = state.settings.deepSeekStreamingOutput;
                        contextStreamingSpeed = state.settings.deepSeekStreamingSpeed;
                    } else if (selectedApiProvider === 'claude') {
                        contextTemperature = state.settings.claudeTemperature;
                        contextMaxTokens = state.settings.claudeMaxTokens;
                        contextClaudeTopK = state.settings.claudeTopK;
                        contextTopP = state.settings.claudeTopP;
                        contextStreamingOutput = state.settings.claudeStreamingOutput;
                        contextStreamingSpeed = state.settings.claudeStreamingSpeed;
                        contextClaudeIncludeThoughts = state.settings.claudeIncludeThoughts;
                        contextClaudeThinkingBudget = state.settings.claudeThinkingBudget;
                        contextClaudeExpandThoughtsByDefault = state.settings.claudeExpandThoughtsByDefault;
                    } else if (selectedApiProvider === 'openai') {
                        contextTemperature = state.settings.openaiTemperature;
                        contextMaxTokens = state.settings.openaiMaxTokens;
                        contextTopP = state.settings.openaiTopP;
                        contextPresencePenalty = state.settings.openaiPresencePenalty;
                        contextFrequencyPenalty = state.settings.openaiFrequencyPenalty;
                        contextStreamingOutput = state.settings.openaiStreamingOutput;
                        contextStreamingSpeed = state.settings.openaiStreamingSpeed;
                    } else if (selectedApiProvider === 'openrouter') {
                        contextTemperature = state.settings.openrouterTemperature;
                        contextMaxTokens = state.settings.openrouterMaxTokens;
                        contextTopP = state.settings.openrouterTopP;
                        contextPresencePenalty = state.settings.openrouterPresencePenalty;
                        contextFrequencyPenalty = state.settings.openrouterFrequencyPenalty;
                        contextStreamingOutput = state.settings.openrouterStreamingOutput;
                        contextStreamingSpeed = state.settings.openrouterStreamingSpeed;
                    } else if (selectedApiProvider === 'xai') {
                        contextTemperature = state.settings.xaiTemperature;
                        contextMaxTokens = state.settings.xaiMaxTokens;
                        contextTopP = state.settings.xaiTopP;
                        contextPresencePenalty = state.settings.xaiPresencePenalty;
                        contextFrequencyPenalty = state.settings.xaiFrequencyPenalty;
                        contextStreamingOutput = state.settings.xaiStreamingOutput;
                        contextStreamingSpeed = state.settings.xaiStreamingSpeed;
                        contextXaiVisionEnable = state.settings.xaiVisionEnable;
                        contextXaiIncludeThoughts = state.settings.xaiIncludeThoughts;
                        contextXaiReasoningEffort = state.settings.xaiReasoningEffort;
                    } else if (selectedApiProvider === 'llmaggregator') {
                        contextTemperature = state.settings.llmAggregatorTemperature;
                        contextMaxTokens = state.settings.llmAggregatorMaxTokens;
                        contextTopP = state.settings.llmAggregatorTopP;
                        contextLlmAggregatorTopK = state.settings.llmAggregatorTopK;
                        contextPresencePenalty = state.settings.llmAggregatorPresencePenalty;
                        contextFrequencyPenalty = state.settings.llmAggregatorFrequencyPenalty;
                        contextDeepSeekIncludeThoughts = state.settings.llmAggregatorIncludeThoughts;
                        contextStreamingOutput = state.settings.llmAggregatorStreamingOutput;
                        contextStreamingSpeed = state.settings.llmAggregatorStreamingSpeed;
                    }

                if (!apiKeyToUse) {
                    await uiUtils.showCustomAlert(`${selectedApiProvider} APIキーが設定されていません。設定画面を開きます。`);
                    uiUtils.showScreen('settings');
                    return "APIキー未設定";
                }

                if (selectedApiProvider === 'llmaggregator') {
                                        const activeBackend = multiBackendUtils.getActiveBackend();
                    if (!activeBackend || !activeBackend.url) {
                        await uiUtils.showCustomAlert('アクティブなLLM Aggregatorバックエンドが設定されていません。');
                        uiUtils.showScreen('settings');
                        return "バックエンド未設定";
                    }
                    if (!isAllowedAggregatorDomain(activeBackend.url)) {
                        await uiUtils.showCustomAlert('LLM AggregatorのバックエンドURLがホワイトリスト外のため、送信できません。設定を確認してください。');
                        uiUtils.showScreen('settings');
                        return "不正なドメイン";
                    }
                }

                uiUtils.setSendingState(true);
                state.partialStreamContent = '';
                state.partialThoughtStreamContent = '';

                let contextWindowTokensForResponse = null;
                if (selectedApiProvider === 'gemini') {
                    contextWindowTokensForResponse = await apiUtils.getGeminiModelContextWindow(apiKeyToUse, modelNameToUse);
                } else if (selectedApiProvider === 'openrouter') {
                    contextWindowTokensForResponse = Number(openRouterModelCatalog.getModel(modelNameToUse)?.contextLength) || null;
                }
                const responseModelMetadata = {
                    generatedByApiProvider: selectedApiProvider,
                    generatedByModel: modelNameToUse || null,
                    contextWindowTokens: contextWindowTokensForResponse,
                };

                let userMessageIndex = isRetry ? retryUserMessageIndex : -1;
                let existingSiblingGroupId = null;
                let firstResponseIndexForRetry = -1;
                let siblingGroupIdToUse = null;
                let messagesToProcess;

                if (!isRetry) {
                    const userMessage = {
                        role: 'user', content: text, timestamp: Date.now(),
                        attachments: attachmentsToSend,
                        generatedByApiProvider: null
                    };
                    state.currentMessages.push(userMessage);
                    userMessageIndex = state.currentMessages.length - 1;
                    state.messageCollapsedStates.set(userMessageIndex, false);
                    uiUtils.appendMessage(userMessage.role, userMessage.content, userMessageIndex, false, null, userMessage.attachments);
                    elements.userInput.value = '';
                    state.pendingAttachments = [];
                    uiUtils.adjustTextareaHeight();
                    uiUtils.updateAttachmentBadgeVisibility();
                    if (state.settings.autoScrollOnNewMessage) uiUtils.scrollToBottom();
                    currentContextMessages = [...state.currentMessages];
                } else if (isRetry) {
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

                messagesToProcess = isRetry
                    ? currentContextMessages.slice(0, userMessageIndex + 1)
                    : [...currentContextMessages];

                const lorebookPrompt = lorebookUtils.buildPrompt(
                    state.currentLorebookId,
                    messagesToProcess,
                    currentContextSystemPrompt
                );
                currentContextSystemPrompt = lorebookUtils.appendToSystemPrompt(currentContextSystemPrompt, lorebookPrompt);


                try {
                        let titleToSave = null;
                        let isNewChatForDBSave = !currentContextSessionId;
                        let existingChatForDBSave = null;

                        if (currentContextSessionId) {
                            existingChatForDBSave = await dbUtils.getChat(currentContextSessionId);
                            if (existingChatForDBSave) {
                                titleToSave = existingChatForDBSave.title;
                                isNewChatForDBSave = false;
                            } else {
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
                                generatedByModel: msg.generatedByModel || null,
                                contextWindowTokens: Number(msg.contextWindowTokens) || null,
                                ...(msg.finishReason && { finishReason: msg.finishReason }),
                                ...(msg.finishMessage && { finishMessage: msg.finishMessage }),
                                ...(msg.safetyRatings && { safetyRatings: msg.safetyRatings }),
                                ...(msg.promptFeedback && { promptFeedback: msg.promptFeedback }),
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
                            title: titleToSave,
                            lorebookId: lorebookUtils.normalizeLorebookId(state.currentLorebookId)
                        };

                        if (isNewChatForDBSave) {
                            chatToSave.createdAt = Date.now();
                        } else if (existingChatForDBSave) {
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
                } catch (error) {
                    if (currentContextSessionId) {
                        uiUtils.displayError("チャットの保存に失敗しましたが、送信を試みます。", false);
                    }
                }
                const apiMessages = messagesToProcess
                    .filter(msg => {
                        if (msg.role === 'user') return true;
                        if (msg.role === 'model') return !msg.isCascaded || (msg.isCascaded && msg.isSelected);
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
                                } else if (att.base64Data) {
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
                const commonDummyUser = state.settings.enableCommonDummyUser
                    ? state.settings.commonDummyUser?.trim()
                    : '';
                if (commonDummyUser) {
                    apiMessages.push({ role: 'user', parts: [{ text: commonDummyUser }] });
                }
                const commonGenerationConfig = {};
                if (contextTemperature !== null) commonGenerationConfig.temperature = contextTemperature;
                if (contextMaxTokens !== null) commonGenerationConfig.maxOutputTokens = contextMaxTokens;
                if (contextTopP !== null) commonGenerationConfig.topP = contextTopP;
                if (contextPresencePenalty !== null) commonGenerationConfig.presencePenalty = contextPresencePenalty;
                if (contextFrequencyPenalty !== null) commonGenerationConfig.frequencyPenalty = contextFrequencyPenalty;

                if (selectedApiProvider === 'gemini') {
                    if (contextGeminiTopK !== null) commonGenerationConfig.topK = contextGeminiTopK;
                    if (contextGeminiThinkingBudget !== null || contextGeminiIncludeThoughts) {
                        commonGenerationConfig.thinkingConfig = commonGenerationConfig.thinkingConfig || {};
                        if (contextGeminiThinkingBudget !== null && Number.isInteger(contextGeminiThinkingBudget) && contextGeminiThinkingBudget >= 0) {
                            commonGenerationConfig.thinkingConfig.thinkingBudget = contextGeminiThinkingBudget;
                        }
                        if (contextGeminiIncludeThoughts) {
                            commonGenerationConfig.thinkingConfig.includeThoughts = true;
                        }
                        if (Object.keys(commonGenerationConfig.thinkingConfig).length === 0) delete commonGenerationConfig.thinkingConfig;
                    }
                } else if (selectedApiProvider === 'claude') {
                    if (contextClaudeTopK !== null) commonGenerationConfig.topK = contextClaudeTopK;
                    if (contextClaudeIncludeThoughts) {
                        commonGenerationConfig.thinkingConfig = { "type": "enabled" };
                        if (contextClaudeThinkingBudget !== null && Number.isInteger(contextClaudeThinkingBudget) && contextClaudeThinkingBudget >= 1024) {
                            commonGenerationConfig.thinkingConfig.budget_tokens = contextClaudeThinkingBudget;
                        }
                    }
                } else if (selectedApiProvider === 'llmaggregator') {
                    if (contextLlmAggregatorTopK !== null) commonGenerationConfig.topK = contextLlmAggregatorTopK;
                }

                let systemInstructionForProvider = null;
                const systemPromptTextToUseForApi = currentContextSystemPrompt?.trim() ? currentContextSystemPrompt.trim() : null;

                if (systemPromptTextToUseForApi) {
                    if (selectedApiProvider === 'gemini') {
                        systemInstructionForProvider = { role: "system", parts: [{ text: systemPromptTextToUseForApi }] };
                    } else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'claude' || selectedApiProvider === 'openai' || selectedApiProvider === 'openrouter' || selectedApiProvider === 'xai' || selectedApiProvider === 'llmaggregator') {
                        systemInstructionForProvider = { content: systemPromptTextToUseForApi, parts: [{ text: systemPromptTextToUseForApi }] };
                    }
                }

                let modelResponseRawContent = '';
                let modelThoughtSummaryContent = '';
                let modelResponseMetadata = {};
                let currentGroundingMetadata = null;
                let finalUsageMetadataFromStream = null;

                let useStreamingForThisCall = contextStreamingOutput;
                let usePseudoForThisCall = selectedApiProvider === 'gemini' && contextGeminiPseudoStreaming;

                let modelMessageObjectForStream = null;

                try {
                    let apiResponseObject;
                    if (selectedApiProvider === 'gemini') {
                        apiResponseObject = await apiUtils.callGeminiApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, usePseudoForThisCall, contextGeminiEnableGrounding);
                    } else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                        apiResponseObject = await apiUtils.callDeepSeekApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, selectedApiProvider);
                    } else if (selectedApiProvider === 'claude') {
                        apiResponseObject = await apiUtils.callClaudeApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall);
                    } else if (selectedApiProvider === 'openai' || selectedApiProvider === 'openrouter') {
                        const hasImage = apiMessages.some(m => m.parts.some(p => p.inlineData && p.inlineData.mimeType.startsWith('image/')));
                        apiResponseObject = await apiUtils.callOpenAICompatibleApi(apiKeyToUse, modelNameToUse, selectedApiProvider, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, hasImage);
                    } else if (selectedApiProvider === 'xai') {
                        const hasImage = apiMessages.some(m => m.parts.some(p => p.inlineData && p.inlineData.mimeType.startsWith('image/')));
                        const enableVisionForThisCall = contextXaiVisionEnable || hasImage;
                        apiResponseObject = await apiUtils.callXaiApi(apiKeyToUse, modelNameToUse, apiMessages, commonGenerationConfig, systemInstructionForProvider, useStreamingForThisCall, enableVisionForThisCall);
                    } else {
                        throw new Error("不明なAPIプロバイダーが選択されています。");
                    }

                    state.partialStreamContent = '';
                    state.partialThoughtStreamContent = '';

                    if (useStreamingForThisCall) {
                        const tempPlaceholderIndex = state.currentMessages.length;
                        modelMessageObjectForStream = {
                            role: 'model',
                            content: '',
                            thoughtSummary: null,
                            deepSeekThoughtSummary: null,
                            xaiThoughtSummary: null,
                            timestamp: Date.now(),
                            ...responseModelMetadata,
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
                        } else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                            responseStreamIterator = apiUtils.handleDeepSeekStreamingResponse(apiResponseObject);
                        } else if (selectedApiProvider === 'claude') {
                            responseStreamIterator = apiUtils.handleClaudeStreamingResponse(apiResponseObject);
                        } else if (selectedApiProvider === 'openai' || selectedApiProvider === 'openrouter') {
                            responseStreamIterator = apiUtils.handleOpenAICompatibleStreamingResponse(apiResponseObject, selectedApiProvider);
                        } else if (selectedApiProvider === 'xai') {
                            responseStreamIterator = apiUtils.handleOpenAICompatibleStreamingResponse(apiResponseObject, 'xai');
                        }

                        const currentContextStreamSpeed = selectedApiProvider === 'gemini' ? contextStreamingSpeed :
                            selectedApiProvider === 'deepseek' ? state.settings.deepSeekStreamingSpeed :
                                selectedApiProvider === 'claude' ? state.settings.claudeStreamingSpeed :
                                    selectedApiProvider === 'openrouter' ? state.settings.openrouterStreamingSpeed :
                                    selectedApiProvider === 'xai' ? state.settings.xaiStreamingSpeed :
                                        selectedApiProvider === 'llmaggregator' ? state.settings.llmAggregatorStreamingSpeed :
                                            state.settings.openaiStreamingSpeed;

                        const messageIndexForDisplay = modelMessageObjectForStream ? state.currentMessages.indexOf(modelMessageObjectForStream) : -1;

                        for await (const streamData of responseStreamIterator) {
                            if (state.abortController?.signal.aborted) {
                                modelResponseMetadata.finishReason = 'ABORTED';
                                throw new Error("リクエストがキャンセルされました。");
                            }

                            if (streamData.type === 'chunk') {
                                if (streamData.thoughtText) {
                                    for (const char of streamData.thoughtText) {
                                        if (state.abortController?.signal.aborted) break;
                                        state.partialThoughtStreamContent += char;
                                        uiUtils.updateStreamingMessage(messageIndexForDisplay, char, true);
                                        if (currentContextStreamSpeed > 0) await sleep(currentContextStreamSpeed);
                                    }
                                }
                                if (streamData.contentText) {
                                    for (const char of streamData.contentText) {
                                        if (state.abortController?.signal.aborted) break;
                                        state.partialStreamContent += char;
                                        uiUtils.updateStreamingMessage(messageIndexForDisplay, char, false);
                                        if (currentContextStreamSpeed > 0) await sleep(currentContextStreamSpeed);
                                    }
                                }
                                if (state.abortController?.signal.aborted) {
                                    modelResponseMetadata.finishReason = 'ABORTED';
                                    throw new Error("リクエストがキャンセルされました。");
                                }
                                if (streamData.groundingMetadata && selectedApiProvider === 'gemini') {
                                    currentGroundingMetadata = streamData.groundingMetadata;
                                    if (modelMessageObjectForStream && state.currentMessages.includes(modelMessageObjectForStream)) {
                                        const msgIndexForGrounding = state.currentMessages.indexOf(modelMessageObjectForStream);
                                        if (state.currentMessages[msgIndexForGrounding]) {
                                            state.currentMessages[msgIndexForGrounding].groundingMetadata = currentGroundingMetadata;
                                        }
                                    }
                                }
                                if (streamData.usageMetadata) finalUsageMetadataFromStream = streamData.usageMetadata;
                            } else if (streamData.type === 'metadata') {
                                modelResponseMetadata = {
                                    finishReason: streamData.finishReason,
                                    finishMessage: streamData.finishMessage,
                                    safetyRatings: streamData.safetyRatings,
                                    promptFeedback: streamData.promptFeedback,
                                };
                                if (selectedApiProvider === 'gemini') {
                                    if (streamData.groundingMetadata) currentGroundingMetadata = streamData.groundingMetadata;
                                    if (streamData.usageMetadata) finalUsageMetadataFromStream = streamData.usageMetadata;
                                } else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                                    if (streamData.fullReasoningContent && contextDeepSeekIncludeThoughts) {
                                        modelThoughtSummaryContent = streamData.fullReasoningContent;
                                    }
                                    if (streamData.usageMetadata) finalUsageMetadataFromStream = streamData.usageMetadata;
                                } else if (selectedApiProvider === 'claude' || selectedApiProvider === 'openai' || selectedApiProvider === 'openrouter' || selectedApiProvider === 'xai') {
                                    if (streamData.usageMetadata) finalUsageMetadataFromStream = streamData.usageMetadata;
                                }
                                break;
                            } else if (streamData.type === 'error') {
                                modelResponseMetadata.finishReason = 'ERROR';
                                modelResponseMetadata.error = streamData.error;
                                throw new Error(streamData.message || "ストリーム内でエラーが発生しました。");
                            }
                        }

                        modelThoughtSummaryContent = state.partialThoughtStreamContent;
                        modelResponseRawContent = state.partialStreamContent;

                        let finalContent = modelResponseRawContent;
                        if (selectedApiProvider === 'gemini' && !finalContent && !modelThoughtSummaryContent && !modelResponseMetadata.finishReason) {
                            modelResponseMetadata.finishReason = 'EMPTY_RESPONSE';
                            modelResponseMetadata.finishMessage = '本文、思考要約、終了理由のいずれも返されませんでした。';
                        }
                        if (finalContent || modelThoughtSummaryContent || modelResponseMetadata.finishReason) {
                            if (useStreamingForThisCall && modelMessageObjectForStream) {
                                const finalModelMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                                if (finalModelMessageIndex !== -1) {
                                    const msgToUpdate = state.currentMessages[finalModelMessageIndex];
                                    msgToUpdate.content = finalContent;
                                    msgToUpdate.timestamp = Date.now();
                                    msgToUpdate.finishReason = modelResponseMetadata.finishReason;
                                    msgToUpdate.finishMessage = modelResponseMetadata.finishMessage;
                                    msgToUpdate.safetyRatings = modelResponseMetadata.safetyRatings;
                                    msgToUpdate.promptFeedback = modelResponseMetadata.promptFeedback;
                                    msgToUpdate.usageMetadata = finalUsageMetadataFromStream;
                                    if (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts) {
                                        if (modelThoughtSummaryContent) {
                                            msgToUpdate.thoughtSummary = modelThoughtSummaryContent;
                                        }
                                        msgToUpdate.groundingMetadata = currentGroundingMetadata;
                                    } else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts && modelThoughtSummaryContent) {
                                        msgToUpdate.deepSeekThoughtSummary = modelThoughtSummaryContent || null;
                                    } else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts && modelThoughtSummaryContent) {
                                        msgToUpdate.thoughtSummary = modelThoughtSummaryContent || null;
                                    } else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts && modelThoughtSummaryContent) {
                                        msgToUpdate.xaiThoughtSummary = modelThoughtSummaryContent || null;
                                    }

                                    uiUtils.finalizeStreamingMessage(finalModelMessageIndex);
                                    await dbUtils.saveChat();
                                }
                            } else {
                                const newModelMessage = {
                                    role: 'model', content: finalContent,
                                    timestamp: Date.now(),
                                    ...modelResponseMetadata,
                                    usageMetadata: finalUsageMetadataFromStream,
                                    ...responseModelMetadata
                                };
                                if (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts) {
                                    newModelMessage.thoughtSummary = modelThoughtSummaryContent || null;
                                    newModelMessage.groundingMetadata = currentGroundingMetadata;
                                } else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts && modelThoughtSummaryContent) {
                                    newModelMessage.deepSeekThoughtSummary = modelThoughtSummaryContent || null;
                                } else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts && modelThoughtSummaryContent) {
                                    newModelMessage.thoughtSummary = modelThoughtSummaryContent || null;
                                } else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts && modelThoughtSummaryContent) {
                                    newModelMessage.xaiThoughtSummary = modelThoughtSummaryContent || null;
                                }
                                newModelMessage.thoughtSummaryOpen = (selectedApiProvider === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                                    (selectedApiProvider === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                                    (selectedApiProvider === 'claude' && state.settings.claudeExpandThoughtsByDefault) ||
                                    (selectedApiProvider === 'xai' && state.settings.xaiExpandThoughtsByDefault) ||
                                    (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorExpandThoughtsByDefault);

                                const targetUserIndexForCascade = userMessageIndex;
                                if (targetUserIndexForCascade !== -1) {
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
                        } else {
                            if (useStreamingForThisCall && modelMessageObjectForStream) {
                                const tempPlaceholderIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                                const placeholderElement = document.getElementById(`streaming-message-${tempPlaceholderIndex}`);
                                if (placeholderElement) placeholderElement.remove();
                                if (tempPlaceholderIndex !== -1) state.currentMessages.splice(tempPlaceholderIndex, 1);
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
                                finalMetadata = {
                                    finishReason: candidate.finishReason,
                                    finishMessage: candidate.finishMessage || null,
                                    safetyRatings: candidate.safetyRatings,
                                };
                                candidate.content?.parts?.forEach(part => {
                                    if (part.thought === true && contextGeminiIncludeThoughts) finalThoughtSummary += (part.text || "") + "\n\n";
                                    else if (part.thought !== true) rawContentFromApi += (part.text || "") + "\n\n";
                                });
                                finalThoughtSummary = finalThoughtSummary.trim();
                                rawContentFromApi = rawContentFromApi.trim();
                                finalGrounding = candidate.groundingMetadata || null;
                                finalUsage = data.usageMetadata || null;
                                if (rawContentFromApi && candidate.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") rawContentFromApi += `\n\n(理由: ${candidate.finishReason})`;
                            } else {
                                if (data.promptFeedback) {
                                    finalMetadata = {
                                        promptFeedback: data.promptFeedback,
                                        finishReason: data.promptFeedback.blockReason || 'ERROR',
                                        finishMessage: data.promptFeedback.blockReasonMessage || null,
                                        safetyRatings: data.promptFeedback.safetyRatings,
                                    };
                                } else {
                                    finalMetadata.finishReason = 'ERROR';
                                }
                                finalUsage = data.usageMetadata || null;
                            }
                        } else if (selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') {
                            const choice = data.choices?.[0];
                            if (choice) {
                                rawContentFromApi = choice.message?.content || "";
                                finalMetadata = { finishReason: choice.finish_reason };
                                if (data.usage) finalUsage = { candidatesTokenCount: data.usage.completion_tokens, totalTokenCount: data.usage.total_tokens };
                                if (contextDeepSeekIncludeThoughts && data.parsedReasoningContent) finalThoughtSummary = data.parsedReasoningContent;
                            } else {
                                rawContentFromApi = `${selectedApiProvider.toUpperCase()}からの応答がありません。`;
                                finalMetadata = { finishReason: 'ERROR' };
                                if (data.error) rawContentFromApi += ` (エラー: ${data.error.message})`;
                            }
                        } else if (selectedApiProvider === 'claude') {
                            if (data.content && data.content.length > 0) {
                                data.content.forEach(block => {
                                    if (block.type === 'text') rawContentFromApi += block.text;
                                    else if (block.type === 'thinking' && contextClaudeIncludeThoughts) finalThoughtSummary += (block.thinking || "") + "\n\n";
                                });
                                finalThoughtSummary = finalThoughtSummary.trim();
                            }
                            finalMetadata = { finishReason: data.stop_reason || 'stop' };
                            if (data.usage) finalUsage = { candidatesTokenCount: data.usage.output_tokens, totalTokenCount: data.usage.input_tokens + data.usage.output_tokens };
                            if (!rawContentFromApi && data.stop_reason === 'end_turn') rawContentFromApi = "(応答が空です)";
                        } else if (selectedApiProvider === 'openai' || selectedApiProvider === 'openrouter' || selectedApiProvider === 'xai') {
                            if (data.choices && data.choices.length > 0) {
                                rawContentFromApi = data.choices[0].message?.content || "";
                                finalMetadata = { finishReason: data.choices[0].finish_reason };
                                if (selectedApiProvider === 'xai' && data.choices[0].message.reasoning_content) finalThoughtSummary = data.choices[0].message.reasoning_content;
                            }
                            if (data.usage) {
                                let reasoningTokens = (selectedApiProvider === 'xai' && data.usage.completion_tokens_details?.reasoning_tokens) ? data.usage.completion_tokens_details.reasoning_tokens : 0;
                                finalUsage = { candidatesTokenCount: data.usage.completion_tokens + reasoningTokens, totalTokenCount: data.usage.prompt_tokens + data.usage.completion_tokens + reasoningTokens };
                            }
                            if (!rawContentFromApi && finalMetadata.finishReason === 'stop') rawContentFromApi = "(応答が空です)";
                        }
                        finalContent = rawContentFromApi;
                    }


                    if (finalContent || finalThoughtSummary || finalMetadata.finishReason) {
                        let finalModelMessageIndex;
                        if (useStreamingForThisCall && modelMessageObjectForStream) {
                            finalModelMessageIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                        } else {
                            const newModelMessage = { role: 'model', content: '', timestamp: Date.now(), ...finalMetadata, usageMetadata: finalUsage, ...responseModelMetadata };
                            const targetUserIndexForCascade = userMessageIndex;
                            if (targetUserIndexForCascade !== -1) {
                                if (siblingGroupIdToUse === null) siblingGroupIdToUse = `gid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
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
                            msgToUpdate.finishMessage = finalMetadata.finishMessage;
                            msgToUpdate.safetyRatings = finalMetadata.safetyRatings;
                            msgToUpdate.promptFeedback = finalMetadata.promptFeedback;
                            msgToUpdate.usageMetadata = finalUsage;
                            Object.assign(msgToUpdate, responseModelMetadata);

                            if (selectedApiProvider === 'gemini' && contextGeminiIncludeThoughts) { msgToUpdate.thoughtSummary = finalThoughtSummary || null; msgToUpdate.groundingMetadata = finalGrounding; }
                            else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts) { msgToUpdate.deepSeekThoughtSummary = finalThoughtSummary || null; }
                            else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts) { msgToUpdate.thoughtSummary = finalThoughtSummary || null; }
                            else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts) { msgToUpdate.xaiThoughtSummary = finalThoughtSummary || null; }

                            msgToUpdate.thoughtSummaryOpen = (selectedApiProvider === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                                (selectedApiProvider === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                                (selectedApiProvider === 'claude' && state.settings.claudeExpandThoughtsByDefault) ||
                                (selectedApiProvider === 'xai' && state.settings.xaiExpandThoughtsByDefault) ||
                                (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorExpandThoughtsByDefault);
                            state.thoughtSummaryOpenStates.set(finalModelMessageIndex, msgToUpdate.thoughtSummaryOpen);

                            if (useStreamingForThisCall) {
                                uiUtils.finalizeStreamingMessage(finalModelMessageIndex);
                            } else {
                                const shouldMaintainScroll = !state.settings.autoScrollOnNewMessage;
uiUtils.renderChatMessages(shouldMaintainScroll);
                            }
                            await dbUtils.saveChat();

                        }
                    } else {
                        if (useStreamingForThisCall && modelMessageObjectForStream) {
                            const tempPlaceholderIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                            const placeholderElement = document.getElementById(`streaming-message-${tempPlaceholderIndex}`);
                            if (placeholderElement) placeholderElement.remove();
                            if (tempPlaceholderIndex !== -1) state.currentMessages.splice(tempPlaceholderIndex, 1);
                        }
                    }

                }

                catch (error) {
                    const isAbort = error.message === "リクエストがキャンセルされました。" || modelResponseMetadata.finishReason === 'ABORTED';
                    const displayErrorMessage = isAbort ? error.message : (error.message || "不明なエラーが発生しました");

                    let partialThoughtContentOnError = state.partialThoughtStreamContent;
                    let partialContentOnError = state.partialStreamContent;

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
                            Object.assign(msgToUpdate, responseModelMetadata);

                            if (selectedApiProvider === 'gemini') {
                                msgToUpdate.thoughtSummary = finalPartialThoughtValue;
                                msgToUpdate.groundingMetadata = currentGroundingMetadata;
                            } else if ((selectedApiProvider === 'deepseek' || selectedApiProvider === 'llmaggregator') && contextDeepSeekIncludeThoughts) {
                                msgToUpdate.deepSeekThoughtSummary = finalPartialThoughtValue;
                            } else if (selectedApiProvider === 'claude' && contextClaudeIncludeThoughts) {
                                msgToUpdate.thoughtSummary = finalPartialThoughtValue;
                            } else if (selectedApiProvider === 'xai' && contextXaiIncludeThoughts) {
                                msgToUpdate.xaiThoughtSummary = finalPartialThoughtValue;
                            }

                            try {
                                uiUtils.finalizeStreamingMessage(streamingMessageIndex);
                                await dbUtils.saveChat();
                            } catch (saveError) {
                                uiUtils.displayError(displayErrorMessage, !isAbort);
                            }
                        } else {
                            uiUtils.displayError(displayErrorMessage, !isAbort);
                        }
                    } else {
                        if (useStreamingForThisCall && !isAbort && modelMessageObjectForStream) {
                            const tempPlaceholderIndex = state.currentMessages.indexOf(modelMessageObjectForStream);
                            const placeholderElement = document.getElementById(`streaming-message-${tempPlaceholderIndex}`);
                            if (placeholderElement) placeholderElement.remove();
                            if (tempPlaceholderIndex !== -1) state.currentMessages.splice(tempPlaceholderIndex, 1);
                        }
                        uiUtils.displayError(displayErrorMessage, !isAbort);
                    }
                }
                finally {
                    uiUtils.setSendingState(false);
                    state.abortController = null;
                    state.partialStreamContent = '';
                    state.partialThoughtStreamContent = '';
                    if (state.settings.autoScrollOnNewMessage) {
                        // uiUtils.scrollToBottom();
                    }
                    uiUtils.updateAttachmentBadgeVisibility();
                }
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
                } catch (error) {
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
});
