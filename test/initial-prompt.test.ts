import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const runtime = fs.readFileSync(
  path.resolve(import.meta.dirname, '../.build/runtime/initial-prompts.js'), 'utf8',
);

const createContext = () => {
  const state = { initialPromptRecords: [] as any[], currentInitialPromptId: null as string | null, currentMessages: [] as any[], isSending: false, areAllMessagesHidden: false, currentScreen: 'initial-prompt-editor' };
  const saved: any[][] = [];
  const alerts: string[] = [];
  const dbUtils = {
    putInitialPrompts: vi.fn(async (records: any[]) => { saved.push(records); }),
    putInitialPrompt: vi.fn(async () => undefined),
    deleteInitialPrompt: vi.fn(async (_id: string) => undefined),
  };
  const uiUtils = {
    showCustomConfirm: vi.fn(async () => true),
    showCustomAlert: vi.fn(async (message: string) => { alerts.push(message); }),
    updateInitialPromptMenuItem: vi.fn(),
    renderChatMessages: vi.fn(),
  };
  const node = () => {
    const children: any[] = [];
    return {
      className: '', textContent: '', type: '', open: false, children,
      classList: { add: vi.fn() },
      addEventListener: vi.fn(),
      append: vi.fn((...items: any[]) => children.push(...items)),
      appendChild: vi.fn((item: any) => children.push(item)),
    };
  };
  const elements = {
    initialPromptManagementList: { replaceChildren: vi.fn(), appendChild: vi.fn() },
    noInitialPromptsMessage: { classList: { toggle: vi.fn() } },
    initialPromptTitle: { value: '' },
    initialPromptBody: { value: '' },
  };
  const history = { back: vi.fn() };
  const context = vm.createContext({ state, dbUtils, uiUtils, elements, history,
    crypto: { randomUUID: () => 'generated-id' }, document: { createElement: node } });
  new vm.Script(runtime).runInContext(context);
  const utils = new vm.Script('initialPromptUtils').runInContext(context);
  return { utils, state, saved, alerts, dbUtils, uiUtils, elements, history };
};

