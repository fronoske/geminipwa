// @ts-nocheck -- Enable after shared application service types are defined.
// Bundled into the generated index.html from this TypeScript source.
        const apiUtils = {
            geminiModelContextCache: new Map(),

            formatGeminiEmptyResponse(messageData = {}) {
                const promptFeedback = messageData.promptFeedback || null;
                const finishReason = promptFeedback?.blockReason || messageData.finishReason || '不明';
                const finishMessage = messageData.finishMessage || promptFeedback?.blockReasonMessage || '';
                const safetyRatings = [
                    ...(Array.isArray(messageData.safetyRatings) ? messageData.safetyRatings : []),
                    ...(Array.isArray(promptFeedback?.safetyRatings) ? promptFeedback.safetyRatings : []),
                ];
                const blockedCategories = [...new Set(safetyRatings
                    .filter(rating => rating?.blocked)
                    .map(rating => rating.category)
                    .filter(Boolean))];
                const usage = messageData.usageMetadata || {};
                const tokenDetails = [];
                if (typeof usage.candidatesTokenCount === 'number') {
                    tokenDetails.push(`通常出力: ${usage.candidatesTokenCount} tokens`);
                }
                if (typeof usage.thoughtsTokenCount === 'number') {
                    tokenDetails.push(`思考: ${usage.thoughtsTokenCount} tokens`);
                }

                const details = [`終了理由: ${finishReason}`];
                if (finishMessage) details.push(`詳細: ${finishMessage}`);
                if (blockedCategories.length > 0) details.push(`該当カテゴリ: ${blockedCategories.join(', ')}`);
                if (tokenDetails.length > 0) details.push(tokenDetails.join(' / '));
                return `Geminiから本文のない応答が返されました。${details.join(' / ')}`;
            },

            async getGeminiModelContextWindow(apiKey, model) {
                const normalizedModel = String(model || '').replace(/^models\//, '').trim();
                if (!apiKey || !normalizedModel) return null;
                if (this.geminiModelContextCache.has(normalizedModel)) {
                    return this.geminiModelContextCache.get(normalizedModel);
                }

                try {
                    const endpoint = `${GEMINI_API_BASE_URL}${encodeURIComponent(normalizedModel)}?key=${encodeURIComponent(apiKey)}`;
                    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
                    if (!response.ok) return null;
                    const modelInfo = await response.json();
                    const inputTokenLimit = Number(modelInfo.inputTokenLimit) || 0;
                    if (inputTokenLimit <= 0) return null;
                    this.geminiModelContextCache.set(normalizedModel, inputTokenLimit);
                    return inputTokenLimit;
                } catch {
                    return null;
                }
            },

            async callGeminiApi(apiKey, model, messagesForApi, generationConfig, systemInstruction, useStreaming, usePseudo, enableGrounding) {
                if (!apiKey) {
                    throw new Error("APIキーが設定されていません。");
                }
                let baseUrl = GEMINI_API_BASE_URL;

                state.abortController = new AbortController();
                const { signal } = state.abortController;

                let endpointMethod = useStreaming
                    ? (usePseudo ? 'generateContent?alt=sse&' : 'streamGenerateContent?alt=sse&')
                    : 'generateContent?';

                const endpoint = `${baseUrl}${model}:${endpointMethod}key=${apiKey}`;

                const finalGenerationConfig = { ...generationConfig };
                if (state.settings.geminiThinkingBudget !== null || state.settings.geminiIncludeThoughts) {
                    finalGenerationConfig.thinkingConfig = finalGenerationConfig.thinkingConfig || {};
                    if (state.settings.geminiThinkingBudget !== null && Number.isInteger(state.settings.geminiThinkingBudget) && state.settings.geminiThinkingBudget >= 0) {
                        finalGenerationConfig.thinkingConfig.thinkingBudget = state.settings.geminiThinkingBudget;
                    }
                    if (state.settings.geminiIncludeThoughts) {
                        finalGenerationConfig.thinkingConfig.includeThoughts = true;
                    }
                    if (Object.keys(finalGenerationConfig.thinkingConfig).length === 0) delete finalGenerationConfig.thinkingConfig;
                }

                const requestBody = {
                    contents: messagesForApi,
                    ...(Object.keys(finalGenerationConfig).length > 0 && { generationConfig: finalGenerationConfig }),
                    ...(systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0 && systemInstruction.parts[0].text && { systemInstruction }),
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }, { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                    ]
                };

                const tools = [];
                if (enableGrounding) {
                    tools.push({ "google_search": {} });
                }

                if (tools.length > 0) {
                    requestBody.tools = tools;
                }

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal
                    });

                    if (!response.ok) {
                        let errorMsg = `APIエラー (${response.status}): ${response.statusText}`;
                        try {
                            const errorData = await response.json();
                            if (errorData.error && errorData.error.message) {
                                errorMsg = `APIエラー (${response.status}): ${errorData.error.message}`;
                            }
                        } catch (e) { }
                        throw new Error(errorMsg);
                    }
                    return response;
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error("リクエストがキャンセルされました。");
                    }
                    throw error;
                }
            },
            async *handleGeminiStreamingResponse(response) {
                if (!response.body) {
                    throw new Error("レスポンスボディがありません。");
                }
                const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
                let buffer = '';
                let lastCandidateInfo = null;
                let isCancelled = false;
                let groundingMetadata = null;
                let finalUsageMetadata = null;
                let finalPromptFeedback = null;

                try {
                    while (true) {
                        if (state.abortController?.signal.aborted && !isCancelled) {
                            isCancelled = true;
                            await reader.cancel("User aborted");
                            throw new Error("リクエストがキャンセルされました。");
                        }

                        let readResult;
                        try {
                            readResult = await reader.read();
                        } catch (readError) {
                            if (readError.name === 'AbortError' || readError.message === "User aborted" || readError.message.includes("aborted")) {
                                if (!isCancelled) {
                                    isCancelled = true;
                                    throw new Error("リクエストがキャンセルされました。");
                                }
                                break;
                            }
                            throw readError;
                        }

                        const { value, done } = readResult;

                        if (done) {
                            if (buffer.trim()) {
                                const finalData = parseSseDataForYield(buffer.trim().substring(6));
                                if (finalData) yield finalData;
                            }
                            break;
                        }

                        buffer += value;
                        let remainingBuffer = buffer;
                        while (true) {
                            const newlineIndex = remainingBuffer.indexOf('\n');
                            if (newlineIndex === -1) {
                                buffer = remainingBuffer;
                                break;
                            }
                            const line = remainingBuffer.substring(0, newlineIndex).trim();
                            remainingBuffer = remainingBuffer.substring(newlineIndex + 1);

                            if (line.startsWith('data: ')) {
                                const chunkData = parseSseDataForYield(line.substring(6));
                                if (chunkData) {
                                    if (chunkData.groundingMetadata) groundingMetadata = chunkData.groundingMetadata;
                                    if (chunkData.usageMetadata) finalUsageMetadata = chunkData.usageMetadata;
                                    yield chunkData;
                                }
                            } else if (line !== '') {
                            }
                            if (remainingBuffer === '') {
                                buffer = '';
                                break;
                            }
                        }
                    }
                    const finishReason = lastCandidateInfo?.finishReason;
                    const safetyRatings = lastCandidateInfo?.safetyRatings;
                    const finishMessage = lastCandidateInfo?.finishMessage || null;

                    yield {
                        type: 'metadata',
                        finishReason: isCancelled ? 'ABORTED' : finishReason,
                        finishMessage,
                        safetyRatings,
                        promptFeedback: finalPromptFeedback,
                        groundingMetadata: groundingMetadata,
                        usageMetadata: finalUsageMetadata
                    };

                } catch (error) {
                    throw new Error(`${error.message || error}`, { cause: { originalError: error } });
                } finally {
                    if (!reader.closed && !isCancelled) {
                        try { await reader.cancel("Cleanup cancellation"); } catch (e) { }
                    }
                }

                function parseSseDataForYield(jsonString) {
                    try {
                        const chunkJson = JSON.parse(jsonString);
                        if (chunkJson.error) {
                            const errorMsg = `モデルエラー: ${chunkJson.error.message || JSON.stringify(chunkJson.error)}`;
                            lastCandidateInfo = { error: chunkJson.error, finishReason: 'ERROR' };
                            return { type: 'error', error: chunkJson.error, message: errorMsg };
                        }

                        let contentText = null;
                        let thoughtText = null;
                        let currentGroundingMetadata = null;
                        let currentUsageMetadata = null;

                        if (chunkJson.usageMetadata) {
                            currentUsageMetadata = chunkJson.usageMetadata;
                            finalUsageMetadata = chunkJson.usageMetadata;
                        }

                        if (chunkJson.candidates && chunkJson.candidates.length > 0) {
                            lastCandidateInfo = chunkJson.candidates[0];
                            if (lastCandidateInfo?.content?.parts) {
                                lastCandidateInfo.content.parts.forEach(part => {
                                    if (typeof part.text === 'string') {
                                        if (part.thought === true) {
                                            thoughtText = (thoughtText || '') + part.text;
                                        } else {
                                            contentText = (contentText || '') + part.text;
                                        }
                                    }
                                });
                            }
                            if (lastCandidateInfo.groundingMetadata) {
                                currentGroundingMetadata = lastCandidateInfo.groundingMetadata;
                            }
                        } else if (chunkJson.promptFeedback) {
                            finalPromptFeedback = chunkJson.promptFeedback;
                            lastCandidateInfo = {
                                finishReason: chunkJson.promptFeedback.blockReason || 'ERROR',
                                finishMessage: chunkJson.promptFeedback.blockReasonMessage || null,
                                safetyRatings: chunkJson.promptFeedback.safetyRatings
                            };
                            return null;
                        }

                        if (contentText !== null || thoughtText !== null || currentGroundingMetadata || currentUsageMetadata) {
                            return {
                                type: 'chunk',
                                contentText,
                                thoughtText,
                                groundingMetadata: currentGroundingMetadata,
                                usageMetadata: currentUsageMetadata
                            };
                        }
                        return null;
                    } catch (parseError) {
                        return {
                            type: 'error',
                            error: { message: parseError.message, rawData: jsonString },
                            message: `Geminiストリームの解析に失敗しました: ${parseError.message}`
                        };
                    }
                }
            },
