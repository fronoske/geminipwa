// @ts-nocheck -- Enable after shared UI types are defined.
// src/ui-message-rendering.js is generated from this file. Edit this TypeScript source instead.
Object.assign(uiUtils, {
            updateSettingsScreenElementVisibility() {
                elements.settingsScrollToTopBtn.classList.toggle('hidden', !state.settings.showSettingsScrollToTopButton);
                elements.settingsScrollToBottomBtn.classList.toggle('hidden', !state.settings.showSettingsScrollToBottomButton);
            },
            _sanitizeAndParseMarkdown(content) {
                // state.settings.enableImageUrlReplacement と state.settings.imageUrlReplacementBase のチェックを修正
                if (typeof content === 'string' && state.settings.enableImageUrlReplacement) {

                    // ▼▼▼ ここから変更 ▼▼▼
                    // 優先順位に従ってベースURLを決定
                    // 1. チャット固有のベースURL (state.currentChatBaseUrl)
                    // 2. グローバル設定のベースURL (state.settings.imageUrlReplacementBase)
                    const baseUrl = state.currentChatBaseUrl || state.settings.imageUrlReplacementBase;

                    // ベースURLが確定した場合のみ置換処理を実行
                    if (baseUrl) {
                        console.log(`[Markdown Img] Using Base URL for replacement: ${baseUrl}`);
                        // --- ステップ0: Markdown構文の軽微なエラーを修正 ---
                        // ![alt text]-(...) のような、角括弧と丸括弧の間の不要な文字を除去する
                        content = content.replace(/(\!\[.*?\])\s*[-_.,:;*]?\s*(\(.*?\))/g, '$1$2');
                        // `![alt](https...` という正しい形式に強制的に修正する
                        content = content.replace(/(\!\[[^\(\]\n]+).*?(https?:\/\/)/g, '$1]($2');
                        // --- ステップ1: AIが生成したフルURLをプレースホルダー形式に強制変換 ---
                        // AIが生成する多様なURLの崩れに対応するための修正
                        content = content.replace(/!\[(.*?)\]\((https?)([:.\/\s　-]*)(.*?)\)/gi, (match, altText, protocol, separator, restOfUrl) => {
                            // separator には ":", "://", "-", ".-", "s" など、プロトコルとホスト名の間のあらゆる文字が入る
                            // restOfUrl には "example.com/image.png" のような、ホスト名以降の部分が入る

                            let cleanRestOfUrl = restOfUrl;

                            // 先頭にある可能性のある不要なスラッシュや文字を削除
                            // 例: "//example.com" -> "example.com"
                            cleanRestOfUrl = cleanRestOfUrl.replace(/^[\/.\s　-]+/, '');

                            // ホスト名以降のパス部分を取得
                            const slashIndex = cleanRestOfUrl.indexOf('/');

                            // AIがホスト名を省略してパスだけを生成した場合の対策 (例: /れな/部屋着/通常.avif)
                            // パスから始まり、ドットを含まない場合はホスト名がないと判断
                            if (cleanRestOfUrl.startsWith('/') && !cleanRestOfUrl.substring(1).includes('.')) {
                                const pathWithQuery = cleanRestOfUrl;
                                return `![${altText}]({{img}}${pathWithQuery})`;
                            }

                            // 通常のホスト名を含む場合の処理
                            if (slashIndex !== -1) {
                                const pathWithQuery = cleanRestOfUrl.substring(slashIndex);
                                return `![${altText}]({{img}}${pathWithQuery})`;
                            } else {
                                // パスがなくファイル名(またはホスト名)だけの場合 (例: image.png や example.com)
                                // これをパスと見なして先頭にスラッシュを追加する
                                return `![${altText}]({{img}}/${cleanRestOfUrl})`;
                            }
                        });
                        // --- ステップ2: プレースホルダーを正しいベースURLに置換 ---
                        content = content.replace(/\{\{(img|画像|asset|image)\}\}/gi, baseUrl);

                        // --- ステップ3: Markdownを対象に、パスをクリーニング ---
                        content = content.replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, (match, altText, url, title) => {
                            // ▼▼▼ ここから変更 ▼▼▼
                            console.groupCollapsed(`[Markdown Img] Processing URL: ${url}`);
                            try {
                                const characterNames = state.settings.characterNamesList;
                                const normalizationMap = getNormalizationMap(characterNames);

                                const urlObject = new URL(url);
                                // パス名を取得した直後にデコードする
                                let pathname = decodeURIComponent(urlObject.pathname);
                                // ▲▲▲ ここまで変更 ▲▲▲

                                const lastSlashIndex = pathname.lastIndexOf('/');
                                let pathPart = (lastSlashIndex > 0) ? pathname.substring(0, lastSlashIndex) : '';
                                let filenamePart = (lastSlashIndex !== -1) ? pathname.substring(lastSlashIndex + 1) : pathname;

                                console.log("Original Path:", pathPart);
                                console.log("Original Filename:", filenamePart);

                                // 3a. まずパスとファイル名から不要な記号をクリーニング
                                pathPart = pathPart
                                    .replace(/[\s　.-]/g, '')
                                    .replace(/\/{2,}/g, '/')
                                    .replace(/／/g, '/');

                                let nameWithoutExt, extension;
                                const lastDotIndex = filenamePart.lastIndexOf('.');

                                if (lastDotIndex !== -1) {
                                    nameWithoutExt = filenamePart.substring(0, lastDotIndex);
                                    extension = filenamePart.substring(lastDotIndex);
                                } else {
                                    const knownExtensions = ['.avif', '.webp', '.png', '.jpg', '.jpeg', '.gif'];
                                    let foundExt = '';
                                    for (const ext of knownExtensions) {
                                        if (filenamePart.toLowerCase().endsWith(ext.substring(1))) {
                                            foundExt = ext;
                                            break;
                                        }
                                    }
                                    if (foundExt) {
                                        nameWithoutExt = filenamePart.slice(0, -foundExt.length);
                                        extension = foundExt;
                                    } else {
                                        nameWithoutExt = filenamePart;
                                        extension = '.avif';
                                    }
                                }

                                nameWithoutExt = nameWithoutExt.replace(/[\s　.-]/g, '');
                                extension = extension.replace(/[\s　.-]/g, '');

                                console.log("Cleaned Path for normalization:", pathPart);
                                console.log("Cleaned Filename (no ext) for normalization:", nameWithoutExt);

                                // 3b. クリーニング後の文字列を固有名詞リストと照合して正規化
                                if (pathPart && normalizationMap.size > 0) {
                                    pathPart = pathPart.split('/')
                                        // ▼▼▼ ここを変更 ▼▼▼
                                        .map(segment => normalizeName(segment, normalizationMap, state.settings.enableRomajiToKatakanaConversion))
                                        // ▲▲▲ ここまで変更 ▲▲▲
                                        .join('/');
                                }
                                if (normalizationMap.size > 0) {
                                    // ▼▼▼ ここを変更 ▼▼▼
                                    nameWithoutExt = normalizeName(nameWithoutExt, normalizationMap, state.settings.enableRomajiToKatakanaConversion);
                                    // ▲▲▲ ここまで変更 ▲▲▲
                                }

                                // 3c. 最終的なファイル名を組み立て
                                if (extension && !extension.startsWith('.')) {
                                    extension = '.' + extension;
                                }

                                const cleanedFilename = (nameWithoutExt + extension).toLowerCase();

                                const cleanedPathname = (pathPart ? pathPart + '/' : '/') + cleanedFilename;
                                const newUrl = urlObject.origin + cleanedPathname.replace(/\/{2,}/g, '/');

                                console.log("Final Pathname:", cleanedPathname);
                                console.log("Final URL:", newUrl);
                                console.groupEnd();
                                // ▲▲▲ ここまで変更 ▲▲▲

                                return `![${altText}](${newUrl})`;
                            } catch (e) {
                                console.error(`[Markdown Img] Error processing URL: ${url}`, e);
                                console.groupEnd();
                                return match;
                            }
                        });
                    }
                } else {
                    console.log('[Markdown Img] No Base URL available (neither chat-specific nor global). Skipping replacement.');
                }
                if (typeof DOMPurify === 'undefined') {
                    const div = document.createElement('div');
                    div.textContent = content || '';
                    return div.innerHTML;
                }

                const rawHtml = marked.parse(content || '');
                const cleanHtml = DOMPurify.sanitize(rawHtml, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'img'],
                    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt']
                });
                return cleanHtml;
            },
