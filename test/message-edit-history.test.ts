import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readRuntime = (name: string): string =>
  fs.readFileSync(path.join(projectRoot, `.build/runtime/${name}.js`), 'utf8');

const createContext = (role: 'user' | 'model', storedTitle = 'old input') => {
  const message = { role, content: role === 'user' ? 'old input' : 'old output', timestamp: 1 };
  const contentDiv = { innerHTML: '', textContent: '', appendChild: vi.fn() };
  const textarea = { value: role === 'user' ? 'new input' : 'new output' };
  const messageElement = {
    dataset: { index: '0' },
    querySelector: (selector: string) => {
      if (selector === '.edit-textarea') return textarea;
      if (selector === '.message-content') return contentDiv;
      return null;
    },
  };
  const getChat = vi.fn(async () => ({ title: storedTitle }));
  const saveChat = vi.fn(async (_title: string | null) => 1);
  const getAllChats = vi.fn(async () => []);
  const updateChatTitle = vi.fn();
  const context = vm.createContext({
    appLogic: {},
    uiUtils: { updateChatTitle, showCustomAlert: vi.fn(async () => undefined) },
    dbUtils: { getChat, saveChat, getAllChats },
    state: {
      currentMessages: [message],
      currentChatId: 1,
      pendingMessageEditSave: null,
      settings: { historySortOrder: 'updatedAt' },
    },
    elements: {
      historyList: { querySelectorAll: () => [] },
      noHistoryMessage: { classList: { remove: vi.fn() } },
      historyTitle: { textContent: '' },
    },
    document: { createElement: () => ({ textContent: '', style: {} }) },
    Date,
  });
  new vm.Script(readRuntime('message-actions')).runInContext(context);
  new vm.Script(readRuntime('ui-message-tools')).runInContext(context);
  context.appLogic.finishEditing = vi.fn();
  context.uiUtils.updateChatTitle = updateChatTitle;
  context.uiUtils.updateHistoryHeaderButtonVisibility = vi.fn();
  return { context, message, messageElement, getChat, saveChat, getAllChats, updateChatTitle };
};

describe('message edit history persistence', () => {
  it('saves an edited first input and updates its generated history title', async () => {
    const { context, message, messageElement, saveChat, updateChatTitle } = createContext('user');

    await context.appLogic.saveEditMessage(0, messageElement);

    expect(message.content).toBe('new input');
    expect(saveChat).toHaveBeenCalledWith('new input');
    expect(updateChatTitle).toHaveBeenCalledWith('new input');
    expect(context.state.pendingMessageEditSave).toBeNull();
  });

  it('preserves a manually edited history title', async () => {
    const { context, messageElement, saveChat } = createContext('user', 'custom title');

    await context.appLogic.saveEditMessage(0, messageElement);

    expect(saveChat).toHaveBeenCalledWith('custom title');
  });

  it('waits for an edited output to save before reading history', async () => {
    const { context, message, messageElement, saveChat, getAllChats } = createContext('model');
    let finishSave!: () => void;
    saveChat.mockImplementation(() => new Promise<number>((resolve) => {
      finishSave = () => resolve(1);
    }));

    const editing = context.appLogic.saveEditMessage(0, messageElement);
    const rendering = context.uiUtils.renderHistoryList();

    expect(message.content).toBe('new output');
    expect(saveChat).toHaveBeenCalledWith(null);
    expect(getAllChats).not.toHaveBeenCalled();

    finishSave();
    await Promise.all([editing, rendering]);
    expect(getAllChats).toHaveBeenCalledOnce();
    expect(context.state.pendingMessageEditSave).toBeNull();
  });
});
