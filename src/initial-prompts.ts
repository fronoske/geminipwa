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

    appendReference(container, value) {
        const snapshot = this.normalizeSnapshot(value);
        if (!snapshot) return;
        const details = document.createElement('details');
        details.className = 'initial-prompt-reference';
        details.open = true;
        const summary = document.createElement('summary');
        summary.textContent = `初回プロンプト：${snapshot.title}`;
        const body = document.createElement('pre');
        body.textContent = snapshot.text;
        details.append(summary, body);
        container.appendChild(details);
    },

    async loadRecords() {
        state.initialPromptRecords = (await dbUtils.getAllInitialPrompts())
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
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
        for (const record of state.initialPromptRecords) {
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
            actions.appendChild(edit);
            row.append(details, actions);
            list.appendChild(row);
        }
        elements.noInitialPromptsMessage.classList.toggle('hidden', state.initialPromptRecords.length > 0);
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

    exportAll() {
        const data = { format: 'GeminiPWA Initial Prompts', version: 1, prompts: state.initialPromptRecords };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `geminipwa-initial-prompts-${formatLocalDateStamp()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
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
            await dbUtils.putInitialPrompts(records);
            const importedIds = new Set(records.map(item => item.id));
            state.initialPromptRecords = [...state.initialPromptRecords.filter(item => !importedIds.has(item.id)), ...records]
                .sort((a, b) => a.createdAt - b.createdAt);
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
    },
};
