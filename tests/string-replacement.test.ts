import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readRuntime = (): string =>
  fs.readFileSync(path.join(projectRoot, '.build/runtime/string-replacement.js'), 'utf8');

const createContext = (messages: any[] = []) => {
  const showCustomAlert = vi.fn(async () => undefined);
  const context = vm.createContext({
    appLogic: {},
    state: {
      currentMessages: messages,
      editingMessageIndex: null,
      isSending: false,
    },
    elements: {
      stringReplacementBar: { classList: { add: vi.fn(), remove: vi.fn() } },
      stringReplacementPrompt: { textContent: '' },
      stringReplacementProgress: { textContent: '' },
      stringReplacementYesBtn: { classList: { toggle: vi.fn() } },
      stringReplacementNoBtn: { classList: { toggle: vi.fn() } },
      stringReplacementAllBtn: { classList: { toggle: vi.fn() } },
      stringReplacementPreviousBtn: { classList: { toggle: vi.fn() } },
      stringReplacementNextBtn: { classList: { toggle: vi.fn() } },
    },
    uiUtils: { showCustomAlert },
    dbUtils: {},
    Map,
    Set,
    Date,
    String,
    requestAnimationFrame: (callback: () => void) => callback(),
  });
  new vm.Script(readRuntime()).runInContext(context);
  return { context, showCustomAlert };
};

