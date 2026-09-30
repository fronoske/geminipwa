import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');
const readRuntime = (name: string): string => readFile(`.build/runtime/${name}.js`);

const createContext = (extra: Record<string, unknown> = {}) => {
  const context = vm.createContext(extra);
  new vm.Script(readRuntime('app-config')).runInContext(context);
  new vm.Script(readRuntime('openrouter-model-catalog')).runInContext(context);
  return context;
};

describe('OpenRouter model catalog', () => {
  it('keeps only active text-output models and classifies hard-coded providers', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 'openai/new-text-model',
            name: 'New Text Model',
            created: 20,
            context_length: 2000000,
            architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] },
            pricing: { prompt: '0.000001', completion: '0.000002' },
            supported_parameters: ['reasoning'],
          },
          {
            id: 'qwen/free-text-model:free',
            name: 'Free Text Model',
            created: 10,
            context_length: 1048576,
            architecture: { modality: 'text->text' },
            pricing: { prompt: '0', completion: '0' },
          },
          {
            id: 'google/context-too-short',
            context_length: 1000000,
            architecture: { output_modalities: ['text'] },
          },
          {
            id: 'vendor/image-generator',
            architecture: { output_modalities: ['image'] },
          },
          {
            id: 'openrouter/auto',
            architecture: { output_modalities: ['text'] },
          },
          {
            id: 'anthropic/expired-model',
            expiration_date: '2000-01-01T00:00:00Z',
            architecture: { output_modalities: ['text'] },
          },
        ],
      }),
    }));
    const context = createContext({ fetch: fetchMock });

    const models = await new vm.Script("openRouterModelCatalog.fetchModels('secret-key')").runInContext(context);
    expect(Array.from(models, (model: { id: string }) => model.id)).toEqual([
      'google/context-too-short',
      'openai/new-text-model',
      'qwen/free-text-model:free',
    ]);
    expect(models.find((model: { id: string }) => model.id === 'openai/new-text-model')).toMatchObject({
      provider: 'openai', supportsVision: true, supportsReasoning: true, isFree: false,
    });
    expect(models.find((model: { id: string }) => model.id === 'qwen/free-text-model:free')).toMatchObject({
      provider: 'qwen', isFree: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models/user',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer secret-key' }),
      }),
    );
  });

  it('excludes batch variants by ID from fresh and cached catalogs', () => {
    const context = createContext();
    const freshBatch = new vm.Script(`openRouterModelCatalog.normalizeModel({
      id: 'openai/model:batch', name: 'Ordinary Label', context_length: 1000000,
      architecture: { output_modalities: ['text'] }
    })`).runInContext(context);
    const cachedBatch = new vm.Script(`openRouterModelCatalog.normalizeCachedModel({
      id: 'openai/model:BATCH', name: 'Ordinary Label', contextLength: 1000000
    })`).runInContext(context);
    const ordinary = new vm.Script(`openRouterModelCatalog.normalizeModel({
      id: 'openai/batch-research', name: 'Batch Research', context_length: 1000000,
      architecture: { output_modalities: ['text'] }
    })`).runInContext(context);
    expect(freshBatch).toBeNull();
    expect(cachedBatch).toBeNull();
    expect(ordinary).toMatchObject({ id: 'openai/batch-research' });
  });

  it('classifies latest aliases by their author while keeping unknown authors in the other group', () => {
    const context = createContext();
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('openai/gpt-terra-latest')").runInContext(context)).toBe('openai');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('~openai/gpt-terra-latest')").runInContext(context)).toBe('openai');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('~google/model')").runInContext(context)).toBe('google');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('~new-vendor/model')").runInContext(context)).toBe('other');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('~~openai/model')").runInContext(context)).toBe('other');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('new-vendor/model')").runInContext(context)).toBe('other');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('z-ai/model')").runInContext(context)).toBe('zai');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('meta/model')").runInContext(context)).toBe('meta');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('meta-llama/model')").runInContext(context)).toBe('meta');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('mistralai/model')").runInContext(context)).toBe('mistral');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('moonshotai/model')").runInContext(context)).toBe('moonshot');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('stealth/model')").runInContext(context)).toBe('stealth');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('x-ai/model')").runInContext(context)).toBe('xai');
  });

  it('sorts providers ascending and newest releases first within each provider', () => {
    const context = createContext();
    const sortedIds = new vm.Script(`
      openRouterModelCatalog.sortModels([
        { id: 'google/alpha', name: 'Google: Alpha', provider: 'google', created: 30 },
        { id: 'anthropic/middle', name: 'Anthropic: Middle', provider: 'anthropic', created: 10 },
        { id: 'google/zebra-2', name: 'Google: Zebra 2', provider: 'google', created: 20 },
        { id: 'google/zebra-10', name: 'Google: Zebra 10', provider: 'google', created: 20 }
      ]).map(model => model.id)
    `).runInContext(context);

    expect(Array.from(sortedIds)).toEqual([
      'anthropic/middle',
      'google/alpha',
      'google/zebra-10',
      'google/zebra-2',
    ]);
  });

  it('sorts output cost ascending and context length descending on demand', () => {
    const context = createContext();
    new vm.Script(`
      openRouterModelCatalog.models = [
        { id: 'google/high', name: 'Google: High', provider: 'google', created: 30, contextLength: 2000000, pricing: { completion: '0.00001' } },
        { id: 'google/free', name: 'Google: Free', provider: 'google', created: 20, contextLength: 3000000, pricing: { completion: '0' } },
        { id: 'google/low', name: 'Google: Low', provider: 'google', created: 10, contextLength: 5000000, pricing: { completion: '0.000001' } },
        { id: 'google/unknown', name: 'Google: Unknown', provider: 'google', created: 40, contextLength: 4000000, pricing: {} }
      ];
    `).runInContext(context);

    new vm.Script("openRouterModelCatalog.sortMode = 'cost'").runInContext(context);
    const byCost = new vm.Script('openRouterModelCatalog.sortVisibleModels(openRouterModelCatalog.models).map(model => model.id)').runInContext(context);
    expect(Array.from(byCost)).toEqual(['google/free', 'google/low', 'google/high', 'google/unknown']);

    new vm.Script('openRouterModelCatalog.sortReversed = true').runInContext(context);
    const byCostReversed = new vm.Script('openRouterModelCatalog.sortVisibleModels(openRouterModelCatalog.models).map(model => model.id)').runInContext(context);
    expect(Array.from(byCostReversed)).toEqual(['google/unknown', 'google/high', 'google/low', 'google/free']);

    new vm.Script("openRouterModelCatalog.sortMode = 'context'; openRouterModelCatalog.sortReversed = false").runInContext(context);
    const byContext = new vm.Script('openRouterModelCatalog.sortVisibleModels(openRouterModelCatalog.models).map(model => model.id)').runInContext(context);
    expect(Array.from(byContext)).toEqual(['google/low', 'google/unknown', 'google/free', 'google/high']);

    new vm.Script('openRouterModelCatalog.sortReversed = true').runInContext(context);
    const byContextReversed = new vm.Script('openRouterModelCatalog.sortVisibleModels(openRouterModelCatalog.models).map(model => model.id)').runInContext(context);
    expect(Array.from(byContextReversed)).toEqual(['google/high', 'google/free', 'google/unknown', 'google/low']);
  });

  it('formats prompt and completion costs per million tokens and resolves provider labels', () => {
    const context = createContext();
    const inputCost = new vm.Script(
      "openRouterModelCatalog.formatModelPrice({ isFree: false, pricing: { prompt: '0.0000025' } }, 'prompt')",
    ).runInContext(context);
    const outputCost = new vm.Script(
      "openRouterModelCatalog.formatModelPrice({ isFree: false, pricing: { completion: '0.00001' } }, 'completion')",
    ).runInContext(context);
    const freeCost = new vm.Script(
      "openRouterModelCatalog.formatModelPrice({ isFree: true, pricing: { prompt: '0' } }, 'prompt')",
    ).runInContext(context);
    expect(inputCost).toBe('$2.50/M');
    expect(outputCost).toBe('$10.00/M');
    expect(freeCost).toBe('free');
    expect(new vm.Script("openRouterModelCatalog.formatPerMillionPrice('0.000000123456')").runInContext(context)).toBe('0.12');
    expect(new vm.Script("openRouterModelCatalog.getProviderLabel('google')").runInContext(context)).toBe('Google');
    expect(new vm.Script("openRouterModelCatalog.getProviderLabel('unknown')").runInContext(context)).toBe('その他');
  });

  it('restores normalized model details and the fetch time from settings', () => {
    const context = createContext({
      state: {
        settings: {
          openrouterModelCatalog: [
            {
              id: 'google/model-id',
              name: 'Google: Display Name',
              created: 123,
              contextLength: 2000000,
              provider: 'incorrect-value',
              inputModalities: ['text', 'image'],
              supportedParameters: ['reasoning'],
              pricing: { prompt: '0.000001', completion: '0.000002' },
            },
            {
              id: '~openai/gpt-terra-latest',
              name: 'OpenAI: GPT Terra Latest',
              contextLength: 1050000,
              provider: 'other',
            },
          ],
          openrouterModelCatalogFetchedAt: 123456789,
        },
      },
    });

    const models = new vm.Script('openRouterModelCatalog.restoreCachedCatalog()').runInContext(context);
    expect(models[0]).toMatchObject({
      id: 'google/model-id',
      provider: 'google',
      contextLength: 2000000,
      supportsVision: true,
      supportsReasoning: true,
    });
    expect(models.find((model: { id: string }) => model.id === '~openai/gpt-terra-latest')).toMatchObject({
      id: '~openai/gpt-terra-latest',
      provider: 'openai',
    });
    expect(new vm.Script('openRouterModelCatalog.lastFetchedAt.getTime()').runInContext(context)).toBe(123456789);
    expect(new vm.Script("openRouterModelCatalog.getDisplayLabel('google/model-id')").runInContext(context)).toBe('Display Name — $2.00/M');
  });

  it('persists and clears the complete normalized catalog immediately', async () => {
    const saveSetting = vi.fn(async () => undefined);
    const state: { settings: Record<string, unknown> } = { settings: {} };
    const context = createContext({ state, dbUtils: { saveSetting } });
    new vm.Script(`
      openRouterModelCatalog.models = [{
        id: 'openai/model-id', name: 'OpenAI: Model', created: 20, contextLength: 2000000,
        provider: 'openai', inputModalities: ['text'], supportedParameters: [],
        pricing: { prompt: '0.000001', completion: '0.000002' },
        isFree: false, supportsVision: false, supportsReasoning: false
      }];
      openRouterModelCatalog.lastFetchedAt = new Date(987654321);
    `).runInContext(context);

    await new vm.Script('openRouterModelCatalog.persistCatalog()').runInContext(context);
    expect(state.settings.openrouterModelCatalog).toHaveLength(1);
    expect(state.settings.openrouterModelCatalogFetchedAt).toBe(987654321);
    expect(saveSetting).toHaveBeenCalledWith('openrouterModelCatalog', state.settings.openrouterModelCatalog);
    expect(saveSetting).toHaveBeenCalledWith('openrouterModelCatalogFetchedAt', 987654321);

    await new vm.Script('openRouterModelCatalog.clearCatalog()').runInContext(context);
    expect(state.settings.openrouterModelCatalog).toEqual([]);
    expect(state.settings.openrouterModelCatalogFetchedAt).toBeNull();
    expect(new vm.Script('openRouterModelCatalog.models.length').runInContext(context)).toBe(0);
  });

  it('shows the fetched display name and output cost while retaining the model ID internally', () => {
    const context = createContext();
    new vm.Script("openRouterModelCatalog.models = [{ id: 'google/model-id', name: 'Google: Display Name', isFree: false, pricing: { completion: '0.00001' } }, { id: 'google/free-id', name: 'Google: Free Name', isFree: true, pricing: { completion: '0' } }]").runInContext(context);
    expect(new vm.Script("openRouterModelCatalog.getDisplayLabel('google/model-id')").runInContext(context)).toBe('Display Name — $10.00/M');
    expect(new vm.Script("openRouterModelCatalog.getDisplayLabel('google/free-id')").runInContext(context)).toBe('Free Name — free');
    expect(new vm.Script("openRouterModelCatalog.getDisplayLabel('manual/model-id')").runInContext(context)).toBe('manual/model-id');
  });

  it('ignores legacy manual models and selects an available checked model', () => {
    const selectedGroup = {
      children: [] as Array<{ value: string; textContent: string }>,
      disabled: false,
      set innerHTML(_value: string) { this.children = []; },
      appendChild(option: { value: string; textContent: string }) { this.children.push(option); },
    };
    const modelSelect = {
      value: 'manual/legacy-model',
      get options() { return selectedGroup.children; },
    };
    const state = { settings: {
      openrouterSelectedModels: ['google/available-model'],
      openrouterAdditionalModels: 'manual/legacy-model',
      openrouterModelName: 'manual/legacy-model',
    } };
    const context = createContext({
      state,
      elements: {
        openrouterSelectedModelsGroup: selectedGroup,
        openrouterModelNameSelect: modelSelect,
        openrouterSelectedModelCount: { textContent: '' },
      },
      document: { createElement: () => ({ value: '', textContent: '' }) },
      uiUtils: {},
    });
    new vm.Script(readRuntime('ui-header-controls')).runInContext(context);
    new vm.Script('uiUtils.updateOpenRouterUserModelOptions()').runInContext(context);

    expect(selectedGroup.children.map((option) => option.value)).toEqual(['google/available-model']);
    expect(modelSelect.value).toBe('google/available-model');
    expect(state.settings.openrouterModelName).toBe('google/available-model');
  });

  it('filters available models by name or ID', () => {
    const searchInput = { value: '' };
    const providerOptions = {
      querySelectorAll: () => [{ value: 'google' }, { value: 'openai' }],
    };
    const context = createContext({
      elements: {
        openrouterModelSearchInput: searchInput,
        openrouterModelProviderOptions: providerOptions,
      },
    });
    new vm.Script(`
      openRouterModelCatalog.models = [
        { id: 'google/alpha', name: 'Google: Alpha Model', provider: 'google', created: 2 },
        { id: 'openai/beta', name: 'OpenAI: Beta Model', provider: 'openai', created: 1 }
      ];
    `).runInContext(context);

    searchInput.value = 'ALPHA';
    const byName = new vm.Script('openRouterModelCatalog.getFilteredModels().map(model => model.id)').runInContext(context);
    expect(Array.from(byName)).toEqual(['google/alpha']);
    searchInput.value = 'OPENAI/BETA';
    const byId = new vm.Script('openRouterModelCatalog.getFilteredModels().map(model => model.id)').runInContext(context);
    expect(Array.from(byId)).toEqual(['openai/beta']);

  });

  it('removes unavailable and batch IDs after a successful response while preserving other variants', async () => {
    const saveSetting = vi.fn(async () => undefined);
    const state = { settings: {
      openrouterSelectedModels: ['google/removed', 'google/available', 'google/image-only', 'google/available:batch'],
      openrouterModelName: 'google/removed',
    } };
    const count = { textContent: '' };
    const context = createContext({
      state,
      fetch: vi.fn(async () => ({
        ok: true,
        json: async () => ({ data: [
          { id: 'google/available', context_length: 1000000, architecture: { output_modalities: ['text'] } },
          { id: 'google/image-only', context_length: 1000000, architecture: { output_modalities: ['image'] } },
          { id: 'google/available:batch', context_length: 1000000, architecture: { output_modalities: ['text'] } },
        ] }),
      })),
      elements: { openrouterSelectedModelCount: count },
      dbUtils: { saveSetting },
      uiUtils: {
        updateOpenRouterUserModelOptions: () => {
          if (!state.settings.openrouterSelectedModels.includes(state.settings.openrouterModelName)) {
            state.settings.openrouterModelName = state.settings.openrouterSelectedModels[0] || '';
          }
        },
      },
    });
    expect(await new vm.Script('openRouterModelCatalog.pruneUnavailableSelectedModels()').runInContext(context)).toBe(0);
    expect(state.settings.openrouterSelectedModels).toHaveLength(4);
    expect(saveSetting).not.toHaveBeenCalled();
    await new vm.Script("openRouterModelCatalog.fetchModels('secret-key')").runInContext(context);

    const removedCount = await new vm.Script('openRouterModelCatalog.pruneUnavailableSelectedModels()').runInContext(context);
    expect(removedCount).toBe(2);
    expect(state.settings.openrouterSelectedModels).toEqual(['google/available', 'google/image-only']);
    expect(state.settings.openrouterModelName).toBe('google/available');
    expect(count.textContent).toBe('2');
    expect(saveSetting).toHaveBeenCalledWith('openrouterSelectedModels', ['google/available', 'google/image-only']);
    expect(saveSetting).toHaveBeenCalledWith('openrouterModelName', 'google/available');
  });

  it('reports missing and unauthorized API keys without exposing the key', async () => {
    const context = createContext({
      fetch: vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
    });
    await expect(
      new vm.Script("openRouterModelCatalog.fetchModels('')").runInContext(context),
    ).rejects.toThrow('OpenRouter APIキーを入力してください。');
    await expect(
      new vm.Script("openRouterModelCatalog.fetchModels('do-not-display')").runInContext(context),
    ).rejects.toThrow('OpenRouter APIキーを確認してください。');
  });
});
