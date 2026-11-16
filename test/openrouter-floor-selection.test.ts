import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

class FakeElement {
  children: FakeElement[] = [];
  textContent = '';
  checked = false;
  value = '';
  className = '';
  dataset: Record<string, string> = {};
  private listeners = new Map<string, () => void>();
  classList = { add: () => {}, toggle: () => {} };

  set innerHTML(_value: string) { this.children = []; }
  append(...children: FakeElement[]) { this.children.push(...children); }
  appendChild(child: FakeElement) { this.children.push(child); }
  setAttribute(_name: string, _value: string) {}
  addEventListener(name: string, listener: () => void) { this.listeners.set(name, listener); }
  trigger(name: string) { this.listeners.get(name)?.(); }
}

const source = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'openrouter-model-catalog.ts'), 'utf8');
const headerSource = fs.readFileSync(path.join(import.meta.dirname, '..', 'src', 'ui-header-controls.ts'), 'utf8');

const createCatalog = (fetchMock?: ReturnType<typeof vi.fn>, observerClass?: unknown) => {
  const elements = {
    openrouterModelFloorToggle: new FakeElement(),
    openrouterApiKeyInput: new FakeElement(),
    openrouterModelSearchInput: new FakeElement(),
    openrouterModelProviderOptions: { querySelectorAll: () => [{ value: 'google' }] },
    openrouterModelCatalogList: new FakeElement(),
    openrouterModelCatalogEmpty: new FakeElement(),
    openrouterSelectedModelCount: new FakeElement(),
  };
  const state = { settings: { openrouterSelectedModels: [] as string[], openrouterModelName: '' } };
  const saves: [string, unknown][] = [];
  const context = {
    elements,
    state,
    document: { createElement: () => new FakeElement() },
    OPENROUTER_MODEL_PROVIDERS: [{ value: 'google', text: 'Google', prefixes: ['google'] }],
    formatCompactTokenCount: (value: number) => String(value),
    uiUtils: { updateOpenRouterUserModelOptions: () => {} },
    dbUtils: { saveSetting: async (name: string, value: unknown) => { saves.push([name, value]); } },
    fetch: fetchMock,
    IntersectionObserver: observerClass,
  };
  const vmContext = vm.createContext(context);
  const catalog = new vm.Script(`${source}\nopenRouterModelCatalog`).runInContext(vmContext) as {
    models: Record<string, unknown>[];
    latestModelIds: Set<string> | null;
    visibleModelIds: string[];
    renderModelList(): void;
    getModel(id: string): { contextLength: number } | null;
    getDisplayLabel(id: string): string;
    getSelectedIds(): string[];
    setVisibleSelection(selected: boolean): void;
    pruneUnavailableSelectedModels(): Promise<number>;
    clearFloorPrices(): void;
    requestFloorPrices(modelId: string): Promise<{ completion: number | null } | null>;
  };
  catalog.models = [{
    id: 'google/gemini-3.8-flash',
    name: 'Google: Gemini 3.8 Flash',
    provider: 'google',
    contextLength: 1_000_000,
    pricing: { prompt: '0.00000075', completion: '0.00000375' },
    created: 1,
    isFree: false,
  }];
  return { catalog, elements, state, saves, vmContext };
};

