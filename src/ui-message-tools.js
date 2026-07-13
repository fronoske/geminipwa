// @ts-nocheck -- Enable after shared UI types are defined.
// src/ui-message-tools.js is generated from this file. Edit this TypeScript source instead.
Object.assign(uiUtils, {
    updateMemoStackHeightSettingsVisibility() {
        const showMemoBtn = elements.showMemoButtonToggle.checked;
        const showClipboardStackBtn = elements.showClipboardStackButtonToggle.checked;
        const shouldShow = showMemoBtn || showClipboardStackBtn;
        elements.memoStackHeightSettings.classList.toggle('hidden', !shouldShow);
    },
    renderCitations(messageData, containerDiv) {
        if (!containerDiv)
            return;
        containerDiv.innerHTML = '';
        const messageApiProvider = messageData?.generatedByApiProvider || state.settings.apiProvider;
        if (messageApiProvider === 'gemini' && messageData && messageData.groundingMetadata &&
            ((messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0) ||
                (messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0))) {
            const details = document.createElement('details');
            details.classList.add('citation-details');
            const summary = document.createElement('summary');
            summary.textContent = '引用元/検索クエリ';
            details.appendChild(summary);
            let detailsHasContent = false;
            if (messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0) {
                const citationList = document.createElement('ul');
                citationList.classList.add('citation-list');
                const citationMap = new Map();
                let displayIndexCounter = 1;
                if (messageData.groundingMetadata.groundingSupports) {
                    messageData.groundingMetadata.groundingSupports.forEach(support => {
                        if (support.groundingChunkIndices) {
                            support.groundingChunkIndices.forEach(chunkIndex => {
                                if (!citationMap.has(chunkIndex) && chunkIndex >= 0 && chunkIndex < messageData.groundingMetadata.groundingChunks.length) {
                                    const chunk = messageData.groundingMetadata.groundingChunks[chunkIndex];
                                    if (chunk?.web?.uri) {
                                        citationMap.set(chunkIndex, {
                                            uri: chunk.web.uri,
                                            title: chunk.web.title || 'タイトル不明',
                                            displayIndex: displayIndexCounter++
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                const sortedCitations = Array.from(citationMap.entries()).sort(([, a], [, b]) => a.displayIndex - b.displayIndex);
                sortedCitations.forEach(([chunkIndex, citationInfo]) => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = citationInfo.uri;
                    link.textContent = `[${citationInfo.displayIndex}] ${citationInfo.title}`;
                    link.title = citationInfo.title;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    listItem.appendChild(link);
                    citationList.appendChild(listItem);
                });
                if (sortedCitations.length === 0) {
                    messageData.groundingMetadata.groundingChunks.forEach((chunk, idx) => {
                        if (chunk?.web?.uri) {
                            const listItem = document.createElement('li');
                            const link = document.createElement('a');
                            link.href = chunk.web.uri;
                            link.textContent = chunk.web.title || `ソース ${idx + 1}`;
                            link.title = chunk.web.title || 'タイトル不明';
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            listItem.appendChild(link);
                            citationList.appendChild(listItem);
                        }
                    });
                }
                if (citationList.hasChildNodes()) {
                    details.appendChild(citationList);
                    detailsHasContent = true;
                }
            }
            if (messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0) {
                if (detailsHasContent) {
                    const separator = document.createElement('hr');
                    separator.style.marginTop = '10px';
                    separator.style.marginBottom = '8px';
                    separator.style.border = 'none';
                    separator.style.borderTop = '1px dashed var(--border-tertiary)';
                    details.appendChild(separator);
                }
                const queryHeader = document.createElement('div');
                queryHeader.textContent = '検索に使用されたクエリ:';
                queryHeader.style.fontWeight = '500';
                queryHeader.style.marginTop = detailsHasContent ? '0' : '8px';
                queryHeader.style.marginBottom = '4px';
                queryHeader.style.fontSize = '11px';
                queryHeader.style.color = 'var(--text-secondary)';
                details.appendChild(queryHeader);
                const queryList = document.createElement('ul');
                queryList.classList.add('search-query-list');
                queryList.style.listStyle = 'none';
                queryList.style.paddingLeft = '0';
                queryList.style.margin = '0';
                queryList.style.fontSize = '11px';
                queryList.style.color = 'var(--text-secondary)';
                messageData.groundingMetadata.webSearchQueries.forEach(query => {
                    const queryItem = document.createElement('li');
                    queryItem.textContent = `• ${query}`;
                    queryItem.style.marginBottom = '3px';
                    queryList.appendChild(queryItem);
                });
                details.appendChild(queryList);
                detailsHasContent = true;
            }
            if (detailsHasContent) {
                containerDiv.appendChild(details);
            }
        }
    },
    addCopyButtonsToCodeBlocks(contentDiv, isStreamingContext = false) {
        const codeBlocks = contentDiv.querySelectorAll('pre');
        codeBlocks.forEach(preElement => {
            if (this.isMermaidCode(preElement) && !isStreamingContext) {
                const codeElement = preElement.querySelector('code');
                const mermaidCode = codeElement ? codeElement.innerText : preElement.innerText;
                this.processMermaidBlock(preElement, mermaidCode);
                return;
            }
            const codeElement = preElement.querySelector('code');
            const textToCopy = codeElement ? codeElement.innerText : preElement.innerText;
            if (textToCopy && textToCopy.trim() !== '') {
                const copyButton = document.createElement('button');
                copyButton.textContent = 'コピー';
                copyButton.classList.add('code-copy-button');
                copyButton.title = 'コードをコピー';
                copyButton.onclick = (event) => {
                    event.stopPropagation();
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const originalText = copyButton.textContent;
                        copyButton.textContent = 'コピー完了!';
                        copyButton.disabled = true;
                        setTimeout(() => {
                            copyButton.textContent = originalText;
                            copyButton.disabled = false;
                        }, 1500);
                    }).catch(err => {
                        const originalText = copyButton.textContent;
                        copyButton.textContent = '失敗';
                        copyButton.disabled = true;
                        setTimeout(() => {
                            copyButton.textContent = originalText;
                            copyButton.disabled = false;
                        }, 2000);
                    });
                };
                preElement.appendChild(copyButton);
            }
        });
    },
    isMermaidCode(preElement) {
        const codeElement = preElement.querySelector('code');
        if (codeElement && (codeElement.classList.contains('language-mermaid') ||
            codeElement.classList.contains('mermaid'))) {
            return true;
        }
        const content = preElement.textContent.trim();
        const mermaidKeywords = [
            'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
            'stateDiagram', 'journey', 'gantt', 'pie', 'gitgraph',
            'erDiagram', 'mindmap', 'timeline', 'sankey'
        ];
        return mermaidKeywords.some(keyword => content.includes(keyword));
    },
    async processMermaidBlock(preElement, mermaidCode) {
        if (typeof mermaid === 'undefined') {
            return;
        }
        const getCurrentMermaidTheme = () => {
            const bodyClasses = document.body.classList;
            if (bodyClasses.contains('dark-mode')) {
                return 'dark';
            }
            else if (bodyClasses.contains('turf-mode')) {
                return 'default';
            }
            else if (bodyClasses.contains('pastel-pink-mode')) {
                return 'base';
            }
            else if (bodyClasses.contains('pastel-blue-mode')) {
                return 'base';
            }
            else if (bodyClasses.contains('pastel-yellow-mode')) {
                return 'base';
            }
            else if (bodyClasses.contains('pastel-purple-mode')) {
                return 'base';
            }
            else if (bodyClasses.contains('pastel-rainbow-mode')) {
                return 'base';
            }
            else {
                return 'default';
            }
        };
        const currentTheme = getCurrentMermaidTheme();
        mermaid.initialize({
            startOnLoad: false,
            theme: currentTheme,
            securityLevel: 'loose',
            fontFamily: 'var(--font-family)',
            flowchart: { useMaxWidth: true, htmlLabels: true },
            sequence: { useMaxWidth: true },
            gantt: { useMaxWidth: true },
            journey: { useMaxWidth: true },
            pie: { useMaxWidth: true },
            themeVariables: {
                primaryColor: currentTheme === 'dark' ? '#404040' : '#ffffff',
                primaryTextColor: currentTheme === 'dark' ? '#e0e0e0' : '#333333',
                primaryBorderColor: currentTheme === 'dark' ? '#666666' : '#cccccc',
                lineColor: currentTheme === 'dark' ? '#888888' : '#666666',
                secondaryColor: currentTheme === 'dark' ? '#303030' : '#f8f9fa',
                tertiaryColor: currentTheme === 'dark' ? '#2a2a2a' : '#ffffff'
            }
        });
        const container = document.createElement('div');
        container.classList.add('mermaid-container');
        container.style.cssText = `
                    position: relative;
                    background-color: var(--bg-tertiary);
                    border: 1px solid var(--border-secondary);
                    border-radius: 8px;
                    padding: 15px;
                    margin: 10px 0;
                    overflow: auto;
                `;
        const diagramDiv = document.createElement('div');
        diagramDiv.classList.add('mermaid-diagram');
        diagramDiv.style.cssText = `
                    text-align: center;
                    min-height: 100px;
                    border-radius: 5px;
                    padding: 10px;
                    margin-bottom: 10px;
                    transition: background-color 0.3s ease;
                `;
        const codeDiv = document.createElement('div');
        codeDiv.classList.add('mermaid-code');
        codeDiv.style.cssText = `
                    display: none;
                    background-color: var(--bg-secondary);
                    border-radius: 5px;
                    padding: 10px;
                    font-family: monospace;
                    font-size: 13px;
                    white-space: pre-wrap;
                    word-break: break-all;
                    margin-bottom: 10px;
                    color: var(--text-secondary);
                `;
        codeDiv.textContent = mermaidCode;
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                `;
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'コード表示';
        toggleButton.classList.add('mermaid-toggle-button');
        toggleButton.style.cssText = `
                    padding: 4px 10px;
                    font-size: 12px;
                    background-color: var(--bg-button-action);
                    color: var(--text-light);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                `;
        const copyButton = document.createElement('button');
        copyButton.textContent = 'コピー';
        copyButton.classList.add('mermaid-copy-button');
        copyButton.style.cssText = `
                    padding: 4px 10px;
                    font-size: 12px;
                    background-color: var(--bg-button-copy);
                    color: var(--text-light);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                `;
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('mermaid-error');
        errorDiv.style.cssText = `
                    display: none;
                    background-color: var(--bg-error-message);
                    color: var(--text-error);
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    font-size: 13px;
                `;
        toggleButton.onclick = () => {
            const isCodeVisible = codeDiv.style.display !== 'none';
            if (isCodeVisible) {
                codeDiv.style.display = 'none';
                diagramDiv.style.display = 'block';
                toggleButton.textContent = 'コード表示';
            }
            else {
                codeDiv.style.display = 'block';
                diagramDiv.style.display = 'none';
                toggleButton.textContent = '図表表示';
            }
        };
        copyButton.onclick = async () => {
            try {
                await navigator.clipboard.writeText(mermaidCode);
                const originalText = copyButton.textContent;
                copyButton.textContent = 'コピー完了!';
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.disabled = false;
                }, 1500);
            }
            catch (err) {
                const originalText = copyButton.textContent;
                copyButton.textContent = '失敗';
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.disabled = false;
                }, 2000);
            }
        };
        buttonContainer.appendChild(toggleButton);
        buttonContainer.appendChild(copyButton);
        container.appendChild(errorDiv);
        container.appendChild(diagramDiv);
        container.appendChild(codeDiv);
        container.appendChild(buttonContainer);
        try {
            const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            diagramDiv.id = uniqueId;
            const { svg } = await mermaid.render(uniqueId + '-svg', mermaidCode);
            diagramDiv.innerHTML = svg;
            const svgElement = diagramDiv.querySelector('svg');
            if (svgElement) {
                svgElement.style.maxWidth = '100%';
                svgElement.style.height = 'auto';
            }
            errorDiv.style.display = 'none';
        }
        catch (error) {
            errorDiv.textContent = `図表の描画に失敗しました: ${error.message}`;
            errorDiv.style.display = 'block';
            diagramDiv.style.display = 'none';
            codeDiv.style.display = 'block';
            toggleButton.textContent = '図表表示';
        }
        preElement.parentNode.replaceChild(container, preElement);
    },
    async updateStreamingMessage(index, newCharOrChunk, isThoughtSummary = false) {
        const messageDiv = document.getElementById(`streaming-message-${index}`);
        if (!messageDiv || typeof marked === 'undefined')
            return;
        let targetContentDiv;
        let accumulatedContentForDisplay;
        const selectedApiProvider = state.settings.apiProvider;
        const streamSpeed = selectedApiProvider === 'gemini' ? state.settings.geminiStreamingSpeed :
            selectedApiProvider === 'deepseek' ? state.settings.deepSeekStreamingSpeed :
                selectedApiProvider === 'claude' ? state.settings.claudeStreamingSpeed :
                    selectedApiProvider === 'xai' ? state.settings.xaiStreamingSpeed :
                        selectedApiProvider === 'llmaggregator' ? state.settings.llmAggregatorStreamingSpeed :
                            state.settings.openaiStreamingSpeed;
        if (isThoughtSummary) {
            if ((selectedApiProvider === 'gemini' && state.settings.geminiIncludeThoughts) ||
                (selectedApiProvider === 'deepseek' && state.settings.deepSeekIncludeDeepSeekThoughts) ||
                (selectedApiProvider === 'claude' && state.settings.claudeIncludeThoughts) ||
                (selectedApiProvider === 'xai' && state.settings.xaiIncludeThoughts) ||
                (selectedApiProvider === 'llmaggregator' && state.settings.llmAggregatorIncludeThoughts)) {
                targetContentDiv = messageDiv.querySelector(`#streaming-thought-summary-${index}`);
                accumulatedContentForDisplay = state.partialThoughtStreamContent;
            }
            else {
                return;
            }
        }
        else {
            targetContentDiv = messageDiv.querySelector(`#streaming-content-${index}`);
            accumulatedContentForDisplay = state.partialStreamContent;
        }
        if (targetContentDiv) {
            if (isThoughtSummary) {
                const pre = targetContentDiv.querySelector('pre');
                if (pre) {
                    pre.textContent = accumulatedContentForDisplay;
                }
            }
            else {
                const renderCurrentState = (contentToRender) => {
                    try {
                        const safeHtml = this._sanitizeAndParseMarkdown(contentToRender || '');
                        targetContentDiv.innerHTML = safeHtml;
                        this.processInteractivePlaceholders(targetContentDiv);
                        this.processInteractiveTitles(targetContentDiv);
                        this.addCopyButtonsToCodeBlocks(targetContentDiv, true);
                        this.addImageClickListeners(targetContentDiv);
                    }
                    catch (e) {
                        targetContentDiv.textContent = contentToRender;
                    }
                };
                renderCurrentState(accumulatedContentForDisplay);
            }
        }
        if (!isThoughtSummary && state.currentMessages[index]?.groundingMetadata && selectedApiProvider === 'gemini') {
            const citationContainer = messageDiv.querySelector(`#streaming-citations-${index}`);
            if (citationContainer) {
                this.renderCitations(state.currentMessages[index], citationContainer);
            }
        }
        const autoScrollEnabledForThisContentType = isThoughtSummary
            ? state.settings.autoScrollOnThought
            : state.settings.autoScrollOnNewMessage;
        if (autoScrollEnabledForThisContentType && targetContentDiv?.textContent?.length < 200) {
            this.scrollToBottom();
        }
    },
    finalizeStreamingMessage(index) {
        const messageDiv = document.getElementById(`streaming-message-${index}`);
        if (messageDiv) {
            const finalMessageData = state.currentMessages[index];
            if (!finalMessageData)
                return;
            const messageApiProvider = finalMessageData.generatedByApiProvider || state.settings.apiProvider;
            if (finalMessageData.thoughtSummary || finalMessageData.deepSeekThoughtSummary || finalMessageData.xaiThoughtSummary) {
                const thoughtContentDiv = messageDiv.querySelector(`#streaming-thought-summary-${index}`);
                if (thoughtContentDiv) {
                    const summaryContent = finalMessageData.thoughtSummary || finalMessageData.deepSeekThoughtSummary || finalMessageData.xaiThoughtSummary;
                    thoughtContentDiv.innerHTML = '';
                    const pre = document.createElement('pre');
                    pre.textContent = summaryContent || '';
                    pre.style.whiteSpace = 'pre-wrap';
                    pre.style.wordBreak = 'break-all';
                    thoughtContentDiv.appendChild(pre);
                    thoughtContentDiv.removeAttribute('id');
                }
            }
            const thoughtDetailsElement = messageDiv.querySelector('.thought-summary-details');
            if (thoughtDetailsElement && finalMessageData.thoughtSummaryOpen !== undefined) {
                if (thoughtDetailsElement.open !== finalMessageData.thoughtSummaryOpen) {
                    thoughtDetailsElement.open = finalMessageData.thoughtSummaryOpen;
                }
            }
            const contentDiv = messageDiv.querySelector(`#streaming-content-${index}`);
            const finalRawContent = finalMessageData.content || '';
            if (contentDiv && typeof marked !== 'undefined') {
                try {
                    const safeHtml = this._sanitizeAndParseMarkdown(finalRawContent);
                    contentDiv.innerHTML = safeHtml;
                    this.processInteractivePlaceholders(contentDiv);
                    this.processInteractiveTitles(contentDiv);
                    this.addCopyButtonsToCodeBlocks(contentDiv, false);
                    this.addImageClickListeners(contentDiv);
                }
                catch (e) {
                    contentDiv.textContent = finalRawContent;
                }
            }
            else if (contentDiv) {
                contentDiv.textContent = finalRawContent;
            }
            if (contentDiv)
                contentDiv.removeAttribute('id');
            const citationContainer = messageDiv.querySelector(`#streaming-citations-${index}`);
            if (citationContainer) {
                this.renderCitations(finalMessageData, citationContainer);
                citationContainer.removeAttribute('id');
            }
            messageDiv.removeAttribute('id');
            const msgData = state.currentMessages[index];
            if (msgData && msgData.role === 'model' && msgData.isCascaded) {
                const siblings = appLogic.getCascadedSiblings(index);
                if (siblings.length > 1) {
                    this.renderChatMessages();
                }
            }
        }
        if (state.settings.autoScrollOnNewMessage && messageDiv?.textContent?.length < 200) {
            this.scrollToBottom();
        }
    },
    updateFinalizedMessageContent(index, newContent) {
        const messageDiv = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
        if (!messageDiv)
            return;
        const contentDiv = messageDiv.querySelector('.message-content');
        if (!contentDiv)
            return;
        try {
            if (typeof marked !== 'undefined') {
                const safeHtml = this._sanitizeAndParseMarkdown(newContent || '');
                contentDiv.innerHTML = safeHtml;
                this.processInteractivePlaceholders(contentDiv);
                this.processInteractiveTitles(contentDiv);
                this.addCopyButtonsToCodeBlocks(contentDiv, false);
                this.addImageClickListeners(contentDiv);
            }
            else {
                const pre = document.createElement('pre');
                pre.textContent = newContent;
                contentDiv.innerHTML = '';
                contentDiv.appendChild(pre);
            }
        }
        catch (e) {
            const pre = document.createElement('pre');
            pre.textContent = newContent;
            contentDiv.innerHTML = '';
            contentDiv.appendChild(pre);
        }
    },
    displayError(message, isApiError = false) {
        const errorIndex = state.currentMessages.length;
        this.appendMessage('error', `エラー: ${message}`, errorIndex);
        elements.loadingIndicator.classList.add('hidden');
        this.setSendingState(false);
        this.scrollToBottom();
    },
    scrollToBottom() {
        requestAnimationFrame(() => {
            const mainContent = elements.chatScreen.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = mainContent.scrollHeight;
            }
        });
    },
    updateChatTitle(definitiveTitle = null) {
        let titleText = '新規チャット';
        let baseTitle = '';
        let isNewChat = !state.currentChatId;
        if (state.currentChatId) {
            isNewChat = false;
            if (definitiveTitle !== null) {
                baseTitle = definitiveTitle;
            }
            else {
                const firstUserMessage = state.currentMessages.find(m => m.role === 'user');
                if (firstUserMessage) {
                    baseTitle = firstUserMessage.content;
                }
                else if (state.currentMessages.length > 0) {
                    baseTitle = "チャット履歴";
                }
            }
            if (baseTitle) {
                const displayBase = baseTitle.startsWith(IMPORT_PREFIX) ? baseTitle.substring(IMPORT_PREFIX.length) : baseTitle;
                const truncated = displayBase.substring(0, CHAT_TITLE_LENGTH);
                titleText = truncated + (displayBase.length > CHAT_TITLE_LENGTH ? '...' : '');
                if (baseTitle.startsWith(IMPORT_PREFIX)) {
                    titleText = IMPORT_PREFIX + titleText;
                }
            }
            else if (state.currentMessages.length > 0) {
                titleText = 'チャット履歴';
            }
            if (titleText === '新規チャット' && state.currentMessages.length > 0) {
                titleText = 'チャット履歴';
            }
        }
        const displayTitle = isNewChat ? titleText : `: ${titleText}`;
        elements.chatTitle.textContent = displayTitle;
        document.title = `GeminiPWA - ${titleText}`;
    },
    formatDate(timestamp) {
        if (!timestamp)
            return '';
        try {
            return new Intl.DateTimeFormat('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
        }
        catch (e) {
            const d = new Date(timestamp);
            return `${String(d.getFullYear()).slice(-2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },
    async renderHistoryList() {
        try {
            const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
            elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').forEach(item => item.remove());
            this.updateHistoryHeaderButtonVisibility();
            const sessionLinkingEnabled = state.settings.enableSessionLinking;
            if (chats && chats.length > 0) {
                elements.noHistoryMessage.classList.add('hidden');
                const sortOrderText = state.settings.historySortOrder === 'createdAt' ? '作成順' : '更新順';
                elements.historyTitle.textContent = `履歴一覧 (${sortOrderText})`;
                chats.forEach(chat => {
                    const li = elements.historyItemTemplate.cloneNode(true);
                    li.classList.remove('js-history-item-template');
                    li.dataset.chatId = chat.id;
                    if (state.settings.showHistoryPreviewBubble && chat.messages && chat.messages.length > 0) {
                        const lastMsg = chat.messages[chat.messages.length - 1];
                        if (lastMsg && (lastMsg.role === 'user' || lastMsg.role === 'model')) {
                            const previewLayer = document.createElement('div');
                            previewLayer.classList.add('history-item-preview-layer', lastMsg.role === 'user' ? 'align-right' : 'align-left');
                            const bubble = document.createElement('div');
                            bubble.classList.add('history-preview-bubble');
                            let previewText = lastMsg.content;
                            if (!previewText && lastMsg.attachments && lastMsg.attachments.length > 0) {
                                previewText = `[添付ファイル: ${lastMsg.attachments[0].name} 他]`;
                            }
                            else if (!previewText) {
                                previewText = "(空のメッセージ)";
                            }
                            if (previewText.length > 300)
                                previewText = previewText.substring(0, 300) + "...";
                            bubble.textContent = previewText;
                            previewLayer.appendChild(bubble);
                            li.insertBefore(previewLayer, li.firstChild);
                        }
                    }
                    const titleText = chat.title || `履歴 ${chat.id}`;
                    const titleEl = li.querySelector('.history-item-title');
                    titleEl.textContent = titleText;
                    titleEl.title = titleText;
                    li.querySelector('.created-date').textContent = `作成: ${this.formatDate(chat.createdAt)}`;
                    li.querySelector('.updated-date').textContent = `更新: ${this.formatDate(chat.updatedAt)}`;
                    li.onclick = (event) => {
                        if (!event.target.closest('.history-item-actions button')) {
                            appLogic.loadChat(chat.id);
                            this.showScreen('chat');
                        }
                    };
                    li.querySelector('.js-edit-title-btn').onclick = (e) => { e.stopPropagation(); appLogic.editHistoryTitle(chat.id, titleEl); };
                    li.querySelector('.js-export-btn').onclick = (e) => { e.stopPropagation(); appLogic.exportChat(chat.id, titleText); };
                    li.querySelector('.js-duplicate-btn').onclick = (e) => { e.stopPropagation(); appLogic.duplicateChat(chat.id); };
                    li.querySelector('.js-delete-btn').onclick = (e) => { e.stopPropagation(); appLogic.confirmDeleteChat(chat.id, titleText); };
                    const linkButton = li.querySelector('.js-link-session-btn');
                    if (linkButton) {
                        if (sessionLinkingEnabled) {
                            linkButton.classList.remove('hidden');
                            linkButton.classList.remove('linked-a', 'linked-b');
                            if (state.linkedSessionIds.includes(chat.id)) {
                                if (state.linkedSessionIds[0] === chat.id) {
                                    linkButton.classList.add('linked-a');
                                }
                                else if (state.linkedSessionIds[1] === chat.id) {
                                    linkButton.classList.add('linked-b');
                                }
                            }
                            linkButton.onclick = (e) => { e.stopPropagation(); appLogic.toggleSessionLink(chat.id); };
                        }
                        else {
                            linkButton.classList.add('hidden');
                        }
                    }
                    elements.historyList.appendChild(li);
                });
            }
            else {
                elements.noHistoryMessage.classList.remove('hidden');
                elements.historyTitle.textContent = '履歴一覧';
            }
        }
        catch (error) {
            elements.noHistoryMessage.textContent = "履歴の読み込み中にエラーが発生しました。";
            elements.noHistoryMessage.classList.remove('hidden');
            elements.historyTitle.textContent = '履歴一覧';
        }
    },
});
