// @ts-nocheck -- Bundled with the shared browser application.
const initialPromptUtils = {
    editingId: null,

    getRecord(id) {
        return state.initialPromptRecords.find(record => record.id === id) || null;
    },

    normalizeSnapshot(value) {
        if (!value || typeof value !== 'object') return null;
        const id = typeof value.id === 'string' ? value.id.trim() : '';
        const title = typeof value.title === 'string' ? value.title.trim() : '';
        const text = typeof value.text === 'string' ? value.text.trim() : '';
        return id && title && text ? { id, title, text } : null;
    },

    formatUserText(message) {
        const snapshot = this.normalizeSnapshot(message?.initialPrompt);
        if (!snapshot) return String(message?.content || '');
        const input = String(message.content || '');
        return `【初回プロンプト：${snapshot.title}】\n${snapshot.text}\n\n【ユーザー入力】\n${input}`;
    },

    appendReference(container, value, { preview = false } = {}) {
        const snapshot = this.normalizeSnapshot(value);
        if (!snapshot) return;
        const message = document.createElement('div');
        message.classList.add('message', 'user', 'initial-prompt-message');
        if (preview) message.classList.add('initial-prompt-preview');
        if (state.areAllMessagesHidden) message.classList.add('message-hidden-by-toggle');
        const content = document.createElement('div');
        content.classList.add('message-content');
        const details = document.createElement('details');
        details.className = 'initial-prompt-reference';
        const summary = document.createElement('summary');
        summary.textContent = `初回プロンプト：${snapshot.title}${preview ? '（未送信）' : ''}`;
        const body = document.createElement('pre');
        body.textContent = snapshot.text;
        details.append(summary, body);
        content.appendChild(details);
        message.appendChild(content);
        container.appendChild(message);
    },

    async loadRecords() {
        const records = (await dbUtils.getAllInitialPrompts()).sort((a, b) => {
            if (Number.isFinite(a.order) && Number.isFinite(b.order)) return a.order - b.order;
            if (Number.isFinite(a.order)) return -1;
            if (Number.isFinite(b.order)) return 1;
            return (a.createdAt || 0) - (b.createdAt || 0);
        });
        if (records.some(record => !Number.isFinite(record.order))) {
            records.forEach((record, order) => { record.order = order; });
            await dbUtils.putInitialPrompts(records);
        }
        state.initialPromptRecords = records;
        this.renderList();
    },

    initialize() {
        elements.addInitialPromptBtn.addEventListener('click', () => this.openEditor());
        elements.backFromInitialPromptEditorBtn.addEventListener('click', () => history.back());
        elements.initialPromptEditorForm.addEventListener('submit', event => {
            event.preventDefault();
            this.saveEditor();
        });
        elements.importInitialPromptsBtn.addEventListener('click', () => elements.importInitialPromptsInput.click());
        elements.importInitialPromptsInput.addEventListener('change', async event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) await this.importAll(file);
        });
        elements.exportInitialPromptsBtn.addEventListener('click', () => this.exportAll());
        elements.headerMenuInitialPromptBtn.addEventListener('click', () => {
            uiUtils.setHeaderMenuOpen(false);
            this.selectForChat();
        });
        elements.initialPromptOkBtn.addEventListener('click', () => {
            elements.initialPromptDialog.close(elements.initialPromptSelect.value || 'none');
        });
        elements.initialPromptCancelBtn.addEventListener('click', () => elements.initialPromptDialog.close('cancel'));
    },

    renderList() {
        const list = elements.initialPromptManagementList;
        list.replaceChildren();
        state.initialPromptRecords.forEach((record, index, records) => {
            const row = document.createElement('div');
            row.className = 'lorebook-management-item';
            const title = document.createElement('strong');
            title.textContent = record.title;
            const details = document.createElement('div');
            details.className = 'lorebook-management-details';
            details.appendChild(title);
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = '編集';
            edit.addEventListener('click', () => this.openEditor(record.id));
            const actions = document.createElement('div');
            actions.className = 'lorebook-management-actions';
            const addButton = (label, titleText, handler, disabled = false, className = '') => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                button.title = titleText;
                button.disabled = disabled;
                if (className) button.className = className;
                button.addEventListener('click', handler);
                actions.appendChild(button);
            };
            addButton('↑', '上へ移動', () => this.moveRecord(record.id, -1), index === 0);
            addButton('↓', '下へ移動', () => this.moveRecord(record.id, 1), index === records.length - 1);
            actions.appendChild(edit);
            addButton('コピー', 'この初回プロンプトをコピー', () => this.copyRecord(record.id));
            const exportButton = document.createElement('button');
            exportButton.type = 'button';
            exportButton.textContent = 'JSON出力';
            exportButton.title = 'この初回プロンプトをJSON形式で出力';
            exportButton.addEventListener('click', () => this.exportOne(record.id));
            actions.appendChild(exportButton);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = '削除';
            remove.classList.add('danger');
            remove.addEventListener('click', () => this.deleteRecord(record.id));
            actions.appendChild(remove);
            row.append(details, actions);
            list.appendChild(row);
        });
        elements.noInitialPromptsMessage.classList.toggle('hidden', state.initialPromptRecords.length > 0);
    },

    async moveRecord(id, delta) {
        const index = state.initialPromptRecords.findIndex(record => record.id === id);
        const nextIndex = index + delta;
        if (index < 0 || nextIndex < 0 || nextIndex >= state.initialPromptRecords.length) return;
        const records = [...state.initialPromptRecords];
        [records[index], records[nextIndex]] = [records[nextIndex], records[index]];
        const reordered = records.map((record, order) => ({ ...record, order }));
        try {
            await dbUtils.putInitialPrompts(reordered);
            state.initialPromptRecords = reordered;
            this.renderList();
        } catch (error) {
            await uiUtils.showCustomAlert(`並び替えに失敗しました: ${error}`);
        }
    },

    async copyRecord(id) {
        const source = this.getRecord(id);
        if (!source) return;
        const now = Date.now();
        const existingIds = new Set(state.initialPromptRecords.map(record => record.id));
        let newId = crypto.randomUUID ? crypto.randomUUID() : `prompt-${now}-${Math.random().toString(36).slice(2)}`;
        while (existingIds.has(newId)) newId = `prompt-${now}-${Math.random().toString(36).slice(2)}`;
        const copy = { ...source, id: newId, title: `${source.title} (コピー)`, createdAt: now, updatedAt: now };
        const index = state.initialPromptRecords.findIndex(record => record.id === id);
        const records = [...state.initialPromptRecords];
        records.splice(index + 1, 0, copy);
        const reordered = records.map((record, order) => ({ ...record, order }));
        try {
            await dbUtils.putInitialPrompts(reordered);
            state.initialPromptRecords = reordered;
            this.renderList();
            uiUtils.updateInitialPromptMenuItem();
        } catch (error) {
            await uiUtils.showCustomAlert(`コピーに失敗しました: ${error}`);
        }
    },

    async deleteRecord(id) {
        const record = this.getRecord(id);
        if (!record) return;
        const confirmed = await uiUtils.showCustomConfirm(`初回プロンプト「${record.title}」を削除しますか？既存チャットに適用済みの内容は残ります。`);
        if (!confirmed) return;
        try {
            await dbUtils.deleteInitialPrompt(id);
            state.initialPromptRecords = state.initialPromptRecords.filter(item => item.id !== id);
            if (state.currentInitialPromptId === id) {
                state.currentInitialPromptId = null;
                if (!state.currentMessages.some(message => message.role === 'user')) {
                    uiUtils.renderChatMessages(true);
                }
            }
            this.renderList();
            uiUtils.updateInitialPromptMenuItem();
        } catch (error) {
            await uiUtils.showCustomAlert(`初回プロンプトの削除に失敗しました: ${error}`);
        }
    },

    openEditor(id = null) {
        const record = id ? this.getRecord(id) : null;
        this.editingId = record?.id || null;
        elements.initialPromptEditorHeading.textContent = record ? '初回ユーザープロンプトを編集' : '新規初回ユーザープロンプトを追加';
        elements.initialPromptTitle.value = record?.title || '';
        elements.initialPromptBody.value = record?.text || '';
        uiUtils.showScreen('initial-prompt-editor');
        elements.initialPromptTitle.focus();
    },

    async saveEditor() {
        const title = elements.initialPromptTitle.value.trim();
        const text = elements.initialPromptBody.value.trim();
        if (!title || !text) {
            await uiUtils.showCustomAlert('タイトルと本文を入力してください。');
            return;
        }
        const previous = this.editingId ? this.getRecord(this.editingId) : null;
        const now = Date.now();
        const record = {
            id: previous?.id || (crypto.randomUUID ? crypto.randomUUID() : `prompt-${now}-${Math.random().toString(36).slice(2)}`),
            title,
            text,
            createdAt: previous?.createdAt || now,
            updatedAt: now,
            order: previous?.order ?? state.initialPromptRecords.reduce((max, item) => Math.max(max, Number.isFinite(item.order) ? item.order : -1), -1) + 1,
        };
        try {
            await dbUtils.putInitialPrompt(record);
            state.initialPromptRecords = previous
                ? state.initialPromptRecords.map(item => item.id === record.id ? record : item)
                : [...state.initialPromptRecords, record];
            this.renderList();
            uiUtils.updateInitialPromptMenuItem();
            if (state.currentScreen === 'initial-prompt-editor') history.back();
        } catch (error) {
            await uiUtils.showCustomAlert(`保存に失敗しました: ${error}`);
        }
    },

    createExportData(records) {
        return { format: 'GeminiPWA Initial Prompts', version: 1, prompts: records };
    },

    downloadJson(records, filename) {
        const data = this.createExportData(records);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    },

    exportOne(id) {
        const record = this.getRecord(id);
        if (!record) return;
        const safeName = record.title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 100) || 'initial-prompt';
        this.downloadJson([record], `${safeName}.initial-prompt.json`);
    },

    exportAll() {
        this.downloadJson(state.initialPromptRecords, `geminipwa-initial-prompts-${formatLocalDateStamp()}.json`);
    },

    async importAll(file) {
        try {
            const data = JSON.parse(await file.text());
            if (data?.format !== 'GeminiPWA Initial Prompts' || data.version !== 1 || !Array.isArray(data.prompts)) {
                throw new Error('対応していないJSON形式です。');
            }
            const ids = new Set();
            const records = data.prompts.map(item => {
                if (!item || typeof item.id !== 'string' || !item.id.trim()
                    || typeof item.title !== 'string' || !item.title.trim()
                    || typeof item.text !== 'string' || !item.text.trim()
                    || !Number.isFinite(item.createdAt) || !Number.isFinite(item.updatedAt)) {
                    throw new Error('ID、タイトル、本文、日時を確認してください。');
                }
                const id = item.id.trim();
                if (ids.has(id)) throw new Error(`ID「${id}」が重複しています。`);
                ids.add(id);
                return { id, title: item.title.trim(), text: item.text.trim(), createdAt: item.createdAt, updatedAt: item.updatedAt };
            });
            const existingIds = new Set(state.initialPromptRecords.map(item => item.id));
            const count = records.filter(item => existingIds.has(item.id)).length;
            if (count && !(await uiUtils.showCustomConfirm(`同じIDの初回プロンプトが${count}件あります。上書きしますか？`))) return;
            const imported = new Map(records.map(record => [record.id, record]));
            const merged = state.initialPromptRecords.map(item => imported.has(item.id)
                ? { ...imported.get(item.id), order: item.order } : item);
            merged.push(...records.filter(item => !existingIds.has(item.id)));
            const ordered = merged.map((record, order) => ({ ...record, order }));
            await dbUtils.putInitialPrompts(ordered);
            state.initialPromptRecords = ordered;
            this.renderList();
            uiUtils.updateInitialPromptMenuItem();
            await uiUtils.showCustomAlert(`${records.length}件の初回プロンプトを取り込みました。`);
        } catch (error) {
            await uiUtils.showCustomAlert(`JSON取込に失敗しました: ${error.message || error}`);
        }
    },

    updateMenuItem() {
        const selected = this.getRecord(state.currentInitialPromptId);
        const snapshot = state.currentMessages.find(message => message.initialPrompt)?.initialPrompt;
        const title = snapshot?.title || selected?.title || (state.currentInitialPromptId ? '未登録の初回プロンプト' : '使用しない');
        elements.headerMenuInitialPromptName.textContent = title;
        const locked = state.isSending || state.currentMessages.some(message => message.role === 'user');
        elements.headerMenuInitialPromptBtn.disabled = locked;
        elements.headerMenuInitialPromptBtn.title = locked ? '初回送信後は変更できません' : `初回プロンプト: ${title}`;
    },

    async selectForChat() {
        if (state.isSending || state.currentMessages.some(message => message.role === 'user')) return;
        const select = elements.initialPromptSelect;
        select.replaceChildren();
        const none = new Option('使用しない', 'none');
        select.appendChild(none);
        state.initialPromptRecords.forEach(record => select.appendChild(new Option(record.title, record.id)));
        select.value = this.getRecord(state.currentInitialPromptId)?.id || 'none';
        elements.initialPromptDialog.returnValue = '';
        const result = await uiUtils.showCustomDialog(elements.initialPromptDialog, select);
        if (!result || result === 'cancel') return;
        state.currentInitialPromptId = result === 'none' ? null : this.getRecord(result)?.id || null;
        this.updateMenuItem();
        uiUtils.renderChatMessages(true);
    },
};