describe('OpenRouter :floor selection', () => {
  it('shows one row in either view and keeps both selections independent', () => {
    const { catalog, elements, state } = createCatalog();
    catalog.renderModelList();
    expect(catalog.visibleModelIds).toEqual(['google/gemini-3.8-flash']);
    expect(elements.openrouterModelCatalogList.children[0].children[1].children).toHaveLength(1);
    catalog.setVisibleSelection(true);

    elements.openrouterModelFloorToggle.checked = true;
    catalog.renderModelList();
    expect(catalog.visibleModelIds).toEqual(['google/gemini-3.8-flash:floor']);
    expect(elements.openrouterModelCatalogList.children[0].children[1].children).toHaveLength(1);
    catalog.setVisibleSelection(true);
    expect(catalog.getSelectedIds()).toEqual([
      'google/gemini-3.8-flash',
      'google/gemini-3.8-flash:floor',
    ]);
    expect(state.settings.openrouterSelectedModels).toHaveLength(2);

    catalog.setVisibleSelection(false);
    expect(catalog.getSelectedIds()).toEqual(['google/gemini-3.8-flash']);
    expect(catalog.getModel('google/gemini-3.8-flash:floor')?.contextLength).toBe(1_000_000);
    expect(catalog.getDisplayLabel('google/gemini-3.8-flash:floor')).toBe('Gemini 3.8 Flash(:floor) — APIキー未入力');
  });

  it('keeps a selected floor variant when its catalog model still exists', async () => {
    const { catalog, state, saves } = createCatalog();
    state.settings.openrouterSelectedModels = [
      'google/gemini-3.8-flash:floor',
      'google/removed-model:floor',
    ];
    catalog.latestModelIds = new Set(['google/gemini-3.8-flash']);

    expect(await catalog.pruneUnavailableSelectedModels()).toBe(1);
    expect(catalog.getSelectedIds()).toEqual(['google/gemini-3.8-flash:floor']);
    expect(saves[0][0]).toBe('openrouterSelectedModels');
  });

  it('shows the lowest eligible endpoint prices and reuses them after toggling', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { endpoints: [
        { service_tier: null, pricing: { prompt: '0.00000075', completion: '0.00000375' } },
        { service_tier: 'flex', pricing: { prompt: '0.000000375', completion: '0.000001875' } },
        { service_tier: 'priority', pricing: { prompt: '0.0000001', completion: '0.0000001' } },
      ] } }),
    }));
    const { catalog, elements } = createCatalog(fetchMock);
    elements.openrouterApiKeyInput.value = 'test-key';
    elements.openrouterModelFloorToggle.checked = true;
    catalog.renderModelList();
    const costCell = elements.openrouterModelCatalogList.children[0].children[1].children[0].children[1];
    await vi.waitFor(() => expect(costCell.children[0].textContent).toBe('入力 $0.375/M'));
    expect(costCell.children[1].textContent).toBe('出力 $1.875/M');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models/google/gemini-3.8-flash/endpoints',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-key' }) }),
    );

    elements.openrouterModelFloorToggle.checked = false;
    catalog.renderModelList();
    elements.openrouterModelFloorToggle.checked = true;
    catalog.renderModelList();
    const cachedCostCell = elements.openrouterModelCatalogList.children[0].children[1].children[0].children[1];
    expect(cachedCostCell.children[0].textContent).toBe('入力 $0.375/M');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    catalog.clearFloorPrices();
    catalog.renderModelList();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('waits until a floor row is visible before requesting its endpoint prices', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { endpoints: [
        { service_tier: 'flex', pricing: { prompt: '0.000000375', completion: '0.000001875' } },
      ] } }),
    }));
    let observer: {
      show(row: FakeElement): void;
    };
    class FakeObserver {
      constructor(private callback: (entries: { isIntersecting: boolean; target: FakeElement }[]) => void) {
        observer = this;
      }
      observe(_row: FakeElement) {}
      unobserve(_row: FakeElement) {}
      disconnect() {}
      show(row: FakeElement) { this.callback([{ isIntersecting: true, target: row }]); }
    }
    const { catalog, elements } = createCatalog(fetchMock, FakeObserver);
    elements.openrouterApiKeyInput.value = 'test-key';
    elements.openrouterModelFloorToggle.checked = true;
    catalog.renderModelList();
    expect(fetchMock).not.toHaveBeenCalled();

    const row = elements.openrouterModelCatalogList.children[0].children[1].children[0];
    observer!.show(row);
    await vi.waitFor(() => expect(row.children[1].children[0].textContent).toBe('入力 $0.375/M'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('updates selected model labels after the floor price loads without changing the active model', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { endpoints: [
        { service_tier: null, pricing: { prompt: '0.00000075', completion: '0.00000375' } },
        { service_tier: 'flex', pricing: { prompt: '0.000000375', completion: '0.000001875' } },
      ] } }),
    }));
    const { catalog, elements, state, vmContext } = createCatalog(fetchMock);
    catalog.models.push({
      id: 'google/gemini-4-hydrogen',
      name: 'Google: Gemini 4 Hydrogen',
      provider: 'google',
      contextLength: 1_000_000,
      pricing: { prompt: '0.00000075', completion: '0.00000375' },
      created: 2,
      isFree: false,
    });
    const selectedGroup = new FakeElement();
    const modelSelect = {
      value: 'google/gemini-3.8-flash:floor',
      get options() { return selectedGroup.children; },
    };
    Object.assign(elements, {
      openrouterSelectedModelsGroup: selectedGroup,
      openrouterModelNameSelect: modelSelect,
    });
    state.settings.openrouterSelectedModels = [
      'google/gemini-4-hydrogen:floor',
      'google/gemini-3.8-flash:floor',
      'google/gemini-3.8-flash',
    ];
    state.settings.openrouterModelName = 'google/gemini-3.8-flash:floor';
    elements.openrouterApiKeyInput.value = 'test-key';
    new vm.Script(headerSource).runInContext(vmContext);
    const uiUtils = (vmContext as { uiUtils: { updateOpenRouterUserModelOptions(): void } }).uiUtils;
    uiUtils.updateOpenRouterUserModelOptions();
    expect(selectedGroup.children.map((option) => option.textContent)).toEqual([
      'Gemini 3.8 Flash — $3.75/M',
      'Gemini 3.8 Flash(:floor) — 料金取得中',
      'Gemini 4 Hydrogen(:floor) — 料金取得中',
    ]);

    await catalog.requestFloorPrices('google/gemini-3.8-flash');
    expect(selectedGroup.children.map((option) => option.textContent)).toEqual([
      'Gemini 3.8 Flash — $3.75/M',
      'Gemini 3.8 Flash(:floor) — $1.875/M',
      'Gemini 4 Hydrogen(:floor) — 料金取得中',
    ]);
    expect(modelSelect.value).toBe('google/gemini-3.8-flash:floor');
    expect(state.settings.openrouterModelName).toBe('google/gemini-3.8-flash:floor');
  });
});