renderChatMessages(maintainScroll = false) {
                const mainContent = elements.chatScreen.querySelector('.main-content');
                const oldScrollTop = maintainScroll ? mainContent.scrollTop : null;

                // 編集中のメッセージがあればキャンセル処理
                if (state.editingMessageIndex !== null) {
                    const messageElement = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
                    if (messageElement) appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
                    else state.editingMessageIndex = null;
                }

                // ★ここが修正ポイント：既存の内容を一度すべて消去してリセットします（元の仕様）
                elements.messageContainer.innerHTML = '';

                let currentSiblingGroupId = null;
                let siblingsInGroup = [];
                let siblingIndex = 0;

                const fragment = document.createDocumentFragment();


                for (let i = 0; i < state.currentMessages.length; i++) {
                    const msg = state.currentMessages[i];
                    let cascadeInfo = null;

                    if (msg.role === 'model' && msg.isCascaded && msg.siblingGroupId) {
                        if (msg.siblingGroupId !== currentSiblingGroupId) {
                            currentSiblingGroupId = msg.siblingGroupId;
                            siblingsInGroup = state.currentMessages.filter(m => m.role === 'model' && m.isCascaded && m.siblingGroupId === currentSiblingGroupId);
                        }
                        const currentIndexInGroup = siblingsInGroup.findIndex(m => m === msg);
                        if (currentIndexInGroup !== -1) {
                            siblingIndex = currentIndexInGroup + 1;
                        }
                        cascadeInfo = {
                            currentIndex: siblingIndex,
                            total: siblingsInGroup.length,
                            siblingGroupId: currentSiblingGroupId
                        };
                    } else {
                        currentSiblingGroupId = null;
                    }


                    if (msg.role === 'model' && msg.isCascaded && msg.siblingGroupId) {
                        if (msg.isSelected) {
                            this.appendMessage(msg.role, msg.content, i, false, cascadeInfo, msg.attachments, fragment);
                        }
                    } else {
                        this.appendMessage(msg.role, msg.content, i, false, null, msg.attachments, fragment);
                    }
                }

                elements.messageContainer.appendChild(fragment);


                if (maintainScroll && oldScrollTop !== null) {
                    requestAnimationFrame(() => {
                        mainContent.scrollTop = oldScrollTop;
                    });
                }
            },
