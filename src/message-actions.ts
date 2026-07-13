// @ts-nocheck -- Enable after shared application types are defined.
// src/message-actions.js is generated from this file. Edit this TypeScript source instead.
Object.assign(appLogic, {
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
                if (!message) return;

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
                } catch (e) {
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
                            } else {
                                pasteButton.textContent = "空";
                                pasteButton.title = "クリップボードは空です";
                                setTimeout(() => {
                                    pasteButton.textContent = originalText;
                                    pasteButton.title = originalTitle;
                                }, 1500);
                            }
                        } catch (err) {
                            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                                pasteButton.textContent = "!";
                                pasteButton.title = "クリップボードの許可なし";
                            } else {
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
                if (contentDiv) contentDiv.classList.add('hidden');
                if (cascadeControls) cascadeControls.classList.add('hidden');
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

                } else if (originalMessage.role === 'model') {
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
                        } catch (e) {
                            contentDiv.textContent = newRawContent;
                        }
                    } else if (contentDiv) {
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
                } catch (error) {
                    await uiUtils.showCustomAlert("メッセージ編集後のチャット保存に失敗しました。");
                }
            },
            cancelEditMessage(index, messageElement = null) {
                if (!messageElement) {
                    messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
                }
                if (messageElement) {
                    this.finishEditing(messageElement);
                } else if (state.editingMessageIndex === index) {
                    state.editingMessageIndex = null;
                }
            },
            finishEditing(messageElement) {
                if (!messageElement) return;
                const editArea = messageElement.querySelector('.message-edit-area');
                const contentDiv = messageElement.querySelector('.message-content');
                const cascadeControls = messageElement.querySelector('.message-cascade-controls');
                const textarea = messageElement.querySelector('.edit-textarea');

                messageElement.style.removeProperty('width');
                messageElement.classList.remove('editing');
                if (contentDiv) contentDiv.classList.remove('hidden');
                if (cascadeControls) cascadeControls.classList.remove('hidden');
                if (editArea) {
                    editArea.classList.add('hidden');
                    editArea.innerHTML = '';
                }


            },
            async copyMessageText(index, buttonElement) {
                const message = state.currentMessages[index];
                if (!message) return;

                let textToCopy = message.content;
                if (!textToCopy && message.role === 'user' && message.attachments && message.attachments.length > 0) {
                    textToCopy = `[添付ファイル: ${message.attachments.map(a => a.name).join(', ')}]`;
                } else if (!textToCopy) {
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
                } catch (err) {
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
                } else {
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
                        } else {
                            state.messageCollapsedStates.set(newIdx, false);
                        }
                    });
                    const oldThoughtOpenStates = new Map(state.thoughtSummaryOpenStates);
                    state.thoughtSummaryOpenStates.clear();
                    state.currentMessages.forEach((msg, newIdx) => {
                        const oldIdxEquivalent = newIdx >= Math.min(...indicesToDelete) ? newIdx + indicesToDelete.filter(i => i <= newIdx).length : newIdx;
                        if (oldThoughtOpenStates.has(oldIdxEquivalent)) {
                            state.thoughtSummaryOpenStates.set(newIdx, oldThoughtOpenStates.get(oldIdxEquivalent));
                        } else {
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
                        } else if (currentChatData) {
                            newTitleForSave = currentChatData.title;
                        }

                        await dbUtils.saveChat(newTitleForSave);
                        if (requiresTitleUpdate) {
                            uiUtils.updateChatTitle(newTitleForSave);
                        }
                        if (state.currentMessages.length === 0 && state.currentChatId) {
                            this.startNewChat();
                        }
                    } catch (error) {
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
                if (!userMessage || userMessage.role !== 'user') return;

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
                        } catch (error) {
                            await uiUtils.showCustomAlert(`リトライ前の要約処理中にエラーが発生しました: ${error.message}`);
                            state.isSummarizingForRetry = false;
                            uiUtils.updateLoadingIndicator();
                            elements.sendButton.disabled = false;
                            elements.userInput.disabled = false;
                            return;
                        } finally {
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
                        while (
                            scanIndex < state.currentMessages.length &&
                            state.currentMessages[scanIndex].role === 'model' &&
                            state.currentMessages[scanIndex].siblingGroupId === targetSiblingGroupId
                        ) {
                            scanIndex++;
                        }
                    } else {
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
                    if (state.settings.autoScrollOnNewMessage) uiUtils.scrollToBottom();

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
                    } else if (index + 1 < state.currentMessages.length && state.currentMessages[index + 1]?.role === 'model') {
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
                const siblings = state.currentMessages.filter((msg, i) =>
                    msg.role === 'model' &&
                    msg.isCascaded &&
                    msg.siblingGroupId === groupId &&
                    (includeSelf || i !== index)
                );
                return siblings;
            },
            async navigateCascade(currentIndex, direction) {
                await this.commitAllOpenEdits();

                const currentMsg = state.currentMessages[currentIndex];
                if (!currentMsg || !currentMsg.isCascaded || !currentMsg.siblingGroupId) return;

                const groupId = currentMsg.siblingGroupId;
                const siblingsWithIndices = state.currentMessages
                    .map((msg, i) => ({ msg, originalIndex: i }))
                    .filter(item => item.msg.role === 'model' && item.msg.isCascaded && item.msg.siblingGroupId === groupId);

                const currentSiblingIndexInGroup = siblingsWithIndices.findIndex(item => item.originalIndex === currentIndex);
                if (currentSiblingIndexInGroup === -1) return;

                let targetSiblingIndexInGroup = -1;
                if (direction === 'prev' && currentSiblingIndexInGroup > 0) {
                    targetSiblingIndexInGroup = currentSiblingIndexInGroup - 1;
                } else if (direction === 'next' && currentSiblingIndexInGroup < siblingsWithIndices.length - 1) {
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
                    } catch (error) {
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
                if (state.isSending) { await uiUtils.showCustomAlert("送信中は削除できません。"); return; }

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
                        } else {
                            state.messageCollapsedStates.set(newIdx, false);
                        }
                    });
                    const oldThoughtOpenStates = new Map(state.thoughtSummaryOpenStates);
                    state.thoughtSummaryOpenStates.clear();
                    state.currentMessages.forEach((msg, newIdx) => {
                        const oldIdxEquivalent = newIdx >= indexToDelete ? newIdx + 1 : newIdx;
                        if (oldThoughtOpenStates.has(oldIdxEquivalent)) {
                            state.thoughtSummaryOpenStates.set(newIdx, oldThoughtOpenStates.get(oldIdxEquivalent));
                        } else {
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
                        } else {
                            const stillSelectedItem = remainingSiblingsWithIndices.find(item => item.msg.isSelected);
                            if (stillSelectedItem) {
                                newlySelectedIndex = stillSelectedItem.originalIndex;
                            } else {
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
                    } catch (error) {
                        await uiUtils.showCustomAlert("応答削除後のチャット状態の保存に失敗しました。");
                    }
                }
            },
            async handleFileSelection(fileList) {
                if (!fileList || fileList.length === 0) return;
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
                        } else {
                            const base64Data = await fileToBase64(file);
                            attachmentsToAdd.push({
                                file: file,
                                name: fileName,
                                mimeType: guessedMimeType,
                                base64Data: base64Data,
                                textData: null
                            });
                        }
                    } catch (error) {
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
                        } else {
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
                            } else {
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
                if (!state.settings.enableSessionLinking) return;

                const index = state.linkedSessionIds.indexOf(sessionId);
                if (index > -1) {
                    state.linkedSessionIds.splice(index, 1);
                } else {
                    if (state.linkedSessionIds.length >= 2) {
                        state.linkedSessionIds.shift();
                    }
                    state.linkedSessionIds.push(sessionId);
                }
                uiUtils.updateSessionLinkingUI();
            },
});
