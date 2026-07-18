import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');

const fixtureLorebooks = JSON.parse(readFile('tests/fixtures/lorebook.json'));

const createLorebookContext = (lorebooks = fixtureLorebooks) => {
  const context = vm.createContext({ LOCAL_LOREBOOKS: lorebooks });
  new vm.Script(readFile('.build/runtime/lorebook-data.js')).runInContext(context);
  new vm.Script(readFile('.build/runtime/lorebook.js')).runInContext(context);
  return context;
};

const evaluate = <T>(context: vm.Context, expression: string): T =>
  new vm.Script(expression).runInContext(context) as T;

describe('Lorebook retrieval', () => {
  it('keeps all character and memory identifiers internally consistent', () => {
    const context = createLorebookContext();
    const lorebook = evaluate<{
      schemaVersion: number;
      characters: Array<{ id: string; aliases: string[] }>;
      addressing: {
        exactRules: Array<{ speakerId: string; targetId: string; forms: Array<{ context: string }> }>;
        fallbackRules: Array<{ speakerId: string }>;
      };
      conditionalMemories: Array<{
        id: string;
        characters?: string[];
        allCharacters?: string[];
        anyCharacters?: string[];
      }>;
    }>(context, "lorebookUtils.getLorebook('test-lorebook')");
    const characterIds = lorebook.characters.map(character => character.id);
    const memoryIds = lorebook.conditionalMemories.map(memory => memory.id);

    expect(lorebook.schemaVersion).toBe(2);
    expect(lorebook.characters).toHaveLength(2);
    expect(new Set(characterIds).size).toBe(characterIds.length);
    expect(new Set(memoryIds).size).toBe(memoryIds.length);
    lorebook.characters.forEach(character => expect(character.aliases.length).toBeGreaterThan(1));
    lorebook.conditionalMemories.forEach(memory => {
      [memory.characters, memory.allCharacters, memory.anyCharacters]
        .filter(Boolean)
        .flat()
        .forEach(characterId => expect(characterIds).toContain(characterId));
    });
    lorebook.addressing.exactRules.forEach(rule => {
      expect(characterIds).toContain(rule.speakerId);
      expect(characterIds).toContain(rule.targetId);
    });
    lorebook.addressing.fallbackRules.forEach(rule => expect(characterIds).toContain(rule.speakerId));

    const addressingKeys = lorebook.addressing.exactRules.flatMap(rule =>
      rule.forms.map(form => `${rule.speakerId}:${rule.targetId}:${form.context}`),
    );
    expect(new Set(addressingKeys).size).toBe(addressingKeys.length);
  });

  it('keeps a formal versioned schema for future LLM analysis output', () => {
    const schema = JSON.parse(readFile('schemas/lorebook.schema.json'));

    expect(schema.properties.schemaVersion.const).toBe(2);
    expect(schema.required).toContain('addressing');
    expect(schema.required).toContain('conditionalMemories');
    expect(schema.$defs.exactAddressingRule.required).toEqual(['speakerId', 'targetId', 'forms']);
  });

  it('exposes locally supplied Lorebooks without exposing full data through the selector', () => {
    const context = createLorebookContext();
    const summaries = evaluate<Array<Record<string, string>>>(
      context,
      'lorebookUtils.getAvailableLorebooks()',
    );

    expect(summaries).toEqual([
      {
        id: 'test-lorebook',
        name: 'テスト用Lorebook',
        description: '自動テスト専用の架空データ',
      },
    ]);
    expect(summaries[0]).not.toHaveProperty('storyCore');
    expect(summaries[0]).not.toHaveProperty('addressing');
    expect(summaries[0]).not.toHaveProperty('conditionalMemories');
  });

  it('starts with no available Lorebooks when local data is absent', () => {
    const context = createLorebookContext([]);
    expect(evaluate(context, 'lorebookUtils.getAvailableLorebooks()')).toEqual([]);
  });

  it('returns no injection when the session has no Lorebook', () => {
    const context = createLorebookContext();
    expect(evaluate(context, "lorebookUtils.buildPrompt(null, [{ role: 'user', content: '春' }])"))
      .toBe('');
  });

  it('always includes the fixed core for a selected Lorebook', () => {
    const context = createLorebookContext();
    const prompt = evaluate<string>(
      context,
      "lorebookUtils.buildPrompt('test-lorebook', [{ role: 'user', content: '物語を始めよう' }])",
    );

    expect(prompt).toContain('【固定ストーリーコア】');
    expect(prompt).toContain('設定を列挙・引用・解説');
    expect(prompt).not.toContain('【現在関係する人物コア】');
  });

  it('retrieves a named character core and only the relevant topic memory', () => {
    const context = createLorebookContext();
    const prompt = evaluate<string>(
      context,
      "lorebookUtils.buildPrompt('test-lorebook', [{ role: 'user', content: '春は今日の油絵をどう感じた？' }])",
    );

    expect(prompt).toContain('春は絵を描くことが好き');
    expect(prompt).toContain('校内展で入選');
    expect(prompt).not.toContain('空は音楽が好き');
    expect(prompt).not.toContain('ピアノの練習');
  });

  it('retrieves relationship memory when both people are in the recent scene', () => {
    const context = createLorebookContext();
    const prompt = evaluate<string>(
      context,
      "lorebookUtils.buildPrompt('test-lorebook', [{ role: 'user', content: '春と空が放課後に二人で話している。' }])",
    );

    expect(prompt).toContain('幼い頃からの友人');
    expect(prompt).toContain('互いの創作活動を応援');
  });

  it('injects directional forms of address before ordinary conditional memories', () => {
    const context = createLorebookContext();
    const prompt = evaluate<string>(
      context,
      "lorebookUtils.buildPrompt('test-lorebook', [{ role: 'user', content: '空が春に声をかける。' }])",
    );

    expect(prompt).toContain('【呼称ルール（最優先）】');
    expect(prompt).toContain('空 → 春: 発話では「春くん」');
    expect(prompt).toContain('春 → 空: 発話では「空さん」、内心では「空」');
    expect(prompt.indexOf('【呼称ルール（最優先）】'))
      .toBeLessThan(prompt.indexOf('【今回参照する条件付き記憶】'));
  });

  it('injects all explicit address exceptions for a detected acting character', () => {
    const context = createLorebookContext();
    const prompt = evaluate<string>(
      context,
      "lorebookUtils.buildPrompt('test-lorebook', [{ role: 'user', content: '声をかけて。' }], 'あなたは春として応答する')",
    );

    expect(prompt).toContain('春 → 空: 発話では「空さん」、内心では「空」');
    expect(prompt).toContain('春 → その他の同級生: 発話では「{姓}さん」');
  });

  it('keeps context-dependent spoken and inner forms separate', () => {
    const context = createLorebookContext();
    const prompt = evaluate<string>(
      context,
      "lorebookUtils.buildPrompt('test-lorebook', [{ role: 'user', content: '春と空が話す。' }])",
    );

    expect(prompt).toContain('春 → 空: 発話では「空さん」、内心では「空」');
  });

  it('can detect the acting character from the existing system prompt', () => {
    const context = createLorebookContext();
    const prompt = evaluate<string>(
      context,
      "lorebookUtils.buildPrompt('test-lorebook', [{ role: 'user', content: '今日の気分は？' }], 'あなたは春として自然に応答する')",
    );

    expect(prompt).toContain('春は絵を描くことが好き');
  });

  it('caps dynamic context even when many characters and topics match', () => {
    const context = createLorebookContext();
    const selected = evaluate<{
      lorebook: {
        retrieval: {
          maxDynamicCharacters: number;
          maxCharacterCores: number;
          maxAddressingRules: number;
          maxConditionalMemories: number;
        };
      };
      addressingRules: unknown[];
      characterCores: unknown[];
      memories: unknown[];
      dynamicContentCharacters: number;
    }>(
      context,
      `lorebookUtils.selectContext('test-lorebook', [{ role: 'user', content:
        '春と空が、絵、油絵、美術、音楽、ピアノ、創作について話す。'
      }])`,
    );

    expect(selected.addressingRules.length).toBeLessThanOrEqual(selected.lorebook.retrieval.maxAddressingRules);
    expect(selected.characterCores.length).toBeLessThanOrEqual(selected.lorebook.retrieval.maxCharacterCores);
    expect(selected.memories.length).toBeLessThanOrEqual(selected.lorebook.retrieval.maxConditionalMemories);
    expect(selected.dynamicContentCharacters).toBeLessThanOrEqual(selected.lorebook.retrieval.maxDynamicCharacters);
  });

  it('appends Lorebook context after the user-configured system prompt', () => {
    const context = createLorebookContext();
    const result = evaluate<string>(
      context,
      "lorebookUtils.appendToSystemPrompt('基本指示', '<lorebook-reference>記憶</lorebook-reference>')",
    );

    expect(result).toBe('基本指示\n\n<lorebook-reference>記憶</lorebook-reference>');
  });
});

