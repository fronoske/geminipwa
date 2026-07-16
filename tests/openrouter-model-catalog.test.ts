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
            context_length: 128000,
            architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] },
            pricing: { prompt: '0.000001', completion: '0.000002' },
            supported_parameters: ['reasoning'],
          },
          {
            id: 'qwen/free-text-model:free',
            name: 'Free Text Model',
            created: 10,
            architecture: { modality: 'text->text' },
            pricing: { prompt: '0', completion: '0' },
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
      'openai/new-text-model',
      'qwen/free-text-model:free',
    ]);
    expect(models[0]).toMatchObject({ provider: 'openai', supportsVision: true, supportsReasoning: true, isFree: false });
    expect(models[1]).toMatchObject({ provider: 'qwen', isFree: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models/user',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer secret-key' }),
      }),
    );
  });

  it('puts unknown model authors into the other provider group', () => {
    const context = createContext();
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('new-vendor/model')").runInContext(context)).toBe('other');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('z-ai/model')").runInContext(context)).toBe('zai');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('meta-llama/model')").runInContext(context)).toBe('other');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('mistralai/model')").runInContext(context)).toBe('other');
    expect(new vm.Script("openRouterModelCatalog.classifyProvider('x-ai/model')").runInContext(context)).toBe('xai');
  });

  it('formats prompt and completion costs per million tokens without repeating the provider', () => {
    const context = createContext();
    const paidCost = new vm.Script(
      "openRouterModelCatalog.formatModelCost({ isFree: false, pricing: { prompt: '0.0000025', completion: '0.00001' } })",
    ).runInContext(context);
    const freeCost = new vm.Script(
      "openRouterModelCatalog.formatModelCost({ isFree: true, pricing: { prompt: '0', completion: '0' } })",
    ).runInContext(context);
    expect(paidCost).toBe('入力 $2.50/M · 出力 $10.00/M');
    expect(freeCost).toBe('無料');
    const source = readFile('src/openrouter-model-catalog.ts');
    expect(source).not.toContain('getProviderLabel');
  });

  it('shows the fetched display name and output cost while retaining the model ID internally', () => {
    const context = createContext();
    new vm.Script("openRouterModelCatalog.models = [{ id: 'google/model-id', name: 'Google: Display Name', isFree: false, pricing: { completion: '0.00001' } }, { id: 'google/free-id', name: 'Google: Free Name', isFree: true, pricing: { completion: '0' } }]").runInContext(context);
    expect(new vm.Script("openRouterModelCatalog.getDisplayLabel('google/model-id')").runInContext(context)).toBe('Google: Display Name — $10.00/M');
    expect(new vm.Script("openRouterModelCatalog.getDisplayLabel('google/free-id')").runInContext(context)).toBe('Google: Free Name — free');
    expect(new vm.Script("openRouterModelCatalog.getDisplayLabel('manual/model-id')").runInContext(context)).toBe('manual/model-id');
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
