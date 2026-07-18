// @ts-nocheck -- Enable after shared application and DOM types are defined.
// Bundled into the generated index.html from this TypeScript source.
const openRouterModelCatalog = {
    models: [],
    visibleModelIds: [],
    lastFetchedAt: null,
    initialized: false,

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
        const model = {
            id: rawModel.id.trim(),
            name: String(rawModel.name || rawModel.id).trim(),
            created: Number(rawModel.created) || 0,
            contextLength: Number(rawModel.context_length) || 0,
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
        this.models = [...uniqueModels.values()].sort((left, right) =>
            right.created - left.created || left.id.localeCompare(right.id)
        );
        this.lastFetchedAt = new Date();
        return this.models;
    },

    getModel(modelId) {
        return this.models.find((model) => model.id === modelId) || null;
    },

    getDisplayLabel(modelId) {
        const model = this.getModel(modelId);
        if (!model) return modelId;
        const displayName = model.name.replace(/^[^:：]+[:：]\s*/, '');
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
        const price = elements.openrouterModelPriceFilter.value;
        const minimumContext = Number(elements.openrouterModelContextFilter.value) || 0;
        const visionOnly = elements.openrouterModelVisionFilter.checked;
        const reasoningOnly = elements.openrouterModelReasoningFilter.checked;

        return this.models.filter((model) => {
            if (!selectedProviders.has(model.provider)) return false;
            if (price === 'free' && !model.isFree) return false;
            if (price === 'paid' && model.isFree) return false;
            if (minimumContext && model.contextLength < minimumContext) return false;
            if (visionOnly && !model.supportsVision) return false;
            if (reasoningOnly && !model.supportsReasoning) return false;
            return true;
        });
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

    formatModelCost(model) {
        if (model.isFree) return '無料';
        const promptPrice = this.formatPerMillionPrice(model.pricing?.prompt);
        const completionPrice = this.formatPerMillionPrice(model.pricing?.completion);
        if (promptPrice === null && completionPrice === null) return '料金不明';
        return [
            promptPrice === null ? '' : `入力 $${promptPrice}/M`,
            completionPrice === null ? '' : `出力 $${completionPrice}/M`,
        ].filter(Boolean).join(' · ');
    },

    renderModelList() {
        const filteredModels = this.getFilteredModels();
        const selectedIds = new Set(this.getSelectedIds());
        this.visibleModelIds = filteredModels.map((model) => model.id);
        elements.openrouterModelCatalogList.innerHTML = '';
        elements.openrouterModelCatalogEmpty.classList.toggle('hidden', filteredModels.length > 0);

        const fragment = document.createDocumentFragment();
        filteredModels.forEach((model) => {
            const label = document.createElement('label');
            label.className = 'openrouter-model-catalog-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedIds.has(model.id);
            checkbox.addEventListener('change', () => {
                const nextSelectedIds = new Set(this.getSelectedIds());
                if (checkbox.checked) nextSelectedIds.add(model.id);
                else nextSelectedIds.delete(model.id);
                this.setSelectedIds([...nextSelectedIds]);
            });

            const text = document.createElement('span');
            text.className = 'openrouter-model-catalog-item-text';
            const name = document.createElement('strong');
            name.textContent = model.name;
            const cost = document.createElement('span');
            cost.className = 'openrouter-model-catalog-item-cost';
            cost.textContent = this.formatModelCost(model);
            const metadata = document.createElement('span');
            metadata.className = 'openrouter-model-catalog-item-meta';
            metadata.textContent = [
                `Context ${this.formatContextLength(model.contextLength)}`,
                model.supportsVision ? '画像入力' : '',
                model.supportsReasoning ? 'Reasoning' : '',
            ].filter(Boolean).join(' · ');
            text.append(name, cost, metadata);
            label.append(checkbox, text);
            fragment.appendChild(label);
        });
        elements.openrouterModelCatalogList.appendChild(fragment);
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
            const models = await this.fetchModels(elements.openrouterApiKeyInput.value);
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
        elements.fetchOpenrouterModelsBtn.addEventListener('click', () => this.handleFetchButtonClick());
        [
            elements.openrouterModelPriceFilter,
            elements.openrouterModelContextFilter,
            elements.openrouterModelVisionFilter,
            elements.openrouterModelReasoningFilter,
        ].forEach((control) => {
            control.addEventListener(control.tagName === 'INPUT' && control.type === 'search' ? 'input' : 'change', () => this.renderModelList());
        });
        elements.selectAllOpenrouterProvidersBtn.addEventListener('click', () => this.setAllProvidersSelected(true));
        elements.clearAllOpenrouterProvidersBtn.addEventListener('click', () => this.setAllProvidersSelected(false));
        elements.selectVisibleOpenrouterModelsBtn.addEventListener('click', () => this.setVisibleSelection(true));
        elements.clearVisibleOpenrouterModelsBtn.addEventListener('click', () => this.setVisibleSelection(false));
    },
};
