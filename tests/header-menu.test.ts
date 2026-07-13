import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readRuntime = (name: string): string =>
  fs.readFileSync(path.join(projectRoot, `.build/runtime/${name}.js`), 'utf8');

describe('header menu actions', () => {
  it('keeps the first message and persists the cleared chat', async () => {
    const firstMessage = { role: 'user', content: 'first' };
    const saveChat = vi.fn(async () => undefined);
    const renderChatMessages = vi.fn();
    const updateToggleAllContentButton = vi.fn();
    const showCustomAlert = vi.fn(async () => undefined);
    const context = vm.createContext({
      appLogic: {},
      state: {
        currentMessages: [
          firstMessage,
          { role: 'model', content: 'second' },
          { role: 'user', content: 'third' },
        ],
        messageCollapsedStates: new Map([[1, true]]),
        thoughtSummaryOpenStates: new Map([[1, true]]),
        areAllMessagesHidden: true,
      },
      dbUtils: { saveChat },
      uiUtils: {
        renderChatMessages,
        showCustomAlert,
        updateToggleAllContentButton,
      },
    });

    new vm.Script(readRuntime('chat-sessions')).runInContext(context);
    await new vm.Script('appLogic.clearCurrentSessionExceptFirst()').runInContext(context);

    expect(context.state.currentMessages).toEqual([firstMessage]);
    expect(context.state.messageCollapsedStates.size).toBe(0);
    expect(context.state.thoughtSummaryOpenStates.size).toBe(0);
    expect(context.state.areAllMessagesHidden).toBe(false);
    expect(saveChat).toHaveBeenCalledOnce();
    expect(renderChatMessages).toHaveBeenCalledOnce();
    expect(updateToggleAllContentButton).toHaveBeenCalledOnce();
  });
});
