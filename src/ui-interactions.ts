// @ts-nocheck -- Enable after shared UI types are defined.
// Bundled into the generated index.html from this TypeScript source.
Object.assign(uiUtils, {
            showScreen(screenName, fromPopState = false) {
                if (state.isMemoVisible && screenName !== 'chat') {
                    elements.memoArea.classList.add('hidden');
                    state.isMemoVisible = false;
                }
                if (state.isClipboardStackVisible && screenName !== 'chat') {
                    elements.clipboardStackArea.classList.add('hidden');
                    state.isClipboardStackVisible = false;
                }
                if (state.isTwinEngineSummaryVisible && screenName !== 'chat') {
                    elements.twinEngineSummaryArea.classList.add('hidden');
                    state.isTwinEngineSummaryVisible = false;
                }

                if (screenName === state.currentScreen) {
                    if (screenName === 'history') this.updateHistoryHeaderButtonVisibility();
                    if (screenName === 'settings') this.applySettingsUIDetailsOpenStates();
                    return;
                }

                // チャット画面へ戻る際、現在最下部にいるかを判定しておく
                const chatMain = elements.chatScreen.querySelector('.main-content');
                // 判定を少し緩くして(100px)、キーボード開閉等のズレも許容する
                const isChatAtBottom = screenName === 'chat' && (chatMain.scrollHeight - chatMain.scrollTop - chatMain.clientHeight < 100);

                                                const allScreens = [elements.chatScreen, elements.historyScreen, elements.settingsScreen];
                let activeScreen = null;

                if (!fromPopState) {
                    if (screenName === 'history' || screenName === 'settings') {
                        history.pushState({ screen: screenName }, '', `#${screenName}`);
                    } else if (screenName === 'chat') {
                        history.replaceState({ screen: 'chat' }, '', '#chat');
                    }
                }

                allScreens.forEach(screen => {
                    screen.classList.remove('active');
                    screen.classList.remove('dormant');
                    screen.inert = true;
                    void screen.offsetWidth;
                });

                if (screenName === 'chat') {
                    activeScreen = elements.chatScreen;
                    elements.chatScreen.style.transform = 'translateX(0)';
                    elements.historyScreen.style.transform = 'translateX(-100%)';
                    elements.settingsScreen.style.transform = 'translateX(100%)';
                    requestAnimationFrame(() => {
                        this.adjustTextareaHeight();
                        this.updateChatScreenElementVisibility();
                    });
                } else if (screenName === 'history') {
                    activeScreen = elements.historyScreen;
                    elements.chatScreen.style.transform = 'translateX(100%)';
                    elements.historyScreen.style.transform = 'translateX(0)';
                    elements.settingsScreen.style.transform = 'translateX(200%)';
                    this.renderHistoryList();
                } else if (screenName === 'settings') {
                    activeScreen = elements.settingsScreen;
                    elements.chatScreen.style.transform = 'translateX(-100%)';
                    elements.historyScreen.style.transform = 'translateX(-200%)';
                    elements.settingsScreen.style.transform = 'translateX(0)';
                    this.applySettingsToUI();
                }

                requestAnimationFrame(() => {
                    allScreens.forEach(screen => {
                        screen.style.transition = 'transform 0.3s ease-in-out';
                    });
                    if (activeScreen) {
                        activeScreen.inert = false;
                        activeScreen.classList.add('active');

                        if (state.settings.enableImmersiveScrolling) {
                            appLogic.updateImmersiveLayout();

                            if (screenName === 'chat' && isChatAtBottom) {
                                chatMain.scrollTop = chatMain.scrollHeight;
                            }

                            setTimeout(() => {
                                appLogic.updateImmersiveLayout();

                                if (screenName === 'chat' && isChatAtBottom) {
                                    chatMain.scrollTop = chatMain.scrollHeight;
                                }
                            }, 305);
                        }
                    }
                    setTimeout(() => {
                        allScreens.forEach(screen => {
                            if (!screen.classList.contains('active')) {
                                screen.classList.add('dormant');
                            }
                        });
                    }, 350);
                });
                state.currentScreen = screenName;


            },
                        setSendingState(sending) {
                state.isSending = sending;
                if (sending) {
                    elements.sendButton.textContent = '止';
                    elements.sendButton.classList.add('sending');
                    elements.sendButton.title = "停止";
                    elements.sendButton.disabled = false;
                    if (elements.aiToAiChatBtn) elements.aiToAiChatBtn.disabled = true;
                } else {
                    elements.sendButton.textContent = '送';
                    elements.sendButton.classList.remove('sending');
                    elements.sendButton.title = "送信";
                    if (elements.aiToAiChatBtn) {
                        const showAiToAiBtn = state.settings.enableSessionLinking &&
                            state.linkedSessionIds.length === 2 &&
                            state.currentChatId && state.linkedSessionIds.includes(state.currentChatId);
                        elements.aiToAiChatBtn.disabled = !showAiToAiBtn;
                    }
                    this.adjustTextareaHeight();
                }
                this.updateLoadingIndicator();
            },

            updateLoadingIndicator() {
                const isProcessing = state.isAiToAiChatProcessing || state.isSummarizingForRetry || state.isProofreading || state.isSummarizing || state.isSending;

                if (isProcessing) {
                    elements.loadingIndicator.classList.remove('hidden');
                    elements.loadingIndicator.setAttribute('aria-live', state.isAiToAiChatProcessing ? 'assertive' : 'polite');

                    let baseText = '応答中';
                    if (state.isAiToAiChatProcessing) baseText = state.aiToAiProcessingMessage;
                    else if (state.isSummarizingForRetry) baseText = 'リトライ前の履歴を要約中...';
                    else if (state.isProofreading) baseText = '校正中...';
                    else if (state.isSummarizing) baseText = '要約中...';

                    if (state.settings.showResponseTimer) {
                        if (!state.responseTimerId) {
                            state.responseStartTime = Date.now();
                            state.responseTimerId = setInterval(() => {
                                const now = Date.now();
                                const elapsed = ((now - state.responseStartTime) / 1000).toFixed(1);
                                if (state.isSending && !state.isSummarizing && !state.isProofreading && !state.isAiToAiChatProcessing && !state.isSummarizingForRetry) {
                                    elements.loadingIndicator.textContent = `${elapsed}s`;
                                } else {
                                    elements.loadingIndicator.textContent = `${baseText} (${elapsed}s)`;
                                }
                            }, 100);
                            elements.loadingIndicator.textContent = (state.isSending && !state.isSummarizing && !state.isProofreading) ? "0.0s" : `${baseText} (0.0s)`;
                        }
                    } else {
                        if (state.responseTimerId) {
                            clearInterval(state.responseTimerId);
                            state.responseTimerId = null;
                        }
                        elements.loadingIndicator.textContent = baseText;
                    }
                } else {
                    if (state.responseTimerId) {
                        clearInterval(state.responseTimerId);
                        state.responseTimerId = null;
                    }
                    elements.loadingIndicator.classList.add('hidden');
                    elements.loadingIndicator.removeAttribute('aria-live');
                }
            },
            setLoadingIndicatorText(text) {
                elements.loadingIndicator.textContent = text;
                elements.loadingIndicator.classList.remove('hidden');
                elements.loadingIndicator.setAttribute('aria-live', 'polite');
            },
            adjustTextareaHeight(textarea = elements.userInput, maxHeight = TEXTAREA_MAX_HEIGHT) {
                if (!textarea) return;
                textarea.style.height = 'auto';
                const scrollHeight = textarea.scrollHeight;
                textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';

                if (textarea === elements.userInput && !state.isSending) {
                    const isInputEmpty = textarea.value.trim() === '';
                    const hasAttachments = state.pendingAttachments.length > 0;
                    const isDummyProvider = state.settings.apiProvider === 'dummy';

                    if (isDummyProvider) {
                        elements.sendButton.disabled = false;
                    } else {
                        elements.sendButton.disabled = isInputEmpty && !hasAttachments;
                    }
                }
            },
            showCustomDialog(dialogElement, focusElement) {
                return new Promise((resolve) => {
                    const closeListener = () => {
                        dialogElement.removeEventListener('close', closeListener);
                        resolve(dialogElement.returnValue);
                    };
                    dialogElement.addEventListener('close', closeListener);
                    dialogElement.showModal();
                    if (focusElement) {
                        requestAnimationFrame(() => { focusElement.focus(); });
                    }
                });
            },
            async showCustomAlert(message) {
                elements.alertMessage.innerHTML = DOMPurify.sanitize(message);
                const newOkBtn = elements.alertOkBtn.cloneNode(true);
                elements.alertOkBtn.parentNode.replaceChild(newOkBtn, elements.alertOkBtn);
                elements.alertOkBtn = newOkBtn;

                elements.alertOkBtn.onclick = () => elements.alertDialog.close('ok');
                await this.showCustomDialog(elements.alertDialog, elements.alertOkBtn);
            },
            async showCustomConfirm(message) {
                elements.confirmMessage.innerHTML = DOMPurify.sanitize(message);
                const newOkBtn = elements.confirmOkBtn.cloneNode(true);
                elements.confirmOkBtn.parentNode.replaceChild(newOkBtn, elements.confirmOkBtn);
                elements.confirmOkBtn = newOkBtn;
                const newCancelBtn = elements.confirmCancelBtn.cloneNode(true);
                elements.confirmCancelBtn.parentNode.replaceChild(newCancelBtn, elements.confirmCancelBtn);
                elements.confirmCancelBtn = newCancelBtn;

                elements.confirmOkBtn.onclick = () => elements.confirmDialog.close('ok');
                elements.confirmCancelBtn.onclick = () => elements.confirmDialog.close('cancel');
                const result = await this.showCustomDialog(elements.confirmDialog, elements.confirmOkBtn);
                return result === 'ok';
            },
            async showCustomPrompt(message, defaultValue = '') {
                elements.promptMessage.innerHTML = DOMPurify.sanitize(message);
                elements.promptInput.value = defaultValue;
                const newOkBtn = elements.promptOkBtn.cloneNode(true);
                elements.promptOkBtn.parentNode.replaceChild(newOkBtn, elements.promptOkBtn);
                elements.promptOkBtn = newOkBtn;
                const newCancelBtn = elements.promptCancelBtn.cloneNode(true);
                elements.promptCancelBtn.parentNode.replaceChild(newCancelBtn, elements.promptCancelBtn);
                elements.promptCancelBtn = newCancelBtn;
                const newPromptInput = elements.promptInput.cloneNode(true);
                elements.promptInput.parentNode.replaceChild(newPromptInput, elements.promptInput);
                elements.promptInput = newPromptInput;

                const enterHandler = (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        elements.promptOkBtn.click();
                    }
                };
                elements.promptInput.addEventListener('keypress', enterHandler);

                elements.promptOkBtn.onclick = () => elements.promptDialog.close(elements.promptInput.value);
                elements.promptCancelBtn.onclick = () => elements.promptDialog.close('');

                const closeHandler = () => {
                    elements.promptInput.removeEventListener('keypress', enterHandler);
                    elements.promptDialog.removeEventListener('close', closeHandler);
                };
                elements.promptDialog.addEventListener('close', closeHandler);

                const result = await this.showCustomDialog(elements.promptDialog, elements.promptInput);
                return result;
            },
            updateApiKeyCycleButtons() {
                const provider = state.settings.apiProvider;
                let keys = [];

                if (provider === 'llmaggregator') {
                    const activeBackend = multiBackendUtils.getActiveBackend();
                    if (activeBackend && activeBackend.apiKeys) {
                        keys = activeBackend.apiKeys;
                    }
                } else {
                    keys = multiApiKeyUtils.getApiKeysArray(provider);
                }

                const isEnabled = state.settings.showMultiApiKeys && keys.length > 1;
                const buttons = [elements.headerCycleApiKeyBtn, elements.footerCycleApiKeyBtn];

                buttons.forEach(button => {
                    if (!button) return;

                    button.disabled = !isEnabled;

                    if (isEnabled) {
                        const activeIndex = keys.findIndex(k => k.isActive);
                        const activeKey = activeIndex !== -1 ? keys[activeIndex] : null;

                        if (activeKey) {
                            const displayIndex = (activeIndex + 1).toString().padStart(2, '0').slice(-2);
                            button.textContent = displayIndex;
                            button.title = `現在のキー: ${activeKey.label} (クリックで切替)`;
                        } else {
                            button.textContent = '-';
                            button.title = 'アクティブなキーがありません';
                            button.disabled = true;
                        }
                    } else {
                        button.textContent = '-';
                        button.title = 'APIキー切替 (複数キー未設定または1つのみ)';
                    }
                });
            },
                        async showInitializationFailureDialog(message) {
                const dialog = document.getElementById('initFailureDialog');
                const dialogMessage = document.getElementById('initFailureMessage');
                const exportBtn = document.getElementById('initFailureExportBtn');
                const okBtn = document.getElementById('initFailureOkBtn');
                const copyBtn = document.getElementById('initFailureCopyBtn');

                dialogMessage.textContent = message;

                const newExportBtn = exportBtn.cloneNode(true);
                exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
                const newOkBtn = okBtn.cloneNode(true);
                okBtn.parentNode.replaceChild(newOkBtn, okBtn);
                const newCopyBtn = copyBtn.cloneNode(true);
                copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);

                newCopyBtn.onclick = async () => {
                    try {
                        await navigator.clipboard.writeText(message);
                        const originalText = newCopyBtn.textContent;
                        newCopyBtn.textContent = '完了';
                        setTimeout(() => { newCopyBtn.textContent = originalText; }, 1500);
                    } catch (e) {}
                };

                newExportBtn.onclick = () => dialog.close('export');
                newOkBtn.onclick = () => dialog.close('ok');

                return this.showCustomDialog(dialog, newOkBtn);
            },

            updateAttachmentBadgeVisibility() {
                const hasAttachments = state.pendingAttachments.length > 0;
                elements.attachFileBtn.classList.toggle('has-attachments', hasAttachments);
                if (!state.isSending) {
                    const isDummyProvider = state.settings.apiProvider === 'dummy';
                    if (isDummyProvider) {
                        elements.sendButton.disabled = false;
                    } else {
                        elements.sendButton.disabled = elements.userInput.value.trim() === '' && !hasAttachments;
                    }
                }
            },
            showFileUploadDialog() {
                if (state.pendingAttachments.length > 0) {
                    state.selectedFilesForUpload = state.pendingAttachments.map(att => ({ file: att.file }));
                } else {
                    state.selectedFilesForUpload = [];
                }
                this.updateSelectedFilesUI();
                elements.fileUploadDialog.showModal();
                this.updateAttachmentBadgeVisibility();
            },
            updateSelectedFilesUI() {
                elements.selectedFilesList.innerHTML = '';
                let totalSize = 0;
                state.selectedFilesForUpload.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.classList.add('selected-file-item');
                    li.dataset.fileIndex = index;

                    const infoDiv = document.createElement('div');
                    infoDiv.classList.add('selected-file-info');
                    const nameSpan = document.createElement('span');
                    nameSpan.classList.add('selected-file-name');
                    nameSpan.textContent = sanitizeText(item.file.name);
                    nameSpan.title = sanitizeText(item.file.name);
                    const sizeSpan = document.createElement('span');
                    sizeSpan.classList.add('selected-file-size');
                    sizeSpan.textContent = formatFileSize(item.file.size);
                    infoDiv.appendChild(nameSpan);
                    infoDiv.appendChild(sizeSpan);

                    const removeBtn = document.createElement('button');
                    removeBtn.classList.add('remove-file-btn');
                    removeBtn.title = '削除';
                    removeBtn.textContent = '×';
                    removeBtn.onclick = () => appLogic.removeSelectedFile(index);

                    li.appendChild(infoDiv);
                    li.appendChild(removeBtn);
                    elements.selectedFilesList.appendChild(li);
                    totalSize += item.file.size;
                });

                if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
                    elements.confirmAttachBtn.disabled = true;
                } else {
                    elements.confirmAttachBtn.disabled = false;
                }
                if (state.selectedFilesForUpload.length === 0) {
                    elements.confirmAttachBtn.disabled = true;
                }
            },
            updateToggleAllContentButton() {
                if (elements.toggleAllContentBtn) {
                    if (state.areAllMessagesHidden) {
                        elements.toggleAllContentBtn.setAttribute('aria-label', "全メッセージを表示");
                        elements.toggleAllContentBtn.title = "全メッセージを表示";
                    } else {
                        elements.toggleAllContentBtn.setAttribute('aria-label', "全メッセージを非表示");
                        elements.toggleAllContentBtn.title = "全メッセージを非表示";
                    }
                }
            },
            processInteractiveTitles(contentElement) {
                const links = contentElement.querySelectorAll('a[href="#"]');
                links.forEach(link => {
                    if (link.dataset.interactiveTitleProcessed === 'true' || link.dataset.interactivePlaceholderProcessed === 'true') {
                        return;
                    }

                    const titleText = sanitizeText(link.getAttribute('title'));
                    if (titleText && titleText.trim() !== '') {
                        link.dataset.interactiveTitleProcessed = 'true';

                        let spanToToggle = link.nextElementSibling;
                        if (!spanToToggle ||
                            !spanToToggle.classList.contains('interactive-title-content') ||
                            spanToToggle.textContent !== ` (# "${titleText}")`) {

                            if (spanToToggle && spanToToggle.classList.contains('interactive-title-content')) {
                                spanToToggle.remove();
                            }

                            spanToToggle = document.createElement('span');
                            spanToToggle.classList.add('interactive-title-content', 'interactive-title-content-style');
                            spanToToggle.textContent = ` (# "${titleText}")`;
                            spanToToggle.classList.add('hidden');
                            link.insertAdjacentElement('afterend', spanToToggle);
                            link.setAttribute('aria-expanded', 'false');
                        } else {
                            const isExpanded = link.getAttribute('aria-expanded') === 'true';
                            spanToToggle.classList.toggle('hidden', !isExpanded);
                        }

                        link.addEventListener('click', function (event) {
                            event.preventDefault();
                            const isCurrentlyHidden = spanToToggle.classList.contains('hidden');
                            spanToToggle.classList.toggle('hidden', !isCurrentlyHidden);
                            this.setAttribute('aria-expanded', String(!isCurrentlyHidden));
                        });
                        link.style.cursor = 'pointer';
                    }
                });
            },
            processInteractivePlaceholders(contentElement) {
                const placeholderRegex = /(.*?)?\s*\(#\s*"([^"]+)"\)/g;

                const walker = document.createTreeWalker(contentElement, NodeFilter.SHOW_TEXT, null, false);
                const nodesToProcess = [];
                let node;
                while (node = walker.nextNode()) {
                    let parent = node.parentNode;
                    let skip = false;
                    while (parent && parent !== contentElement) {
                        if (['A', 'PRE', 'CODE', 'BUTTON'].includes(parent.tagName) || parent.isContentEditable) {
                            skip = true;
                            break;
                        }
                        parent = parent.parentNode;
                    }
                    if (!skip && node.nodeValue && node.nodeValue.includes('(# "')) {
                        nodesToProcess.push(node);
                    }
                }

                for (const textNode of nodesToProcess) {
                    const textContent = textNode.nodeValue;
                    let match;
                    let lastIndex = 0;
                    const fragment = document.createDocumentFragment();
                    let replacementNeeded = false;

                    placeholderRegex.lastIndex = 0;

                    while ((match = placeholderRegex.exec(textContent)) !== null) {
                        replacementNeeded = true;
                        const precedingText = textContent.substring(lastIndex, match.index);
                        if (precedingText) {
                            fragment.appendChild(document.createTextNode(precedingText));
                        }

                        const leadingTextContent = sanitizeText(match[1] || "").trim();
                        const clickableTextDisplay = leadingTextContent || "詳細";
                        const detailText = sanitizeText(match[2]);

                        const link = document.createElement('a');
                        link.href = "#";
                        link.textContent = clickableTextDisplay;
                        link.title = detailText;
                        link.style.cursor = 'pointer';
                        link.dataset.interactivePlaceholderProcessed = 'true';

                        const detailSpan = document.createElement('span');
                        detailSpan.classList.add('interactive-title-content-style', 'hidden');
                        detailSpan.textContent = ` (# "${detailText}")`;

                        link.setAttribute('aria-expanded', 'false');
                        link.addEventListener('click', function (event) {
                            event.preventDefault();
                            event.stopPropagation();
                            const isCurrentlyHidden = detailSpan.classList.contains('hidden');
                            detailSpan.classList.toggle('hidden', !isCurrentlyHidden);
                            this.setAttribute('aria-expanded', String(!isCurrentlyHidden));
                        });

                        fragment.appendChild(link);
                        fragment.appendChild(detailSpan);

                        lastIndex = placeholderRegex.lastIndex;
                    }

                    if (replacementNeeded) {
                        if (lastIndex < textContent.length) {
                            fragment.appendChild(document.createTextNode(textContent.substring(lastIndex)));
                        }
                        textNode.parentNode.replaceChild(fragment, textNode);
                    }
                }
            },
            setAiToAiProcessingState(processing, message = "AI間会話処理中...") {
                state.isAiToAiChatProcessing = processing;
                state.aiToAiProcessingMessage = message;

                if (processing) {
                    elements.sendButton.disabled = true;
                    elements.userInput.disabled = true;
                    elements.attachFileBtn.disabled = true;
                    elements.pasteToInputBtn.disabled = true;
                    elements.rollDiceBtn.disabled = true;
                    if (elements.aiToAiChatBtn) elements.aiToAiChatBtn.disabled = true;
                } else {
                    elements.sendButton.disabled = elements.userInput.value.trim() === '' && state.pendingAttachments.length === 0;
                    elements.userInput.disabled = false;
                    elements.attachFileBtn.disabled = false;
                    elements.pasteToInputBtn.disabled = false;
                    elements.rollDiceBtn.disabled = false;
                    if (elements.aiToAiChatBtn) {
                        const showAiToAiBtn = state.settings.enableSessionLinking &&
                            state.linkedSessionIds.length === 2 &&
                            state.currentChatId && state.linkedSessionIds.includes(state.currentChatId);
                        elements.aiToAiChatBtn.disabled = !showAiToAiBtn;
                    }
                }
                this.updateLoadingIndicator();
            },
            updateSessionLinkingUI() {
                this.renderHistoryList();
                this.updateChatScreenElementVisibility();
            },
            updateApiProviderSelectOptions() {
                const apiProviderSelect = elements.apiProviderSelect;
                if (!apiProviderSelect) return;

                const currentValue = apiProviderSelect.value;
                apiProviderSelect.innerHTML = '';

                const cycleSettings = state.settings.apiProviderCycle;
                const enabledOptions = API_PROVIDERS.filter(option =>
                    cycleSettings[option.value] === true
                );

                enabledOptions.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.text;
                    apiProviderSelect.appendChild(optionElement);
                });

                if (enabledOptions.some(option => option.value === currentValue)) {
                    apiProviderSelect.value = currentValue;
                } else if (enabledOptions.length > 0) {
                    const newProvider = enabledOptions[0].value;
                    state.settings.apiProvider = newProvider;
                    apiProviderSelect.value = newProvider;
                    this.toggleApiSettingsVisibility(newProvider);
                }

                if (enabledOptions.length === 0) {
                    const warningOption = document.createElement('option');
                    warningOption.value = '';
                    warningOption.textContent = '有効なAPIプロバイダーがありません';
                    warningOption.disabled = true;
                    apiProviderSelect.appendChild(warningOption);
                    apiProviderSelect.value = '';
                }
            },
            addImageClickListeners(contentElement) {
                if (!contentElement) return;
                contentElement.querySelectorAll('img').forEach(img => {
                    const newImg = img.cloneNode(true);
                    img.parentNode.replaceChild(newImg, img);

                    newImg.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.open(newImg.src, '_blank', 'noopener,noreferrer');
                    });
                });
            },
            toggleMultiApiKeysVisibility(show) {
                const providers = ['gemini', 'deepseek', 'claude', 'openai', 'xai'];

                providers.forEach(provider => {
                    const multiKeySection = document.getElementById(`${provider}-multi-api-keys-section`);
                    if (multiKeySection) {
                        multiKeySection.classList.toggle('hidden', !show);
                    }

                    const singleKeyInputId = provider === 'gemini' ? 'gemini-api-key' : `${provider}-api-key`;
                    const singleKeyInput = document.getElementById(singleKeyInputId);

                    if (singleKeyInput) {
                        const label = singleKeyInput.previousElementSibling;
                        if (label?.tagName === 'LABEL' && label.htmlFor === singleKeyInputId) {
                            label.classList.toggle('hidden', show);
                        }
                        singleKeyInput.classList.toggle('hidden', show);

                        if (!show) {
                            let singleKeyValue = '';
                            switch (provider) {
                                case 'gemini': singleKeyValue = state.settings.apiKey; break;
                                case 'deepseek': singleKeyValue = state.settings.deepSeekApiKey; break;
                                case 'claude': singleKeyValue = state.settings.claudeApiKey; break;
                                case 'openai': singleKeyValue = state.settings.openaiApiKey; break;
                                case 'xai': singleKeyValue = state.settings.xaiApiKey; break;
                                case 'llmaggregator': singleKeyValue = state.settings.llmAggregatorApiKey; break;
                            }
                            singleKeyInput.value = singleKeyValue || '';
                        }
                    }
                });
            },
            updateApiKeyInputType() {
                const isUnmasked = state.settings.unmaskApiKeys;
                const type = isUnmasked ? 'text' : 'password';
                const mainInputIds = [
                    'gemini-api-key', 'deepseek-api-key', 'claude-api-key',
                    'openai-api-key', 'xai-api-key', 'llmaggregator-api-key'
                ];
                mainInputIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.type = type;
                });
                const dynamicInputs = document.querySelectorAll('.api-key-item-input');
                dynamicInputs.forEach(input => {
                    if (input.placeholder && input.placeholder.includes('APIキー')) {
                        input.type = type;
                    }
                });
            },
});
