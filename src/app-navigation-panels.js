// @ts-nocheck -- Enable after shared application types are defined.
// src/app-navigation-panels.js is generated from this file. Edit this TypeScript source instead.
Object.assign(appLogic, {
    handlePopState(event) {
        const targetScreen = event.state?.screen || 'chat';
        uiUtils.showScreen(targetScreen, true);
    },
    updateZoomState() {
        if ('visualViewport' in window) {
            const newZoomState = window.visualViewport.scale > ZOOM_THRESHOLD;
            if (state.isZoomed !== newZoomState) {
                state.isZoomed = newZoomState;
                document.body.classList.toggle('zoomed', state.isZoomed);
            }
        }
    },
    handleTouchStart(event) {
        if (!state.settings.enableSwipeNavigation)
            return;
        if (window.getSelection().toString().length > 0) {
            state.touchStartX = 0;
            state.touchStartY = 0;
            state.isSwiping = false;
            return;
        }
        if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT')
            return;
        if (event.touches.length > 1 || state.isZoomed) {
            state.touchStartX = 0;
            state.touchStartY = 0;
            state.isSwiping = false;
            return;
        }
        state.touchStartX = event.touches[0].clientX;
        state.touchStartY = event.touches[0].clientY;
        state.isSwiping = false;
        state.touchEndX = state.touchStartX;
        state.touchEndY = state.touchStartY;
    },
    handleTouchMove(event) {
        if (!state.settings.enableSwipeNavigation)
            return;
        if (window.getSelection().toString().length > 0) {
            return;
        }
        if (!state.touchStartX || event.touches.length > 1 || state.isZoomed) {
            return;
        }
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const diffX = state.touchStartX - currentX;
        const diffY = state.touchStartY - currentY;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            state.isSwiping = true;
            if (event.cancelable) {
                event.preventDefault();
            }
        }
        else {
            state.isSwiping = false;
        }
        state.touchEndX = currentX;
        state.touchEndY = currentY;
    },
    handleTouchEnd(event) {
        if (!state.settings.enableSwipeNavigation) {
            this.resetSwipeState();
            return;
        }
        this.updateZoomState();
        if (state.isZoomed) {
            this.resetSwipeState();
            return;
        }
        if (!state.isSwiping || !state.touchStartX) {
            this.resetSwipeState();
            return;
        }
        const diffX = state.touchStartX - state.touchEndX;
        const diffY = state.touchStartY - state.touchEndY;
        if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                uiUtils.showScreen('settings');
            }
            else {
                uiUtils.showScreen('history');
            }
        }
        this.resetSwipeState();
    },
    resetSwipeState() {
        state.touchStartX = 0;
        state.touchStartY = 0;
        state.touchEndX = 0;
        state.touchEndY = 0;
        state.isSwiping = false;
    },
    toggleMemo() {
        state.isMemoVisible = !state.isMemoVisible;
        elements.memoArea.classList.toggle('hidden', !state.isMemoVisible);
        if (state.isMemoVisible) {
            elements.memoEditor.focus();
        }
    },
    async copyMemoText() {
        const memoText = elements.memoEditor.value;
        if (!memoText.trim()) {
            const originalText = elements.copyMemoBtn.textContent;
            elements.copyMemoBtn.textContent = "空です";
            elements.copyMemoBtn.disabled = true;
            setTimeout(() => {
                elements.copyMemoBtn.textContent = originalText;
                elements.copyMemoBtn.disabled = false;
            }, 1500);
            return;
        }
        try {
            await navigator.clipboard.writeText(memoText);
            const originalText = elements.copyMemoBtn.textContent;
            elements.copyMemoBtn.textContent = "コピー完了";
            elements.copyMemoBtn.disabled = true;
            setTimeout(() => { elements.copyMemoBtn.textContent = originalText; elements.copyMemoBtn.disabled = false; }, 1500);
        }
        catch (err) {
            const originalText = elements.copyMemoBtn.textContent;
            elements.copyMemoBtn.textContent = "コピー失敗";
            elements.copyMemoBtn.disabled = true;
            setTimeout(() => { elements.copyMemoBtn.textContent = originalText; elements.copyMemoBtn.disabled = false; }, 2000);
        }
    },
    async pasteIntoMemo() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "非対応";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 2000);
                return;
            }
            const textToPaste = await navigator.clipboard.readText();
            if (textToPaste) {
                const currentText = elements.memoEditor.value;
                const selectionStart = elements.memoEditor.selectionStart;
                const selectionEnd = elements.memoEditor.selectionEnd;
                elements.memoEditor.value = currentText.substring(0, selectionStart) + textToPaste + currentText.substring(selectionEnd);
                elements.memoEditor.selectionStart = elements.memoEditor.selectionEnd = selectionStart + textToPaste.length;
                elements.memoEditor.focus();
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "貼付け完了";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 1500);
            }
            else {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "空です";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 1500);
            }
        }
        catch (err) {
            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "許可エラー";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 2000);
            }
            else {
                const originalText = elements.pasteMemoBtn.textContent;
                elements.pasteMemoBtn.textContent = "貼付け失敗";
                elements.pasteMemoBtn.disabled = true;
                setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 2000);
            }
        }
    },
    async confirmClearMemo() {
        if (!elements.memoEditor.value.trim()) {
            const originalText = elements.deleteMemoBtn.textContent;
            elements.deleteMemoBtn.textContent = "空です";
            elements.deleteMemoBtn.disabled = true;
            setTimeout(() => {
                elements.deleteMemoBtn.textContent = originalText;
                elements.deleteMemoBtn.disabled = false;
            }, 1500);
            return;
        }
        const confirmed = await uiUtils.showCustomConfirm("メモの内容を全てクリアしますか？\nこの操作は元に戻せません。");
        if (confirmed) {
            elements.memoEditor.value = '';
        }
    },
    toggleClipboardStack() {
        state.isClipboardStackVisible = !state.isClipboardStackVisible;
        elements.clipboardStackArea.classList.toggle('hidden', !state.isClipboardStackVisible);
        if (state.isClipboardStackVisible) {
            elements.clipboardStackEditor.value = state.clipboardStackContent;
            elements.clipboardStackEditor.focus();
            elements.clipboardStackEditor.scrollTop = elements.clipboardStackEditor.scrollHeight;
        }
    },
    async copyClipboardStackText() {
        const stackText = elements.clipboardStackEditor.value;
        if (!stackText.trim()) {
            const originalText = elements.copyClipboardStackBtn.textContent;
            elements.copyClipboardStackBtn.textContent = "空です";
            elements.copyClipboardStackBtn.disabled = true;
            setTimeout(() => {
                elements.copyClipboardStackBtn.textContent = originalText;
                elements.copyClipboardStackBtn.disabled = false;
            }, 1500);
            return;
        }
        try {
            await navigator.clipboard.writeText(stackText);
            const originalText = elements.copyClipboardStackBtn.textContent;
            elements.copyClipboardStackBtn.textContent = "コピー完了";
            elements.copyClipboardStackBtn.disabled = true;
            setTimeout(() => { elements.copyClipboardStackBtn.textContent = originalText; elements.copyClipboardStackBtn.disabled = false; }, 1500);
        }
        catch (err) {
            const originalText = elements.copyClipboardStackBtn.textContent;
            elements.copyClipboardStackBtn.textContent = "コピー失敗";
            elements.copyClipboardStackBtn.disabled = true;
            setTimeout(() => { elements.copyClipboardStackBtn.textContent = originalText; elements.copyClipboardStackBtn.disabled = false; }, 2000);
        }
    },
    async pasteIntoClipboardStack() {
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "非対応";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 2000);
                return;
            }
            const textToPaste = await navigator.clipboard.readText();
            if (textToPaste) {
                const currentText = elements.clipboardStackEditor.value;
                const separator = currentText.length > 0 && !currentText.endsWith('\n\n') ? "\n\n" : "";
                elements.clipboardStackEditor.value += separator + textToPaste;
                elements.clipboardStackEditor.scrollTop = elements.clipboardStackEditor.scrollHeight;
                elements.clipboardStackEditor.focus();
                state.clipboardStackContent = elements.clipboardStackEditor.value;
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "貼付け完了";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 1500);
            }
            else {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "空です";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 1500);
            }
        }
        catch (err) {
            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "許可エラー";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 2000);
            }
            else {
                const originalText = elements.pasteClipboardStackBtn.textContent;
                elements.pasteClipboardStackBtn.textContent = "貼付け失敗";
                elements.pasteClipboardStackBtn.disabled = true;
                setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 2000);
            }
        }
    },
    async confirmClearClipboardStack() {
        if (!elements.clipboardStackEditor.value.trim()) {
            const originalText = elements.deleteClipboardStackBtn.textContent;
            elements.deleteClipboardStackBtn.textContent = "空です";
            elements.deleteClipboardStackBtn.disabled = true;
            setTimeout(() => {
                elements.deleteClipboardStackBtn.textContent = originalText;
                elements.deleteClipboardStackBtn.disabled = false;
            }, 1500);
            return;
        }
        const confirmed = await uiUtils.showCustomConfirm("クリップボードスタックの内容を全てクリアしますか？");
        if (confirmed) {
            elements.clipboardStackEditor.value = '';
            state.clipboardStackContent = '';
        }
    },
    toggleTwinEngineSummary() {
        state.isTwinEngineSummaryVisible = !state.isTwinEngineSummaryVisible;
        elements.twinEngineSummaryArea.classList.toggle('hidden', !state.isTwinEngineSummaryVisible);
        if (state.isTwinEngineSummaryVisible) {
            elements.twinEngineSummaryEditor.value = state.twinEngineSummaryContent;
            uiUtils.updateTwinEngineApiKeyCycleButton();
            elements.twinEngineSummaryEditor.focus();
            elements.twinEngineSummaryEditor.scrollTop = elements.twinEngineSummaryEditor.scrollHeight;
        }
    },
    async copyTwinEngineSummaryText() {
        const summaryText = elements.twinEngineSummaryEditor.value;
        if (!summaryText.trim()) {
            const originalText = elements.copyTwinEngineSummaryBtn.textContent;
            elements.copyTwinEngineSummaryBtn.textContent = "空です";
            elements.copyTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => {
                elements.copyTwinEngineSummaryBtn.textContent = originalText;
                elements.copyTwinEngineSummaryBtn.disabled = false;
            }, 1500);
            return;
        }
        try {
            await navigator.clipboard.writeText(summaryText);
            const originalText = elements.copyTwinEngineSummaryBtn.textContent;
            elements.copyTwinEngineSummaryBtn.textContent = "コピー完了";
            elements.copyTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => { elements.copyTwinEngineSummaryBtn.textContent = originalText; elements.copyTwinEngineSummaryBtn.disabled = false; }, 1500);
        }
        catch (err) {
            const originalText = elements.copyTwinEngineSummaryBtn.textContent;
            elements.copyTwinEngineSummaryBtn.textContent = "コピー失敗";
            elements.copyTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => { elements.copyTwinEngineSummaryBtn.textContent = originalText; elements.copyTwinEngineSummaryBtn.disabled = false; }, 2000);
        }
    },
    async clearTwinEngineSummary() {
        if (!elements.twinEngineSummaryEditor.value.trim()) {
            const originalText = elements.clearTwinEngineSummaryBtn.textContent;
            elements.clearTwinEngineSummaryBtn.textContent = "空です";
            elements.clearTwinEngineSummaryBtn.disabled = true;
            setTimeout(() => {
                elements.clearTwinEngineSummaryBtn.textContent = originalText;
                elements.clearTwinEngineSummaryBtn.disabled = false;
            }, 1500);
            return;
        }
        elements.twinEngineSummaryEditor.value = '';
        state.twinEngineSummaryContent = '';
    },
    async toggleTwinEngineMode() {
        if (!state.settings.showTwinEngineSettings)
            return;
        const newValue = !state.settings.twinEngineEnableFullAuto;
        state.settings.twinEngineEnableFullAuto = newValue;
        elements.twinEngineEnableFullAutoToggle.checked = newValue;
        uiUtils.updateTwinEngineModeButton();
        await this.saveSettings(false);
    },
    async cycleTwinEngineApiKey() {
        const configs = state.settings.twinEngineApiConfigs;
        if (configs.length <= 1) {
            return;
        }
        const currentId = state.settings.twinEngineActiveConfigId;
        const currentIndex = configs.findIndex(c => c.id === currentId);
        const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % configs.length;
        const nextConfig = configs[nextIndex];
        if (nextConfig) {
            state.settings.twinEngineActiveConfigId = nextConfig.id;
        }
        uiUtils.updateTwinEngineApiKeyCycleButton();
        elements.headerCycleApiKeyBtn.classList.toggle('hidden', !state.settings.showHeaderCycleApiKeyBtn);
        elements.footerCycleApiKeyBtn.classList.toggle('hidden', !state.settings.showFooterCycleApiKeyBtn);
        this.updateApiKeyCycleButtons();
        twinEngineApiConfigUtils.renderList();
        if (state.settings.autoSaveSettings) {
            await this.saveSettings(false);
        }
    },
    async summarizeCurrentSession(messagesToSummarize) {
        if (!messagesToSummarize || messagesToSummarize.length === 0) {
            return null;
        }
        try {
            const activeConfig = state.settings.twinEngineApiConfigs.find(c => c.id === state.settings.twinEngineActiveConfigId);
            if (!activeConfig || (activeConfig.provider !== 'dummy' && !activeConfig.apiKey)) {
                throw new Error("Twin-engine用のアクティブなAPI設定（とAPIキー）がありません。設定画面を確認してください。");
            }
            const { provider, apiKey, modelName } = activeConfig;
            const contextForSummary = {
                sessionId: null,
                messages: messagesToSummarize,
                systemPrompt: state.settings.twinEngineSummaryPrompt || '以下の会話を簡潔に要約してください。',
                inputText: '',
                attachments: [],
                apiProvider: provider,
                _apiKeyOverride: apiKey,
                _modelNameOverride: modelName,
                temperature: activeConfig.temperature,
                maxTokens: activeConfig.maxTokens,
                topK: activeConfig.topK,
                topP: activeConfig.topP,
                presencePenalty: activeConfig.presencePenalty,
                frequencyPenalty: activeConfig.frequencyPenalty,
                thinkingBudget: activeConfig.thinkingBudget,
                dummyUser: state.settings.twinEngineDummyUser,
                enableDummyUser: state.settings.twinEngineEnableDummyUser,
                dummyModel: state.settings.twinEngineDummyModel,
                enableDummyModel: state.settings.twinEngineEnableDummyModel,
                concatDummyModel: state.settings.twinEngineConcatDummyModel
            };
            const response = await this.handleSend(false, -1, contextForSummary);
            if (response && response.content) {
                if (state.settings.twinEngineConcatDummyModel && state.settings.twinEngineDummyModel) {
                    const prefix = state.settings.twinEngineDummyModel.trim();
                    response.content = `${prefix}\n\n${response.content}`;
                }
                return response;
            }
            return null;
        }
        catch (error) {
            await uiUtils.showCustomAlert(`要約処理中にエラーが発生しました: ${error.message}`);
            return null;
        }
    },
    async manualResummarize() {
        if (!state.settings.showTwinEngineSettings) {
            await uiUtils.showCustomAlert("Twin-engine機能が無効です。設定画面から有効にしてください。");
            return;
        }
        if (state.isSending || state.isAiToAiChatProcessing || state.isSummarizing) {
            await uiUtils.showCustomAlert("現在他の処理を実行中です。完了後に再試行してください。");
            return;
        }
        if (state.currentMessages.length === 0) {
            await uiUtils.showCustomAlert("要約対象のチャット履歴がありません。");
            return;
        }
        const buttonsToUpdate = [elements.resummarizeBtn, elements.footerResummarizeBtn];
        const originalPanelBtnText = elements.resummarizeBtn.textContent;
        state.isSummarizing = true;
        uiUtils.updateLoadingIndicator();
        buttonsToUpdate.forEach(btn => {
            btn.disabled = true;
            if (btn.id === 'resummarize-btn') {
                btn.textContent = "要約中...";
            }
        });
        try {
            const response = await this.summarizeCurrentSession([...state.currentMessages]);
            if (response && response.content) {
                const newSummaryContent = response.content.trim() + "\n\n";
                state.twinEngineSummaryContent = newSummaryContent;
                elements.twinEngineSummaryEditor.value = state.twinEngineSummaryContent;
                if (state.isTwinEngineSummaryVisible) {
                    elements.twinEngineSummaryEditor.scrollTop = 0;
                }
                elements.resummarizeBtn.textContent = "要約完了";
            }
            else {
                elements.resummarizeBtn.textContent = "失敗";
            }
        }
        catch (error) {
            await uiUtils.showCustomAlert(`再要約エラー: ${error.message}`);
            elements.resummarizeBtn.textContent = "エラー";
        }
        finally {
            state.isSummarizing = false;
            uiUtils.updateLoadingIndicator();
            buttonsToUpdate.forEach(btn => btn.disabled = false);
            setTimeout(() => {
                elements.resummarizeBtn.textContent = originalPanelBtnText;
            }, 2000);
        }
    },
    async triggerTwinEngineSummaryInBackground() {
        if (state.currentMessages.length === 0 || state.isSending || state.isAiToAiChatProcessing || state.isSummarizing) {
            return;
        }
        state.isSummarizing = true;
        uiUtils.updateLoadingIndicator();
        try {
            const response = await this.summarizeCurrentSession([...state.currentMessages]);
            if (response && response.content) {
                const newSummaryContent = response.content.trim() + "\n\n";
                state.twinEngineSummaryContent = newSummaryContent;
                elements.twinEngineSummaryEditor.value = state.twinEngineSummaryContent;
                if (state.isTwinEngineSummaryVisible) {
                    elements.twinEngineSummaryEditor.scrollTop = 0;
                }
            }
        }
        catch (error) {
        }
        finally {
            state.isSummarizing = false;
            uiUtils.updateLoadingIndicator();
        }
    },
    scrollToTop() {
        requestAnimationFrame(() => {
            const mainContent = elements.chatScreen.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
        });
    },
    scrollToBottom() {
        requestAnimationFrame(() => {
            const mainContent = elements.chatScreen.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = mainContent.scrollHeight;
            }
        });
    },
    async pasteToUserInput() {
        const button = elements.pasteToInputBtn;
        const originalTextContent = button.textContent;
        const originalTitle = button.title;
        try {
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                button.textContent = "!";
                button.title = "クリップボードAPI非対応";
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = originalTextContent;
                    button.title = originalTitle;
                    button.disabled = false;
                }, 2000);
                return;
            }
            const textToPaste = await navigator.clipboard.readText();
            if (textToPaste) {
                const currentText = elements.userInput.value;
                const selectionStart = elements.userInput.selectionStart;
                const selectionEnd = elements.userInput.selectionEnd;
                elements.userInput.value = currentText.substring(0, selectionStart) + textToPaste + currentText.substring(selectionEnd);
                elements.userInput.selectionStart = elements.userInput.selectionEnd = selectionStart + textToPaste.length;
                elements.userInput.focus();
                uiUtils.adjustTextareaHeight();
                uiUtils.updateAttachmentBadgeVisibility();
                button.textContent = "✓";
                button.title = "貼り付け完了";
                setTimeout(() => {
                    button.textContent = originalTextContent;
                    button.title = originalTitle;
                }, 1500);
            }
            else {
                button.textContent = "空";
                button.title = "クリップボードは空です";
                setTimeout(() => {
                    button.textContent = originalTextContent;
                    button.title = originalTitle;
                }, 1500);
            }
        }
        catch (err) {
            if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                button.textContent = "!";
                button.title = "クリップボードの許可なし";
            }
            else {
                button.textContent = "X";
                button.title = "貼り付け失敗";
            }
            button.disabled = true;
            setTimeout(() => {
                button.textContent = originalTextContent;
                button.title = originalTitle;
                button.disabled = false;
            }, 2000);
        }
    },
    rollDiceAndInput() {
        let min = parseInt(state.settings.diceMinValue, 10);
        let max = parseInt(state.settings.diceMaxValue, 10);
        if (isNaN(min))
            min = DEFAULT_DICE_MIN_VALUE;
        if (isNaN(max))
            max = DEFAULT_DICE_MAX_VALUE;
        if (min > max) {
            [min, max] = [max, min];
        }
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        const currentText = elements.userInput.value;
        const selectionStart = elements.userInput.selectionStart;
        const selectionEnd = elements.userInput.selectionEnd;
        elements.userInput.value = currentText.substring(0, selectionStart) + randomNumber + currentText.substring(selectionEnd);
        elements.userInput.selectionStart = elements.userInput.selectionEnd = selectionStart + String(randomNumber).length;
        uiUtils.adjustTextareaHeight();
        uiUtils.updateAttachmentBadgeVisibility();
    },
});