appendMessage(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', role);
                messageDiv.dataset.index = index;

                if (role === 'user') {
                    if (state.settings.showUserIcon && state.userIconUrl) {
                        const iconImg = document.createElement('img');
                        iconImg.src = state.userIconUrl;
                        iconImg.alt = "User Icon";
                        iconImg.classList.add('message-icon');
                        messageDiv.appendChild(iconImg);
                    }
                    if (state.settings.showUserName && state.settings.userName) {
                        const nameSpan = document.createElement('span');
                        nameSpan.classList.add('message-icon-name');
                        if (state.settings.showUserNameBubble) {
                            nameSpan.classList.add('has-bubble');
                        }
                        nameSpan.textContent = state.settings.userName;
                        messageDiv.appendChild(nameSpan);
                    }
                } else if (role === 'model') {
                    if (state.settings.showAiIcon && state.aiIconUrl) {
                        const iconImg = document.createElement('img');
                        iconImg.src = state.aiIconUrl;
                        iconImg.alt = "AI Icon";
                        iconImg.classList.add('message-icon');
                        messageDiv.appendChild(iconImg);
                    }
                    if (state.settings.showAiName && state.settings.aiName) {
                        const nameSpan = document.createElement('span');
                        nameSpan.classList.add('message-icon-name');
                        if (state.settings.showAiNameBubble) {
                            nameSpan.classList.add('has-bubble');
                        }
                        nameSpan.textContent = state.settings.aiName;
                        messageDiv.appendChild(nameSpan);
                    }
                }

                const messageData = state.currentMessages[index];
                const messageApiProvider = messageData?.generatedByApiProvider || state.settings.apiProvider;
                const includeThoughtsForProvider = (messageApiProvider === 'gemini' && state.settings.geminiIncludeThoughts) ||
                    (messageApiProvider === 'deepseek' && state.settings.deepSeekIncludeDeepSeekThoughts) ||
                    (messageApiProvider === 'claude' && state.settings.claudeIncludeThoughts) ||
                    (messageApiProvider === 'xai' && state.settings.xaiIncludeThoughts) ||
                    (messageApiProvider === 'llmaggregator' && state.settings.llmAggregatorIncludeThoughts);

                let initialThoughtOpenState = false;
                if (isStreamingPlaceholder) {
                    initialThoughtOpenState = state.currentMessages[index]?.thoughtSummaryOpen || false;
                } else if (messageData && messageData.thoughtSummaryOpen !== undefined) {
                    initialThoughtOpenState = messageData.thoughtSummaryOpen;
                } else if (includeThoughtsForProvider) {
                    initialThoughtOpenState = (messageApiProvider === 'gemini' && state.settings.geminiExpandThoughtsByDefault) ||
                        (messageApiProvider === 'deepseek' && state.settings.deepSeekExpandThoughtsByDefault) ||
                        (messageApiProvider === 'claude' && state.settings.claudeExpandThoughtsByDefault) ||
                        (messageApiProvider === 'xai' && state.settings.xaiExpandThoughtsByDefault) ||
                        (messageApiProvider === 'llmaggregator' && state.settings.llmAggregatorExpandThoughtsByDefault);
                }

                if (role === 'model' && includeThoughtsForProvider && (messageData?.thoughtSummary || messageData?.deepSeekThoughtSummary || messageData?.xaiThoughtSummary || isStreamingPlaceholder)) {
                    const thoughtDetails = document.createElement('details');
                    thoughtDetails.classList.add('thought-summary-details');
                    thoughtDetails.dataset.messageIndex = index;
                    thoughtDetails.open = initialThoughtOpenState;

                    thoughtDetails.addEventListener('toggle', (event) => {
                        const msgIndex = parseInt(thoughtDetails.dataset.messageIndex, 10);
                        if (state.currentMessages[msgIndex]) {
                            state.currentMessages[msgIndex].thoughtSummaryOpen = event.target.open;
                            if (!state.isSending && !state.isAiToAiChatProcessing && !isStreamingPlaceholder) {
                                dbUtils.saveChat();
                            }
                        }
                    });

                    const thoughtSummaryElem = document.createElement('summary');
                    thoughtSummaryElem.textContent = '思考プロセス';
                    thoughtDetails.appendChild(thoughtSummaryElem);

                    const thoughtContentDiv = document.createElement('div');
                    thoughtContentDiv.classList.add('thought-summary-content');

                    thoughtContentDiv.addEventListener('click', (event) => {
                        if (window.getSelection().toString().length > 0) return;
                        if (event.target === thoughtContentDiv) {
                            event.preventDefault();
                            thoughtDetails.open = !thoughtDetails.open;
                        }
                    });

                    if (isStreamingPlaceholder) {
                        thoughtContentDiv.id = `streaming-thought-summary-${index}`;
                        const pre = document.createElement('pre');
                        pre.style.whiteSpace = 'pre-wrap';
                        pre.style.wordBreak = 'break-all';
                        thoughtContentDiv.appendChild(pre);
                    } else if (messageData?.thoughtSummary || messageData?.xaiThoughtSummary) {
                        const pre = document.createElement('pre');
                        pre.textContent = messageData.thoughtSummary || messageData.xaiThoughtSummary || '';
                        pre.style.whiteSpace = 'pre-wrap';
                        pre.style.wordBreak = 'break-all';
                        thoughtContentDiv.appendChild(pre);
                    } else if (messageData?.deepSeekThoughtSummary) {
                        const pre = document.createElement('pre');
                        pre.textContent = messageData.deepSeekThoughtSummary || '';
                        thoughtContentDiv.appendChild(pre);
                    }
                    thoughtDetails.appendChild(thoughtContentDiv);
                    messageDiv.appendChild(thoughtDetails);
                }

                if (state.areAllMessagesHidden && (role === 'user' || role === 'model') && !isStreamingPlaceholder) {
                    messageDiv.classList.add('message-hidden-by-toggle');
                }

                const isCurrentlyCollapsed = state.messageCollapsedStates.get(index) || false;

                if (isCurrentlyCollapsed) {
                    messageDiv.classList.add('message-content-collapsed-fully');
                }

                if (role !== 'error' && state.settings.showTopCollapseButton) {
                    const toggleButtonTop = document.createElement('button');
                    toggleButtonTop.classList.add('message-toggle-button', 'top');
                    toggleButtonTop.dataset.index = index;
                    toggleButtonTop.dataset.action = 'toggle-collapse';
                    toggleButtonTop.textContent = isCurrentlyCollapsed ? state.settings.toggleButtonTopTextExpand : state.settings.toggleButtonTopTextCollapse;
                    const topTitle = isCurrentlyCollapsed ? 'メッセージを展開' : 'メッセージを折りたたむ';
                    toggleButtonTop.title = topTitle;
                    toggleButtonTop.setAttribute('aria-label', topTitle);
                    messageDiv.appendChild(toggleButtonTop);
                }

                const contentDiv = document.createElement('div');
                contentDiv.classList.add('message-content');
                if (isStreamingPlaceholder) {
                    contentDiv.id = `streaming-content-${index}`;
                }

                if (isCurrentlyCollapsed) {
                    contentDiv.classList.add('collapsed');
                    const toggleButtonTopElement = messageDiv.querySelector('.message-toggle-button.top');
                    if (toggleButtonTopElement) {
                        toggleButtonTopElement.textContent = state.settings.toggleButtonTopTextExpand;
                        toggleButtonTopElement.title = 'メッセージを展開';
                        toggleButtonTopElement.setAttribute('aria-label', 'メッセージを展開');
                    }
                }

                if (role === 'user' && attachments && attachments.length > 0) {
                    const details = document.createElement('details');
                    details.classList.add('attachment-details');
                    const summary = document.createElement('summary');
                    summary.textContent = `添付ファイル (${attachments.length}件)`;
                    details.appendChild(summary);

                    const list = document.createElement('ul');
                    list.classList.add('attachment-list');

                    attachments.forEach((att, attachmentIndex) => {
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
                            previewBtn.onclick = (e) => {
                                e.preventDefault();
                                appLogic.previewAttachment(index, attachmentIndex);
                            };
                            actionsDiv.appendChild(previewBtn);
                        }

                        const editBtn = document.createElement('button');
                        editBtn.textContent = '編集';
                        editBtn.classList.add('attachment-edit-btn');
                        editBtn.onclick = (e) => {
                            e.preventDefault();
                            appLogic.editAttachment(index, attachmentIndex);
                        };

                        const removeBtn = document.createElement('button');
                        removeBtn.textContent = '削除';
                        removeBtn.classList.add('attachment-remove-btn');
                        removeBtn.onclick = (e) => {
                            e.preventDefault();
                            appLogic.removeAttachment(index, attachmentIndex, listItem);
                        };

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
                    addMoreBtn.onclick = (e) => {
                        e.preventDefault();
                        appLogic.addMoreAttachments(index, list);
                    };
                    details.appendChild(addMoreBtn);

                    contentDiv.appendChild(details);

                    if (content && content.trim() !== '') {
                        const pre = document.createElement('pre');
                        pre.textContent = content;
                        pre.style.marginTop = '8px';
                        contentDiv.appendChild(pre);
                    }
                } else {
                    try {
                        if (role === 'model' && !isStreamingPlaceholder && typeof marked !== 'undefined') {
                            const safeHtml = uiUtils._sanitizeAndParseMarkdown(content || '');
                            contentDiv.innerHTML = safeHtml;
                            uiUtils.processInteractivePlaceholders(contentDiv);
                            uiUtils.processInteractiveTitles(contentDiv);
                            uiUtils.addCopyButtonsToCodeBlocks(contentDiv, false);
                            uiUtils.addImageClickListeners(contentDiv);
                        } else if (role === 'user') {
                            const pre = document.createElement('pre'); pre.textContent = content; contentDiv.appendChild(pre);
                        } else if (role === 'error') {
                            const p = document.createElement('p'); p.textContent = content; contentDiv.appendChild(p);
                        } else if (isStreamingPlaceholder) {
                            contentDiv.innerHTML = '';
                        } else {
                            const pre = document.createElement('pre'); pre.textContent = content; contentDiv.innerHTML = ''; contentDiv.appendChild(pre);
                        }
                    } catch (e) {
                        const pre = document.createElement('pre'); pre.textContent = content; contentDiv.innerHTML = ''; contentDiv.appendChild(pre);
                    }
                }
                messageDiv.appendChild(contentDiv);

                const citationDetailsDiv = document.createElement('div');
                citationDetailsDiv.classList.add('citation-details-container');
                if (isStreamingPlaceholder) {
                    citationDetailsDiv.id = `streaming-citations-${index}`;
                }
                messageDiv.appendChild(citationDetailsDiv);
                uiUtils.renderCitations(messageData, citationDetailsDiv);

                const editArea = document.createElement('div');
                editArea.classList.add('message-edit-area', 'hidden');
                messageDiv.appendChild(editArea);

                if (role === 'model' && cascadeInfo && cascadeInfo.total > 1) {
                    const cascadeControlsDiv = document.createElement('div');
                    cascadeControlsDiv.classList.add('message-cascade-controls');

                    const prevButton = document.createElement('button');
                    prevButton.textContent = '＜';
                    prevButton.title = '前の応答';
                    prevButton.classList.add('cascade-prev-btn');
                    prevButton.disabled = cascadeInfo.currentIndex <= 1;
                    cascadeControlsDiv.appendChild(prevButton);

                    const indicatorSpan = document.createElement('span');
                    indicatorSpan.classList.add('cascade-indicator');
                    indicatorSpan.textContent = `${cascadeInfo.currentIndex}/${cascadeInfo.total}`;
                    cascadeControlsDiv.appendChild(indicatorSpan);

                    const nextButton = document.createElement('button');
                    nextButton.textContent = '＞';
                    nextButton.title = '次の応答';
                    nextButton.classList.add('cascade-next-btn');
                    nextButton.disabled = cascadeInfo.currentIndex >= cascadeInfo.total;
                    cascadeControlsDiv.appendChild(nextButton);

                    const deleteCascadeButton = document.createElement('button');
                    deleteCascadeButton.textContent = '✕';
                    deleteCascadeButton.title = 'この応答を削除';
                    deleteCascadeButton.classList.add('cascade-delete-btn');
                    cascadeControlsDiv.appendChild(deleteCascadeButton);

                    messageDiv.appendChild(cascadeControlsDiv);
                }

                if (role !== 'error') {
                    const actionsDiv = document.createElement('div');
                    actionsDiv.classList.add('message-actions');

                    if (state.settings.showBottomCollapseButton) {
                        const toggleButtonBottom = document.createElement('button');
                        toggleButtonBottom.classList.add('message-toggle-button', 'bottom');
                        toggleButtonBottom.dataset.index = index;
                        toggleButtonBottom.dataset.action = 'toggle-collapse';
                        toggleButtonBottom.textContent = isCurrentlyCollapsed ? state.settings.toggleButtonBottomTextExpand : state.settings.toggleButtonBottomTextCollapse;
                        const bottomTitle = isCurrentlyCollapsed ? 'メッセージを展開' : 'メッセージを折りたたむ';
                        toggleButtonBottom.title = bottomTitle;
                        toggleButtonBottom.setAttribute('aria-label', bottomTitle);
                        if (actionsDiv.firstChild) {
                            actionsDiv.insertBefore(toggleButtonBottom, actionsDiv.firstChild);
                        } else {
                            actionsDiv.appendChild(toggleButtonBottom);
                        }
                    }

                    const editButton = document.createElement('button');
                    editButton.textContent = '編集'; editButton.title = 'メッセージを編集'; editButton.classList.add('js-edit-btn');
                    actionsDiv.appendChild(editButton);

                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = '削除'; deleteButton.title = 'この会話ターンを削除'; deleteButton.classList.add('js-delete-btn');
                    actionsDiv.appendChild(deleteButton);

                    const copyButton = document.createElement('button');
                    copyButton.textContent = 'コピー';
                    copyButton.title = 'テキストをコピー';
                    copyButton.classList.add('js-copy-btn');
                    actionsDiv.appendChild(copyButton);

                    if (role === 'user' || role === 'model') {
                        const retryButton = document.createElement('button');
                        retryButton.textContent = 'リトライ';
                        retryButton.title = 'このメッセージから再生成';
                        retryButton.classList.add('js-retry-btn');
                        actionsDiv.appendChild(retryButton);
                    }

                    if (role === 'model' && messageData?.usageMetadata &&
                        typeof messageData.usageMetadata.candidatesTokenCount === 'number' &&
                        typeof messageData.usageMetadata.totalTokenCount === 'number') {
                        const usage = messageData.usageMetadata;
                        const tokenSpan = document.createElement('span');
                        tokenSpan.classList.add('token-count-display');

                        let finalTotalTokenCount = usage.totalTokenCount;
                        if (typeof messageData.usageMetadata.thoughtsTokenCount === 'number' && messageApiProvider === 'gemini') {
                            finalTotalTokenCount -= messageData.usageMetadata.thoughtsTokenCount;
                        }

                        const formattedCandidates = usage.candidatesTokenCount.toLocaleString('en-US');
                        const formattedTotal = finalTotalTokenCount.toLocaleString('en-US');

                        tokenSpan.textContent = `${formattedCandidates} / ${formattedTotal}`;
                        tokenSpan.title = `Candidate Tokens / Total Tokens`;
                        actionsDiv.appendChild(tokenSpan);
                    }
                    messageDiv.appendChild(actionsDiv);
                }

                if (isStreamingPlaceholder) {
                    messageDiv.id = `streaming-message-${index}`;
                }
                elements.messageContainer.appendChild(messageDiv);
            },
});
