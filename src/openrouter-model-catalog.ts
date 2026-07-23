// @ts-nocheck -- Enable after shared application and DOM types are defined.
// Bundled into the generated index.html from this TypeScript source.
const openRouterModelCatalog = {
    models: [],
    visibleModelIds: [],
    lastFetchedAt: null,
    initialized: false,
    sortMode: 'model',
    sortReversed: false,

    classifyProvider(modelId) {
        const author = String(modelId || '').split('/')[0].toLowerCase();
        const provider = OPENROUTER_MODEL_PROVIDERS.find((candidate) =>
            candidate.value !== 'other' && candidate.prefixes.includes(author)
        );
        return provider?.value || 'other';
    },

    isFreeModel(model) {
        if (String(model.id || '').endsWith(':free')) return true;
        const promptPrice = Number(model.pricing?.prompt);
        const completionPrice = Number(model.pricing?.completion);
        return Number.isFinite(promptPrice)
            && Number.isFinite(completionPrice)
            && promptPrice === 0
            && completionPrice === 0;
    },

    normalizeModel(rawModel) {
        if (!rawModel || typeof rawModel.id !== 'string' || !rawModel.id.trim()) return null;
        if (rawModel.id.trim() === 'openrouter/auto') return null;
        const outputModalities = Array.isArray(rawModel.architecture?.output_modalities)
            ? rawModel.architecture.output_modalities
            : [];
        const modality = String(rawModel.architecture?.modality || '');
        if (!outputModalities.includes('text') && !modality.endsWith('->text')) return null;

        if (rawModel.expiration_date) {
            const expirationTime = Date.parse(rawModel.expiration_date);
            if (Number.isFinite(expirationTime) && expirationTime <= Date.now()) return null;
        }

        const supportedParameters = Array.isArray(rawModel.supported_parameters)
            ? rawModel.supported_parameters
            : [];
        const inputModalities = Array.isArray(rawModel.architecture?.input_modalities)
            ? rawModel.architecture.input_modalities
            : [];
        const contextLength = Number(rawModel.context_length) || 0;
        if (contextLength <= OPENROUTER_MIN_CONTEXT_LENGTH_EXCLUSIVE) return null;
        const model = {
            id: rawModel.id.trim(),
            name: String(rawModel.name || rawModel.id).trim(),
            created: Number(rawModel.created) || 0,
            contextLength,
            provider: this.classifyProvider(rawModel.id),
            inputModalities,
            supportedParameters,
            pricing: rawModel.pricing || {},
        };
        model.isFree = this.isFreeModel(model);
        model.supportsVision = inputModalities.includes('image');
        model.supportsReasoning = supportedParameters.includes('reasoning')
            || supportedParameters.includes('include_reasoning');
        return model;
    },

    normalizeCachedModel(rawModel) {
        if (!rawModel || typeof rawModel.id !== 'string' || !rawModel.id.trim()) return null;
        if (rawModel.id.trim() === 'openrouter/auto') return null;
        const inputModalities = Array.isArray(rawModel.inputModalities)
            ? rawModel.inputModalities.filter((value) => typeof value === 'string')
            : [];
        const supportedParameters = Array.isArray(rawModel.supportedParameters)
            ? rawModel.supportedParameters.filter((value) => typeof value === 'string')
            : [];
        const contextLength = Number(rawModel.contextLength) || 0;
        if (contextLength <= OPENROUTER_MIN_CONTEXT_LENGTH_EXCLUSIVE) return null;
        const model = {
            id: rawModel.id.trim(),
            name: String(rawModel.name || rawModel.id).trim(),
            created: Number(rawModel.created) || 0,
            contextLength,
            provider: this.classifyProvider(rawModel.id),
            inputModalities,
            supportedParameters,
            pricing: rawModel.pricing && typeof rawModel.pricing === 'object'
                ? { ...rawModel.pricing }
                : {},
        };
        model.isFree = this.isFreeModel(model);
        model.supportsVision = inputModalities.includes('image');
        model.supportsReasoning = supportedParameters.includes('reasoning')
            || supportedParameters.includes('include_reasoning');
        return model;
    },

    serializeModels(models = this.models) {
        return models
            .filter((model) => Number(model.contextLength) > OPENROUTER_MIN_CONTEXT_LENGTH_EXCLUSIVE)
            .map((model) => ({
                id: model.id,
                name: model.name,
                created: model.created,
                contextLength: model.contextLength,
                provider: model.provider,
                inputModalities: [...model.inputModalities],
                supportedParameters: [...model.supportedParameters],
                pricing: { ...model.pricing },
                isFree: model.isFree,
                supportsVision: model.supportsVision,
                supportsReasoning: model.supportsReasoning,
            }));
    },

    compareModelsByDefault(left, right) {
        const providerComparison = this.getProviderLabel(left.provider).localeCompare(
            this.getProviderLabel(right.provider),
            'en',
            { sensitivity: 'base' }
        );
        if (providerComparison !== 0) return providerComparison;

        const releaseDateComparison = (Number(right.created) || 0) - (Number(left.created) || 0);
        if (releaseDateComparison !== 0) return releaseDateComparison;

        const modelNameComparison = this.getCleanDisplayName(right).localeCompare(
            this.getCleanDisplayName(left),
            'en',
            { numeric: true, sensitivity: 'base' }
        );
        if (modelNameComparison !== 0) return modelNameComparison;
        return left.id.localeCompare(right.id);
    },

    sortModels(models) {
        return [...models].sort((left, right) => this.compareModelsByDefault(left, right));
    },

    getOutputCostSortValue(model) {
        const rawCost = model.pricing?.completion;
        if (rawCost === null || rawCost === undefined || rawCost === '') return Number.POSITIVE_INFINITY;
        const cost = Number(rawCost);
        return Number.isFinite(cost) && cost >= 0 ? cost : Number.POSITIVE_INFINITY;
    },

    sortVisibleModels(models) {
        return [...models].sort((left, right) => {
            let comparison = 0;
            if (this.sortMode === 'cost') {
                const leftCost = this.getOutputCostSortValue(left);
                const rightCost = this.getOutputCostSortValue(right);
                if (leftCost !== rightCost) comparison = leftCost < rightCost ? -1 : 1;
            } else if (this.sortMode === 'context') {
                comparison = (Number(right.contextLength) || 0) - (Number(left.contextLength) || 0);
            }
            if (comparison === 0) comparison = this.compareModelsByDefault(left, right);
            return this.sortReversed ? -comparison : comparison;
        });
    },

    setSortMode(sortMode) {
        if (!['model', 'cost', 'context'].includes(sortMode)) return;
        if (this.sortMode === sortMode) {
            this.sortReversed = !this.sortReversed;
        } else {
            this.sortMode = sortMode;
            this.sortReversed = false;
        }
        this.renderModelList();
    },

    restoreCachedCatalog() {
        const uniqueModels = new Map();
        const cachedModels = Array.isArray(state.settings.openrouterModelCatalog)
            ? state.settings.openrouterModelCatalog
            : [];
        cachedModels.forEach((rawModel) => {
            const model = this.normalizeCachedModel(rawModel);
            if (model) uniqueModels.set(model.id, model);
        });
        this.models = this.sortModels([...uniqueModels.values()]);

        const fetchedAt = Number(state.settings.openrouterModelCatalogFetchedAt);
        this.lastFetchedAt = Number.isFinite(fetchedAt) && fetchedAt > 0
            ? new Date(fetchedAt)
            : null;
        return this.models;
    },

    async persistCatalog() {
        const serializedModels = this.serializeModels();
        const fetchedAt = this.lastFetchedAt instanceof Date
            ? this.lastFetchedAt.getTime()
            : null;
        state.settings.openrouterModelCatalog = serializedModels;
        state.settings.openrouterModelCatalogFetchedAt = fetchedAt;
        await Promise.all([
            dbUtils.saveSetting('openrouterModelCatalog', serializedModels),
            dbUtils.saveSetting('openrouterModelCatalogFetchedAt', fetchedAt),
        ]);
    },

    async clearCatalog() {
        this.models = [];
        this.visibleModelIds = [];
        this.lastFetchedAt = null;
        await this.persistCatalog();
    },

    async fetchModels(apiKey, fetchImplementation = fetch) {
        const trimmedApiKey = String(apiKey || '').trim();
        if (!trimmedApiKey) throw new Error('OpenRouter APIキーを入力してください。');

        const response = await fetchImplementation(OPENROUTER_MODEL_CATALOG_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${trimmedApiKey}`,
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            let detail = '';
            try {
                const errorData = await response.json();
                detail = errorData?.error?.message || errorData?.message || '';
            } catch {
                detail = '';
            }
            if (response.status === 401) throw new Error('OpenRouter APIキーを確認してください。');
            if (response.status === 429) throw new Error('OpenRouterのレート上限に達しました。時間を置いて再実行してください。');
            throw new Error(detail || `モデル一覧を取得できませんでした（HTTP ${response.status}）。`);
        }

        const payload = await response.json();
        if (!Array.isArray(payload?.data)) throw new Error('OpenRouterから不正なモデル一覧が返されました。');

        const uniqueModels = new Map();
        payload.data.forEach((rawModel) => {
            const model = this.normalizeModel(rawModel);
            if (model) uniqueModels.set(model.id, model);
        });
        this.models = this.sortModels([...uniqueModels.values()]);
        this.lastFetchedAt = new Date();
        return this.models;
    },

    getModel(modelId) {
        return this.models.find((model) => model.id === modelId) || null;
    },

    getProviderLabel(providerValue) {
        return OPENROUTER_MODEL_PROVIDERS.find((provider) => provider.value === providerValue)?.text
            || 'その他';
    },

    getCleanDisplayName(model) {
        return String(model?.name || model?.id || '').replace(/^[^:：]+[:：]\s*/, '');
    },

    getDisplayLabel(modelId) {
        const model = this.getModel(modelId);
        if (!model) return modelId;
        const displayName = this.getCleanDisplayName(model);
        if (model.isFree) return `${displayName} — free`;
        const completionPrice = this.formatPerMillionPrice(model.pricing?.completion);
        return `${displayName} — ${completionPrice === null ? '料金不明' : `$${completionPrice}/M`}`;
    },

    getSelectedIds() {
        const selected = Array.isArray(state.settings.openrouterSelectedModels)
            ? state.settings.openrouterSelectedModels
            : [];
        return [...new Set(selected.filter((modelId) => typeof modelId === 'string' && modelId && modelId !== 'openrouter/auto'))];
    },

    setSelectedIds(modelIds) {
        state.settings.openrouterSelectedModels = [...new Set(
            modelIds.filter((modelId) => typeof modelId === 'string' && modelId && modelId !== 'openrouter/auto')
        )];
        uiUtils.updateOpenRouterUserModelOptions();
        this.updateSelectedCount();
    },

    updateSelectedCount() {
        elements.openrouterSelectedModelCount.textContent = String(this.getSelectedIds().length);
    },

    getFilteredModels() {
        const selectedProviders = new Set(
            [...elements.openrouterModelProviderOptions.querySelectorAll('.openrouter-model-provider-checkbox:checked')]
                .map((checkbox) => checkbox.value)
        );
        const filteredModels = this.models.filter((model) => {
            if (!selectedProviders.has(model.provider)) return false;
            return true;
        });
        return this.sortVisibleModels(filteredModels);
    },

    renderProviderFilters() {
        elements.openrouterModelProviderOptions.innerHTML = '';
        const fragment = document.createDocumentFragment();
        OPENROUTER_MODEL_PROVIDERS.forEach((provider) => {
            const label = document.createElement('label');
            label.className = 'openrouter-model-provider-option';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = provider.value;
            checkbox.className = 'openrouter-model-provider-checkbox';
            checkbox.checked = provider.value !== 'other';
            checkbox.addEventListener('change', () => this.renderModelList());
            label.append(checkbox, document.createTextNode(provider.text));
            fragment.appendChild(label);
        });
        elements.openrouterModelProviderOptions.appendChild(fragment);
    },

    setAllProvidersSelected(selected) {
        elements.openrouterModelProviderOptions
            .querySelectorAll('.openrouter-model-provider-checkbox')
            .forEach((checkbox) => { checkbox.checked = selected; });
        this.renderModelList();
    },

    formatContextLength(contextLength) {
        if (!contextLength) return '不明';
        return formatCompactTokenCount(contextLength);
    },

    formatPerMillionPrice(pricePerToken) {
        const price = Number(pricePerToken);
        if (!Number.isFinite(price)) return null;
        const pricePerMillion = price * 1000000;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: pricePerMillion === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(pricePerMillion);
    },

    formatModelPrice(model, priceType) {
        if (model.isFree) return 'free';
        const price = this.formatPerMillionPrice(model.pricing?.[priceType]);
        return price === null ? '不明' : `$${price}/M`;
    },

    renderModelList() {
        const filteredModels = this.getFilteredModels();
        const selectedIds = new Set(this.getSelectedIds());
        this.visibleModelIds = filteredModels.map((model) => model.id);
        elements.openrouterModelCatalogList.innerHTML = '';
        elements.openrouterModelCatalogEmpty.classList.toggle('hidden', filteredModels.length > 0);

        if (filteredModels.length === 0) return;

        const table = document.createElement('table');
        table.className = 'openrouter-model-catalog-table';
        const tableHead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        [
            { label: 'モデル', sortMode: 'model', defaultAscending: true },
            { label: 'コスト', sortMode: 'cost', defaultAscending: true },
            { label: 'Context', sortMode: 'context', defaultAscending: false },
        ].forEach(({ label, sortMode, defaultAscending }) => {
            const headerCell = document.createElement('th');
            headerCell.scope = 'col';
            const sortButton = document.createElement('button');
            sortButton.type = 'button';
            sortButton.className = 'openrouter-model-sort-button';
            sortButton.textContent = label;
            sortButton.addEventListener('click', () => this.setSortMode(sortMode));
            if (this.sortMode === sortMode) {
                const ascending = this.sortReversed ? !defaultAscending : defaultAscending;
                headerCell.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
                sortButton.classList.add('active');
                const sortIndicator = document.createElement('span');
                sortIndicator.className = 'openrouter-model-sort-indicator';
                sortIndicator.textContent = ascending ? '↑' : '↓';
                sortButton.appendChild(sortIndicator);
            }
            headerCell.appendChild(sortButton);
            headerRow.appendChild(headerCell);
        });
        tableHead.appendChild(headerRow);

        const tableBody = document.createElement('tbody');
        filteredModels.forEach((model) => {
            const row = document.createElement('tr');

            const modelCell = document.createElement('td');
            const label = document.createElement('label');
            label.className = 'openrouter-model-selection';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedIds.has(model.id);
            checkbox.setAttribute('aria-label', `${this.getCleanDisplayName(model)}を選択`);
            checkbox.addEventListener('change', () => {
                const nextSelectedIds = new Set(this.getSelectedIds());
                if (checkbox.checked) nextSelectedIds.add(model.id);
                else nextSelectedIds.delete(model.id);
                this.setSelectedIds([...nextSelectedIds]);
            });
            const modelIdentity = document.createElement('span');
            modelIdentity.className = 'openrouter-model-identity';
            const provider = document.createElement('span');
            provider.textContent = this.getProviderLabel(model.provider);
            const name = document.createElement('strong');
            name.textContent = this.getCleanDisplayName(model);
            modelIdentity.append(provider, name);
            label.append(checkbox, modelIdentity);
            modelCell.appendChild(label);

            const costCell = document.createElement('td');
            costCell.className = 'openrouter-model-cost-cell';
            const inputCost = document.createElement('span');
            inputCost.textContent = `入力 ${this.formatModelPrice(model, 'prompt')}`;
            const outputCost = document.createElement('span');
            outputCost.textContent = `出力 ${this.formatModelPrice(model, 'completion')}`;
            costCell.append(inputCost, outputCost);
            const contextCell = document.createElement('td');
            contextCell.className = 'openrouter-model-context-cell';
            const contextLength = document.createElement('span');
            contextLength.textContent = this.formatContextLength(model.contextLength);
            contextCell.appendChild(contextLength);
            const capabilities = [
                model.supportsVision ? 'I' : '',
                model.supportsReasoning ? 'R' : '',
            ].filter(Boolean).join(' ');
            if (capabilities) {
                const capabilityLabels = document.createElement('span');
                capabilityLabels.className = 'openrouter-model-context-capabilities';
                capabilityLabels.textContent = capabilities;
                contextCell.appendChild(capabilityLabels);
            }

            row.append(
                modelCell,
                costCell,
                contextCell
            );
            tableBody.appendChild(row);
        });
        table.append(tableHead, tableBody);
        elements.openrouterModelCatalogList.appendChild(table);
    },

    setVisibleSelection(selected) {
        const nextSelectedIds = new Set(this.getSelectedIds());
        this.visibleModelIds.forEach((modelId) => {
            if (selected) nextSelectedIds.add(modelId);
            else nextSelectedIds.delete(modelId);
        });
        this.setSelectedIds([...nextSelectedIds]);
        this.renderModelList();
    },

    async handleFetchButtonClick() {
        const button = elements.fetchOpenrouterModelsBtn;
        button.disabled = true;
        const previousText = button.textContent;
        button.textContent = '取得中…';
        elements.openrouterModelFetchStatus.textContent = 'OpenRouterからモデル一覧を取得しています…';
        try {
            const apiKey = String(elements.openrouterApiKeyInput.value || '').trim();
            if (!apiKey) throw new Error('OpenRouter APIキーを入力してください。');
            await this.clearCatalog();
            elements.openrouterModelCatalogControls.classList.add('hidden');
            elements.openrouterModelCatalogList.innerHTML = '';
            uiUtils.updateOpenRouterUserModelOptions();
            const models = await this.fetchModels(apiKey);
            await this.persistCatalog();
            elements.openrouterModelCatalogControls.classList.remove('hidden');
            elements.openrouterModelFetchStatus.textContent = `${models.length}件のTextモデルを取得しました（${this.lastFetchedAt.toLocaleString()}）。`;
            this.renderModelList();
            uiUtils.updateOpenRouterUserModelOptions();
        } catch (error) {
            elements.openrouterModelFetchStatus.textContent = `取得失敗: ${error.message}`;
        } finally {
            button.disabled = false;
            button.textContent = previousText;
        }
    },

    initialize() {
        if (this.initialized) return;
        this.initialized = true;
        this.updateSelectedCount();
        this.renderProviderFilters();
        const cachedModels = this.restoreCachedCatalog();
        if (this.lastFetchedAt) {
            elements.openrouterModelCatalogControls.classList.remove('hidden');
            elements.openrouterModelFetchStatus.textContent = `${cachedModels.length}件のTextモデルを保存済みです（${this.lastFetchedAt.toLocaleString()}取得）。`;
            this.renderModelList();
            uiUtils.updateOpenRouterUserModelOptions();
        }
        elements.fetchOpenrouterModelsBtn.addEventListener('click', () => this.handleFetchButtonClick());
        elements.selectAllOpenrouterProvidersBtn.addEventListener('click', () => this.setAllProvidersSelected(true));
        elements.clearAllOpenrouterProvidersBtn.addEventListener('click', () => this.setAllProvidersSelected(false));
        elements.selectVisibleOpenrouterModelsBtn.addEventListener('click', () => this.setVisibleSelection(true));
        elements.clearVisibleOpenrouterModelsBtn.addEventListener('click', () => this.setVisibleSelection(false));
    },
};