async callDeepSeekApi(apiKey, model, messagesForApi, generationConfig, systemInstruction, useStreaming, provider = 'deepseek') {
                let baseUrl;
                if (provider === 'llmaggregator') {
                    const activeBackend = multiBackendUtils.getActiveBackend();
                    baseUrl = activeBackend ? activeBackend.url : '';
                    if (!baseUrl) {
                        throw new Error("LLM AggregatorのAPIバックエンドURLが設定されていません。");
                    }
                } else {
        baseUrl = state.settings.deepSeekApiEndpoint || DEEPSEEK_API_DEFAULT_BASE_URL;
    }

    if (!apiKey) {
                    throw new Error(`${provider.toUpperCase()} APIキーが設定されていません。`);
                }
                state.abortController = new AbortController();
                const { signal } = state.abortController;

                const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

                const dsMessages = [];
                if (systemInstruction && systemInstruction.content) {
                    dsMessages.push({ role: "system", content: systemInstruction.content });
                }

                messagesForApi.forEach(msg => {
                    const contentParts = msg.parts.filter(p => p.text).map(p => p.text.trim());
                    const fullContent = contentParts.join('\n').trim();

                    if (fullContent) {
                        dsMessages.push({
                            role: msg.role === 'model' ? 'assistant' : msg.role,
                            content: fullContent
                        });
                    }
                });

                const dsRequestBody = {
                    model: model,
                    messages: dsMessages,
                    stream: useStreaming,
                    ...(generationConfig.temperature !== undefined && { temperature: generationConfig.temperature }),
                    ...(generationConfig.maxOutputTokens !== undefined && { max_tokens: generationConfig.maxOutputTokens }),
                    ...(generationConfig.topP !== undefined && { top_p: generationConfig.topP }),
                    ...(generationConfig.presencePenalty !== undefined && { presence_penalty: generationConfig.presencePenalty }),
                    ...(generationConfig.frequencyPenalty !== undefined && { frequency_penalty: generationConfig.frequencyPenalty }),
                };

                if (provider === 'llmaggregator' && generationConfig.topK !== null) {
                    if (generationConfig.topK !== null) {
                        dsRequestBody.top_k = generationConfig.topK;
                    }
                    const activeBackend = multiBackendUtils.getActiveBackend();
                    if(activeBackend && activeBackend.url.includes('openrouter.ai')) {
                        dsRequestBody.http_referer = "https://geminipwa.pages.dev/";
                        dsRequestBody.site_url = "https://github.com/fronoske/geminipwa/blob/stop-auto-scroll/README.md";
                    }
                }

                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify(dsRequestBody),
                        signal
                    });

                    if (!response.ok) {
                        let errorMsg = `${provider.toUpperCase()} APIエラー (${response.status}): ${response.statusText}`;
                        try {
                            const errorData = await response.json();
                            if (errorData.error && errorData.error.message) {
                                errorMsg = `${provider.toUpperCase()} APIエラー (${response.status}): ${errorData.error.message} (Type: ${errorData.error.type || 'N/A'})`;
                            }
                        } catch (e) { }
                        throw new Error(errorMsg);
                    }
                    if (!useStreaming) {
                        const data = await response.json();
                        let reasoningContent = null;
                        const choice = data.choices?.[0];
                        if (choice && choice.message && choice.message.reasoning_content) {
                            reasoningContent = choice.message.reasoning_content;
                        }
                        response.json = async () => ({ ...data, parsedReasoningContent: reasoningContent });
                    }
                    return response;
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error("リクエストがキャンセルされました。");
                    }
                    throw error;
                }
            },
            async *handleDeepSeekStreamingResponse(response) {
                if (!response.body) {
                    throw new Error("DeepSeekレスポンスボディがありません。");
                }
                const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
                let buffer = '';
                let finalUsage = null;
                let finalFinishReason = null;
                let isCancelled = false;
                let accumulatedFullReasoningContent = "";

                try {
                    while (true) {
                        if (state.abortController?.signal.aborted && !isCancelled) {
                            isCancelled = true;
                            await reader.cancel("User aborted");
                            throw new Error("リクエストがキャンセルされました。");
                        }

                        const { value, done } = await reader.read();
                        if (done) break;

                        buffer += value;
                        let eolIndex;
                        while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                            const line = buffer.substring(0, eolIndex).trim();
                            buffer = buffer.substring(eolIndex + 1);

                            if (line.startsWith('data: ')) {
                                const jsonData = line.substring(6);
                                if (jsonData.trim() === '[DONE]') {
                                    finalFinishReason = finalFinishReason || 'stop';
                                    break;
                                }
                                try {
                                    const chunk = JSON.parse(jsonData);
                                    let contentTextChunk = null;
                                    let reasoningTextChunk = null;

                                    if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
                                        const delta = chunk.choices[0].delta;
                                        if (delta.reasoning_content) {
                                            reasoningTextChunk = delta.reasoning_content;
                                            accumulatedFullReasoningContent += reasoningTextChunk;
                                        } else if (delta.content) {
                                            contentTextChunk = delta.content;
                                        }
                                    }

                                    if (chunk.choices && chunk.choices[0] && chunk.choices[0].finish_reason) {
                                        finalFinishReason = chunk.choices[0].finish_reason;
                                    }
                                    if (chunk.usage) {
                                        finalUsage = chunk.usage;
                                    }

                                    if (contentTextChunk !== null || reasoningTextChunk !== null) {
                                        yield { type: 'chunk', contentText: contentTextChunk, thoughtText: reasoningTextChunk };
                                    }
                                } catch (e) { }
                            }
                        }
                        if (finalFinishReason && finalFinishReason !== 'null') break;
                    }

                    yield {
                        type: 'metadata',
                        finishReason: isCancelled ? 'ABORTED' : finalFinishReason || 'stop',
                        safetyRatings: null,
                        groundingMetadata: null,
                        usageMetadata: finalUsage ? {
                            candidatesTokenCount: finalUsage.completion_tokens,
                            totalTokenCount: finalUsage.total_tokens,
                        } : null,
                        fullReasoningContent: accumulatedFullReasoningContent || null
                    };
                } catch (error) {
                    yield { type: 'error', error: { message: error.message }, message: error.message };
                } finally {
                    if (!reader.closed && !isCancelled) {
                        try { await reader.cancel("Stream processing ended."); } catch (e) { }
                    }
                }
            },
            async callClaudeApi(apiKey, model, messagesForApi, generationConfig, systemInstruction, useStreaming) {
                if (!apiKey) {
                    throw new Error("Claude APIキーが設定されていません。");
                }
                state.abortController = new AbortController();
                const { signal } = state.abortController;

                const baseUrl = CLAUDE_API_BASE_URL;

                const anthropicRequest = this.convertToClaudeRequest(messagesForApi, systemInstruction);

                const requestBody = {
                    model: model,
                    messages: anthropicRequest.messages,
                    stream: useStreaming,
                    max_tokens: generationConfig.maxOutputTokens || state.settings.claudeMaxTokens || DEFAULT_CLAUDE_MAX_TOKENS
                };
                if (anthropicRequest.system) requestBody.system = anthropicRequest.system;
                let tempValue = (generationConfig.temperature !== undefined && generationConfig.temperature !== null)
                    ? generationConfig.temperature
                    : state.settings.claudeTemperature;

                let topPValue = (generationConfig.topP !== undefined && generationConfig.topP !== null)
                    ? generationConfig.topP
                    : state.settings.claudeTopP;

                if (tempValue !== null) {
                    requestBody.temperature = tempValue;
                }
                if (topPValue !== null) {
                    requestBody.top_p = topPValue;
                }

                const topKValue = (generationConfig.topK !== undefined && generationConfig.topK !== null)
                    ? generationConfig.topK
                    : state.settings.claudeTopK;

                if (topKValue !== null) {
                    requestBody.top_k = topKValue;
                }
                if (state.settings.claudeIncludeThoughts) {
                    requestBody.thinking = { "type": "enabled" };
                    const budget = state.settings.claudeThinkingBudget;
                    if (budget !== null && Number.isInteger(budget) && budget >= 1024) {
                        requestBody.thinking.budget_tokens = budget;
                    }
                }

                try {
                    const response = await fetch(baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apiKey,
                            'anthropic-version': '2023-06-01',
                            'anthropic-dangerous-direct-browser-access': 'true'
                        },
                        body: JSON.stringify(requestBody),
                        signal
                    });

                    if (!response.ok) {
                        let errorMsg = `Claude APIエラー (${response.status}): ${response.statusText}`;
                        try {
                            const errorData = await response.json();
                            if (errorData.error && errorData.error.message) {
                                errorMsg = `Claude APIエラー (${response.status}): ${errorData.error.message} (Type: ${errorData.error.type || 'N/A'})`;
                            }
                        } catch (e) { }
                        throw new Error(errorMsg);
                    }
                    return response;
                } catch (error) {
                    if (error.name === 'AbortError') {
                        throw new Error("リクエストがキャンセルされました。");
                    }
                    throw error;
                }
            },
            convertToClaudeRequest(messagesForApi, systemInstruction) {
                const claudeMessages = [];
                let systemContent = '';

                if (systemInstruction && systemInstruction.content) {
                    systemContent = systemInstruction.content;
                } else if (systemInstruction && systemInstruction.parts && systemInstruction.parts.length > 0 && systemInstruction.parts[0].text) {
                    systemContent = systemInstruction.parts[0].text;
                }

                for (const msg of messagesForApi) {
                    const claudeRole = msg.role === 'model' ? 'assistant' : 'user';
                    const contentParts = [];
                    msg.parts.forEach(part => {
                        if (part.text) {
                            contentParts.push({ type: 'text', text: part.text });
                        } else if (part.inlineData && part.inlineData.mimeType && part.inlineData.data && part.inlineData.mimeType.startsWith('image/')) {
                            contentParts.push({
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: part.inlineData.mimeType,
                                    data: part.inlineData.data
                                }
                            });
                        }
                    });

                    if (contentParts.length > 0) {
                        claudeMessages.push({
                            role: claudeRole,
                            content: contentParts
                        });
                    }
                }
                return {
                    messages: claudeMessages,
                    system: systemContent || undefined
                };
            },
            async *handleClaudeStreamingResponse(response) {
                if (!response.body) {
                    throw new Error("Claudeレスポンスボディがありません。");
                }
                const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
                let buffer = '';
                let finalUsage = null;
                let finalFinishReason = null;
                let isCancelled = false;

                try {
                    while (true) {
                        if (state.abortController?.signal.aborted && !isCancelled) {
                            isCancelled = true;
                            await reader.cancel("User aborted");
                            throw new Error("リクエストがキャンセルされました。");
                        }

                        const { value, done } = await reader.read();
                        if (done) break;

                        buffer += value;
                        let eolIndex;
                        while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                            const line = buffer.substring(0, eolIndex).trim();
                            buffer = buffer.substring(eolIndex + 1);

                            if (line.startsWith('data: ')) {
                                const jsonData = line.substring(6);
                                if (jsonData.trim() === '[DONE]') {
                                    break;
                                }
                                try {
                                    const chunk = JSON.parse(jsonData);
                                    if (chunk.type === 'content_block_delta' && chunk.delta && chunk.delta.type === 'text_delta') {
                                        yield { type: 'chunk', contentText: chunk.delta.text || '', thoughtText: null };
                                    } else if (chunk.type === 'content_block_start' && chunk.content_block && chunk.content_block.type === 'thinking') {
                                    } else if (chunk.type === 'content_block_delta' && chunk.delta && chunk.delta.type === 'thinking_delta') {
                                        yield { type: 'chunk', contentText: null, thoughtText: chunk.delta.thinking || '' };
                                    } else if (chunk.type === 'message_stop') {
                                        finalFinishReason = chunk.message?.stop_reason || 'stop';
                                        if (chunk["amazon-bedrock-invocationMetrics"]) {
                                            finalUsage = {
                                                input_tokens: chunk["amazon-bedrock-invocationMetrics"].inputTokenCount,
                                                output_tokens: chunk["amazon-bedrock-invocationMetrics"].outputTokenCount
                                            };
                                        } else if (chunk.usage) {
                                            finalUsage = chunk.usage;
                                        }
                                    } else if (chunk.type === 'message_delta' && chunk.usage) {
                                        finalUsage = chunk.usage;
                                    }
                                } catch (e) {
                                }
                            }
                        }
                        if (finalFinishReason && finalFinishReason !== 'null') break;
                    }
                    yield {
                        type: 'metadata',
                        finishReason: isCancelled ? 'ABORTED' : finalFinishReason || 'stop',
                        safetyRatings: null,
                        usageMetadata: finalUsage ? {
                            candidatesTokenCount: finalUsage.output_tokens,
                            totalTokenCount: finalUsage.input_tokens + finalUsage.output_tokens
                        } : null
                    };
                } catch (error) {
                    yield { type: 'error', error: { message: error.message }, message: error.message };
                } finally {
                    if (!reader.closed && !isCancelled) {
                        try { await reader.cancel("Stream processing ended."); } catch (e) { }
                    }
                }
            },
            _createOpenAICompatibleRequestBody(model, messagesForApi, systemInstruction, useStreaming, enableVision, generationConfig) {
                const oaMessages = [];
                if (systemInstruction && systemInstruction.parts?.[0]?.text) {
                    oaMessages.push({ role: "system", content: systemInstruction.parts[0].text });
                }

                messagesForApi.forEach(m => {
                    const role = m.role === "model" ? "assistant" : m.role;
                    const contentParts = [];
                    let hasTextPart = false;

                    m.parts.forEach(p => {
                        if (p.text) {
                            if (hasTextPart) {
                                contentParts[contentParts.length - 1].text += `\n${p.text}`;
                            } else {
                                contentParts.push({ type: "text", text: p.text });
                                hasTextPart = true;
                            }
                        }
                        if (p.textData) {
                            if (hasTextPart) {
                                contentParts[contentParts.length - 1].text += `\n\n--- ファイル内容 ---\n${p.textData}`;
                            } else {
                                contentParts.push({ type: "text", text: p.textData });
                                hasTextPart = true;
                            }
                        }
                        if (enableVision && p.inlineData && p.inlineData.mimeType && p.inlineData.data && p.inlineData.mimeType.startsWith('image/')) {
                            contentParts.push({
                                type: "image_url",
                                image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` }
                            });
                        }
                    });

                    if (contentParts.length > 0) {
                        oaMessages.push({ role: role, content: contentParts });
                    }
                });

                const body = {
                    model: model,
                    messages: oaMessages,
                    stream: useStreaming,
                };
                if (generationConfig.temperature != null) body.temperature = generationConfig.temperature;
                if (generationConfig.maxOutputTokens != null) body.max_tokens = generationConfig.maxOutputTokens;
                if (generationConfig.topP != null) body.top_p = generationConfig.topP;
                if (generationConfig.presencePenalty != null) body.presence_penalty = generationConfig.presencePenalty;
                if (generationConfig.frequencyPenalty != null) body.frequency_penalty = generationConfig.frequencyPenalty;

                return body;
            },
            async callOpenAICompatibleApi(apiKey, model, provider, messagesForApi, generationConfig, systemInstruction, useStreaming, enableVision) {
                let baseUrl;

                if (provider === 'openai') {
                    baseUrl = OPENAI_API_BASE_URL;
                } else if (provider === 'openrouter') {
                    baseUrl = OPENROUTER_API_BASE_URL;
                } else if (provider === 'llmaggregator') {
                    baseUrl = state.settings.llmAggregatorApiBackend;
                    if (!baseUrl) {
                        throw new Error("LLM AggregatorのAPIバックエンドURLが設定されていません。");
                    }
                } else {
                    throw new Error(`Unsupported provider for callOpenAICompatibleApi: ${provider}`);
                }

                if (!apiKey) {
                    throw new Error(`${provider} のAPIキーが設定されていません。`);
                }

                state.abortController = new AbortController();
                const { signal } = state.abortController;

                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                };
                if (provider === 'openrouter') {
                    headers['HTTP-Referer'] = 'https://geminipwa.pages.dev/';
                    headers['X-OpenRouter-Title'] = 'GeminiPWA';
                }

                const body = this._createOpenAICompatibleRequestBody(
                    model,
                    messagesForApi,
                    systemInstruction,
                    useStreaming,
                    enableVision,
                    generationConfig
                );
                if (useStreaming) body.stream_options = { include_usage: true };

                if (provider === 'llmaggregator' && generationConfig.topK !== null) {
                    body.top_k = generationConfig.topK;
                }

                const response = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(body), signal });
                if (!response.ok) {
                    let msg = `${provider} API error ${response.status}`;
                    let errorData = null;
                    try {
                        errorData = await response.json();
                        msg = errorData.error?.message || msg;
                    } catch { }
                    if (provider === 'openrouter' && response.status === 429) {
                        const retryAfter = Number(response.headers?.get('Retry-After'));
                        const retryMessage = Number.isFinite(retryAfter) && retryAfter > 0
                            ? `${retryAfter}秒後に再試行してください。`
                            : '時間を置くか、別のモデルを選択してください。';
                        const errorType = errorData?.error?.metadata?.error_type;
                        msg = `OpenRouterのレート上限に達しました。${retryMessage}${errorType ? ` (${errorType})` : ''}`;
                    }
                    throw new Error(msg);
                }
                return response;
            },
            async *handleOpenAICompatibleStreamingResponse(response, providerName) {
                if (!response.body) {
                    throw new Error(`${providerName}レスポンスボディがありません。`);
                }
                const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
                let buffer = '';
                let usage = null;
                let finishReason = null;
                let isCancelled = false;
                let streamEnded = false;

                try {
                    while (true) {
                        if (state.abortController?.signal.aborted) {
                            isCancelled = true;
                            await reader.cancel();
                            throw new Error("リクエストがキャンセルされました。");
                        }

                        const { value, done } = await reader.read();
                        if (done) break;

                        buffer += value;
                        let eolIndex;
                        while ((eolIndex = buffer.indexOf('\n')) >= 0) {
                            const line = buffer.slice(0, eolIndex).trim();
                            buffer = buffer.slice(eolIndex + 1);

                            if (!line.startsWith('data:')) continue;
                            const data = line.slice(5).trim();

                            if (data === '[DONE]') {
                                if (!finishReason) finishReason = 'stop';
                                streamEnded = true;
                                break;
                            }
                            try {
                                const chunk = JSON.parse(data);
                                if (chunk.error) {
                                    yield {
                                        type: 'error',
                                        error: chunk.error,
                                        message: chunk.error.message || `${providerName}のストリーミング中にエラーが発生しました。`,
                                    };
                                    return;
                                }
                                if (chunk.choices?.[0]) {
                                    const delta = chunk.choices[0].delta;
                                    let contentText = null;
                                    let thoughtText = null;

                                    if (delta?.content) {
                                        contentText = delta.content;
                                    }
                                    if (delta?.reasoning_content) {
                                        thoughtText = delta.reasoning_content;
                                    }

                                    if (contentText !== null || thoughtText !== null) {
                                        yield { type: "chunk", contentText: contentText, thoughtText: thoughtText };
                                    }

                                    if (chunk.choices[0].finish_reason) {
                                        finishReason = chunk.choices[0].finish_reason;
                                    }
                                }
                                if (chunk.usage) {
                                    usage = chunk.usage;
                                    if (usage.completion_tokens_details?.reasoning_tokens) {
                                        usage.completion_tokens += usage.completion_tokens_details.reasoning_tokens;
                                    }
                                }
                            } catch (e) { }
                        }
                        if (streamEnded) break;
                    }
                    yield {
                        type: "metadata",
                        finishReason: isCancelled ? "ABORTED" : finishReason || 'stop',
                        usageMetadata: usage ? {
                            candidatesTokenCount: usage.completion_tokens,
                            totalTokenCount: usage.prompt_tokens + usage.completion_tokens
                        } : null,
                        safetyRatings: null,
                        groundingMetadata: null
                    };
                } catch (error) {
                    yield { type: 'error', error: { message: error.message }, message: error.message };
                } finally {
                    if (!reader.closed && !isCancelled) {
                        try { await reader.cancel(); } catch (e) { }
                    }
                }
            },
            async callXaiApi(apiKey, model, messagesForApi, generationConfig, systemInstruction, useStreaming, enableVision) {
                if (!apiKey) {
                    throw new Error("xAI APIキーが設定されていません。");
                }
                state.abortController = new AbortController();
                const { signal } = state.abortController;

                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                };

                const body = this._createOpenAICompatibleRequestBody(
                    model,
                    messagesForApi,
                    systemInstruction,
                    useStreaming,
                    enableVision,
                    generationConfig
                );

                const reasoningModels = ['grok-3-mini', 'grok-3-mini-fast'];
                if (state.settings.xaiIncludeThoughts && reasoningModels.includes(body.model)) {
                    body.reasoning_effort = state.settings.xaiReasoningEffort;
                }

                const baseUrl = XAI_API_BASE_URL;
                const response = await fetch(baseUrl, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body),
                    signal
                });

                if (!response.ok) {
                    let msg = `xAI API error ${response.status}`;
                    try {
                        const je = await response.json();
                        msg = je.error?.message || msg;
                    } catch { }
                    throw new Error(msg);
                }

                if (!useStreaming) {
                    const data = await response.json();
                    let reasoningContent = null;
                    const choice = data.choices?.[0];
                    if (choice && choice.message && choice.message.reasoning_content) {
                        reasoningContent = choice.message.reasoning_content;
                    }
                    if (data.usage?.completion_tokens_details?.reasoning_tokens) {
                        data.usage.completion_tokens += data.usage.completion_tokens_details.reasoning_tokens;
                    }
                    response.json = async () => ({ ...data, xaiThoughtSummary: reasoningContent });
                }
                return response;
            },

            getCurrentProviderRequestContext() {
                const provider = state.settings.apiProvider;
                let apiKey = '';
                if (provider === 'llmaggregator') {
                    const activeBackend = multiBackendUtils.getActiveBackend();
                    apiKey = multiBackendUtils.getActiveApiKeyForBackend(activeBackend);
                } else if (state.settings.showMultiApiKeys) {
                    apiKey = multiApiKeyUtils.getActiveApiKey(provider);
                } else {
                    const keySettings = {
                        gemini: 'apiKey',
                        deepseek: 'deepSeekApiKey',
                        claude: 'claudeApiKey',
                        openai: 'openaiApiKey',
                        openrouter: 'openrouterApiKey',
                        xai: 'xaiApiKey',
                    };
                    apiKey = state.settings[keySettings[provider]] || '';
                }

                const modelSettings = {
                    gemini: 'modelName',
                    deepseek: 'deepSeekModelName',
                    claude: 'claudeModelName',
                    openai: 'openaiModelName',
                    openrouter: 'openrouterModelName',
                    xai: 'xaiModelName',
                    llmaggregator: 'llmAggregatorModelName',
                };
                return { provider, apiKey, model: state.settings[modelSettings[provider]] || '' };
            },

            extractNonStreamingText(provider, data) {
                if (provider === 'gemini') {
                    return (data?.candidates?.[0]?.content?.parts || [])
                        .filter(part => !part?.thought && typeof part?.text === 'string')
                        .map(part => part.text)
                        .join('');
                }
                if (provider === 'claude') {
                    return (Array.isArray(data?.content) ? data.content : [])
                        .filter(part => part?.type === 'text' && typeof part?.text === 'string')
                        .map(part => part.text)
                        .join('');
                }
                const content = data?.choices?.[0]?.message?.content;
                if (typeof content === 'string') return content;
                if (Array.isArray(content)) {
                    return content.map(part => typeof part === 'string' ? part : part?.text || '').join('');
                }
                return '';
            },

            async requestCurrentProviderText(systemPrompt, userPrompt, options = {}) {
                const { provider, apiKey, model } = this.getCurrentProviderRequestContext();
                if (!apiKey) throw new Error(`${provider} APIキーが設定されていません。`);
                if (!model) throw new Error(`${provider} のモデルが選択されていません。`);

                if (provider === 'llmaggregator') {
                    const activeBackend = multiBackendUtils.getActiveBackend();
                    if (!activeBackend?.url) throw new Error('LLM AggregatorのAPIバックエンドURLが設定されていません。');
                    if (!isAllowedAggregatorDomain(activeBackend.url)) {
                        throw new Error('LLM AggregatorのバックエンドURLが許可されていません。');
                    }
                }

                const messages = [{ role: 'user', parts: [{ text: userPrompt }] }];
                const generationConfig = {
                    temperature: options.temperature ?? 0.1,
                    maxOutputTokens: options.maxOutputTokens ?? 16384,
                    topP: options.topP ?? 0.9,
                };
                const systemInstruction = provider === 'gemini'
                    ? { role: 'system', parts: [{ text: systemPrompt }] }
                    : { content: systemPrompt, parts: [{ text: systemPrompt }] };

                try {
                    let response;
                    if (provider === 'gemini') {
                        response = await this.callGeminiApi(apiKey, model, messages, generationConfig, systemInstruction, false, false, false);
                    } else if (provider === 'deepseek' || provider === 'llmaggregator') {
                        response = await this.callDeepSeekApi(apiKey, model, messages, generationConfig, systemInstruction, false, provider);
                    } else if (provider === 'claude') {
                        response = await this.callClaudeApi(apiKey, model, messages, generationConfig, systemInstruction, false);
                    } else if (provider === 'openai' || provider === 'openrouter') {
                        response = await this.callOpenAICompatibleApi(apiKey, model, provider, messages, generationConfig, systemInstruction, false, false);
                    } else if (provider === 'xai') {
                        response = await this.callXaiApi(apiKey, model, messages, generationConfig, systemInstruction, false, false);
                    } else {
                        throw new Error('対応していないAPIプロバイダーです。');
                    }
                    const data = await response.json();
                    const text = this.extractNonStreamingText(provider, data).trim();
                    if (!text) throw new Error(`${provider} から解析結果が返されませんでした。`);
                    return { text, provider, model };
                } finally {
                    state.abortController = null;
                }
            },
        };