describe('初回ユーザープロンプト', () => {
  it('combines the saved prompt and typed input in one user text, in that order', () => {
    const { utils } = createContext();
    const message = {
      role: 'user', content: '今日の相談です。',
      initialPrompt: { id: 'opening-1', title: '相談', text: '背景を踏まえて答えてください。' },
    };
    expect(utils.formatUserText(message)).toBe(
      '【初回プロンプト：相談】\n背景を踏まえて答えてください。\n\n【ユーザー入力】\n今日の相談です。',
    );
    expect(utils.formatUserText({ role: 'user', content: '通常の質問' })).toBe('通常の質問');
    expect(utils.normalizeSnapshot({ id: 'a', title: '', text: 'body' })).toBeNull();
  });

  it('shows an applied prompt as a collapsed user bubble before the typed input', () => {
    const { utils, state } = createContext();
    const container = { appendChild: vi.fn() };
    const snapshot = { id: 'opening-1', title: '相談', text: '背景を踏まえて答えてください。' };

    utils.appendReference(container, snapshot);
    const bubble = container.appendChild.mock.calls[0][0];
    expect(bubble.classList.add).toHaveBeenCalledWith('message', 'user', 'initial-prompt-message');
    const details = bubble.children[0].children[0];
    expect(details.open).toBe(false);
    expect(details.children[0].textContent).toBe('初回プロンプト：相談');
    expect(details.children[1].textContent).toBe(snapshot.text);

    state.areAllMessagesHidden = true;
    utils.appendReference(container, snapshot);
    expect(container.appendChild.mock.calls[1][0].classList.add).toHaveBeenCalledWith('message-hidden-by-toggle');

    utils.appendReference(container, snapshot, { preview: true });
    const preview = container.appendChild.mock.calls[2][0];
    expect(preview.classList.add).toHaveBeenCalledWith('initial-prompt-preview');
    expect(preview.children[0].children[0].children[0].textContent).toBe('初回プロンプト：相談（未送信）');
  });

  it('validates the entire JSON before an atomic import and confirms ID collisions', async () => {
    const { utils, state, saved, alerts, dbUtils, uiUtils } = createContext();
    state.initialPromptRecords.push({ id: 'a', title: '旧', text: '旧本文', createdAt: 1, updatedAt: 1 });
    const invalid = {
      format: 'GeminiPWA Initial Prompts', version: 1,
      prompts: [
        { id: 'b', title: '有効', text: '本文', createdAt: 2, updatedAt: 2 },
        { id: 'c', title: '', text: '本文', createdAt: 3, updatedAt: 3 },
      ],
    };
    await utils.importAll({ text: async () => JSON.stringify(invalid) });
    expect(saved).toHaveLength(0);
    expect(alerts.at(-1)).toContain('JSON取込に失敗');

    const valid = {
      ...invalid,
      prompts: [{ id: 'a', title: '新', text: '新本文', createdAt: 1, updatedAt: 4 }],
    };
    uiUtils.showCustomConfirm.mockResolvedValueOnce(false);
    await utils.importAll({ text: async () => JSON.stringify(valid) });
    expect(saved).toHaveLength(0);

    await utils.importAll({ text: async () => JSON.stringify(valid) });
    expect(dbUtils.putInitialPrompts).toHaveBeenCalledOnce();
    expect(saved[0][0].title).toBe('新');
    expect(state.initialPromptRecords[0].title).toBe('新');
  });

  it('saves an edited title and body under the same stable ID', async () => {
    const { utils, state, dbUtils, elements, history } = createContext();
    state.initialPromptRecords.push({ id: 'a', title: '旧', text: '旧本文', createdAt: 1, updatedAt: 1 });
    utils.editingId = 'a';
    elements.initialPromptTitle.value = '新タイトル';
    elements.initialPromptBody.value = '新しい本文';
    await utils.saveEditor();
    expect(dbUtils.putInitialPrompt).toHaveBeenCalledWith(expect.objectContaining({
      id: 'a', title: '新タイトル', text: '新しい本文', createdAt: 1,
    }));
    expect(state.initialPromptRecords[0].title).toBe('新タイトル');
    expect(history.back).toHaveBeenCalledOnce();
  });

  it('places JSON export between Edit and Delete and removes a confirmed selected prompt', async () => {
    const { utils, state, dbUtils, uiUtils, elements } = createContext();
    state.initialPromptRecords.push({ id: 'a', title: '削除対象', text: '本文', createdAt: 1, updatedAt: 1 });
    state.currentInitialPromptId = 'a';
    utils.renderList();
    const row = (elements.initialPromptManagementList.appendChild as any).mock.calls[0][0];
    expect(row.children[1].children.map((button: any) => button.textContent)).toEqual(['編集', 'JSON出力', '削除']);
    expect(row.children[1].children[2].classList.add).toHaveBeenCalledWith('danger');

    uiUtils.showCustomConfirm.mockResolvedValueOnce(false);
    await utils.deleteRecord('a');
    expect(dbUtils.deleteInitialPrompt).not.toHaveBeenCalled();
    expect(state.currentInitialPromptId).toBe('a');

    await utils.deleteRecord('a');
    expect(dbUtils.deleteInitialPrompt).toHaveBeenCalledWith('a');
    expect(state.initialPromptRecords).toHaveLength(0);
    expect(state.currentInitialPromptId).toBeNull();
    expect(uiUtils.renderChatMessages).toHaveBeenCalledWith(true);
    expect(uiUtils.updateInitialPromptMenuItem).toHaveBeenCalledOnce();
  });

  it('exports one prompt in the same JSON envelope accepted by bulk import', async () => {
    const { utils, state } = createContext();
    const record = { id: 'a', title: '相談/導入', text: '本文', createdAt: 1, updatedAt: 1 };
    state.initialPromptRecords.push(record);
    utils.downloadJson = vi.fn();

    utils.exportOne('a');
    expect(utils.downloadJson).toHaveBeenCalledWith([record], '相談_導入.initial-prompt.json');
    utils.exportOne('missing');
    expect(utils.downloadJson).toHaveBeenCalledOnce();

    const data = JSON.parse(JSON.stringify(utils.createExportData(utils.downloadJson.mock.calls[0][0])));
    const imported = createContext();
    await imported.utils.importAll({ text: async () => JSON.stringify(data) });
    expect(imported.saved[0]).toEqual([record]);
  });

  it('keeps applied chat snapshots and leaves state unchanged if deletion fails', async () => {
    const { utils, state, dbUtils, alerts, uiUtils } = createContext();
    const snapshot = { id: 'a', title: '保存済み', text: '適用本文' };
    state.initialPromptRecords.push({ ...snapshot, createdAt: 1, updatedAt: 1 });
    state.currentInitialPromptId = 'a';
    state.currentMessages.push({ role: 'user', content: '入力', initialPrompt: snapshot });

    dbUtils.deleteInitialPrompt.mockRejectedValueOnce(new Error('保存失敗'));
    await utils.deleteRecord('a');
    expect(state.initialPromptRecords).toHaveLength(1);
    expect(state.currentInitialPromptId).toBe('a');
    expect(alerts.at(-1)).toContain('削除に失敗');

    await utils.deleteRecord('a');
    expect(state.currentMessages[0].initialPrompt).toEqual(snapshot);
    expect(utils.formatUserText(state.currentMessages[0])).toContain('適用本文');
    expect(uiUtils.renderChatMessages).not.toHaveBeenCalled();
  });
});
