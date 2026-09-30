import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const runtime = fs.readFileSync(
  path.resolve(import.meta.dirname, '../.build/runtime/initial-prompts.js'), 'utf8',
);

const createContext = () => {
  const state = { initialPromptRecords: [] as any[], currentInitialPromptId: null, currentMessages: [], isSending: false, currentScreen: 'initial-prompt-editor' };
  const saved: any[][] = [];
  const alerts: string[] = [];
  const dbUtils = {
    putInitialPrompts: vi.fn(async (records: any[]) => { saved.push(records); }),
    putInitialPrompt: vi.fn(async () => undefined),
  };
  const uiUtils = {
    showCustomConfirm: vi.fn(async () => true),
    showCustomAlert: vi.fn(async (message: string) => { alerts.push(message); }),
    updateInitialPromptMenuItem: vi.fn(),
  };
  const node = () => ({
    className: '', textContent: '', type: '',
    addEventListener: vi.fn(), append: vi.fn(), appendChild: vi.fn(),
  });
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
});
