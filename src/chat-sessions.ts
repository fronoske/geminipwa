// @ts-nocheck -- Enable after shared application types are defined.
// Bundled into the generated index.html from this TypeScript source.
Object.assign(appLogic, {
            async confirmStartNewChat() {
                if (state.isSending) {
                    const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して新規チャットを開始しますか？");
                    if (!confirmed) return;
                    this.abortRequest();
                }
                if (state.editingMessageIndex !== null) {
                    const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して新規チャットを開始しますか？");
                    if (!confirmed) return;
                    const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
                    this.cancelEditMessage(state.editingMessageIndex, msgEl);
                }
                if (state.pendingAttachments.length > 0) {
                    const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して新規チャットを開始しますか？");
                    if (!confirmedAttach) return;
                    state.pendingAttachments = [];
                    uiUtils.updateAttachmentBadgeVisibility();
                }

                if ((state.currentMessages.length > 0) && state.currentChatId) {
                    try {
                        await dbUtils.saveChat();
                    } catch (error) {
                        const conf = await uiUtils.showCustomConfirm("現在のチャットの保存に失敗しました。新規チャットを開始しますか？");
                        if (!conf) return;
                    }
                }
                this.startNewChat();
                uiUtils.showScreen('chat');
            },
            startNewChat() {
                state.currentChatId = null;
                state.currentLorebookId = null;
                state.currentMessages = [];
                if (state.settings.commonSystemPrompt && state.settings.commonSystemPrompt.trim() !== '') {
                }

                state.pendingAttachments = [];
                state.isMemoVisible = false;
                elements.memoArea.classList.add('hidden');
                elements.memoEditor.value = '';
                state.isClipboardStackVisible = false;
                elements.clipboardStackArea.classList.add('hidden');
                state.clipboardStackContent = '';
                state.areAllMessagesHidden = false;
                uiUtils.updateToggleAllContentButton();
                state.messageCollapsedStates.clear();
                state.thoughtSummaryOpenStates.clear();
                uiUtils.renderChatMessages();
                uiUtils.updateChatTitle();
                elements.userInput.value = '';
                uiUtils.adjustTextareaHeight();
                uiUtils.setSendingState(false);
                uiUtils.updateLorebookMenuItem();
                uiUtils.updateAttachmentBadgeVisibility();
                if (state.settings.autoScrollOnNewMessage) {
                    uiUtils.scrollToBottom();
                }
            },
            async loadChat(id) {
                if (state.isSending) {
                    const confirmedLoad = await uiUtils.showCustomConfirm("送信中です。中断して別のチャットを読み込みますか？");
                    if (!confirmedLoad) return;
                    this.abortRequest();
                }
                if (state.editingMessageIndex !== null) {
                    const confirmedEdit = await uiUtils.showCustomConfirm("編集中です。変更を破棄して別のチャットを読み込みますか？");
                    if (!confirmedEdit) return;
                    const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
                    this.cancelEditMessage(state.editingMessageIndex, msgEl);
                }
                if (state.pendingAttachments.length > 0) {
                    const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して別のチャットを読み込みますか？");
                    if (!confirmedAttach) return;
                    state.pendingAttachments = [];
                    uiUtils.updateAttachmentBadgeVisibility();
                }

                try {
                    const chat = await dbUtils.getChat(id);
                    if (chat) {
                        state.currentChatId = chat.id;
                        state.currentLorebookId = lorebookUtils.normalizeLorebookId(chat.lorebookId);
                        state.currentMessages = chat.messages?.map(msg => ({
                            ...msg,
                            attachments: msg.attachments || [],
                            thoughtSummaryOpen: msg.thoughtSummaryOpen || false,
                        })) || [];
                        let needsSave = false;
                        const groupIds = new Set(state.currentMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                        groupIds.forEach(gid => {
                            const siblings = state.currentMessages.filter(m => m.siblingGroupId === gid);
                            const selected = siblings.filter(m => m.isSelected);
                            if (selected.length === 0 && siblings.length > 0) {
                                siblings[siblings.length - 1].isSelected = true;
                                needsSave = true;
                            } else if (selected.length > 1) {
                                selected.slice(0, -1).forEach(m => m.isSelected = false);
                                needsSave = true;
                            }
                        });

                        state.pendingAttachments = [];
                        state.areAllMessagesHidden = false;
                        uiUtils.updateToggleAllContentButton();
                        state.messageCollapsedStates.clear();
                        state.thoughtSummaryOpenStates.clear();
                        if (state.settings.persistMessageCollapseState && chat.collapsedStates) {
                            Object.entries(chat.collapsedStates).forEach(([idx, isCollapsed]) => {
                                state.messageCollapsedStates.set(parseInt(idx, 10), isCollapsed);
                            });
                        }
                        (chat.messages || []).forEach((msg, idx) => {
                            if (msg.thoughtSummaryOpen !== undefined) {
                                state.thoughtSummaryOpenStates.set(idx, msg.thoughtSummaryOpen);
                            }
                        });

                        uiUtils.renderChatMessages();
                        uiUtils.updateChatTitle(chat.title);
                        elements.userInput.value = '';
                        uiUtils.adjustTextareaHeight();
                        uiUtils.setSendingState(false);
                        uiUtils.updateLorebookMenuItem();
                        uiUtils.updateAttachmentBadgeVisibility();
                        elements.memoEditor.value = '';
                        if (needsSave) {
                            await dbUtils.saveChat();
                        }
                        history.replaceState({ screen: 'chat' }, '', '#chat');
                        state.currentScreen = 'chat';
                        if (state.settings.autoScrollOnNewMessage && state.currentMessages.length > 0) {
                            uiUtils.scrollToBottom();
                        }
                    } else {
                        await uiUtils.showCustomAlert("チャット履歴が見つかりませんでした。");
                        this.startNewChat();
                        uiUtils.showScreen('chat');
                    }
                } catch (error) {
                    await uiUtils.showCustomAlert(`チャットの読み込みエラー: ${error}`);
                    this.startNewChat();
                    uiUtils.showScreen('chat');
                }
            },
            async changeCurrentSessionLorebook() {
                if (state.isSending) return false;

                const previousLorebookId = lorebookUtils.normalizeLorebookId(state.currentLorebookId);
                const selectedLorebookId = await uiUtils.showLorebookSelectionDialog(previousLorebookId);
                if (selectedLorebookId === undefined) return false;

                const normalizedLorebookId = lorebookUtils.normalizeLorebookId(selectedLorebookId);
                if (normalizedLorebookId === previousLorebookId) return false;

                state.currentLorebookId = normalizedLorebookId;
                uiUtils.updateLorebookMenuItem();

                if (state.currentChatId && state.currentMessages.length > 0) {
                    try {
                        await dbUtils.saveChat();
                    } catch (error) {
                        state.currentLorebookId = previousLorebookId;
                        uiUtils.updateLorebookMenuItem();
                        await uiUtils.showCustomAlert(`Lorebookの変更を保存できませんでした: ${error}`);
                        return false;
                    }
                }
                return true;
            },
            async duplicateChat(id) {
                if (state.isSending) { const conf = await uiUtils.showCustomConfirm("送信中です。中断してチャットを複製しますか？"); if (!conf) return; this.abortRequest(); }
                if (state.editingMessageIndex !== null) { const conf = await uiUtils.showCustomConfirm("編集中です。変更を破棄してチャットを複製しますか？"); if (!conf) return; const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`); this.cancelEditMessage(state.editingMessageIndex, msgEl); }
                if ((state.currentMessages.length > 0) && state.currentChatId && state.currentChatId !== id) { try { await dbUtils.saveChat(); } catch (error) { const conf = await uiUtils.showCustomConfirm("現在のチャット保存に失敗しました。複製を続行しますか？"); if (!conf) return; } }
                if (state.pendingAttachments.length > 0) {
                    const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄してチャットを複製しますか？");
                    if (!confirmedAttach) return;
                    state.pendingAttachments = [];
                }

                try {
                    const chat = await dbUtils.getChat(id);
                    if (chat) {
                        const originalTitle = chat.title || "無題のチャット";
                        const newTitle = originalTitle.replace(new RegExp(DUPLICATE_SUFFIX.replace(/([().])/g, '\\$1') + '$'), '').trim() + DUPLICATE_SUFFIX;

                        const groupIdMap = new Map();
                        const duplicatedMessages = [];

                        (chat.messages || []).forEach(msg => {
                            const newMsg = JSON.parse(JSON.stringify(msg));
                            newMsg.attachments = msg.attachments ? JSON.parse(JSON.stringify(msg.attachments)) : [];
                            newMsg.isCascaded = msg.isCascaded ?? false;
                            newMsg.isSelected = msg.isSelected ?? false;
                            newMsg.thoughtSummaryOpen = msg.thoughtSummaryOpen || false;

                            if (msg.siblingGroupId) {
                                if (!groupIdMap.has(msg.siblingGroupId)) {
                                    groupIdMap.set(msg.siblingGroupId, `dup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
                                }
                                newMsg.siblingGroupId = groupIdMap.get(msg.siblingGroupId);
                            } else {
                                delete newMsg.siblingGroupId;
                            }
                            duplicatedMessages.push(newMsg);
                        });

                        const newGroupIds = new Set(duplicatedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                        newGroupIds.forEach(gid => {
                            const siblings = duplicatedMessages.filter(m => m.siblingGroupId === gid);
                            siblings.forEach((m, idx) => {
                                m.isSelected = (idx === siblings.length - 1);
                            });
                        });

                        const newChatData = {
                            messages: duplicatedMessages,
                            updatedAt: Date.now(),
                            createdAt: Date.now(),
                            title: newTitle,
                            lorebookId: lorebookUtils.normalizeLorebookId(chat.lorebookId)
                        };

                        if (state.settings.persistMessageCollapseState && chat.collapsedStates) {
                            newChatData.collapsedStates = { ...chat.collapsedStates };
                        }

                        const newChatId = await new Promise((resolve, reject) => {
                            const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                            const request = store.add(newChatData);
                            request.onsuccess = (event) => resolve(event.target.result);
                            request.onerror = (event) => reject(event.target.error);
                        });

                        if (state.currentScreen === 'history') {
                            uiUtils.renderHistoryList();
                        } else {
                            await uiUtils.showCustomAlert(`チャット「${newTitle}」を複製しました。`);
                        }
                    } else {
                        await uiUtils.showCustomAlert("複製元のチャットが見つかりません。");
                    }
                } catch (error) {
                    await uiUtils.showCustomAlert(`チャット複製エラー: ${error}`);
                }
            },
            async exportChat(chatId, chatTitle) {
                const confirmed = await uiUtils.showCustomConfirm(`チャット「${chatTitle || 'この履歴'}」をテキスト出力しますか？`);
                if (!confirmed) return;

                try {
                    const chat = await dbUtils.getChat(chatId);
                    if (!chat || ((!chat.messages || chat.messages.length === 0))) {
                        await uiUtils.showCustomAlert("チャットデータが空です。");
                        return;
                    }

                    let exportText = '';
                    if (chat.messages) {
                        chat.messages.forEach(msg => {
                            if (msg.role === 'user' || msg.role === 'model') {
                                let attributes = '';
                                if (msg.role === 'model') {
                                    if (msg.isCascaded) attributes += ' isCascaded';
                                    if (msg.isSelected) attributes += ' isSelected';
                                    if (msg.thoughtSummaryOpen) attributes += ' thoughtOpen';
                                }
                                if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                                    const fileNames = msg.attachments.map(a => a.name).join(';');
                                    attributes += ` attachments="${fileNames.replace(/"/g, '"')}"`;
                                }
                                exportText += `<|#|${msg.role}|#|${attributes.trim()}>\n${msg.content}\n<|#|/${msg.role}|#|>\n\n`;
                            }
                        });
                    }

                    const blob = new Blob([exportText.trim()], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const safeTitle = (chatTitle || `chat_${chatId}_export`).replace(/[<>:"/\\|?*\s]/g, '_');
                    a.href = url;
                    a.download = `${safeTitle}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    await uiUtils.showCustomAlert(`エクスポートエラー: ${error}`);
                }
            },
            async confirmClearCurrentSession() {
                if (state.currentMessages.length <= 1) {
                    await uiUtils.showCustomAlert("削除できる内容がありません。先頭の項目は保持されます。");
                    return;
                }
                if (state.isSending) {
                    await uiUtils.showCustomAlert("送信中です。完了後に再度お試しください。");
                    return;
                }
                if (state.editingMessageIndex !== null) {
                    await uiUtils.showCustomAlert("メッセージ編集中です。完了後に再度お試しください。");
                    return;
                }
                const confirmed = await uiUtils.showCustomConfirm(
                    "先頭の項目を残して、それ以外の内容をすべて削除しますか？\nこの操作は元に戻せません。"
                );
                if (confirmed) {
                    await this.clearCurrentSessionExceptFirst();
                }
            },
            async clearCurrentSessionExceptFirst() {
                const originalMessages = state.currentMessages;
                const originalCollapsedStates = new Map(state.messageCollapsedStates);
                const originalThoughtStates = new Map(state.thoughtSummaryOpenStates);
                const originalAllMessagesHidden = state.areAllMessagesHidden;
                try {
                    state.currentMessages = state.currentMessages.slice(0, 1);
                    state.messageCollapsedStates.clear();
                    state.thoughtSummaryOpenStates.clear();
                    state.areAllMessagesHidden = false;
                    uiUtils.updateToggleAllContentButton();
                    await dbUtils.saveChat();
                    uiUtils.renderChatMessages();
                } catch (error) {
                    state.currentMessages = originalMessages;
                    state.messageCollapsedStates = originalCollapsedStates;
                    state.thoughtSummaryOpenStates = originalThoughtStates;
                    state.areAllMessagesHidden = originalAllMessagesHidden;
                    uiUtils.updateToggleAllContentButton();
                    uiUtils.renderChatMessages();
                    await uiUtils.showCustomAlert(`内容の削除中にエラーが発生しました: ${error}`);
                }
            },
            async copyCurrentSessionText() {
                if (state.currentMessages.length === 0) {
                    await uiUtils.showCustomAlert("コピーする内容がありません。");
                    return;
                }

                let sessionText = "";
                state.currentMessages.forEach(msg => {
                    if (msg.role === 'user') {
                        sessionText += `あなた:\n`;
                    } else if (msg.role === 'model') {
                        sessionText += `モデル:\n`;
                    } else if (msg.role === 'error') {
                        sessionText += `エラー:\n`;
                    }
                    sessionText += `${msg.content}\n\n`;
                    if (msg.attachments && msg.attachments.length > 0) {
                        sessionText += `  [添付ファイル: ${msg.attachments.map(a => a.name).join(', ')}]\n\n`;
                    }
                });

                try {
                    await navigator.clipboard.writeText(sessionText.trim());
                    const buttonElement = elements.headerMenuCopyBtn;
                    const originalText = buttonElement.textContent;
                    buttonElement.textContent = 'コピーしました';
                    buttonElement.disabled = true;
                    setTimeout(() => {
                        buttonElement.textContent = originalText;
                        buttonElement.disabled = false;
                        uiUtils.setHeaderMenuOpen(false);
                    }, 900);
                } catch (err) {
                    await uiUtils.showCustomAlert("クリップボードへのコピーに失敗しました。\nお使いのブラウザが対応していないか、セキュリティ設定が原因の可能性があります。");
                    const buttonElement = elements.headerMenuCopyBtn;
                    const originalText = buttonElement.textContent;
                    buttonElement.textContent = 'コピー失敗';
                    buttonElement.disabled = true;
                    setTimeout(() => {
                        buttonElement.textContent = originalText;
                        buttonElement.disabled = false;
                    }, 2000);
                }
            },
            async confirmDeleteChat(id, title) {
                const confirmed = await uiUtils.showCustomConfirm(`「${title || 'この履歴'}」を削除しますか？`);
                if (confirmed) {
                    const isDeletingCurrent = state.currentChatId === id;
                    const currentScreenBeforeDelete = state.currentScreen;
                    try {
                        await dbUtils.deleteChat(id);
                        if (isDeletingCurrent) {
                            this.startNewChat();
                        }
                        if (currentScreenBeforeDelete === 'history') {
                            await uiUtils.renderHistoryList();
                            const listIsEmpty = elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').length === 0;
                            if (listIsEmpty) {
                                if (!isDeletingCurrent) {
                                    this.startNewChat();
                                }
                            }
                        }
                    } catch (error) {
                        await uiUtils.showCustomAlert(`チャット削除エラー: ${error}`);
                        uiUtils.setSendingState(false);
                    }
                }
            },
            async editHistoryTitle(chatId, titleElement) {
                const currentTitle = titleElement.textContent;
                const newTitle = await uiUtils.showCustomPrompt("新しいタイトル:", currentTitle);
                const trimmedTitle = (newTitle !== null) ? sanitizeText(newTitle, 100).trim() : '';

                if (newTitle !== '' && trimmedTitle !== '' && trimmedTitle !== currentTitle) {
                    const finalTitle = trimmedTitle;
                    try {
                        await dbUtils.updateChatTitleDb(chatId, finalTitle);
                        titleElement.textContent = finalTitle;
                        titleElement.title = finalTitle;
                        const dateElement = titleElement.closest('.history-item')?.querySelector('.updated-date');
                        if (dateElement) dateElement.textContent = `更新: ${uiUtils.formatDate(Date.now())}`;

                        if (state.currentChatId === chatId) {
                            uiUtils.updateChatTitle(finalTitle);
                        }
                    } catch (error) {
                        await uiUtils.showCustomAlert(`タイトル更新エラー: ${error}`);
                    }
                }
            },
});