describe('Lorebook session integration', () => {
  it('keeps the selected Lorebook on saved, loaded, duplicated, and imported sessions', () => {
    const database = readFile('src/database.ts');
    const sessions = readFile('src/chat-sessions.ts');
    const sending = readFile('src/message-sending.ts');
    const dataManagement = readFile('src/data-management.ts');

    expect(database).toContain('lorebookId: lorebookUtils.normalizeLorebookId(state.currentLorebookId)');
    expect(sessions).toContain('state.currentLorebookId = lorebookUtils.normalizeLorebookId(chat.lorebookId)');
    expect(sessions).toContain('lorebookId: lorebookUtils.normalizeLorebookId(chat.lorebookId)');
    expect(sending).toContain('lorebookUtils.buildPrompt(');
    expect(dataManagement).toContain('lorebookId: lorebookUtils.normalizeLorebookId(chat.lorebookId)');
    expect(dataManagement).toContain('lorebookId: lorebookUtils.normalizeLorebookId(chatData.lorebookId)');
  });

  it('starts without a Lorebook and lets the current session change it from the header menu', () => {
    expect(readFile('src/app-initialization.ts')).toContain('this.startNewChat();');
    expect(readFile('src/chat-sessions.ts')).not.toContain('startNewChatWithLorebookSelection');
    expect(readFile('src/index.html')).toContain('id="lorebookDialog"');
    expect(readFile('src/index.html')).toContain('id="header-menu-lorebook-btn"');
    expect(readFile('src/event-wiring.ts')).toContain('this.changeCurrentSessionLorebook()');
    expect(readFile('src/chat-sessions.ts')).toContain(
      'uiUtils.showLorebookSelectionDialog(previousLorebookId)',
    );
  });

  it('persists a changed Lorebook immediately for an existing session and reverts on failure', () => {
    const sessions = readFile('src/chat-sessions.ts');

    expect(sessions).toContain('if (state.currentChatId && state.currentMessages.length > 0)');
    expect(sessions).toContain('await dbUtils.saveChat()');
    expect(sessions).toContain('state.currentLorebookId = previousLorebookId');
    expect(readFile('src/ui-interactions.ts')).toContain('this.updateLorebookMenuItem()');
  });
});

