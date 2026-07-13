// @ts-nocheck -- Enable after shared application types are defined.
// Bundled into the generated index.html from this TypeScript source.
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
                if (!state.settings.enableSwipeNavigation) return;
                if (window.getSelection().toString().length > 0) {
                    state.touchStartX = 0;
                    state.touchStartY = 0;
                    state.isSwiping = false;
                    return;
                }
                if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') return;
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
                if (!state.settings.enableSwipeNavigation) return;
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
                } else {
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
                    } else {
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
                } catch (err) {
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
                    } else {
                        const originalText = elements.pasteMemoBtn.textContent;
                        elements.pasteMemoBtn.textContent = "空です";
                        elements.pasteMemoBtn.disabled = true;
                        setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 1500);
                    }
                } catch (err) {
                    if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                        const originalText = elements.pasteMemoBtn.textContent;
                        elements.pasteMemoBtn.textContent = "許可エラー";
                        elements.pasteMemoBtn.disabled = true;
                        setTimeout(() => { elements.pasteMemoBtn.textContent = originalText; elements.pasteMemoBtn.disabled = false; }, 2000);
                    } else {
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
                } catch (err) {
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
                    } else {
                        const originalText = elements.pasteClipboardStackBtn.textContent;
                        elements.pasteClipboardStackBtn.textContent = "空です";
                        elements.pasteClipboardStackBtn.disabled = true;
                        setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 1500);
                    }
                } catch (err) {
                    if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                        const originalText = elements.pasteClipboardStackBtn.textContent;
                        elements.pasteClipboardStackBtn.textContent = "許可エラー";
                        elements.pasteClipboardStackBtn.disabled = true;
                        setTimeout(() => { elements.pasteClipboardStackBtn.textContent = originalText; elements.pasteClipboardStackBtn.disabled = false; }, 2000);
                    } else {
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
                    } else {
                        button.textContent = "空";
                        button.title = "クリップボードは空です";
                        setTimeout(() => {
                            button.textContent = originalTextContent;
                            button.title = originalTitle;
                        }, 1500);
                    }
                } catch (err) {
                    if (err.name === 'NotAllowedError' || err.message.includes('Read permission denied')) {
                        button.textContent = "!";
                        button.title = "クリップボードの許可なし";
                    } else {
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
});