describe('string replacement', () => {
  it('counts and replaces literal non-overlapping matches', () => {
    const { context } = createContext();
    const result = new vm.Script("replaceLiteralMatches('aaaa', 'aa', 'b')").runInContext(context);

    expect(result).toEqual({ text: 'bb', count: 2 });
  });

  it('targets the visible conversation path and skips unselected cascade responses', () => {
    const { context } = createContext([
      { role: 'user', content: 'first' },
      { role: 'model', content: 'selected', isCascaded: true, isSelected: true },
      { role: 'model', content: 'hidden', isCascaded: true, isSelected: false },
      { role: 'model', content: 'plain' },
    ]);

    const indices = new vm.Script("appLogic.getStringReplacementTargetIndices('all')").runInContext(context);
    expect(Array.from(indices)).toEqual([0, 1, 3]);
  });

  it('uses live editor text for batch replacement and reports occurrence count', async () => {
    const { context, showCustomAlert } = createContext([
      { role: 'user', content: 'cat' },
      { role: 'model', content: 'cat cat' },
    ]);
    context.state.editingMessageIndex = 1;
    const savedResults: any[] = [];
    context.appLogic.saveStringReplacementResult = vi.fn(async (working: Map<number, string>, changed: Set<number>) => {
      savedResults.push({ working: new Map(working), changed: new Set(changed) });
      return true;
    });

    await context.appLogic.replaceAllStrings({
      searchWord: 'cat',
      replacementWord: 'dog',
      scope: 'all',
      editorSnapshot: { index: 1, value: 'cat cat cat' },
    });

    expect(savedResults[0].working.get(0)).toBe('dog');
    expect(savedResults[0].working.get(1)).toBe('dog dog dog');
    expect(Array.from(savedResults[0].changed)).toEqual([0, 1]);
    expect(showCustomAlert).toHaveBeenCalledWith('4件置換しました');
  });

  it('treats an empty replacement word as search-only even when batch mode is selected', async () => {
    const { context } = createContext([{ role: 'user', content: 'cat' }]);
    context.elements.stringReplacementSearch = { value: 'cat', focus: vi.fn() };
    context.elements.stringReplacementReplacement = { value: '' };
    context.elements.stringReplacementScopeEditing = { checked: false };
    context.elements.stringReplacementModeSequential = { checked: false };
    context.elements.stringReplacementDialog = { close: vi.fn() };
    context.appLogic.startSequentialStringReplacement = vi.fn(async () => undefined);
    context.appLogic.replaceAllStrings = vi.fn(async () => undefined);

    await context.appLogic.confirmStringReplacementDialog();

    expect(context.appLogic.startSequentialStringReplacement).toHaveBeenCalledWith(expect.objectContaining({
      searchWord: 'cat', replacementWord: '', scope: 'all', searchOnly: true,
    }));
    expect(context.appLogic.replaceAllStrings).not.toHaveBeenCalled();
  });

  it('initializes sequential progress with the total literal match count', async () => {
    const { context } = createContext([
      { role: 'user', content: 'cat cat' },
      { role: 'model', content: 'cat' },
    ]);
    context.appLogic.showNextSequentialStringReplacementMatch = vi.fn(async () => undefined);

    await context.appLogic.startSequentialStringReplacement({
      searchWord: 'cat',
      replacementWord: 'dog',
      scope: 'all',
      editorSnapshot: null,
    });

    const progress = new vm.Script(`({
      current: stringReplacementRuntime.active.currentMatchOrdinal,
      total: stringReplacementRuntime.active.totalMatches
    })`).runInContext(context);
    expect(progress).toEqual({ current: 0, total: 3 });
    expect(context.elements.stringReplacementProgress.textContent).toBe('0/3');
  });

  it('shows the one-based current match index and selects the match', async () => {
    const { context } = createContext([{ role: 'user', content: 'before cat after cat' }]);
    const textarea = {
      value: '',
      readOnly: false,
      inputMode: '',
      focus: vi.fn(),
      setSelectionRange: vi.fn(),
    };
    const messageElement = {
      classList: { add: vi.fn() },
      querySelector: vi.fn(() => textarea),
    };
    context.elements.messageContainer = { querySelector: vi.fn(() => messageElement) };
    context.uiUtils.renderChatMessages = vi.fn();
    context.uiUtils.adjustTextareaHeight = vi.fn();
    context.appLogic.startEditMessage = vi.fn(async () => undefined);
    context.appLogic.centerSequentialStringReplacementMatch = vi.fn();

    await context.appLogic.startSequentialStringReplacement({
      searchWord: 'cat',
      replacementWord: 'dog',
      scope: 'all',
      editorSnapshot: null,
    });

    expect(context.elements.stringReplacementProgress.textContent).toBe('1/2');
    expect(context.appLogic.startEditMessage).toHaveBeenCalledWith(0, messageElement, { focus: false });
    expect(textarea.readOnly).toBe(true);
    expect(textarea.inputMode).toBe('none');
    expect(textarea.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(textarea.setSelectionRange).toHaveBeenCalledWith(7, 10);
    expect(context.appLogic.centerSequentialStringReplacementMatch).toHaveBeenCalledWith(textarea, 7, 3);
  });

  it('uses shared match display for search-only previous and next navigation', async () => {
    const messages = [{ role: 'user', content: 'cat then cat' }];
    const { context } = createContext(messages);
    const textarea = {
      value: '', readOnly: false, inputMode: '', focus: vi.fn(), setSelectionRange: vi.fn(),
    };
    const classList = { add: vi.fn(), remove: vi.fn() };
    const messageElement = { classList, querySelector: vi.fn(() => textarea) };
    context.elements.messageContainer = { querySelector: vi.fn(() => messageElement) };
    context.uiUtils.renderChatMessages = vi.fn();
    context.uiUtils.adjustTextareaHeight = vi.fn();
    context.appLogic.startEditMessage = vi.fn(async () => {
      context.state.editingMessageIndex = 0;
    });
    context.appLogic.centerSequentialStringReplacementMatch = vi.fn();

    await context.appLogic.startSequentialStringReplacement({
      searchWord: 'cat',
      replacementWord: '',
      scope: 'all',
      editorSnapshot: null,
      searchOnly: true,
    });
    expect(context.elements.stringReplacementPrompt.textContent).toBe('検索：');
    expect(context.elements.stringReplacementProgress.textContent).toBe('1/2');

    await context.appLogic.handleSequentialStringReplacement('next');
    expect(context.elements.stringReplacementProgress.textContent).toBe('2/2');
    expect(textarea.setSelectionRange).toHaveBeenLastCalledWith(9, 12);

    await context.appLogic.handleSequentialStringReplacement('next');
    expect(context.elements.stringReplacementProgress.textContent).toBe('1/2');
    expect(messages[0].content).toBe('cat then cat');
  });

  it('keeps the current editor and scroll position path on cancel', async () => {
    const messages = [{ role: 'model', content: 'cat cat' }];
    const { context } = createContext(messages);
    const textarea = {
      value: 'cat cat', readOnly: false, inputMode: '', focus: vi.fn(), setSelectionRange: vi.fn(),
    };
    const classList = { add: vi.fn(), remove: vi.fn() };
    const messageElement = { classList, querySelector: vi.fn(() => textarea) };
    context.elements.messageContainer = { querySelector: vi.fn(() => messageElement) };
    context.uiUtils.renderChatMessages = vi.fn();
    context.uiUtils.adjustTextareaHeight = vi.fn();
    context.appLogic.startEditMessage = vi.fn(async () => {
      context.state.editingMessageIndex = 0;
    });
    context.appLogic.centerSequentialStringReplacementMatch = vi.fn();
    context.dbUtils.saveChat = vi.fn(async () => undefined);

    await context.appLogic.startSequentialStringReplacement({
      searchWord: 'cat', replacementWord: 'dog', scope: 'all', editorSnapshot: null,
    });
    await context.appLogic.handleSequentialStringReplacement('yes');
    const rendersBeforeCancel = context.uiUtils.renderChatMessages.mock.calls.length;
    await context.appLogic.handleSequentialStringReplacement('cancel');

    expect(context.uiUtils.renderChatMessages).toHaveBeenCalledTimes(rendersBeforeCancel);
    expect(context.state.editingMessageIndex).toBe(0);
    expect(textarea.value).toBe('dog cat');
    expect(textarea.readOnly).toBe(false);
    expect(textarea.inputMode).toBe('');
    expect(messages[0].content).toBe('dog cat');
    expect(classList.remove).toHaveBeenCalledWith('replacement-preview-active');
  });

  it('all replaces the current match and every later match only', async () => {
    const { context } = createContext();
    const finish = vi.fn(async () => undefined);
    context.appLogic.finishSequentialStringReplacement = finish;
    new vm.Script(`stringReplacementRuntime.active = {
      searchWord: 'x', replacementWord: 'yy', indices: [0, 1],
      workingContents: new Map([[0, 'x skip x'], [1, 'x']]),
      changedIndices: new Set(), editorSnapshot: null,
      targetPosition: 0, searchOffset: 7,
      currentMatch: { messageIndex: 0, matchStart: 7 }, replacementCount: 0
    }`).runInContext(context);

    await context.appLogic.handleSequentialStringReplacement('all');
    const result = new vm.Script(`({
      first: stringReplacementRuntime.active.workingContents.get(0),
      second: stringReplacementRuntime.active.workingContents.get(1),
      count: stringReplacementRuntime.active.replacementCount,
      changed: [...stringReplacementRuntime.active.changedIndices]
    })`).runInContext(context);

    expect(result.first).toBe('x skip yy');
    expect(result.second).toBe('yy');
    expect(result.count).toBe(2);
    expect(Array.from(result.changed)).toEqual([0, 1]);
    expect(finish).toHaveBeenCalledWith(true);
  });
});