describe('Context usage display', () => {
  it('stores the response model and its known context window with each response', () => {
    const sending = readFile('src/message-sending.ts');
    const database = readFile('src/database.ts');
    const dataManagement = readFile('src/data-management.ts');

    expect(sending).toContain('apiUtils.getGeminiModelContextWindow(apiKeyToUse, modelNameToUse)');
    expect(sending).toContain("openRouterModelCatalog.getModel(modelNameToUse)?.contextLength");
    expect(readFile('src/api-clients.ts')).toContain('Number(modelInfo.inputTokenLimit)');
    expect(sending).toContain('generatedByModel: modelNameToUse || null');
    expect(sending).toContain('contextWindowTokens: contextWindowTokensForResponse');
    expect(readFile('src/api-clients.ts')).toContain('stream_options = { include_usage: true }');
    expect(database).toContain('generatedByModel: msg.generatedByModel || null');
    expect(database).toContain('contextWindowTokens: Number(msg.contextWindowTokens) || null');
    expect(dataManagement).toContain('generatedByModel: msg.generatedByModel || null');
  });

  it('renders total usage against the context limit and marks the 90 percent threshold', () => {
    const rendering = readFile('src/ui-message-rendering.ts');

    expect(rendering).toContain('(totalTokenCount / contextWindowTokens) * 100');
    expect(readFile('src/app-config.ts')).toContain('CONTEXT_PRESSURE_THRESHOLD_PERCENT = 90');
    expect(rendering).toContain('usagePercentage >= CONTEXT_PRESSURE_THRESHOLD_PERCENT');
    expect(rendering).toContain('formatCompactTokenCount(totalTokenCount)');
    expect(rendering).toContain('formatCompactTokenCount(contextWindowTokens)');
    expect(rendering).toContain('`${formattedTotal} / 上限不明`');
    expect(readFile('src/styles/app.css')).toContain('.token-count-display.context-usage-critical');
  });

  it('formats large token values with K, M, and G suffixes', () => {
    const context = vm.createContext({});
    new vm.Script(readFile('.build/runtime/utilities.js')).runInContext(context);

    expect(evaluate(context, 'formatCompactTokenCount(999)')).toBe('999');
    expect(evaluate(context, 'formatCompactTokenCount(12345)')).toBe('12.3K');
    expect(evaluate(context, 'formatCompactTokenCount(128000)')).toBe('128K');
    expect(evaluate(context, 'formatCompactTokenCount(1500000)')).toBe('1.5M');
    expect(evaluate(context, 'formatCompactTokenCount(2400000000)')).toBe('2.4G');
  });
});
