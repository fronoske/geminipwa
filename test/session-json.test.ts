import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const runtime = (name: string) => fs.readFileSync(
  path.resolve(import.meta.dirname, `../.build/runtime/${name}.js`), 'utf8',
);

const createContext = () => {
  const chat = {
    id: 3,
    title: 'A session',
    lorebookId: 'lorebook-1',
    createdAt: 100,
    updatedAt: 200,
    collapsedStates: { 0: true },
    messages: [
      { role: 'user', content: 'question', timestamp: 110,
        initialPrompt: { id: 'opening-1', title: '導入', text: '前提を確認してください。' }, attachments: [
        { name: 'notes.txt', mimeType: 'text/plain', textData: 'attached text', base64Data: 'binary-omitted' },
      ] },
      { role: 'model', content: 'answer', timestamp: 120, isCascaded: true, isSelected: true,
        siblingGroupId: 'group-1', generatedByModel: 'test-model', usageMetadata: { totalTokenCount: 12 },
        lorebookContext: { referenceText: 'reference' } },
    ],
  };
  const saved: Record<string, unknown>[] = [];
  const blobs: Blob[] = [];
  const alerts: string[] = [];
  const dbUtils = {
    getChat: vi.fn(async () => chat),
    getAllChats: vi.fn(async () => [chat]),
    openDB: vi.fn(async () => undefined),
    _getStore: vi.fn(() => ({ add: (record: Record<string, unknown>) => {
      const request = { onsuccess: null as null | (() => void), onerror: null };
      queueMicrotask(() => { saved.push(record); request.onsuccess?.(); });
      return request;
    } })),
  };
  const uiUtils = {
    showCustomConfirm: vi.fn(async () => true),
    showCustomAlert: vi.fn(async (message: string) => { alerts.push(message); }),
    renderHistoryList: vi.fn(async () => undefined),
  };
  class FakeFileReader {
    onload: null | ((event: { target: { result: string } }) => void) = null;
    onerror = null;
    readAsText(file: { content: string }) {
      queueMicrotask(() => this.onload?.({ target: { result: file.content } }));
    }
  }
  const context = vm.createContext({
    appLogic: {}, dbUtils, uiUtils, Blob, FileReader: FakeFileReader,
    URL: { createObjectURL: (blob: Blob) => { blobs.push(blob); return 'blob:test'; }, revokeObjectURL: vi.fn() },
    document: { createElement: () => ({ click: vi.fn() }), body: { appendChild: vi.fn(), removeChild: vi.fn() } },
    state: { settings: { addPrefixOnImport: false, persistMessageCollapseState: true } },
    lorebookUtils: { normalizeStoredLorebookId: (value: unknown) => value ?? null,
      normalizeContextSnapshot: (value: unknown) => value },
    CHATS_STORE: 'chats', IMPORT_PREFIX: '(取込) ', formatLocalDateStamp: () => '20260930',
  });
  new vm.Script(runtime('data-management')).runInContext(context);
  new vm.Script(runtime('initial-prompts')).runInContext(context);
  new vm.Script(runtime('chat-sessions')).runInContext(context);
  return { context, chat, saved, blobs, alerts, dbUtils, uiUtils };
};

describe('single session JSON', () => {
  it('uses the bulk schema and restores session details from the exported file', async () => {
    const { context, chat, saved, blobs, dbUtils, uiUtils } = createContext();
    await context.appLogic.exportChat(chat.id, chat.title);
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toBe('application/json;charset=utf-8');
    const single = JSON.parse(await blobs[0].text());
    expect(Array.isArray(single)).toBe(false);
    expect(single.title).toBe(chat.title);
    expect(single.createdAt).toBe(100);
    expect(single.updatedAt).toBe(200);
    expect(single.lorebookId).toBe('lorebook-1');
    expect(single.collapsedStates).toEqual({ 0: true });
    expect(single.messages[0].attachments[0].textData).toBe('attached text');
    expect(single.messages[0].initialPrompt).toEqual({ id: 'opening-1', title: '導入', text: '前提を確認してください。' });
    expect(single.messages[0].attachments[0]).not.toHaveProperty('base64Data');
    expect(single.messages[1].lorebookContext).toEqual({ referenceText: 'reference' });

    await context.appLogic.exportAllSessions();
    expect(JSON.parse(await blobs[1].text())).toEqual([single]);

    await context.appLogic.handleHistoryImport({ name: 'single.json', type: '', content: JSON.stringify(single) });
    await vi.waitFor(() => expect(saved).toHaveLength(1));
    expect(dbUtils.openDB).toHaveBeenCalledOnce();
    expect(saved[0].title).toBe(chat.title);
    expect(saved[0].createdAt).toBe(100);
    expect(saved[0].updatedAt).toBe(200);
    expect(saved[0].lorebookId).toBe('lorebook-1');
    expect(saved[0].collapsedStates).toEqual({ 0: true });
    expect((saved[0].messages as any[])[0].attachments[0].textData).toBe('attached text');
    expect((saved[0].messages as any[])[0].initialPrompt).toEqual(single.messages[0].initialPrompt);
    expect((saved[0].messages as any[])[1].isSelected).toBe(true);
    expect((saved[0].messages as any[])[1].lorebookContext).toEqual({ referenceText: 'reference' });
    expect(uiUtils.renderHistoryList).toHaveBeenCalledOnce();
  });

  it('rejects an array passed to the single-session import', async () => {
    const { context, saved, alerts } = createContext();
    await context.appLogic.handleHistoryImport({ name: 'bulk.json', content: '[]' });
    await vi.waitFor(() => expect(alerts).toContain('単一セッションのJSONファイルを選択してください。'));
    expect(saved).toHaveLength(0);
  });
});
