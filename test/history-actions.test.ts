import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const runtime = (name: string) => fs.readFileSync(
  path.resolve(import.meta.dirname, `../.build/runtime/${name}.js`), 'utf8',
);

const createContext = () => {
  const state = {
    isSending: false,
    pendingMessageEditSave: null as Promise<void> | null,
    currentChatId: 7 as number | null,
    currentMessages: [{ content: 'keep until deletion succeeds' }],
    editingMessageIndex: 0 as number | null,
    settings: { apiKey: 'keep' },
    lorebookRecords: [{ id: 'keep' }],
  };
  const dbUtils = {
    getAllChats: vi.fn(async () => [{ id: 7 }, { id: 8 }]),
    clearAllChatsStore: vi.fn(async (): Promise<void> => undefined),
  };
  const uiUtils = {
    showCustomConfirm: vi.fn(async (_message: string) => true),
    showCustomAlert: vi.fn(async (_message: string) => undefined),
    renderHistoryList: vi.fn(async () => undefined),
  };
  const startNewChat = vi.fn(() => {
    state.currentChatId = null;
    state.currentMessages = [];
  });
  const context = vm.createContext({ state, dbUtils, uiUtils, appLogic: { startNewChat } });
  new vm.Script(runtime('data-management')).runInContext(context);
  return { context, state, dbUtils, uiUtils, startNewChat };
};

describe('history deletion', () => {
  it('confirms the count and refreshes the empty list after deletion, preserving settings and Lorebooks', async () => {
    const { context, state, dbUtils, uiUtils, startNewChat } = createContext();
    let finishDelete!: () => void;
    dbUtils.clearAllChatsStore.mockImplementation(() => new Promise<void>((resolve) => {
      finishDelete = resolve;
    }));
    const deleting = context.appLogic.confirmClearAllHistory();
    await vi.waitFor(() => expect(dbUtils.clearAllChatsStore).toHaveBeenCalledOnce());
    expect(uiUtils.showCustomConfirm.mock.calls[0][0]).toContain('全2件');
    expect(startNewChat).not.toHaveBeenCalled();
    expect(state.currentChatId).toBe(7);
    finishDelete();
    await deleting;
    expect(startNewChat).toHaveBeenCalledOnce();
    expect(state.editingMessageIndex).toBeNull();
    expect(uiUtils.renderHistoryList).toHaveBeenCalledOnce();
    expect(state.settings.apiKey).toBe('keep');
    expect(state.lorebookRecords).toEqual([{ id: 'keep' }]);
  });

  it('leaves the current session intact when canceled', async () => {
    const { context, state, dbUtils, uiUtils, startNewChat } = createContext();
    uiUtils.showCustomConfirm.mockResolvedValue(false);
    await context.appLogic.confirmClearAllHistory();
    expect(dbUtils.clearAllChatsStore).not.toHaveBeenCalled();
    expect(startNewChat).not.toHaveBeenCalled();
    expect(state.currentChatId).toBe(7);
    expect(state.editingMessageIndex).toBe(0);
  });

  it('preserves the current session when deletion fails and allows retry', async () => {
    const { context, state, dbUtils, uiUtils, startNewChat } = createContext();
    dbUtils.clearAllChatsStore.mockRejectedValueOnce(new Error('transaction aborted'));
    await context.appLogic.confirmClearAllHistory();
    expect(startNewChat).not.toHaveBeenCalled();
    expect(state.currentChatId).toBe(7);
    expect(uiUtils.showCustomAlert.mock.calls[0][0]).toContain('transaction aborted');
    await context.appLogic.confirmClearAllHistory();
    expect(startNewChat).toHaveBeenCalledOnce();
  });

  it('waits for pending edit saves and ignores duplicate deletion requests', async () => {
    const { context, state, dbUtils, uiUtils } = createContext();
    let finishSave!: () => void;
    state.pendingMessageEditSave = new Promise<void>((resolve) => { finishSave = resolve; });
    const deleting = context.appLogic.confirmClearAllHistory();
    await context.appLogic.confirmClearAllHistory();
    expect(dbUtils.getAllChats).not.toHaveBeenCalled();
    finishSave();
    await deleting;
    expect(uiUtils.showCustomConfirm).toHaveBeenCalledOnce();
    expect(dbUtils.clearAllChatsStore).toHaveBeenCalledOnce();
  });

  it('does not delete during a response', async () => {
    const { context, state, dbUtils, uiUtils } = createContext();
    state.isSending = true;
    await context.appLogic.confirmClearAllHistory();
    expect(dbUtils.clearAllChatsStore).not.toHaveBeenCalled();
    expect(uiUtils.showCustomConfirm).not.toHaveBeenCalled();
    expect(uiUtils.showCustomAlert.mock.calls[0][0]).toContain('応答中');
  });

  it('does not reset an unsaved session when history is already empty', async () => {
    const { context, state, dbUtils, uiUtils, startNewChat } = createContext();
    dbUtils.getAllChats.mockResolvedValue([]);
    await context.appLogic.confirmClearAllHistory();
    expect(uiUtils.showCustomConfirm).not.toHaveBeenCalled();
    expect(dbUtils.clearAllChatsStore).not.toHaveBeenCalled();
    expect(startNewChat).not.toHaveBeenCalled();
    expect(state.currentMessages).toHaveLength(1);
  });
});

describe('history deletion transaction', () => {
  const createDatabaseContext = () => {
    const transaction = { oncomplete: null, onerror: null, onabort: null } as any;
    const store = { transaction, clear: vi.fn() };
    const context = vm.createContext({ state: {}, CHATS_STORE: 'chats' });
    new vm.Script(`${runtime('database')}\nglobalThis.database = dbUtils;`).runInContext(context);
    context.database.openDB = vi.fn(async () => undefined);
    context.database._getStore = vi.fn(() => store);
    return { context, transaction, store };
  };

  it('waits for transaction commit before reporting success', async () => {
    const { context, transaction, store } = createDatabaseContext();
    let completed = false;
    const deleting = context.database.clearAllChatsStore().then(() => { completed = true; });
    await vi.waitFor(() => expect(store.clear).toHaveBeenCalledOnce());
    expect(completed).toBe(false);
    transaction.oncomplete();
    await deleting;
    expect(completed).toBe(true);
    expect(context.database._getStore).toHaveBeenCalledWith('chats', 'readwrite');
  });

  it('reports a transaction abort as a failure', async () => {
    const { context, transaction, store } = createDatabaseContext();
    const deleting = context.database.clearAllChatsStore();
    const assertion = expect(deleting).rejects.toContain('中断');
    await vi.waitFor(() => expect(store.clear).toHaveBeenCalledOnce());
    transaction.onabort({ target: { error: 'aborted' } });
    await assertion;
  });
});
