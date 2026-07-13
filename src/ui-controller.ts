// @ts-nocheck -- Enable after this legacy controller is split into typed features.
// src/ui-controller.js is generated from this file. Edit this TypeScript source instead.
        const uiUtils = {
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
            updateMemoStackHeightSettingsVisibility() {
                const showMemoBtn = elements.showMemoButtonToggle.checked;
                const showClipboardStackBtn = elements.showClipboardStackButtonToggle.checked;
                const shouldShow = showMemoBtn || showClipboardStackBtn;
                elements.memoStackHeightSettings.classList.toggle('hidden', !shouldShow);
            },
            renderCitations(messageData, containerDiv) {
                if (!containerDiv) return;
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
                if (codeElement && (
                    codeElement.classList.contains('language-mermaid') ||
                    codeElement.classList.contains('mermaid')
                )) {
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
                    } else if (bodyClasses.contains('turf-mode')) {
                        return 'default';
                    } else if (bodyClasses.contains('pastel-pink-mode')) {
                        return 'base';
                    } else if (bodyClasses.contains('pastel-blue-mode')) {
                        return 'base';
                    } else if (bodyClasses.contains('pastel-yellow-mode')) {
                        return 'base';
                    } else if (bodyClasses.contains('pastel-purple-mode')) {
                        return 'base';
                    } else if (bodyClasses.contains('pastel-rainbow-mode')) {
                        return 'base';
                    } else {
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
                    } else {
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
                    } catch (err) {
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
                } catch (error) {
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
                if (!messageDiv || typeof marked === 'undefined') return;

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
                    } else {
                        return;
                    }
                } else {
                    targetContentDiv = messageDiv.querySelector(`#streaming-content-${index}`);
                    accumulatedContentForDisplay = state.partialStreamContent;
                }

                if (targetContentDiv) {
                    if (isThoughtSummary) {
                        const pre = targetContentDiv.querySelector('pre');
                        if (pre) {
                            pre.textContent = accumulatedContentForDisplay;
                        }
                    } else {
                        const renderCurrentState = (contentToRender) => {
                            try {
                                const safeHtml = this._sanitizeAndParseMarkdown(contentToRender || '');
                                targetContentDiv.innerHTML = safeHtml;
                                this.processInteractivePlaceholders(targetContentDiv);
                                this.processInteractiveTitles(targetContentDiv);
                                this.addCopyButtonsToCodeBlocks(targetContentDiv, true);
                                this.addImageClickListeners(targetContentDiv);
                            } catch (e) {
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
                    if (!finalMessageData) return;
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
                        } catch (e) {
                            contentDiv.textContent = finalRawContent;
                        }
                    } else if (contentDiv) {
                        contentDiv.textContent = finalRawContent;
                    }
                    if (contentDiv) contentDiv.removeAttribute('id');

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
                if (!messageDiv) return;

                const contentDiv = messageDiv.querySelector('.message-content');
                if (!contentDiv) return;

                try {
                    if (typeof marked !== 'undefined') {
                        const safeHtml = this._sanitizeAndParseMarkdown(newContent || '');
                        contentDiv.innerHTML = safeHtml;
                        this.processInteractivePlaceholders(contentDiv);
                        this.processInteractiveTitles(contentDiv);
                        this.addCopyButtonsToCodeBlocks(contentDiv, false);
                        this.addImageClickListeners(contentDiv);
                    } else {
                        const pre = document.createElement('pre');
                        pre.textContent = newContent;
                        contentDiv.innerHTML = '';
                        contentDiv.appendChild(pre);
                    }
                } catch (e) {
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
                    } else {
                        const firstUserMessage = state.currentMessages.find(m => m.role === 'user');
                        if (firstUserMessage) {
                            baseTitle = firstUserMessage.content;
                        } else if (state.currentMessages.length > 0) {
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
                    } else if (state.currentMessages.length > 0) {
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
                if (!timestamp) return '';
                try {
                    return new Intl.DateTimeFormat('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
                } catch (e) {
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
                                    } else if (!previewText) {
                                        previewText = "(空のメッセージ)";
                                    }
                                    if (previewText.length > 300) previewText = previewText.substring(0, 300) + "...";
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
                                        } else if (state.linkedSessionIds[1] === chat.id) {
                                            linkButton.classList.add('linked-b');
                                        }
                                    }
                                    linkButton.onclick = (e) => { e.stopPropagation(); appLogic.toggleSessionLink(chat.id); };
                                } else {
                                    linkButton.classList.add('hidden');
                                }
                            }

                            elements.historyList.appendChild(li);
                        });
                    } else {
                        elements.noHistoryMessage.classList.remove('hidden');
                        elements.historyTitle.textContent = '履歴一覧';
                    }
                } catch (error) {
                    elements.noHistoryMessage.textContent = "履歴の読み込み中にエラーが発生しました。";
                    elements.noHistoryMessage.classList.remove('hidden');
                    elements.historyTitle.textContent = '履歴一覧';
                }
            },
            revokeExistingObjectUrl() {
                if (state.backgroundImageUrl) {
                    try { URL.revokeObjectURL(state.backgroundImageUrl); } catch (e) { }
                    state.backgroundImageUrl = null;
                }
            },
            revokeExistingIconUrls() {
                if (state.userIconUrl) {
                    try { URL.revokeObjectURL(state.userIconUrl); } catch (e) { }
                    state.userIconUrl = null;
                }
                if (state.aiIconUrl) {
                    try { URL.revokeObjectURL(state.aiIconUrl); } catch (e) { }
                    state.aiIconUrl = null;
                }
            },
                        updateBackgroundSettingsUI() {
                if (elements.backgroundThumbnail && elements.deleteBackgroundBtn) {
                    if (state.backgroundImageUrl) {
                        elements.backgroundThumbnail.src = state.backgroundImageUrl;
                        elements.backgroundThumbnail.classList.remove('hidden');
                        elements.deleteBackgroundBtn.classList.remove('hidden');
                    } else {
                        elements.backgroundThumbnail.src = '';
                        elements.backgroundThumbnail.classList.add('hidden');
                        elements.deleteBackgroundBtn.classList.add('hidden');
                    }
                }
                if (elements.historyBgThumbnail && elements.deleteHistoryBgBtn) {
                    if (state.historyBackgroundImageUrl) {
                        elements.historyBgThumbnail.src = state.historyBackgroundImageUrl;
                        elements.historyBgThumbnail.classList.remove('hidden');
                        elements.deleteHistoryBgBtn.classList.remove('hidden');
                    } else {
                        elements.historyBgThumbnail.src = '';
                        elements.historyBgThumbnail.classList.add('hidden');
                        elements.deleteHistoryBgBtn.classList.add('hidden');
                    }
                }
                if (elements.settingsBgThumbnail && elements.deleteSettingsBgBtn) {
                    if (state.settingsBackgroundImageUrl) {
                        elements.settingsBgThumbnail.src = state.settingsBackgroundImageUrl;
                        elements.settingsBgThumbnail.classList.remove('hidden');
                        elements.deleteSettingsBgBtn.classList.remove('hidden');
                    } else {
                        elements.settingsBgThumbnail.src = '';
                        elements.settingsBgThumbnail.classList.add('hidden');
                        elements.deleteSettingsBgBtn.classList.add('hidden');
                    }
                }
            },

            updateIconSettingsUI() {
                if (state.userIconUrl) {
                    elements.userIconThumbnail.src = state.userIconUrl;
                    elements.userIconThumbnail.classList.remove('hidden');
                    elements.deleteUserIconBtn.classList.remove('hidden');
                } else {
                    elements.userIconThumbnail.src = '';
                    elements.userIconThumbnail.classList.add('hidden');
                    elements.deleteUserIconBtn.classList.add('hidden');
                }

                if (state.aiIconUrl) {
                    elements.aiIconThumbnail.src = state.aiIconUrl;
                    elements.aiIconThumbnail.classList.remove('hidden');
                    elements.deleteAiIconBtn.classList.remove('hidden');
                } else {
                    elements.aiIconThumbnail.src = '';
                    elements.aiIconThumbnail.classList.add('hidden');
                    elements.deleteAiIconBtn.classList.add('hidden');
                }
            },
            applySidePanelSettingsToUI() {
                if (elements.toggleMemoBtn) {
                    elements.toggleMemoBtn.classList.toggle('hidden', !state.settings.showMemoButton);
                }
                document.documentElement.style.setProperty('--memo-height', state.settings.memoHeight || DEFAULT_MEMO_HEIGHT);

                if (elements.toggleClipboardStackBtn) {
                    elements.toggleClipboardStackBtn.classList.toggle('hidden', !state.settings.showClipboardStackButton);
                }
                document.documentElement.style.setProperty('--clipboard-stack-height', state.settings.clipboardStackHeight || DEFAULT_CLIPBOARD_STACK_HEIGHT);
                document.documentElement.style.setProperty('--message-icon-size', `${state.settings.messageIconSize || DEFAULT_MESSAGE_ICON_SIZE}px`);
                document.documentElement.style.setProperty('--message-icon-offset-y', `${state.settings.messageIconOffsetY || DEFAULT_MESSAGE_ICON_OFFSET_Y}px`);
                document.documentElement.style.setProperty('--icon-name-font-size', `${state.settings.iconNameFontSize || DEFAULT_ICON_NAME_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--icon-name-offset-y', `${state.settings.iconNameOffsetY || DEFAULT_ICON_NAME_OFFSET_Y}px`);

                let userBubbleFinalBg;
                const userBubbleOpacity = state.settings.userNameBubbleOpacity ?? DEFAULT_USER_NAME_BUBBLE_OPACITY;

                if (state.settings.showUserNameBubble) {
                    let userRgb;
                    if (state.settings.userNameBubbleUseThemeColor) {
                        const themeUserMsgRgbString = getComputedStyle(document.body).getPropertyValue('--current-theme-user-message-rgb').trim();
                        const parts = themeUserMsgRgbString.split(',').map(s => parseInt(s.trim(), 10));
                        userRgb = (parts.length === 3 && !parts.some(isNaN)) ? { r: parts[0], g: parts[1], b: parts[2] } : this.hexToRgb(DEFAULT_USER_NAME_BUBBLE_COLOR) || { r: 255, g: 255, b: 255 };
                    } else {
                        const customUserBubbleColor = state.settings.userNameBubbleColor;
                        if (customUserBubbleColor && /^#([0-9A-Fa-f]{3}){1,2}$/.test(customUserBubbleColor)) {
                            userRgb = this.hexToRgb(customUserBubbleColor);
                        } else {
                            const defaultRgbString = getComputedStyle(document.body).getPropertyValue('--default-user-name-bubble-custom-rgb').trim();
                            const parts = defaultRgbString.split(',').map(s => parseInt(s.trim(), 10));
                            userRgb = (parts.length === 3 && !parts.some(isNaN)) ? { r: parts[0], g: parts[1], b: parts[2] } : { r: 255, g: 255, b: 255 };
                        }
                    }
                    userBubbleFinalBg = `rgba(${userRgb.r}, ${userRgb.g}, ${userRgb.b}, ${userBubbleOpacity})`;
                } else {
                    userBubbleFinalBg = 'transparent';
                }
                document.documentElement.style.setProperty('--user-name-bubble-bg', userBubbleFinalBg);

                let aiBubbleFinalBg;
                const aiBubbleOpacity = state.settings.aiNameBubbleOpacity ?? DEFAULT_AI_NAME_BUBBLE_OPACITY;

                if (state.settings.showAiNameBubble) {
                    let aiRgb;
                    if (state.settings.aiNameBubbleUseThemeColor) {
                        const themeAiMsgRgbString = getComputedStyle(document.body).getPropertyValue('--current-theme-model-message-rgb').trim();
                        const parts = themeAiMsgRgbString.split(',').map(s => parseInt(s.trim(), 10));
                        aiRgb = (parts.length === 3 && !parts.some(isNaN)) ? { r: parts[0], g: parts[1], b: parts[2] } : this.hexToRgb(DEFAULT_AI_NAME_BUBBLE_COLOR) || { r: 255, g: 255, b: 255 };
                    } else {
                        const customAiBubbleColor = state.settings.aiNameBubbleColor;
                        if (customAiBubbleColor && /^#([0-9A-Fa-f]{3}){1,2}$/.test(customAiBubbleColor)) {
                            aiRgb = this.hexToRgb(customAiBubbleColor);
                        } else {
                            const defaultRgbString = getComputedStyle(document.body).getPropertyValue('--default-ai-name-bubble-custom-rgb').trim();
                            const parts = defaultRgbString.split(',').map(s => parseInt(s.trim(), 10));
                            aiRgb = (parts.length === 3 && !parts.some(isNaN)) ? { r: parts[0], g: parts[1], b: parts[2] } : { r: 255, g: 255, b: 255 };
                        }
                    }
                    aiBubbleFinalBg = `rgba(${aiRgb.r}, ${aiRgb.g}, ${aiRgb.b}, ${aiBubbleOpacity})`;
                } else {
                    aiBubbleFinalBg = 'transparent';
                }
                document.documentElement.style.setProperty('--ai-name-bubble-bg', aiBubbleFinalBg);

                if (elements.userNameBubbleToggle && elements.userNameBubbleUseThemeColorToggle && document.getElementById('user-name-bubble-custom-color-settings')) {
                    const customColorDiv = document.getElementById('user-name-bubble-custom-color-settings');
                    const colorInput = customColorDiv.querySelector('#user-name-bubble-color');
                    const colorLabel = customColorDiv.querySelector('label[for="user-name-bubble-color"]');
                    const shouldShowCustomColor = state.settings.showUserNameBubble && !state.settings.userNameBubbleUseThemeColor;
                    if (colorInput) colorInput.style.display = shouldShowCustomColor ? 'block' : 'none';
                    if (colorLabel) colorLabel.style.display = shouldShowCustomColor ? 'block' : 'none';

                    const opacityInput = elements.userNameBubbleOpacityInput;
                    const opacityLabel = document.querySelector('label[for="user-name-bubble-opacity"]');
                    if (opacityInput) opacityInput.style.display = state.settings.showUserNameBubble ? 'block' : 'none';
                    if (opacityLabel) opacityLabel.style.display = state.settings.showUserNameBubble ? 'block' : 'none';
                }
                if (elements.aiNameBubbleToggle && elements.aiNameBubbleUseThemeColorToggle && document.getElementById('ai-name-bubble-custom-color-settings')) {
                    const customColorDiv = document.getElementById('ai-name-bubble-custom-color-settings');
                    const colorInput = customColorDiv.querySelector('#ai-name-bubble-color');
                    const colorLabel = customColorDiv.querySelector('label[for="ai-name-bubble-color"]');
                    const shouldShowCustomColor = state.settings.showAiNameBubble && !state.settings.aiNameBubbleUseThemeColor;
                    if (colorInput) colorInput.style.display = shouldShowCustomColor ? 'block' : 'none';
                    if (colorLabel) colorLabel.style.display = shouldShowCustomColor ? 'block' : 'none';

                    const opacityInput = elements.aiNameBubbleOpacityInput;
                    const opacityLabel = document.querySelector('label[for="ai-name-bubble-opacity"]');
                    if (opacityInput) opacityInput.style.display = state.settings.showAiNameBubble ? 'block' : 'none';
                    if (opacityLabel) opacityLabel.style.display = state.settings.showAiNameBubble ? 'block' : 'none';
                }
            },
            applyOpacitySettings() {
                document.documentElement.style.setProperty('--message-bubble-opacity',
                    state.settings.enableMessageBubbleOpacity ? state.settings.messageBubbleOpacity : 1
                );
                document.documentElement.style.setProperty('--header-footer-opacity',
                    state.settings.enableHeaderFooterOpacity ? state.settings.headerFooterOpacity : 1
                );
                document.documentElement.style.setProperty('--chat-overlay-alpha',
                    state.settings.enableChatOverlayOpacity ? state.settings.chatOverlayOpacity : 1
                );
                document.documentElement.style.setProperty('--message-actions-bg-opacity',
                    state.settings.enableMessageActionsBackgroundOpacity ? state.settings.messageActionsBackgroundOpacity : 1
                );
                document.documentElement.style.setProperty('--thought-summary-opacity',
                    state.settings.enableThoughtSummaryOpacity ? state.settings.thoughtSummaryOpacity : 1
                );
                document.documentElement.style.setProperty('--cryscroller-scroll-active-opacity',
                    state.settings.enableCryscrollerScrollActiveOpacity ? state.settings.cryscrollerScrollActiveOpacity : DEFAULT_CRYSCROLLER_SCROLL_ACTIVE_OPACITY
                );

                let headerColor, secondaryColor, userMessageColor, modelMessageColor, overlayBaseColor, tertiaryColorRgbStr;

switch (state.settings.theme) {
                    case 'dark':
                        headerColor = DARK_THEME_COLOR;
                        secondaryColor = DARK_MODE_SECONDARY_COLOR;
                        userMessageColor = DARK_MODE_USER_MESSAGE_COLOR;
                        modelMessageColor = DARK_MODE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = DARK_MODE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'turf':
                        headerColor = TURF_HEADER_COLOR;
                        secondaryColor = TURF_SECONDARY_COLOR;
                        userMessageColor = TURF_USER_MESSAGE_COLOR;
                        modelMessageColor = TURF_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = TURF_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-pink':
                        headerColor = PASTEL_PINK_HEADER_COLOR;
                        secondaryColor = PASTEL_PINK_SECONDARY_COLOR;
                        userMessageColor = PASTEL_PINK_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_PINK_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_PINK_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-blue':
                        headerColor = PASTEL_BLUE_HEADER_COLOR;
                        secondaryColor = PASTEL_BLUE_SECONDARY_COLOR;
                        userMessageColor = PASTEL_BLUE_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_BLUE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_BLUE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-yellow':
                        headerColor = PASTEL_YELLOW_HEADER_COLOR;
                        secondaryColor = PASTEL_YELLOW_SECONDARY_COLOR;
                        userMessageColor = PASTEL_YELLOW_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_YELLOW_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_YELLOW_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-purple':
                        headerColor = PASTEL_PURPLE_HEADER_COLOR;
                        secondaryColor = PASTEL_PURPLE_SECONDARY_COLOR;
                        userMessageColor = PASTEL_PURPLE_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_PURPLE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_PURPLE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'pastel-rainbow':
                        headerColor = PASTEL_RAINBOW_HEADER_COLOR;
                        secondaryColor = PASTEL_RAINBOW_SECONDARY_COLOR;
                        userMessageColor = PASTEL_RAINBOW_USER_MESSAGE_COLOR;
                        modelMessageColor = PASTEL_RAINBOW_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = PASTEL_RAINBOW_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                    case 'light':
                    default:
                        headerColor = LIGHT_THEME_COLOR;
                        secondaryColor = LIGHT_MODE_SECONDARY_COLOR;
                        userMessageColor = LIGHT_MODE_USER_MESSAGE_COLOR;
                        modelMessageColor = LIGHT_MODE_MODEL_MESSAGE_COLOR;
                        overlayBaseColor = LIGHT_MODE_PRIMARY_COLOR;
                        tertiaryColorRgbStr = getComputedStyle(document.body).getPropertyValue('--bg-tertiary-rgb').trim();
                        break;
                }

                if (state.settings.theme !== 'pastel-rainbow') {
                    const headerRgb = this.hexToRgb(headerColor) || this.parseRgbCss(headerColor);
                    if (headerRgb) {
                        document.documentElement.style.setProperty('--bg-header-rgb', `${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}`);
                    }
                }

                const secondaryBgRgb = this.hexToRgb(secondaryColor) || this.parseRgbCss(secondaryColor);
                if (secondaryBgRgb) {
                    document.documentElement.style.setProperty('--bg-secondary-rgb', `${secondaryBgRgb.r}, ${secondaryBgRgb.g}, ${secondaryBgRgb.b}`);
                }
                const userMessageBgRgb = this.hexToRgb(userMessageColor) || this.parseRgbCss(userMessageColor);
                if (userMessageBgRgb) {
                    document.documentElement.style.setProperty('--bg-user-message-rgb', `${userMessageBgRgb.r}, ${userMessageBgRgb.g}, ${userMessageBgRgb.b}`);
                }
                const modelMessageBgRgb = this.hexToRgb(modelMessageColor) || this.parseRgbCss(modelMessageColor);
                if (modelMessageBgRgb) {
                    document.documentElement.style.setProperty('--bg-model-message-rgb', `${modelMessageBgRgb.r}, ${modelMessageBgRgb.g}, ${modelMessageBgRgb.b}`);
                }
                const overlayBaseRgbVal = this.hexToRgb(overlayBaseColor) || this.parseRgbCss(overlayBaseColor);
                if (overlayBaseRgbVal) {
                    document.documentElement.style.setProperty('--overlay-base-rgb', `${overlayBaseRgbVal.r}, ${overlayBaseRgbVal.g}, ${overlayBaseRgbVal.b}`);
                }
                if (tertiaryColorRgbStr) {
                    document.documentElement.style.setProperty('--bg-tertiary-rgb', tertiaryColorRgbStr);
                }
            },
            hexToRgb(hex) {
                if (typeof hex !== 'string') return null;
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            },
            parseRgbCss(rgbString) {
                if (typeof rgbString !== 'string') return null;
                const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                if (match) {
                    return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
                }
                return null;
            },
            applyZoomPreventionSetting() {
                let viewportMeta = document.querySelector('meta[name="viewport"]');
                if (!viewportMeta) {
                    viewportMeta = document.createElement('meta');
                    viewportMeta.name = 'viewport';
                    document.head.appendChild(viewportMeta);
                }

                let content = "width=device-width, initial-scale=1.0";
                if (state.settings.preventZoom) {
                    content += ", maximum-scale=1.0, user-scalable=no";
                }
                viewportMeta.content = content;
            },
            applyTheme() {
                const theme = state.settings.theme;
document.body.classList.remove('dark-mode', 'light-mode-forced', 'pastel-pink-mode', 'pastel-blue-mode', 'pastel-yellow-mode', 'pastel-purple-mode', 'pastel-rainbow-mode', 'turf-mode');
                let themeColorMetaValue;
                let currentThemeUserMessageBgRgb = this.hexToRgb(LIGHT_MODE_USER_MESSAGE_COLOR) || { r: 220, g: 248, b: 198 };
                let currentThemeModelMessageBgRgb = this.hexToRgb(LIGHT_MODE_MODEL_MESSAGE_COLOR) || { r: 229, g: 229, b: 234 };

                switch (theme) {
                    case 'dark':
                        document.body.classList.add('dark-mode');
                        themeColorMetaValue = DARK_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(DARK_MODE_USER_MESSAGE_COLOR) || { r: 5, g: 97, b: 98 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(DARK_MODE_MODEL_MESSAGE_COLOR) || { r: 58, g: 58, b: 60 };
                        break;
                    case 'turf':
                        document.body.classList.add('turf-mode');
                        themeColorMetaValue = TURF_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(TURF_USER_MESSAGE_COLOR) || { r: 220, g: 248, b: 198 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(TURF_MODEL_MESSAGE_COLOR) || { r: 229, g: 229, b: 234 };
                        break;
                    case 'pastel-pink':
                        document.body.classList.add('pastel-pink-mode');
                        themeColorMetaValue = PASTEL_PINK_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_PINK_USER_MESSAGE_COLOR) || { r: 255, g: 221, b: 238 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_PINK_MODEL_MESSAGE_COLOR) || { r: 243, g: 232, b: 255 };
                        break;
                    case 'pastel-blue':
                        document.body.classList.add('pastel-blue-mode');
                        themeColorMetaValue = PASTEL_BLUE_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_BLUE_USER_MESSAGE_COLOR) || { r: 207, g: 241, b: 239 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_BLUE_MODEL_MESSAGE_COLOR) || { r: 224, g: 232, b: 255 };
                        break;
                    case 'pastel-yellow':
                        document.body.classList.add('pastel-yellow-mode');
                        themeColorMetaValue = PASTEL_YELLOW_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_YELLOW_USER_MESSAGE_COLOR) || { r: 255, g: 245, b: 186 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_YELLOW_MODEL_MESSAGE_COLOR) || { r: 255, g: 228, b: 181 };
                        break;
                    case 'pastel-purple':
                        document.body.classList.add('pastel-purple-mode');
                        themeColorMetaValue = PASTEL_PURPLE_THEME_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_PURPLE_USER_MESSAGE_COLOR) || { r: 209, g: 196, b: 233 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_PURPLE_MODEL_MESSAGE_COLOR) || { r: 197, g: 202, b: 233 };
                        break;
                    case 'pastel-rainbow':
                        document.body.classList.add('pastel-rainbow-mode');
                        themeColorMetaValue = PASTEL_RAINBOW_HEADER_COLOR;
                        currentThemeUserMessageBgRgb = this.hexToRgb(PASTEL_RAINBOW_USER_MESSAGE_COLOR) || { r: 224, g: 255, b: 240 };
                        currentThemeModelMessageBgRgb = this.hexToRgb(PASTEL_RAINBOW_MODEL_MESSAGE_COLOR) || { r: 224, g: 240, b: 255 };
                        break;
                    case 'light':
                    default:
                        document.body.classList.add('light-mode-forced');
                        themeColorMetaValue = LIGHT_THEME_COLOR;
                        break;
                }
                if (elements.themeColorMeta) {
                    elements.themeColorMeta.content = themeColorMetaValue;
                }

                document.documentElement.style.setProperty('--current-theme-user-message-rgb', `${currentThemeUserMessageBgRgb.r}, ${currentThemeUserMessageBgRgb.g}, ${currentThemeUserMessageBgRgb.b}`);
                document.documentElement.style.setProperty('--current-theme-model-message-rgb', `${currentThemeModelMessageBgRgb.r}, ${currentThemeModelMessageBgRgb.g}, ${currentThemeModelMessageBgRgb.b}`);

                this.applyOpacitySettings();
                this.applyZoomPreventionSetting();
            },
    applyElevationSetting() {
        document.body.classList.toggle('elevation-enabled', state.settings.enableElevation);
        document.body.classList.toggle('elevation-hover-enabled', state.settings.enableElevationHover);
    },

            applySettingsToUI() {
                this.toggleApiSettingsVisibility(state.settings.apiProvider);
                elements.apiProviderSelect.value = state.settings.apiProvider;
                twinEngineApiConfigUtils.renderList();
                elements.commonSystemPromptDefaultTextarea.value = state.settings.commonSystemPrompt || '';
                elements.enableCommonSystemPromptDefaultCheckbox.checked = state.settings.enableCommonSystemPromptDefault;
                elements.twinEngineEnableFullAutoToggle.checked = state.settings.twinEngineEnableFullAuto;
                elements.showFooterTwinEngineToggleButtonToggle.checked = state.settings.showFooterTwinEngineToggleButton;
                elements.showFooterResummarizeButtonToggle.checked = state.settings.showFooterResummarizeButton;
                elements.twinEngineFullAutoSettingContainer.classList.toggle('hidden', !state.settings.showTwinEngineSettings);
                elements.twinEngineSummarizeAfterTurnsInput.value = state.settings.twinEngineSummarizeAfterTurns ?? DEFAULT_TWIN_ENGINE_SUMMARIZE_AFTER_TURNS;
                document.getElementById('twin-engine-initial-turns-to-include').value = state.settings.twinEngineInitialTurnsToInclude ?? 1;
                elements.twinEngineSummaryPromptInput.value = state.settings.twinEngineSummaryPrompt || '';
                elements.twinEngineDummyUserInput.value = state.settings.twinEngineDummyUser || '';
                elements.twinEngineEnableDummyUserCheckbox.checked = state.settings.twinEngineEnableDummyUser;
                elements.twinEngineDummyModelInput.value = state.settings.twinEngineDummyModel || '';
                elements.twinEngineEnableDummyModelCheckbox.checked = state.settings.twinEngineEnableDummyModel;
                elements.twinEngineConcatDummyModelCheckbox.checked = state.settings.twinEngineConcatDummyModel;

                elements.geminiApiKeyInput.value = state.settings.apiKey || '';
                elements.geminiModelNameSelect.value = state.settings.modelName || DEFAULT_MODEL;
                elements.geminiAdditionalModelsTextarea.value = state.settings.additionalModels || '';
elements.deepSeekApiKeyInput.value = state.settings.deepSeekApiKey || '';
elements.deepSeekApiEndpointInput.value = state.settings.deepSeekApiEndpoint || '';
elements.deepSeekModelNameSelect.value = state.settings.deepSeekModelName || DEFAULT_DEEPSEEK_MODEL;
                elements.deepSeekAdditionalModelsTextarea.value = state.settings.deepSeekAdditionalModels || '';
                elements.claudeApiKeyInput.value = state.settings.claudeApiKey || '';
                elements.claudeModelNameSelect.value = state.settings.claudeModelName || DEFAULT_CLAUDE_MODEL;
                elements.claudeAdditionalModelsTextarea.value = state.settings.claudeAdditionalModels || '';
                elements.openaiApiKeyInput.value = state.settings.openaiApiKey || '';
                elements.openaiModelNameSelect.value = state.settings.openaiModelName || DEFAULT_OPENAI_MODEL;
                elements.openaiAdditionalModelsTextarea.value = state.settings.openaiAdditionalModels || '';
                elements.xaiApiKeyInput.value = state.settings.xaiApiKey || '';
                elements.xaiModelNameSelect.value = state.settings.xaiModelName || DEFAULT_XAI_MODEL;
                elements.xaiAdditionalModelsTextarea.value = state.settings.xaiAdditionalModels || '';
                elements.llmAggregatorApiBackendInput.value = state.settings.llmAggregatorApiBackend || '';
                elements.llmAggregatorApiKeyInput.value = state.settings.llmAggregatorApiKey || '';
                elements.llmAggregatorModelNameSelect.value = state.settings.llmAggregatorModelName || DEFAULT_LLMAGGREGATOR_MODEL;
                elements.llmAggregatorAdditionalModelsTextarea.value = state.settings.llmAggregatorAdditionalModels || '';

                multiBackendUtils.toggleMultiBackendsVisibility(true);
                elements.showSettingsScrollToTopButtonToggle.checked = state.settings.showSettingsScrollToTopButton;
                elements.showSettingsScrollToBottomButtonToggle.checked = state.settings.showSettingsScrollToBottomButton;
    this.updateSettingsScreenElementVisibility();

                multiBackendUtils.renderList();

                multiApiKeyUtils.renderAllApiKeyLists();
                multiApiKeyUtils.updateMainApiKeyInput('gemini');
                multiApiKeyUtils.updateMainApiKeyInput('deepseek');
                multiApiKeyUtils.updateMainApiKeyInput('claude');
                multiApiKeyUtils.updateMainApiKeyInput('openai');
                multiApiKeyUtils.updateMainApiKeyInput('xai');
                multiApiKeyUtils.updateMainApiKeyInput('llmaggregator');

                const setupParamUI = (paramId, storageKey) => {
                    const numberInput = document.getElementById(paramId);
                    const sliderInput = document.getElementById(paramId + '-slider');
                    const checkbox = document.querySelector(`.param-default-checkbox[data-target-id="${paramId}"]`);
                    const maxInput = document.querySelector(`.param-slider-max-input[data-target-id="${paramId}"]`);
                    const label = checkbox.parentElement;
                    if (label) {
                        label.title = "カスタム値を指定する (チェックを入れると有効)";
                    }

                    let paramKey = paramId.replace(/-(\w)/g, (_, c) => c.toUpperCase());
                    if (paramKey.startsWith('deepseek')) {
                        paramKey = 'deepSeek' + paramKey.substring('deepseek'.length);
                    } else if (paramKey.startsWith('llmaggregator')) {
                        paramKey = 'llmAggregator' + paramKey.substring('llmaggregator'.length);
                    }
                    const value = state.settings[paramKey] ?? null;

                    const useCustomValue = value !== null;

                    checkbox.checked = useCustomValue;
                    numberInput.disabled = !useCustomValue;
                    sliderInput.disabled = !useCustomValue;
                    if (maxInput) maxInput.disabled = !useCustomValue;

                    if (useCustomValue) {
                        numberInput.value = value;
                        sliderInput.value = value;
                    } else {
                        numberInput.value = '';
                    }

                    if (maxInput) {
                        const maxVal = state.settings[storageKey] || parseFloat(sliderInput.getAttribute('max')) || 100;
                        sliderInput.max = maxVal;
                        maxInput.value = maxVal;
                    }
                };

                elements.geminiSystemPromptDefaultTextarea.value = state.settings.geminiSystemPrompt || '';
                elements.geminiEnableSystemPromptDefaultCheckbox.checked = state.settings.geminiEnableSystemPromptDefault;
                setupParamUI('gemini-max-tokens', 'geminiMaxTokensSliderMax');
                setupParamUI('gemini-temperature');
                setupParamUI('gemini-top-k', 'geminiTopKSliderMax');
                setupParamUI('gemini-top-p');
                setupParamUI('gemini-presence-penalty');
                setupParamUI('gemini-frequency-penalty');
                setupParamUI('gemini-thinking-budget', 'geminiThinkingBudgetSliderMax');
                elements.geminiThinkingBudgetInput.value = state.settings.geminiThinkingBudget === null ? '' : state.settings.geminiThinkingBudget;
                elements.geminiIncludeThoughtsToggle.checked = state.settings.geminiIncludeThoughts;
                elements.geminiExpandThoughtsByDefaultToggle.checked = state.settings.geminiExpandThoughtsByDefault;
                elements.geminiStreamingOutputCheckbox.checked = state.settings.geminiStreamingOutput;
                elements.geminiStreamingSpeedInput.value = state.settings.geminiStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.geminiDummyUserInput.value = state.settings.geminiDummyUser || '';
                elements.geminiEnableDummyUserCheckbox.checked = state.settings.geminiEnableDummyUser;
                elements.geminiDummyModelInput.value = state.settings.geminiDummyModel || '';
                elements.geminiEnableDummyModelCheckbox.checked = state.settings.geminiEnableDummyModel;
                elements.geminiConcatDummyModelCheckbox.checked = state.settings.geminiConcatDummyModel;
                elements.geminiPseudoStreamingCheckbox.checked = state.settings.geminiPseudoStreaming;
                elements.geminiEnableGroundingToggle.checked = state.settings.geminiEnableGrounding;
                elements.enableImageUrlReplacementCheckbox.checked = state.settings.enableImageUrlReplacement;
                elements.imageUrlReplacementBaseInput.value = state.settings.imageUrlReplacementBase || '';
                elements.imageUrlReplacementOptionsDiv.classList.toggle('hidden', !state.settings.enableImageUrlReplacement);
                elements.characterNamesListTextarea.value = state.settings.characterNamesList || '';
                elements.enableRomajiToKatakanaConversionCheckbox.checked = state.settings.enableRomajiToKatakanaConversion;
                elements.enableAutoBaseUrlDetectionCheckbox.checked = state.settings.enableAutoBaseUrlDetection;
                elements.enableFuzzySearchNormalizationCheckbox.checked = state.settings.enableFuzzySearchNormalization;
                elements.fuzzySearchThresholdInput.value = state.settings.fuzzySearchThreshold;
                elements.fuzzySearchOptionsDiv.classList.toggle('hidden', !state.settings.enableFuzzySearchNormalization);

                elements.deepSeekSystemPromptDefaultTextarea.value = state.settings.deepSeekSystemPrompt || '';
                elements.deepSeekEnableSystemPromptDefaultCheckbox.checked = state.settings.deepSeekEnableSystemPromptDefault;
                setupParamUI('deepseek-max-tokens', 'deepseekMaxTokensSliderMax');
                setupParamUI('deepseek-temperature');
                setupParamUI('deepseek-top-p');
                setupParamUI('deepseek-presence-penalty');
                setupParamUI('deepseek-frequency-penalty');
                elements.deepSeekIncludeThoughtsToggle.checked = state.settings.deepSeekIncludeDeepSeekThoughts;
                elements.deepSeekExpandThoughtsByDefaultToggle.checked = state.settings.deepSeekExpandThoughtsByDefault;
                elements.deepSeekStreamingOutputCheckbox.checked = state.settings.deepSeekStreamingOutput;
                elements.deepSeekStreamingSpeedInput.value = state.settings.deepSeekStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.deepSeekDummyUserInput.value = state.settings.deepSeekDummyUser || '';
                elements.deepSeekEnableDummyUserCheckbox.checked = state.settings.deepSeekEnableDummyUser;
                elements.deepSeekDummyModelInput.value = state.settings.deepSeekDummyModel || '';
                elements.deepSeekEnableDummyModelCheckbox.checked = state.settings.deepSeekEnableDummyModel;
                elements.deepSeekConcatDummyModelCheckbox.checked = state.settings.deepSeekConcatDummyModel;

                elements.claudeSystemPromptDefaultTextarea.value = state.settings.claudeSystemPrompt || '';
                elements.claudeEnableSystemPromptDefaultCheckbox.checked = state.settings.claudeEnableSystemPromptDefault;
                setupParamUI('claude-max-tokens', 'claudeMaxTokensSliderMax');
                setupParamUI('claude-temperature');
                setupParamUI('claude-top-k', 'claudeTopKSliderMax');
                setupParamUI('claude-top-p');
                setupParamUI('claude-thinking-budget', 'claudeThinkingBudgetSliderMax');
                elements.claudeStreamingOutputCheckbox.checked = state.settings.claudeStreamingOutput;
                elements.claudeStreamingSpeedInput.value = state.settings.claudeStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.claudeDummyUserInput.value = state.settings.claudeDummyUser || '';
                elements.claudeEnableDummyUserCheckbox.checked = state.settings.claudeEnableDummyUser;
                elements.claudeDummyModelInput.value = state.settings.claudeDummyModel || '';
                elements.claudeEnableDummyModelCheckbox.checked = state.settings.claudeEnableDummyModel;
                elements.claudeConcatDummyModelCheckbox.checked = state.settings.claudeConcatDummyModel;
                elements.claudeIncludeThoughtsToggle.checked = state.settings.claudeIncludeThoughts;
                elements.claudeExpandThoughtsByDefaultToggle.checked = state.settings.claudeExpandThoughtsByDefault;
                elements.claudeThinkingBudgetInput.value = state.settings.claudeThinkingBudget === null ? '' : state.settings.claudeThinkingBudget;

                elements.openaiSystemPromptDefaultTextarea.value = state.settings.openaiSystemPrompt || '';
                elements.openaiEnableSystemPromptDefaultCheckbox.checked = state.settings.openaiEnableSystemPromptDefault;
                setupParamUI('openai-max-tokens', 'openaiMaxTokensSliderMax');
                setupParamUI('openai-temperature');
                setupParamUI('openai-top-p');
                setupParamUI('openai-presence-penalty');
                setupParamUI('openai-frequency-penalty');
                elements.openaiStreamingOutputCheckbox.checked = state.settings.openaiStreamingOutput;
                elements.openaiStreamingSpeedInput.value = state.settings.openaiStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.openaiDummyUserInput.value = state.settings.openaiDummyUser || '';
                elements.openaiEnableDummyUserCheckbox.checked = state.settings.openaiEnableDummyUser;
                elements.openaiDummyModelInput.value = state.settings.openaiDummyModel || '';
                elements.openaiEnableDummyModelCheckbox.checked = state.settings.openaiEnableDummyModel;
                elements.openaiConcatDummyModelCheckbox.checked = state.settings.openaiConcatDummyModel;

                elements.xaiSystemPromptDefaultTextarea.value = state.settings.xaiSystemPrompt || '';
                elements.xaiEnableSystemPromptDefaultCheckbox.checked = state.settings.xaiEnableSystemPromptDefault;
                setupParamUI('xai-max-tokens', 'xaiMaxTokensSliderMax');
                setupParamUI('xai-temperature');
                setupParamUI('xai-top-p');
                setupParamUI('xai-presence-penalty');
                setupParamUI('xai-frequency-penalty');
                elements.xaiStreamingOutputCheckbox.checked = state.settings.xaiStreamingOutput;
                elements.xaiStreamingSpeedInput.value = state.settings.xaiStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.xaiDummyUserInput.value = state.settings.xaiDummyUser || '';
                elements.xaiEnableDummyUserCheckbox.checked = state.settings.xaiEnableDummyUser;
                elements.xaiDummyModelInput.value = state.settings.xaiDummyModel || '';
                elements.xaiEnableDummyModelCheckbox.checked = state.settings.xaiEnableDummyModel;
                elements.xaiConcatDummyModelCheckbox.checked = state.settings.xaiConcatDummyModel;
                elements.xaiVisionEnableCheckbox.checked = state.settings.xaiVisionEnable;
                elements.xaiIncludeThoughtsToggle.checked = state.settings.xaiIncludeThoughts;
                elements.xaiExpandThoughtsByDefaultToggle.checked = state.settings.xaiExpandThoughtsByDefault;
                elements.xaiReasoningEffortSelect.value = state.settings.xaiReasoningEffort;

                elements.llmAggregatorSystemPromptDefaultTextarea.value = state.settings.llmAggregatorSystemPrompt || '';
                elements.llmAggregatorEnableSystemPromptDefaultCheckbox.checked = state.settings.llmAggregatorEnableSystemPromptDefault;
                setupParamUI('llmaggregator-max-tokens', 'llmaggregatorMaxTokensSliderMax');
                setupParamUI('llmaggregator-temperature');
                setupParamUI('llmaggregator-top-p');
                setupParamUI('llmaggregator-top-k', 'llmaggregatorTopKSliderMax');
                setupParamUI('llmaggregator-presence-penalty');
                setupParamUI('llmaggregator-frequency-penalty');
                elements.llmAggregatorIncludeThoughtsToggle.checked = state.settings.llmAggregatorIncludeThoughts;
                elements.llmAggregatorExpandThoughtsByDefaultToggle.checked = state.settings.llmAggregatorExpandThoughtsByDefault;
                elements.llmAggregatorStreamingOutputCheckbox.checked = state.settings.llmAggregatorStreamingOutput;
                elements.llmAggregatorStreamingSpeedInput.value = state.settings.llmAggregatorStreamingSpeed ?? DEFAULT_STREAMING_SPEED;
                elements.llmAggregatorDummyUserInput.value = state.settings.llmAggregatorDummyUser || '';
                elements.llmAggregatorEnableDummyUserCheckbox.checked = state.settings.llmAggregatorEnableDummyUser;
                elements.llmAggregatorDummyModelInput.value = state.settings.llmAggregatorDummyModel || '';
                elements.llmAggregatorEnableDummyModelCheckbox.checked = state.settings.llmAggregatorEnableDummyModel;
                elements.llmAggregatorConcatDummyModelCheckbox.checked = state.settings.llmAggregatorConcatDummyModel;

                elements.enterToSendCheckbox.checked = state.settings.enterToSend;
elements.headerTapScrollToTopToggle.checked = state.settings.headerTapScrollToTop;
elements.footerTapScrollToBottomToggle.checked = state.settings.footerTapScrollToBottom;
                elements.showResponseTimerToggle.checked = state.settings.showResponseTimer;
                elements.autoScrollOnNewMessageCheckbox.checked = state.settings.autoScrollOnNewMessage;
                elements.autoScrollOnThoughtCheckbox.checked = state.settings.autoScrollOnThought;
                elements.historySortOrderSelect.value = state.settings.historySortOrder || 'updatedAt';
                if (elements.themeSelect) elements.themeSelect.value = state.settings.theme || 'light';
                elements.enableSessionLinkingCheckbox.checked = state.settings.enableSessionLinking;
                elements.fontFamilyInput.value = state.settings.fontFamily || '';
                elements.messageBodyFontSizeInput.value = state.settings.messageBodyFontSize ?? '';
                elements.codeBlockFontSizeInput.value = state.settings.codeBlockFontSize ?? '';
                elements.thoughtSummaryFontSizeInput.value = state.settings.thoughtSummaryFontSize ?? '';

                document.getElementById('message-body-font-size-input-slider').value = state.settings.messageBodyFontSize ?? DEFAULT_MESSAGE_BODY_FONT_SIZE;
                document.getElementById('code-block-font-size-input-slider').value = state.settings.codeBlockFontSize ?? DEFAULT_CODE_BLOCK_FONT_SIZE;
                document.getElementById('thought-summary-font-size-slider').value = state.settings.thoughtSummaryFontSize ?? DEFAULT_THOUGHT_SUMMARY_FONT_SIZE;
                document.getElementById('chat-ui-scale-input').value = state.settings.chatUiScale || 1.0;
                document.getElementById('chat-ui-scale-input-slider').value = state.settings.chatUiScale || 1.0;
                document.getElementById('settings-ui-scale-input').value = state.settings.settingsUiScale || 1.0;
                document.getElementById('settings-ui-scale-input-slider').value = state.settings.settingsUiScale || 1.0;
                document.getElementById('history-ui-scale-input').value = state.settings.historyUiScale || 1.0;
                document.getElementById('history-ui-scale-input-slider').value = state.settings.historyUiScale || 1.0;
                elements.swipeNavigationToggle.checked = state.settings.enableSwipeNavigation;
                elements.preventZoomToggle.checked = state.settings.preventZoom;
                elements.minimizeHeaderFooterToggle.checked = state.settings.minimizeHeaderFooter;
                if (state.settings.enableCryscrollerScroll === undefined) {
                    state.settings.enableCryscrollerScroll = false;
                }
                elements.enableCryscrollerScrollToggle.checked = state.settings.enableCryscrollerScroll;
                document.body.classList.toggle('cryscroller-scroll-enabled', state.settings.enableCryscrollerScroll);

                elements.enableSettingsCryscrollerScrollToggle.checked = state.settings.enableSettingsCryscrollerScroll;
                document.body.classList.toggle('settings-cryscroller-scroll-enabled', state.settings.enableSettingsCryscrollerScroll);
                if (state.settings.enableSettingsCryscrollerScroll) { window.dispatchEvent(new Event('resize')); }

                elements.enableHistoryCryscrollerScrollToggle.checked = state.settings.enableHistoryCryscrollerScroll;
                document.body.classList.toggle('history-cryscroller-scroll-enabled', state.settings.enableHistoryCryscrollerScroll);
                if (state.settings.enableHistoryCryscrollerScroll) { window.dispatchEvent(new Event('resize')); }

                elements.enableImmersiveScrollingToggle.checked = state.settings.enableImmersiveScrolling;
                appLogic.updateImmersiveLayout();
                elements.enableDynamicScrollMarkerColorToggle.checked = state.settings.enableDynamicScrollMarkerColor;

                const currentScrollWidth = state.settings.cryscrollerScrollWidth || DEFAULT_CRYSCROLLER_SCROLL_WIDTH;
                elements.cryscrollerScrollWidthInput.value = currentScrollWidth;
                document.getElementById('cryscroller-scroll-width-input-slider').value = currentScrollWidth;
                document.documentElement.style.setProperty('--cryscroller-scroll-width', `${currentScrollWidth}px`);
                elements.extendAiBubbleWidthToggle.checked = state.settings.extendAiBubbleWidth;
                elements.extendUserBubbleWidthToggle.checked = state.settings.extendUserBubbleWidth;
                                elements.reduceMessageSpacingToggle.checked = state.settings.reduceMessageSpacing;
                elements.compactSettingsSpacingToggle.checked = state.settings.compactSettingsSpacing;
                if (state.settings.slimSettingsHeaders === undefined) state.settings.slimSettingsHeaders = true;
                                elements.slimSettingsHeadersToggle.checked = state.settings.slimSettingsHeaders;
                document.body.classList.toggle('slim-settings-headers', state.settings.slimSettingsHeaders);
                elements.flatSettingsDesignToggle.checked = state.settings.flatSettingsDesign;
                document.body.classList.toggle('flat-settings-mode', state.settings.flatSettingsDesign);
                elements.showSessionLinkingSettingsToggle.checked = state.settings.showSessionLinkingSettings;

                if (elements.sessionLinkingSettingsGroup) {

                    elements.sessionLinkingSettingsGroup.classList.toggle('hidden', !state.settings.showSessionLinkingSettings);
                }
                elements.showTwinEngineSettingsToggle.checked = state.settings.showTwinEngineSettings;
                const twinEngineSettingsGroup = document.getElementById('settings-group-twin-engine');
                if (twinEngineSettingsGroup) {
                    twinEngineSettingsGroup.classList.toggle('hidden', !state.settings.showTwinEngineSettings);
                }
                elements.showChatTitleToggle.checked = state.settings.showChatTitle;
                elements.showNewChatButtonToggle.checked = state.settings.showNewChatButton;
                elements.showDeleteSessionButtonToggle.checked = state.settings.showDeleteSessionButton;
                elements.showCopySessionButtonToggle.checked = state.settings.showCopySessionButton;
                elements.showScrollToTopButtonToggle.checked = state.settings.showScrollToTopButton;
                elements.showScrollToBottomButtonToggle.checked = state.settings.showScrollToBottomButton;
                elements.showToggleAllContentButtonToggle.checked = state.settings.showToggleAllContentButton;
                elements.showBulkHistoryActionsToggle.checked = state.settings.showBulkHistoryActions;
                elements.showPasteButtonInFooterToggle.checked = state.settings.showPasteButtonInFooter;
                elements.showPasteButtonInEditToggle.checked = state.settings.showPasteButtonInEdit;
                elements.showDiceButtonToggle.checked = state.settings.showDiceButton;
                document.getElementById('dice-value-settings').classList.toggle('hidden', !state.settings.showDiceButton);
                elements.diceMinValueInput.value = state.settings.diceMinValue ?? '';
                elements.diceMaxValueInput.value = state.settings.diceMaxValue ?? '';
               elements.messageBubbleOpacityInput.value = state.settings.messageBubbleOpacity ?? DEFAULT_MESSAGE_BUBBLE_OPACITY;
                elements.chatOverlayOpacityInput.value = state.settings.chatOverlayOpacity ?? DEFAULT_CHAT_OVERLAY_OPACITY;
                elements.headerFooterOpacityInput.value = state.settings.headerFooterOpacity ?? DEFAULT_HEADER_FOOTER_OPACITY;
                elements.messageActionsBackgroundOpacityInput.value = state.settings.messageActionsBackgroundOpacity ?? DEFAULT_MESSAGE_ACTIONS_BACKGROUND_OPACITY;
                elements.toggleButtonTopOpacityInput.value = state.settings.toggleButtonTopOpacity ?? DEFAULT_TOGGLE_BUTTON_TOP_OPACITY;
                elements.thoughtSummaryOpacityInput.value = state.settings.thoughtSummaryOpacity ?? DEFAULT_THOUGHT_SUMMARY_OPACITY;
                document.getElementById('cryscroller-scroll-opacity').value = state.settings.cryscrollerScrollOpacity ?? DEFAULT_CRYSCROLLER_SCROLL_OPACITY;
                document.getElementById('cryscroller-scroll-active-opacity').value = state.settings.cryscrollerScrollActiveOpacity ?? DEFAULT_CRYSCROLLER_SCROLL_ACTIVE_OPACITY;
    elements.enableElevationToggle.checked = state.settings.enableElevation;
    elements.enableElevationHoverToggle.checked = state.settings.enableElevationHover;
    elements.elevationHoverOption.classList.toggle('hidden', !state.settings.enableElevation);
    elements.autoCloseOtherSettingsToggle.checked = state.settings.autoCloseOtherSettings;
    this.applyElevationSetting();

                document.getElementById('message-bubble-opacity-slider').value = elements.messageBubbleOpacityInput.value;
                document.getElementById('chat-overlay-opacity-slider').value = elements.chatOverlayOpacityInput.value;
                document.getElementById('header-footer-opacity-slider').value = elements.headerFooterOpacityInput.value;
                document.getElementById('message-actions-background-opacity-slider').value = elements.messageActionsBackgroundOpacityInput.value;
                document.getElementById('toggle-button-top-opacity-slider').value = elements.toggleButtonTopOpacityInput.value;
                document.getElementById('thought-summary-opacity-slider').value = elements.thoughtSummaryOpacityInput.value;
                elements.showApiProviderToggleHeaderCheckbox.checked = state.settings.showApiProviderToggleHeader;
                elements.showApiProviderToggleFooterCheckbox.checked = state.settings.showApiProviderToggleFooter;
                elements.showHeaderCycleApiKeyBtnToggle.checked = state.settings.showHeaderCycleApiKeyBtn;
                elements.showFooterCycleApiKeyBtnToggle.checked = state.settings.showFooterCycleApiKeyBtn;
                elements.apiProviderCycleGeminiCheckbox.checked = state.settings.apiProviderCycle.gemini;
                elements.apiProviderCycleDeepSeekCheckbox.checked = state.settings.apiProviderCycle.deepseek;
                elements.apiProviderCycleClaudeCheckbox.checked = state.settings.apiProviderCycle.claude;
                elements.apiProviderCycleOpenAICheckbox.checked = state.settings.apiProviderCycle.openai;
                elements.apiProviderCycleXaiCheckbox.checked = state.settings.apiProviderCycle.xai;
                elements.apiProviderCycleLlmAggregatorCheckbox.checked = state.settings.apiProviderCycle.llmaggregator;
                elements.apiProviderCycleDummyCheckbox.checked = state.settings.apiProviderCycle.dummy;
                elements.dummyDummyModelInput.value = state.settings.dummyDummyModel || '';
                elements.dummyEnableDummyModelCheckbox.checked = state.settings.dummyEnableDummyModel;
                elements.dummyTwinEngineDebugModeCheckbox.checked = state.settings.dummyTwinEngineDebugMode;

                elements.enableProofreadingCheckbox.checked = state.settings.enableProofreading;
                elements.proofreadingOptionsDiv.classList.toggle('hidden', !elements.enableProofreadingCheckbox.checked);
                proofreadingApiConfigUtils.renderList();

                elements.showMemoButtonToggle.checked = state.settings.showMemoButton;
                elements.showTwinEngineSummaryButtonToggle.checked = state.settings.showTwinEngineSummaryButton;
                elements.memoHeightInput.value = state.settings.memoHeight || '';
                elements.showClipboardStackButtonToggle.checked = state.settings.showClipboardStackButton;
                elements.showUserIconToggle.checked = state.settings.showUserIcon;
                elements.showUserNameToggle.checked = state.settings.showUserName;
                elements.userNameInput.value = state.settings.userName || '';
                elements.showAiIconToggle.checked = state.settings.showAiIcon;
                elements.showAiNameToggle.checked = state.settings.showAiName;
                elements.aiNameInput.value = state.settings.aiName || '';
                elements.iconNameFontSizeInput.value = state.settings.iconNameFontSize ?? DEFAULT_ICON_NAME_FONT_SIZE;
                elements.iconNameOffsetYInput.value = state.settings.iconNameOffsetY !== null ? (state.settings.iconNameOffsetY * -1) : (DEFAULT_ICON_NAME_OFFSET_Y * -1);
                elements.messageIconSizeInput.value = state.settings.messageIconSize ?? DEFAULT_MESSAGE_ICON_SIZE;
                elements.messageIconOffsetYInput.value = state.settings.messageIconOffsetY !== null ? (state.settings.messageIconOffsetY * -1) : (DEFAULT_MESSAGE_ICON_OFFSET_Y * -1);

                elements.userNameBubbleToggle.checked = state.settings.showUserNameBubble;
                elements.userNameBubbleUseThemeColorToggle.checked = state.settings.userNameBubbleUseThemeColor;
                elements.userNameBubbleColorInput.value = state.settings.userNameBubbleColor || DEFAULT_USER_NAME_BUBBLE_COLOR;
                elements.userNameBubbleOpacityInput.value = state.settings.userNameBubbleOpacity ?? DEFAULT_USER_NAME_BUBBLE_OPACITY;
                elements.aiNameBubbleToggle.checked = state.settings.showAiNameBubble;
                elements.aiNameBubbleUseThemeColorToggle.checked = state.settings.aiNameBubbleUseThemeColor;
                elements.aiNameBubbleColorInput.value = state.settings.aiNameBubbleColor || DEFAULT_AI_NAME_BUBBLE_COLOR;
                elements.aiNameBubbleOpacityInput.value = state.settings.aiNameBubbleOpacity ?? DEFAULT_AI_NAME_BUBBLE_OPACITY;

                elements.disableRetryConfirmationToggle.checked = state.settings.disableRetryConfirmation;
                elements.disableLoadChatConfirmationWhileSendingToggle.checked = state.settings.disableLoadChatConfirmationWhileSending;
                elements.disableDeleteMessageConfirmationToggle.checked = state.settings.disableDeleteMessageConfirmation;
                elements.disableAttachmentConfirmationToggle.checked = state.settings.disableAttachmentConfirmation;
                elements.addPrefixOnImportToggle.checked = state.settings.addPrefixOnImport;
                elements.showMultiApiKeysToggle.checked = state.settings.showMultiApiKeys;
                elements.showProofreadingSettingsToggle.checked = state.settings.showProofreadingSettings;
                elements.proofreadingSettingsGroup.classList.toggle('hidden', !state.settings.showProofreadingSettings);
                elements.disableSaveSettingsConfirmationToggle.checked = state.settings.disableSaveSettingsConfirmation;
                elements.autoSaveSettingsToggle.checked = state.settings.autoSaveSettings;
                elements.unmaskApiKeysToggle.checked = state.settings.unmaskApiKeys || false;
                this.updateApiKeyInputType();
                elements.disableLlmUrlWhitelistToggle.checked = state.settings.disableLlmUrlWhitelist || false;
                elements.showTopCollapseButtonToggle.checked = state.settings.showTopCollapseButton;
                elements.showBottomCollapseButtonToggle.checked = state.settings.showBottomCollapseButton;
                elements.persistMessageCollapseStateCheckbox.checked = state.settings.persistMessageCollapseState;

                elements.toggleButtonTopWidthInput.value = state.settings.toggleButtonTopWidth ?? DEFAULT_TOGGLE_BUTTON_TOP_WIDTH;
                elements.toggleButtonTopHeightInput.value = state.settings.toggleButtonTopHeight ?? DEFAULT_TOGGLE_BUTTON_TOP_HEIGHT;
                elements.toggleButtonTopFontSizeInput.value = state.settings.toggleButtonTopFontSize ?? DEFAULT_TOGGLE_BUTTON_TOP_FONT_SIZE;
                elements.toggleButtonTopOpacityInput.value = state.settings.toggleButtonTopOpacity ?? DEFAULT_TOGGLE_BUTTON_TOP_OPACITY;
                elements.toggleButtonTopTextCollapseInput.value = state.settings.toggleButtonTopTextCollapse || DEFAULT_TOGGLE_BUTTON_TOP_TEXT_COLLAPSE;
                elements.toggleButtonTopTextExpandInput.value = state.settings.toggleButtonTopTextExpand || DEFAULT_TOGGLE_BUTTON_TOP_TEXT_EXPAND;
                elements.toggleButtonBottomFontSizeInput.value = state.settings.toggleButtonBottomFontSize ?? DEFAULT_TOGGLE_BUTTON_BOTTOM_FONT_SIZE;
                elements.toggleButtonBottomTextCollapseInput.value = state.settings.toggleButtonBottomTextCollapse || DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_COLLAPSE;
                elements.toggleButtonBottomTextExpandInput.value = state.settings.toggleButtonBottomTextExpand || DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_EXPAND;
                document.getElementById('cryscroller-scroll-opacity').value = state.settings.cryscrollerScrollOpacity ?? DEFAULT_CRYSCROLLER_SCROLL_OPACITY;

                document.documentElement.style.setProperty('--message-body-font-size', `${state.settings.messageBodyFontSize || DEFAULT_MESSAGE_BODY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--code-block-font-size', `${state.settings.codeBlockFontSize || DEFAULT_CODE_BLOCK_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--thought-summary-font-size', `${state.settings.thoughtSummaryFontSize || DEFAULT_THOUGHT_SUMMARY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-width', `${state.settings.toggleButtonTopWidth || DEFAULT_TOGGLE_BUTTON_TOP_WIDTH}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-height', `${state.settings.toggleButtonTopHeight || DEFAULT_TOGGLE_BUTTON_TOP_HEIGHT}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-font-size', `${state.settings.toggleButtonTopFontSize || DEFAULT_TOGGLE_BUTTON_TOP_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--message-toggle-button-top-opacity',
                    state.settings.enableToggleButtonTopOpacity ? state.settings.toggleButtonTopOpacity : 1
                );
                document.documentElement.style.setProperty('--message-toggle-button-bottom-font-size', `${state.settings.toggleButtonBottomFontSize || DEFAULT_TOGGLE_BUTTON_BOTTOM_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--thought-summary-opacity', state.settings.thoughtSummaryOpacity || DEFAULT_THOUGHT_SUMMARY_OPACITY);

                this.applySettingsUIDetailsOpenStates();
                if (state.settings.autoCloseOtherSettings) {
                    const otherDetails = document.getElementById('settings-group-other-details');
                    if (otherDetails) otherDetails.open = false;
                }
                this.updateChatScreenElementVisibility();
                this.updateHistoryHeaderButtonVisibility();
                this.updateUserModelOptions();
                this.updateDeepSeekUserModelOptions();
                this.updateClaudeUserModelOptions();
                this.updateOpenAIUserModelOptions();
                this.updateXaiUserModelOptions();
                this.updateLlmAggregatorUserModelOptions();
                this.updateBackgroundSettingsUI();
                this.updateIconSettingsUI();
                this.applyTheme();
                this.applyFontFamily();
                this.applySidePanelSettingsToUI();
                this.applyMinimizeUI();
                this.applyAiBubbleWidthSetting();
                                    uiUtils.updateSessionLinkingUI();
                    uiUtils.updateApiProviderSelectOptions();
                    uiUtils.updateApiKeyCycleButtons();
                    uiUtils.toggleMultiApiKeysVisibility(state.settings.showMultiApiKeys);
                    elements.settingsScreen.classList.toggle('auto-save-mode', state.settings.autoSaveSettings);



                const setupModelListener = (textareaElement, settingKey, updateFunction) => {
                    textareaElement.addEventListener('input', () => {
                        state.settings[settingKey] = textareaElement.value;
                        updateFunction();
                    });
                };


                setupModelListener(elements.geminiAdditionalModelsTextarea, 'additionalModels', uiUtils.updateUserModelOptions);
                setupModelListener(elements.deepSeekAdditionalModelsTextarea, 'deepSeekAdditionalModels', uiUtils.updateDeepSeekUserModelOptions);
                setupModelListener(elements.claudeAdditionalModelsTextarea, 'claudeAdditionalModels', uiUtils.updateClaudeUserModelOptions);
                setupModelListener(elements.openaiAdditionalModelsTextarea, 'openaiAdditionalModels', uiUtils.updateOpenAIUserModelOptions);
                setupModelListener(elements.xaiAdditionalModelsTextarea, 'xaiAdditionalModels', uiUtils.updateXaiUserModelOptions);
                setupModelListener(elements.llmAggregatorAdditionalModelsTextarea, 'llmAggregatorAdditionalModels', uiUtils.updateLlmAggregatorUserModelOptions);

                this.updateMemoStackHeightSettingsVisibility();
                this.updateTwinEngineModeButton();
                this.updateTwinEngineApiKeyCycleButton();
                const deleteConfirmCheckboxes = document.querySelectorAll('.js-disable-delete-api-key-confirmation-toggle');
                deleteConfirmCheckboxes.forEach(checkbox => {
                    checkbox.checked = state.settings.disableDeleteApiKeyConfirmation;
                });

                const removeDuplicateCheckboxes = document.querySelectorAll('.js-remove-duplicate-api-keys-toggle');
                removeDuplicateCheckboxes.forEach(checkbox => {
                    checkbox.checked = state.settings.removeDuplicateApiKeys;
                });
            },
            applyMinimizeUI() {
                elements.appContainer.classList.toggle('minimized-ui', state.settings.minimizeHeaderFooter);
            },
            applyMessageSpacingSetting() {
                elements.appContainer.classList.toggle('reduced-message-spacing', state.settings.reduceMessageSpacing);
            },
            applyCompactSettingsSpacing() {
                document.body.classList.toggle('compact-settings-mode', state.settings.compactSettingsSpacing);
            },
            applyAiBubbleWidthSetting() {
                document.body.classList.toggle('ai-bubble-extended', state.settings.extendAiBubbleWidth);
            },
            applyUserBubbleWidthSetting() {
                document.body.classList.toggle('user-bubble-extended', state.settings.extendUserBubbleWidth);
            },
            applySettingsUIDetailsOpenStates() {
                const detailsElements = document.querySelectorAll('#settings-screen details[id]');
                detailsElements.forEach(detailsEl => {
                    if (state.settings.settingsUIDetailsOpenStates[detailsEl.id] === true) {
                        detailsEl.open = true;
                    } else if (state.settings.settingsUIDetailsOpenStates[detailsEl.id] === false) {
                        detailsEl.open = false;
                    }
                });
            },
            toggleApiSettingsVisibility(provider) {
                const showGemini = provider === 'gemini';
                const showDeepSeek = provider === 'deepseek';
                const showClaude = provider === 'claude';
                const showOpenAI = provider === 'openai';
                const showXai = provider === 'xai';
                const showLlmAggregator = provider === 'llmaggregator';
                const showDummy = provider === 'dummy';

                elements.geminiSettingsGroup.classList.toggle('hidden', !showGemini);
                elements.geminiParamsGroup.classList.toggle('hidden', !showGemini);
                elements.geminiAdvancedGroup.classList.toggle('hidden', !showGemini);
                elements.geminiGroundingParam.classList.toggle('hidden', !showGemini);

                elements.deepSeekSettingsGroup.classList.toggle('hidden', !showDeepSeek);
                elements.deepseekParamsGroup.classList.toggle('hidden', !showDeepSeek);
                elements.deepseekAdvancedGroup.classList.toggle('hidden', !showDeepSeek);

                elements.claudeSettingsGroup.classList.toggle('hidden', !showClaude);
                elements.claudeParamsGroup.classList.toggle('hidden', !showClaude);
                elements.claudeAdvancedGroup.classList.toggle('hidden', !showClaude);

                elements.openaiSettingsGroup.classList.toggle('hidden', !showOpenAI);
                elements.openaiParamsGroup.classList.toggle('hidden', !showOpenAI);
                elements.openaiAdvancedGroup.classList.toggle('hidden', !showOpenAI);

                elements.xaiSettingsGroup.classList.toggle('hidden', !showXai);
                elements.xaiParamsGroup.classList.toggle('hidden', !showXai);
                elements.xaiAdvancedGroup.classList.toggle('hidden', !showXai);

                elements.llmAggregatorSettingsGroup.classList.toggle('hidden', !showLlmAggregator);
                elements.llmAggregatorParamsGroup.classList.toggle('hidden', !showLlmAggregator);
                elements.llmAggregatorAdvancedGroup.classList.toggle('hidden', !showLlmAggregator);

                elements.dummySettingsGroup.classList.toggle('hidden', !showDummy);

                const paramGroups = [
                    elements.geminiParamsGroup, elements.deepseekParamsGroup, elements.claudeParamsGroup,
                    elements.openaiParamsGroup, elements.xaiParamsGroup, elements.llmAggregatorParamsGroup,
                    elements.geminiAdvancedGroup, elements.deepseekAdvancedGroup, elements.claudeAdvancedGroup,
                    elements.openaiAdvancedGroup, elements.xaiAdvancedGroup, elements.llmAggregatorAdvancedGroup,
                    elements.geminiGroundingParam
                ];

                if (showDummy) {
                    paramGroups.forEach(group => group.classList.add('hidden'));
                }
            },
            updateChatScreenElementVisibility() {
                const header = elements.chatScreen.querySelector('.app-header');
                const allButtons = Array.from(header.querySelectorAll('button'));
                allButtons.forEach(btn => btn.classList.remove('layout-hidden'));

                const updateVisibility = () => {
                    const toggleableButtons = [
                        { id: '#show-chat-title-toggle', element: elements.chatTitle },
                        { id: '#show-new-chat-button-toggle', element: elements.newChatBtn },
                        { id: '#show-delete-session-button-toggle', element: elements.deleteSessionBtn },
                        { id: '#show-copy-session-button-toggle', element: elements.copySessionBtn },
                        { id: '#show-api-provider-toggle-header', element: elements.headerApiProviderToggleBtn },
                       { id: '#show-header-cycle-api-key-btn-toggle', element: elements.headerCycleApiKeyBtn },
                        { id: '#show-scroll-to-top-button-toggle', element: elements.scrollToTopBtn },
                        { id: '#show-scroll-to-bottom-button-toggle', element: elements.scrollToBottomBtn },
                        { id: '#show-toggle-all-content-button-toggle', element: elements.toggleAllContentBtn },
                        { id: '#show-memo-button-toggle', element: elements.toggleMemoBtn },
                        { id: '#show-clipboard-stack-button-toggle', element: elements.toggleClipboardStackBtn },
                    ];

                    toggleableButtons.forEach(item => {
                        const checkbox = document.querySelector(item.id);
                        if (item.element) {
                            item.element.classList.toggle('hidden', !checkbox.checked);
                        }
                    });

                    if (elements.pasteToInputBtn) {
                        elements.pasteToInputBtn.classList.toggle('hidden', !state.settings.showPasteButtonInFooter);
                    }
                    if (elements.rollDiceBtn) {
                        elements.rollDiceBtn.classList.toggle('hidden', !state.settings.showDiceButton);
                    }
                    if (elements.aiToAiChatBtn) {
                        const showAiToAiBtn = state.settings.enableSessionLinking &&
                            state.linkedSessionIds.length === 2 &&
                            state.currentChatId && state.linkedSessionIds.includes(state.currentChatId);
                        elements.aiToAiChatBtn.classList.toggle('hidden', !showAiToAiBtn);
                    }

                    if (elements.footerApiProviderToggleBtn) {
                        elements.footerApiProviderToggleBtn.classList.toggle('hidden', !state.settings.showApiProviderToggleFooter);
                    }
                    if (elements.footerCycleApiKeyBtn) {
                        elements.footerCycleApiKeyBtn.classList.toggle('hidden', !state.settings.showFooterCycleApiKeyBtn);
                    }
                    if (elements.footerTwinEngineModeToggleBtn) {
                        const showButton = state.settings.showTwinEngineSettings && state.settings.showFooterTwinEngineToggleButton;
                        elements.footerTwinEngineModeToggleBtn.classList.toggle('hidden', !showButton);
                    }
                    if (elements.footerResummarizeBtn) {
                        const showButton = state.settings.showTwinEngineSettings && state.settings.showFooterResummarizeButton;
                        elements.footerResummarizeBtn.classList.toggle('hidden', !showButton);
                    }

                    this.adjustHeaderLayout();
                    this.updateProviderToggleButtons();
                    if (elements.twinEngineSummaryBtn) {
                        const showButton = state.settings.showTwinEngineSettings && state.settings.showTwinEngineSummaryButton;
                        elements.twinEngineSummaryBtn.classList.toggle('hidden', !showButton);
                    }
                };

                requestAnimationFrame(updateVisibility);
            },
            adjustHeaderLayout() {
                const header = elements.chatScreen.querySelector('.app-header');
                if (!header) return;

                const allButtons = Array.from(header.querySelectorAll('button:not(#goto-history-btn):not(#goto-settings-btn)'));
                allButtons.forEach(btn => btn.classList.remove('layout-hidden'));

                requestAnimationFrame(() => {
                    let containerWidth = header.offsetWidth;
                    let settingsBtnRect = elements.gotoSettingsBtn.getBoundingClientRect();
                    let headerRect = header.getBoundingClientRect();
                    let isOverflowing = settingsBtnRect.right > headerRect.right - 5;

                    const buttonPriority = [
                        '#toggle-clipboard-stack-btn', '#toggle-memo-btn', '#twin-engine-summary-btn', '#scroll-to-top-btn',
                        '#scroll-to-bottom-btn', '#toggle-all-content-btn', '#header-api-provider-toggle-btn',
                        '#copy-session-btn', '#delete-session-btn', '#new-chat-btn'
                    ];

                    if (isOverflowing) {
                        for (const selector of buttonPriority) {
                            const btn = header.querySelector(selector);
                            if (btn && !btn.classList.contains('hidden') && !btn.classList.contains('layout-hidden')) {
                                btn.classList.add('layout-hidden');
                                settingsBtnRect = elements.gotoSettingsBtn.getBoundingClientRect();
                                isOverflowing = settingsBtnRect.right > headerRect.right - 5;
                                if (!isOverflowing) break;
                            }
                        }
                    }
                });
            },
            updateProviderToggleButtons() {
                const providerMap = {
                    gemini: { text: 'GE', title: 'Gemini', className: 'gemini' },
                    deepseek: { text: 'DS', title: 'DeepSeek', className: 'deepseek' },
                    claude: { text: 'AN', title: 'Anthropic', className: 'claude' },
                    openai: { text: 'OP', title: 'OpenAI', className: 'openai' },
                    xai: { text: 'XA', title: 'xAI', className: 'xai' },
                    llmaggregator: { text: 'LA', title: 'LLM Aggregator', className: 'llmaggregator' },
                    dummy: { text: 'DU', title: 'Dummy AI', className: 'dummy' },
                };
                const currentProviderInfo = providerMap[state.settings.apiProvider] || { text: '??', title: 'Unknown', className: '' };

                [elements.headerApiProviderToggleBtn, elements.footerApiProviderToggleBtn].forEach(button => {
                    if (button) {
                        button.textContent = currentProviderInfo.text;
                        button.title = `API: ${currentProviderInfo.title}`;
                        button.classList.remove('gemini', 'deepseek', 'claude', 'openai', 'xai', 'llmaggregator', 'dummy');
                        if (currentProviderInfo.className) {
                            button.classList.add(currentProviderInfo.className);
                        }
                    }
                });
            },
            updateTwinEngineModeButton() {
                const isEnabled = state.settings.showTwinEngineSettings;
                const isFullAuto = isEnabled && state.settings.twinEngineEnableFullAuto;

                let headerText, headerTitle, footerText, footerTitle;

                if (isFullAuto) {
                    headerText = 'モード: 自動 🛞';
                    footerText = '🛞';
                    headerTitle = footerTitle = 'クリックして手動モードに切り替え';
                } else {
                    headerText = 'モード: 手動 ✋️';
                    footerText = '✋️';
                    headerTitle = footerTitle = isEnabled ? 'クリックして自動モードに切り替え' : 'Twin-engineが無効です';
                }

                if (elements.twinEngineModeToggleBtn) {
                    elements.twinEngineModeToggleBtn.textContent = headerText;
                    elements.twinEngineModeToggleBtn.title = headerTitle;
                    elements.twinEngineModeToggleBtn.disabled = !isEnabled;
                }

                if (elements.footerTwinEngineModeToggleBtn) {
                    elements.footerTwinEngineModeToggleBtn.textContent = footerText;
                    elements.footerTwinEngineModeToggleBtn.title = footerTitle;
                    elements.footerTwinEngineModeToggleBtn.disabled = !isEnabled;
                }
            },
            updateTwinEngineApiKeyCycleButton() {
                const button = elements.twinEngineApiKeyCycleBtn;
                if (!button) return;

                const configs = state.settings.twinEngineApiConfigs;
                const activeId = state.settings.twinEngineActiveConfigId;

                if (configs.length === 0) {
                    button.classList.add('hidden');
                    return;
                }

                button.classList.remove('hidden');
                button.disabled = configs.length <= 1;

                const activeConfig = configs.find(c => c.id === activeId) || configs[0];

                if (activeConfig) {
                    const initial = activeConfig.label?.trim().charAt(0) || '?';
                    button.textContent = `キー: ${initial}`;
                    button.title = `現在のキー: ${activeConfig.label || 'ラベル未設定'}`;
                } else {
                    button.textContent = 'キー: -';
                    button.title = 'APIキーが設定されていません';
                }
            },
            updateHistoryHeaderButtonVisibility() {
                const showBulkActions = state.settings.showBulkHistoryActions;
                if (elements.exportAllSessionsBtn) {
                    elements.exportAllSessionsBtn.classList.toggle('hidden', !showBulkActions);
                }
                if (elements.importAllSessionsBtn) {
                    elements.importAllSessionsBtn.classList.toggle('hidden', !showBulkActions);
                }
            },
            updateUserModelOptions() {
                const group = elements.geminiUserDefinedModelsGroup;
                group.innerHTML = '';
                const models = (state.settings.additionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    group.disabled = false;
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        group.appendChild(option);
                    });
                    if (models.includes(state.settings.modelName)) {
                        elements.geminiModelNameSelect.value = state.settings.modelName;
                    }
                } else {
                    group.disabled = true;
                }
            },
            updateDeepSeekUserModelOptions() {
                const select = elements.deepSeekModelNameSelect;
                const userDefinedOptgroup = select.querySelector('optgroup[label="ユーザー指定 (DeepSeek)"]');
                if (userDefinedOptgroup) {
                    userDefinedOptgroup.remove();
                }

                const baseModelsOptgroup = select.querySelector('optgroup[label="基本モデル (DeepSeek)"]') || select;
                baseModelsOptgroup.innerHTML = '';
                const defaultDeepSeekModels = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
                defaultDeepSeekModels.forEach(modelId => {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = modelId;
                    baseModelsOptgroup.appendChild(option);
                });

                const additionalModels = (state.settings.deepSeekAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (additionalModels.length > 0) {
                    let optgroup = document.createElement('optgroup');
                    optgroup.label = 'ユーザー指定 (DeepSeek)';
                    optgroup.id = 'deepseek-user-defined-models-group';
                    additionalModels.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        optgroup.appendChild(option);
                    });
                    select.appendChild(optgroup);
                }

                if (state.settings.deepSeekModelName && Array.from(select.options).some(opt => opt.value === state.settings.deepSeekModelName)) {
                    select.value = state.settings.deepSeekModelName;
                } else if (select.options.length > 0) {
                    select.value = defaultDeepSeekModels[0];
                    state.settings.deepSeekModelName = select.value;
                }
            },
            updateClaudeUserModelOptions() {
                const group = elements.claudeUserDefinedModelsGroup;
                group.innerHTML = '';
                const models = (state.settings.claudeAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    group.disabled = false;
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        group.appendChild(option);
                    });
                    if (models.includes(state.settings.claudeModelName)) {
                        elements.claudeModelNameSelect.value = state.settings.claudeModelName;
                    }
                } else {
                    group.disabled = true;
                }
            },
            updateOpenAIUserModelOptions() {
                const select = elements.openaiModelNameSelect;
                select.querySelectorAll('optgroup[label="ユーザー指定"]').forEach(el => el.remove());
                const models = (state.settings.openaiAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = 'ユーザー指定';
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        optgroup.appendChild(option);
                    });
                    select.appendChild(optgroup);
                }
                if (Array.from(select.options).some(opt => opt.value === state.settings.openaiModelName)) {
                    select.value = state.settings.openaiModelName;
                } else {
                    select.value = DEFAULT_OPENAI_MODEL;
                }
            },
            updateXaiUserModelOptions() {
                const group = elements.xaiUserDefinedModelsGroup;
                group.innerHTML = '';
                const models = (state.settings.xaiAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (models.length > 0) {
                    group.disabled = false;
                    models.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        group.appendChild(option);
                    });
                    if (models.includes(state.settings.xaiModelName)) {
                        elements.xaiModelNameSelect.value = state.settings.xaiModelName;
                    }
                } else {
                    group.disabled = true;
                }
            },
            updateLlmAggregatorUserModelOptions() {
                const select = elements.llmAggregatorModelNameSelect;
                const userDefinedOptgroup = select.querySelector('optgroup[label="ユーザー指定"]');
                select.innerHTML = '';

                const hfOptgroup = document.createElement('optgroup');
                hfOptgroup.label = 'Hugging Faceサンプル';
                const hfOption = document.createElement('option');
                hfOption.value = 'moonshotai/Kimi-K2-Thinking:novita';
                hfOption.textContent = 'moonshotai/Kimi-K2-Thinking:novita';
                hfOptgroup.appendChild(hfOption);
                select.appendChild(hfOptgroup);

                const openRouterOptgroup = document.createElement('optgroup');
                openRouterOptgroup.label = 'OpenRouterサンプル';
                const openRouterModels = [
                    'google/gemma-4-31b-it:free',
                    'google/gemini-3.1-pro-preview',
                    'google/gemini-2.5-pro',
                    'anthropic/claude-sonnet-5',
                    'z-ai/glm-5.2',
                    'deepseek/deepseek-v4-pro'
                ];
                openRouterModels.forEach(modelId => {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = modelId;
                    openRouterOptgroup.appendChild(option);
                });
                select.appendChild(openRouterOptgroup);

                const additionalModels = (state.settings.llmAggregatorAdditionalModels || '')
                    .split(',')
                    .map(m => m.trim())
                    .filter(m => m !== '');

                if (additionalModels.length > 0) {
                    let optgroup = document.createElement('optgroup');
                    optgroup.label = 'ユーザー指定';
                    optgroup.id = 'llmaggregator-user-defined-models-group';
                    additionalModels.forEach(modelId => {
                        const option = document.createElement('option');
                        option.value = modelId;
                        option.textContent = modelId;
                        optgroup.appendChild(option);
                    });
                    select.appendChild(optgroup);
                }

                if (state.settings.llmAggregatorModelName && Array.from(select.options).some(opt => opt.value === state.settings.llmAggregatorModelName)) {
                    select.value = state.settings.llmAggregatorModelName;
                } else if (select.options.length > 0) {
                    select.value = DEFAULT_LLMAGGREGATOR_MODEL;
                    state.settings.llmAggregatorModelName = select.value;
                }
            },
            applyFontFamily() {
                const customFont = state.settings.fontFamily?.trim();
                const fontFamilyToApply = customFont ? customFont : DEFAULT_FONT_FAMILY;
                document.documentElement.style.setProperty('--font-family', fontFamilyToApply);
                document.documentElement.style.setProperty('--message-body-font-size', `${state.settings.messageBodyFontSize || DEFAULT_MESSAGE_BODY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--code-block-font-size', `${state.settings.codeBlockFontSize || DEFAULT_CODE_BLOCK_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--thought-summary-font-size', `${state.settings.thoughtSummaryFontSize || DEFAULT_THOUGHT_SUMMARY_FONT_SIZE}px`);
                document.documentElement.style.setProperty('--chat-ui-scale', state.settings.chatUiScale || 1.0);
                document.documentElement.style.setProperty('--settings-ui-scale', state.settings.settingsUiScale || 1.0);
                document.documentElement.style.setProperty('--history-ui-scale', state.settings.historyUiScale || 1.0);
            },
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
        };
        function interruptibleSleep(ms, signal) {
            return new Promise((resolve, reject) => {
                if (signal.aborted) {
                    const error = new Error("Sleep aborted");
                    error.name = "AbortError";
                    return reject(error);
                }
                let timeoutId;
                const onAbort = () => {
                    clearTimeout(timeoutId);
                    const error = new Error("Sleep aborted");
                    error.name = "AbortError";
                    reject(error);
                };
                timeoutId = setTimeout(() => {
                    signal.removeEventListener('abort', onAbort);
                    resolve();
                }, ms);
                signal.addEventListener('abort', onAbort, { once: true });
            });
        }
