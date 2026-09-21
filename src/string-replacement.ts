// @ts-nocheck -- Enable after shared application types are defined.
// Bundled into the generated index.html from this TypeScript source.

const stringReplacementRuntime = {
    active: null,
};

const countLiteralMatches = (text, searchWord) => {
    if (!searchWord) return 0;
    let count = 0;
    let offset = 0;
    while (true) {
        const matchIndex = text.indexOf(searchWord, offset);
        if (matchIndex === -1) return count;
        count += 1;
        offset = matchIndex + searchWord.length;
    }
};

const replaceLiteralMatches = (text, searchWord, replacementWord) => {
    const count = countLiteralMatches(text, searchWord);
    if (count === 0) return { text, count: 0 };
    return { text: text.split(searchWord).join(replacementWord), count };
};

Object.assign(appLogic, {
    getStringReplacementTargetIndices(scope) {
        if (scope === 'editing') {
            return state.editingMessageIndex === null ? [] : [state.editingMessageIndex];
        }
        return state.currentMessages
            .map((message, index) => ({ message, index }))
            .filter(({ message }) => (
                typeof message?.content === 'string'
                && !(message.role === 'model' && message.isCascaded && !message.isSelected)
            ))
            .map(({ index }) => index);
    },

    getStringReplacementEditorSnapshot() {
        if (state.editingMessageIndex === null) return null;
        const index = state.editingMessageIndex;
        const messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
        const textarea = messageElement?.querySelector('.edit-textarea');
        if (!textarea) return null;
        return { index, value: textarea.value };
    },

    async openStringReplacementDialog() {
        if (state.isSending) {
            await uiUtils.showCustomAlert('送信中は文字列置換を実行できません。');
            return;
        }
        if (stringReplacementRuntime.active) return;

        const editorSnapshot = this.getStringReplacementEditorSnapshot();
        elements.stringReplacementScopeEditing.disabled = !editorSnapshot;
        if (!editorSnapshot && elements.stringReplacementScopeEditing.checked) {
            elements.stringReplacementScopeAll.checked = true;
        }
        elements.stringReplacementDialog.showModal();
        requestAnimationFrame(() => {
            elements.stringReplacementSearch.focus();
            elements.stringReplacementSearch.select();
        });
    },

    async confirmStringReplacementDialog() {
        const searchWord = elements.stringReplacementSearch.value;
        if (!searchWord) {
            elements.stringReplacementSearch.focus();
            return;
        }

        const scope = elements.stringReplacementScopeEditing.checked ? 'editing' : 'all';
        const editorSnapshot = this.getStringReplacementEditorSnapshot();
        if (scope === 'editing' && !editorSnapshot) {
            await uiUtils.showCustomAlert('編集中の応答がありません。');
            return;
        }

        const options = {
            searchWord,
            replacementWord: elements.stringReplacementReplacement.value,
            scope,
            editorSnapshot,
        };
        elements.stringReplacementDialog.close('ok');

        if (!options.replacementWord || elements.stringReplacementModeSequential.checked) {
            await this.startSequentialStringReplacement({
                ...options,
                searchOnly: !options.replacementWord,
            });
        } else {
            await this.replaceAllStrings(options);
        }
    },

    createStringReplacementWorkingContents(indices, editorSnapshot) {
        const contents = new Map();
        indices.forEach(index => {
            contents.set(index, String(state.currentMessages[index]?.content ?? ''));
        });
        if (editorSnapshot && contents.has(editorSnapshot.index)) {
            contents.set(editorSnapshot.index, editorSnapshot.value);
        }
        return contents;
    },

    commitStringReplacementContents(workingContents, changedIndices) {
        const timestamp = Date.now();
        changedIndices.forEach(index => {
            const message = state.currentMessages[index];
            if (!message) return;
            message.content = workingContents.get(index) ?? '';
            message.timestamp = timestamp;
            delete message.error;
        });
    },

    async restoreStringReplacementEditor(editorSnapshot, workingContents, changedIndices) {
        uiUtils.renderChatMessages(true);
        if (!editorSnapshot || !state.currentMessages[editorSnapshot.index]) return;

        const messageElement = elements.messageContainer.querySelector(`.message[data-index="${editorSnapshot.index}"]`);
        if (!messageElement) return;
        await this.startEditMessage(editorSnapshot.index, messageElement);
        const textarea = messageElement.querySelector('.edit-textarea');
        if (!textarea) return;
        textarea.value = changedIndices.has(editorSnapshot.index)
            ? workingContents.get(editorSnapshot.index)
            : editorSnapshot.value;
        uiUtils.adjustTextareaHeight(textarea, 400);
    },

    async saveStringReplacementResult(workingContents, changedIndices, editorSnapshot) {
        this.commitStringReplacementContents(workingContents, changedIndices);
        if (changedIndices.size > 0) {
            try {
                await dbUtils.saveChat();
            } catch (error) {
                await this.restoreStringReplacementEditor(editorSnapshot, workingContents, changedIndices);
                await uiUtils.showCustomAlert('文字列置換後のチャット保存に失敗しました。');
                return false;
            }
        }
        await this.restoreStringReplacementEditor(editorSnapshot, workingContents, changedIndices);
        return true;
    },

    async replaceAllStrings({ searchWord, replacementWord, scope, editorSnapshot }) {
        const indices = this.getStringReplacementTargetIndices(scope);
        const workingContents = this.createStringReplacementWorkingContents(indices, editorSnapshot);
        const changedIndices = new Set();
        let replacementCount = 0;

        indices.forEach(index => {
            const result = replaceLiteralMatches(workingContents.get(index) ?? '', searchWord, replacementWord);
            if (result.count === 0) return;
            workingContents.set(index, result.text);
            changedIndices.add(index);
            replacementCount += result.count;
        });

        const saved = await this.saveStringReplacementResult(workingContents, changedIndices, editorSnapshot);
        if (saved) await uiUtils.showCustomAlert(`${replacementCount}件置換しました`);
    },

    async startSequentialStringReplacement({ searchWord, replacementWord, scope, editorSnapshot, searchOnly = false }) {
        const indices = this.getStringReplacementTargetIndices(scope);
        const workingContents = this.createStringReplacementWorkingContents(indices, editorSnapshot);
        const searchMatches = [];
        indices.forEach(messageIndex => {
            const content = workingContents.get(messageIndex) ?? '';
            let matchStart = content.indexOf(searchWord);
            while (matchStart !== -1) {
                searchMatches.push({ messageIndex, matchStart });
                matchStart = content.indexOf(searchWord, matchStart + searchWord.length);
            }
        });
        const totalMatches = searchMatches.length;
        stringReplacementRuntime.active = {
            searchWord,
            replacementWord,
            searchOnly,
            searchMatches,
            searchMatchPosition: 0,
            indices,
            workingContents,
            changedIndices: new Set(),
            editorSnapshot,
            targetPosition: 0,
            searchOffset: 0,
            currentMatch: null,
            currentMatchOrdinal: 0,
            totalMatches,
            replacementCount: 0,
        };
        elements.stringReplacementPrompt.textContent = searchOnly ? '検索：' : '置換？';
        elements.stringReplacementYesBtn.classList.toggle('hidden', searchOnly);
        elements.stringReplacementNoBtn.classList.toggle('hidden', searchOnly);
        elements.stringReplacementAllBtn.classList.toggle('hidden', searchOnly);
        elements.stringReplacementPreviousBtn.classList.toggle('hidden', !searchOnly);
        elements.stringReplacementNextBtn.classList.toggle('hidden', !searchOnly);
        elements.stringReplacementProgress.textContent = `0/${totalMatches}`;
        elements.stringReplacementBar.classList.remove('hidden');
        await this.showNextSequentialStringReplacementMatch();
    },

    centerSequentialStringReplacementMatch(textarea, matchStart, matchLength) {
        const computedStyle = window.getComputedStyle(textarea);
        const mirror = document.createElement('div');
        const copiedProperties = [
            'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
            'fontFamily', 'fontSize', 'fontStyle', 'fontWeight', 'letterSpacing', 'lineHeight',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'tabSize', 'textIndent', 'textTransform', 'wordBreak', 'wordSpacing',
        ];
        copiedProperties.forEach(property => {
            mirror.style[property] = computedStyle[property];
        });
        Object.assign(mirror.style, {
            boxSizing: computedStyle.boxSizing,
            overflowWrap: computedStyle.overflowWrap,
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre-wrap',
            width: `${textarea.clientWidth}px`,
            left: '-100000px',
            top: '0',
        });

        mirror.appendChild(document.createTextNode(textarea.value.slice(0, matchStart)));
        const marker = document.createElement('span');
        marker.textContent = textarea.value.slice(matchStart, matchStart + matchLength) || '\u200b';
        mirror.appendChild(marker);
        document.body.appendChild(mirror);

        const centeredScrollTop = marker.offsetTop - (textarea.clientHeight / 2) + (marker.offsetHeight / 2);
        textarea.scrollTop = Math.max(0, Math.min(centeredScrollTop, textarea.scrollHeight - textarea.clientHeight));
        mirror.remove();
        textarea.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },

    async showNextSequentialStringReplacementMatch() {
        const active = stringReplacementRuntime.active;
        if (!active) return;

        if (active.searchOnly) {
            if (active.searchMatches.length === 0) {
                await this.finishSequentialStringReplacement(false);
                await uiUtils.showCustomAlert('一致する文字列はありません。');
                return;
            }
            const match = active.searchMatches[active.searchMatchPosition];
            await this.showSequentialStringReplacementMatch(
                active,
                match.messageIndex,
                match.matchStart,
                active.searchMatchPosition + 1,
            );
            return;
        }

        while (active.targetPosition < active.indices.length) {
            const messageIndex = active.indices[active.targetPosition];
            const content = active.workingContents.get(messageIndex) ?? '';
            const matchStart = content.indexOf(active.searchWord, active.searchOffset);
            if (matchStart !== -1) {
                const shown = await this.showSequentialStringReplacementMatch(
                    active,
                    messageIndex,
                    matchStart,
                    active.currentMatchOrdinal + 1,
                );
                if (!shown) {
                    active.targetPosition += 1;
                    active.searchOffset = 0;
                    continue;
                }
                return;
            }
            active.targetPosition += 1;
            active.searchOffset = 0;
        }

        await this.finishSequentialStringReplacement(true);
    },

    async showSequentialStringReplacementMatch(active, messageIndex, matchStart, ordinal) {
        const content = active.workingContents.get(messageIndex) ?? '';
        active.currentMatch = { messageIndex, matchStart };
        uiUtils.renderChatMessages(true);
        const messageElement = elements.messageContainer.querySelector(`.message[data-index="${messageIndex}"]`);
        if (!messageElement) return false;
        await this.startEditMessage(messageIndex, messageElement);
        const textarea = messageElement.querySelector('.edit-textarea');
        if (!textarea) return false;

        active.currentMatchOrdinal = ordinal;
        elements.stringReplacementProgress.textContent = `${ordinal}/${active.totalMatches}`;
        textarea.value = content;
        messageElement.classList.add('replacement-preview-active');
        uiUtils.adjustTextareaHeight(textarea, 400);
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(matchStart, matchStart + active.searchWord.length);
        requestAnimationFrame(() => {
            this.centerSequentialStringReplacementMatch(textarea, matchStart, active.searchWord.length);
        });
        return true;
    },

    async handleSequentialStringReplacement(action) {
        const active = stringReplacementRuntime.active;
        if (!active?.currentMatch) return;
        const { messageIndex, matchStart } = active.currentMatch;
        const content = active.workingContents.get(messageIndex) ?? '';

        if (action === 'cancel') {
            await this.finishSequentialStringReplacement(false, true);
            return;
        }

        if (active.searchOnly && (action === 'previous' || action === 'next')) {
            const direction = action === 'previous' ? -1 : 1;
            active.searchMatchPosition = (
                active.searchMatchPosition + direction + active.searchMatches.length
            ) % active.searchMatches.length;
            await this.showNextSequentialStringReplacementMatch();
            return;
        }

        if (active.searchOnly) return;

        if (action === 'yes') {
            const updatedContent = content.slice(0, matchStart)
                + active.replacementWord
                + content.slice(matchStart + active.searchWord.length);
            active.workingContents.set(messageIndex, updatedContent);
            active.changedIndices.add(messageIndex);
            active.replacementCount += 1;
            active.searchOffset = matchStart + active.replacementWord.length;
            await this.showNextSequentialStringReplacementMatch();
            return;
        }

        if (action === 'no') {
            active.searchOffset = matchStart + active.searchWord.length;
            await this.showNextSequentialStringReplacementMatch();
            return;
        }

        if (action === 'all') {
            const currentTail = replaceLiteralMatches(
                content.slice(matchStart),
                active.searchWord,
                active.replacementWord,
            );
            active.workingContents.set(
                messageIndex,
                content.slice(0, matchStart) + currentTail.text,
            );
            active.changedIndices.add(messageIndex);
            active.replacementCount += currentTail.count;

            for (let position = active.targetPosition + 1; position < active.indices.length; position += 1) {
                const laterIndex = active.indices[position];
                const result = replaceLiteralMatches(
                    active.workingContents.get(laterIndex) ?? '',
                    active.searchWord,
                    active.replacementWord,
                );
                if (result.count === 0) continue;
                active.workingContents.set(laterIndex, result.text);
                active.changedIndices.add(laterIndex);
                active.replacementCount += result.count;
            }
            await this.finishSequentialStringReplacement(true);
        }
    },

    async finishSequentialStringReplacement(showSummary, preserveCurrentEditor = false) {
        const active = stringReplacementRuntime.active;
        if (!active) return;
        stringReplacementRuntime.active = null;
        elements.stringReplacementBar.classList.add('hidden');

        if (preserveCurrentEditor && active.currentMatch) {
            this.commitStringReplacementContents(active.workingContents, active.changedIndices);
            if (active.changedIndices.size > 0) {
                try {
                    await dbUtils.saveChat();
                } catch (error) {
                    await uiUtils.showCustomAlert('文字列置換後のチャット保存に失敗しました。');
                }
            }
            const messageElement = elements.messageContainer.querySelector(
                `.message[data-index="${active.currentMatch.messageIndex}"]`,
            );
            const textarea = messageElement?.querySelector('.edit-textarea');
            if (textarea) {
                textarea.value = active.workingContents.get(active.currentMatch.messageIndex) ?? textarea.value;
            }
            messageElement?.classList.remove('replacement-preview-active');
            return;
        }

        const saved = await this.saveStringReplacementResult(
            active.workingContents,
            active.changedIndices,
            active.editorSnapshot,
        );
        if (saved && showSummary) {
            await uiUtils.showCustomAlert(`${active.replacementCount}件置換しました`);
        }
    },
});
