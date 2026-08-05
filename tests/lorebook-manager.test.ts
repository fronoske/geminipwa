import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');

const createContext = () => {
  const context = vm.createContext({ LOCAL_LOREBOOKS: [] });
  new vm.Script(readFile('.build/runtime/app-config.js')).runInContext(context);
  new vm.Script(readFile('.build/runtime/lorebook-data.js')).runInContext(context);
  new vm.Script(readFile('.build/runtime/lorebook-manager.js')).runInContext(context);
  return context;
};

const evaluate = <T>(context: vm.Context, expression: string): T =>
  new vm.Script(expression).runInContext(context) as T;

describe('Lorebook management and analysis boundary', () => {
  it('accepts every built-in Lorebook with the programmatic validator', () => {
    const context = createContext();
    const results = evaluate<string[][]>(
      context,
      'BUILTIN_LOREBOOKS.map(lorebook => lorebookManager.validateLorebook(lorebook))',
    );

    expect(Array.from(results, result => Array.from(result))).toEqual([[], []]);
  });

  it('normalizes generated IDs and all directional references in program code', () => {
    const context = createContext();
    const normalized = evaluate<{
      characters: Array<{ id: string }>;
      addressing: { exactRules: Array<{ speakerId: string; targetId: string }> };
      conditionalMemories: Array<{ id: string; allCharacters: string[] }>;
    }>(context, `lorebookManager.normalizeCandidateIds({
      characters: [
        { id: '人物 A', name: '人物A', aliases: ['人物A'], core: '人物Aのコア' },
        { id: '人物 B', name: '人物B', aliases: ['人物B'], core: '人物Bのコア' }
      ],
      addressing: {
        instruction: '個別ルールを優先する。',
        exactRules: [{ speakerId: '人物 A', targetId: '人物 B', forms: [{ context: 'spoken', value: 'Bさん' }] }],
        fallbackRules: []
      },
      conditionalMemories: [{ id: '二人の記憶', allCharacters: ['人物 A', '人物 B'], priority: 50, content: '幼なじみ。' }]
    })`);

    expect(Array.from(normalized.characters, character => character.id)).toEqual(['a', 'b']);
    expect({ ...normalized.addressing.exactRules[0] }).toMatchObject({
      speakerId: 'a',
      targetId: 'b',
    });
    expect(normalized.conditionalMemories[0].id).toBe('memory-1');
    expect(Array.from(normalized.conditionalMemories[0].allCharacters)).toEqual(['a', 'b']);
  });

  it('rejects schema extras, dangling references, and conflicting address forms', () => {
    const context = createContext();
    const errors = evaluate<string[]>(context, `(() => {
      const lorebook = JSON.parse(JSON.stringify(BUILTIN_LOREBOOKS[0]));
      lorebook.unexpected = true;
      lorebook.addressing.exactRules.push({
        speakerId: lorebook.characters[0].id,
        targetId: lorebook.characters[1].id,
        forms: [{ context: 'spoken', value: '矛盾する呼称' }]
      });
      lorebook.conditionalMemories[0].anyCharacters = ['missing-character'];
      return lorebookManager.validateLorebook(lorebook);
    })()`);

    expect(Array.from(errors).join('\n')).toContain('許可されていない項目');
    expect(Array.from(errors).join('\n')).toContain('矛盾する呼称');
    expect(Array.from(errors).join('\n')).toContain('missing-character');
  });

  it('requires the canonical v3 styleGuide in the programmatic validator', () => {
    const context = createContext();
    const errors = evaluate<string[]>(context, `(() => {
      const lorebook = JSON.parse(JSON.stringify(BUILTIN_LOREBOOKS[0]));
      delete lorebook.styleGuide;
      return lorebookManager.validateLorebook(lorebook);
    })()`);

    expect(Array.from(errors)).toContain('styleGuide はオブジェクトである必要があります。');
  });

  it('keeps the recorded lossless extraction and source-audit method in the LLM prompt', () => {
    const context = createContext();
    const prompt = evaluate<string>(context, 'lorebookManager.buildAnalysisSystemPrompt()');

    expect(prompt).toContain('まず圧縮せず');
    expect(prompt).toContain('話者→相手の方向');
    expect(prompt).toContain('逆方向を推測しない');
    expect(prompt).toContain('原文と最終結果を照合');
    expect(prompt).toContain('不明点や矛盾は勝手に決めず');
    expect(prompt).toContain('文体・視点・描写・台詞・形式・禁止事項をstyleGuideへ分類');
    expect(prompt).toContain('物語全体で常に成立する舞台・世界観の大前提はstoryCore');
    expect(prompt).toContain('特定の場所、組織、物品、事件、話題、人物が関係するときだけ必要な詳細');
  });

  it('normalizes style instructions into atomic styleGuide rule lists', () => {
    const context = createContext();
    const styleGuide = evaluate<Record<string, string[]>>(context, `lorebookManager.normalizeStyleGuide({
      narration: '三人称一元視点で描く',
      dialogue: ['会話中心にする', '  '],
      formatting: ['台詞は鉤括弧で表記する'],
      avoid: ['設定を列挙しない']
    })`);

    expect(Object.fromEntries(Object.entries(styleGuide).map(([key, value]) => [key, Array.from(value)]))).toEqual({
      narration: ['三人称一元視点で描く'],
      dialogue: ['会話中心にする'],
      formatting: ['台詞は鉤括弧で表記する'],
      avoid: ['設定を列挙しない'],
    });
  });

  it('migrates v2 characters conditions to canonical v3 anyCharacters', () => {
    const context = createContext();
    const migrated = evaluate<{ schemaVersion: number; styleGuide: Record<string, string[]>; conditionalMemories: Array<Record<string, string[]>> }>(context, `lorebookManager.migrateLorebookToCurrent({
      schemaVersion: 2,
      conditionalMemories: [
        { id: 'legacy-only', characters: ['a'] }
      ]
    })`);

    expect(JSON.parse(JSON.stringify(migrated))).toEqual({
      schemaVersion: 3,
      styleGuide: { narration: [], dialogue: [], formatting: [], avoid: [] },
      conditionalMemories: [{ id: 'legacy-only', anyCharacters: ['a'] }],
    });
  });

  it('rejects an ambiguous v2 compound legacy condition instead of changing its meaning', () => {
    const context = createContext();
    expect(() => evaluate(context, `lorebookManager.migrateLorebookToCurrent({
      schemaVersion: 2,
      conditionalMemories: [{ id: 'compound', characters: ['a'], anyCharacters: ['b'] }]
    })`)).toThrow('自動移行できません');
  });

  it('redacts the active API key from transient communication logs', () => {
    const context = createContext();
    const content = evaluate<string>(context, `(() => {
      globalThis.elements = {
        lorebookAnalysisLog: { textContent: '' },
        lorebookAnalysisLogDialog: { open: false }
      };
      lorebookManager.analysisLogEntries = [];
      lorebookManager.appendAnalysisLog('監査', 'エラー', 'request failed: secret-key', {
        provider: 'test', model: 'test-model', apiKey: 'secret-key'
      });
      return lorebookManager.analysisLogEntries[0].content;
    })()`);

    expect(content).toBe('request failed: [APIキーを除去]');
  });

  it('omits sourceText only from the displayed LLM log payload', () => {
    const context = createContext();
    const logged = JSON.parse(evaluate<string>(context, `lorebookManager.serializeAnalysisPayloadForLog({
      sourceText: 'ログに表示しない原文',
      candidate: { name: '表示する候補' }
    })`));

    expect(logged).toEqual({
      sourceText: '(省略)',
      candidate: { name: '表示する候補' },
    });
    expect(readFile('src/lorebook-manager.ts')).toContain('this.serializeAnalysisPayloadForLog(payload)');
  });

  it('states explicitly when the analysis report has no warnings', () => {
    const context = createContext();
    const report = evaluate<string>(context, `lorebookManager.formatAnalysisReport({
      reviewReport: {
        warnings: [], unresolvedQuestions: [],
        sourceAddressingCount: 4, structuredAddressingCount: 4
      },
      provider: 'gemini', model: 'test-model'
    })`);

    expect(report).toBe('警告: なし\n呼称: 原文 4件 / 構造化 4件\n解析: gemini / test-model');
  });

  it('detects token-limit termination and records response metadata before rejecting', async () => {
    const context = createContext();
    evaluate(context, `(() => {
      globalThis.state = { abortController: null };
      globalThis.elements = {
        lorebookAnalysisLog: { textContent: '' },
        lorebookAnalysisLogDialog: { open: false },
        lorebookEditorStatus: { textContent: '' }
      };
      globalThis.apiUtils = {
        getCurrentProviderRequestContext: () => ({ provider: 'gemini', model: 'test-model', apiKey: 'secret' }),
        requestCurrentProviderText: async () => ({
          text: '{"characters":[', provider: 'gemini', model: 'test-model',
          finishReason: 'MAX_TOKENS',
          usageMetadata: { candidatesTokenCount: 16384, totalTokenCount: 20000 }
        })
      };
      lorebookManager.analysisLogEntries = [];
    })()`);

    const request = new vm.Script(
      "lorebookManager.requestLoggedAnalysis('解析計画', 'system', 'user')",
    ).runInContext(context) as Promise<unknown>;
    await expect(request).rejects.toMatchObject({ name: 'LorebookAnalysisTruncatedError' });
    const log = evaluate<string>(context, 'lorebookManager.analysisLogEntries.map(entry => entry.content).join("\\n")');
    expect(log).toContain('終了理由: MAX_TOKENS');
    expect(log).toContain('通常出力: 16,384 tokens');
  });

  it('retries only the truncated analysis unit with an expanded output limit', async () => {
    const context = createContext();
    evaluate(context, `(() => {
      globalThis.state = { abortController: null };
      globalThis.elements = {
        lorebookAnalysisLog: { textContent: '' },
        lorebookAnalysisLogDialog: { open: false },
        lorebookEditorStatus: { textContent: '' }
      };
      globalThis.__analysisCalls = [];
      globalThis.__progressMessage = '';
      lorebookManager.updateAnalysisProgressMessage = message => { globalThis.__progressMessage = message; };
      globalThis.apiUtils = {
        getCurrentProviderRequestContext: () => ({ provider: 'gemini', model: 'test-model', apiKey: 'secret' }),
        requestCurrentProviderText: async (_system, _user, options) => {
          __analysisCalls.push(options.maxOutputTokens);
          if (__analysisCalls.length === 1) return {
            text: '{"characters":[', provider: 'gemini', model: 'test-model', finishReason: 'MAX_TOKENS',
            usageMetadata: { promptTokenCount: 19447, candidatesTokenCount: 1041, thoughtsTokenCount: 5103, totalTokenCount: 25591 }
          };
          return {
            text: '{"characters":[],"memoryTopics":[]}', provider: 'gemini', model: 'test-model', finishReason: 'STOP',
            usageMetadata: { promptTokenCount: 19447, candidatesTokenCount: 20, thoughtsTokenCount: 1000, totalTokenCount: 20467 }
          };
        }
      };
      lorebookManager.analysisLogEntries = [];
    })()`);

    const request = new vm.Script(`lorebookManager.requestAnalysisJson({
      stage: '解析計画', systemPrompt: 'system', payload: { sourceText: 'source' }, maxOutputTokens: 6144,
      validate: data => Array.isArray(data.characters) && Array.isArray(data.memoryTopics) ? '' : 'invalid'
    })`).runInContext(context) as Promise<unknown>;
    await expect(request).resolves.toMatchObject({ data: { characters: [], memoryTopics: [] } });
    expect(evaluate<number[]>(context, '__analysisCalls')).toEqual([6144, 12288]);
    const log = evaluate<string>(context, 'lorebookManager.analysisLogEntries.map(entry => entry.content).join("\\n")');
    expect(log).toContain('思考: 5,103 tokens');
    expect(log).toContain('指定出力上限: 6,144 tokens');
    expect(log).toContain('この処理単位だけ再試行します');
    expect(evaluate<string>(context, '__progressMessage')).toContain('出力上限を 6,144 から 12,288 tokensへ拡張');
  });

  it('renders deterministic n/m progress after the analysis plan is known', () => {
    const context = createContext();
    const result = evaluate<{ count: string; current: string; phases: string[] }>(context, `(() => {
      const makeClassList = () => ({ add() {}, remove() {} });
      const phaseItems = [];
      globalThis.document = {
        createElement: () => ({ textContent: '', classList: makeClassList() })
      };
      globalThis.elements = {
        lorebookAnalysisProgress: { classList: makeClassList() },
        lorebookAnalysisProgressCount: { textContent: '' },
        lorebookAnalysisProgressCurrent: { textContent: '' },
        lorebookAnalysisProgressPhases: {
          set innerHTML(value) { phaseItems.length = 0; },
          appendChild(item) { phaseItems.push(item); }
        }
      };
      lorebookManager.configureAnalysisProgress({ characterCount: 2, memoryTopicCount: 1 });
      lorebookManager.beginAnalysisProgressUnit('characters', '人物設定（1 / 2）：アリス');
      lorebookManager.completeAnalysisProgressUnit('characters', 'アリスを解析しました。');
      return {
        count: elements.lorebookAnalysisProgressCount.textContent,
        current: elements.lorebookAnalysisProgressCurrent.textContent,
        phases: phaseItems.map(item => item.textContent)
      };
    })()`);

    expect(result.count).toBe('2 / 10');
    expect(result.current).toBe('アリスを解析しました。');
    expect(Array.from(result.phases)).toContain('人物設定 1 / 2');
  });

  it('applies audit additions, replacements, and removals without regenerating the full Lorebook', () => {
    const context = createContext();
    const corrected = evaluate<{
      characterIds: string[];
      exactTargets: string[];
      memoryIds: string[];
    }>(context, `(() => {
      const result = lorebookManager.applyAnalysisCorrections({
        name: 'test', description: '', storyCore: 'core', styleGuide: {},
        characters: [{ id: 'keep' }, { id: 'remove' }],
        addressing: {
          instruction: 'old',
          exactRules: [{ speakerId: 'keep', targetId: 'remove', forms: [] }],
          fallbackRules: []
        },
        conditionalMemories: [{ id: 'old-memory' }]
      }, {
        removeCharacterIds: ['remove'],
        characters: [{ id: 'added' }],
        addressing: {
          removeExactRules: [{ speakerId: 'keep', targetId: 'remove' }],
          exactRules: [{ speakerId: 'keep', targetId: 'added', forms: [] }]
        },
        removeConditionalMemoryIds: ['old-memory'],
        conditionalMemories: [{ id: 'new-memory' }]
      });
      return {
        characterIds: result.characters.map(item => item.id),
        exactTargets: result.addressing.exactRules.map(item => item.targetId),
        memoryIds: result.conditionalMemories.map(item => item.id)
      };
    })()`);

    expect(Array.from(corrected.characterIds)).toEqual(['keep', 'added']);
    expect(Array.from(corrected.exactTargets)).toEqual(['added']);
    expect(Array.from(corrected.memoryIds)).toEqual(['new-memory']);
  });

  it('assembles a valid Lorebook from small planned analysis units', async () => {
    const context = createContext();
    evaluate(context, `(() => {
      globalThis.state = { lorebookRecords: [] };
      globalThis.requestedStages = [];
      lorebookManager.beginAnalysisProgressUnit = () => {};
      lorebookManager.completeAnalysisProgressUnit = () => {};
      lorebookManager.configureAnalysisProgress = () => {};
      lorebookManager.addAnalysisProgressPhase = () => {};
      lorebookManager.appendAnalysisLog = () => {};
      lorebookManager.requestAnalysisJson = async ({ stage }) => {
        requestedStages.push(stage);
        const response = { provider: 'gemini', model: 'test-model' };
        if (stage === '解析計画') return { response, data: {
          characters: [
            { id: 'alice', name: 'アリス', aliases: ['アリス'] },
            { id: 'bob', name: 'ボブ', aliases: ['ボブ'] }
          ],
          memoryTopics: [{ id: 'promise', label: '二人の約束', keywords: ['約束'] }]
        }};
        if (stage === '舞台・世界観・文体') return { response, data: {
          name: 'テスト物語', description: '分割解析テスト', storyCore: '二人が暮らす町を舞台とする。',
          styleGuide: { narration: ['三人称で描く。'], dialogue: [], formatting: [], avoid: [] },
          addressingInstruction: '原文の呼称を優先する。'
        }};
        if (stage === '人物設定：アリス・ボブ') return { response, data: { characters: [
          { id: 'alice', name: 'アリス', aliases: ['アリス'], core: '快活な主人公。' },
          { id: 'bob', name: 'ボブ', aliases: ['ボブ'], core: '慎重な幼なじみ。' }
        ] }};
        if (stage === '呼称・人間関係：アリス・ボブ') return { response, data: {
          exactRules: [
            { speakerId: 'alice', targetId: 'bob', forms: [{ context: 'spoken', value: 'ボブ' }] },
            { speakerId: 'bob', targetId: 'alice', forms: [{ context: 'spoken', value: 'アリス' }] }
          ],
          fallbackRules: []
        }};
        if (stage === '条件付き記憶：二人の約束') return { response, data: { topicResults: [{
          topicId: 'promise',
          memories: [{
            id: 'ignored', allCharacters: ['alice', 'bob'], keywords: ['約束'], priority: 80,
            content: '二人は再会を約束した。'
          }]
        }] }};
        if (stage === '原文照合') return { response, data: {
          reviewReport: { warnings: [], unresolvedQuestions: [], sourceAddressingCount: 2, structuredAddressingCount: 2 },
          corrections: { characters: [], addressing: { exactRules: [], fallbackRules: [] }, conditionalMemories: [] }
        }};
        throw new Error('unexpected stage: ' + stage);
      };
    })()`);

    const result = await new vm.Script(
      "lorebookManager.requestAnalysis('source', null, 'test.md')",
    ).runInContext(context) as { lorebook: Record<string, unknown>; reviewReport: Record<string, unknown> };
    const plain = JSON.parse(JSON.stringify(result));

    expect(plain.lorebook).toMatchObject({
      name: 'テスト物語',
      characters: [{ id: 'alice' }, { id: 'bob' }],
      conditionalMemories: [{ id: 'promise' }],
    });
    expect(evaluate<string[]>(context, 'requestedStages')).toHaveLength(6);
    expect(evaluate<string[]>(context, 'lorebookManager.validateLorebook(' + JSON.stringify(plain.lorebook) + ')')).toEqual([]);
  });

  it('seeds built-in Lorebooks into IndexedDB once and treats deletion as permanent', async () => {
    const context = createContext();
    evaluate(context, `(() => {
      globalThis.state = { lorebookRecords: [] };
      globalThis.savedItems = [];
      globalThis.dbUtils = {
        getAllLorebookRecords: async () => [],
        putLorebookRecords: async (items) => { globalThis.savedItems = items; }
      };
    })()`);

    await new vm.Script('lorebookManager.loadRecords()').runInContext(context);
    const firstLoad = evaluate<{ recordIds: string[]; installedSeedIds: string[] }>(context, `(() => ({
      recordIds: state.lorebookRecords.map(record => record.id),
      installedSeedIds: savedItems.find(item => item.id === LOREBOOK_SEED_REGISTRY_ID).installedSeedIds
    }))()`);
    expect(Array.from(firstLoad.recordIds)).toEqual([
      'tokyo-yunagi-high-v1',
      'seirei-boarding-school-v1',
    ]);
    expect(Array.from(firstLoad.installedSeedIds)).toEqual(firstLoad.recordIds);

    evaluate(context, `(() => {
      globalThis.seedWriteCount = 0;
      const registry = savedItems.find(item => item.id === LOREBOOK_SEED_REGISTRY_ID);
      dbUtils.getAllLorebookRecords = async () => [registry];
      dbUtils.putLorebookRecords = async () => { globalThis.seedWriteCount += 1; };
    })()`);
    await new vm.Script('lorebookManager.loadRecords()').runInContext(context);
    const afterDeletion = evaluate<{ recordCount: number; seedWriteCount: number }>(context, `({
      recordCount: state.lorebookRecords.length,
      seedWriteCount
    })`);
    expect({ ...afterDeletion }).toEqual({ recordCount: 0, seedWriteCount: 0 });
  });

  it('accepts the legacy GeminiPWA package identifier and restores Lorebooks with their original IDs', async () => {
    const context = createContext();
    evaluate(context, `(() => {
      const original = JSON.parse(JSON.stringify(BUILTIN_LOREBOOKS[0]));
      const restored = JSON.parse(JSON.stringify(original));
      restored.description = 'エクスポートから復元した内容';
      globalThis.state = {
        currentLorebookId: original.id,
        lorebookRecords: [{
          id: original.id, lorebook: original, sourceText: '旧内容', sourceLabel: 'seed',
          order: 0, createdAt: 1, updatedAt: 1
        }]
      };
      globalThis.savedRecords = [];
      globalThis.confirmCount = 0;
      globalThis.alertMessage = '';
      globalThis.dbUtils = {
        putLorebookRecords: async records => { globalThis.savedRecords = records; }
      };
      globalThis.uiUtils = {
        showCustomConfirm: async () => { globalThis.confirmCount += 1; return true; },
        showCustomAlert: async message => { globalThis.alertMessage = message; },
        updateLorebookMenuItem: () => {}
      };
      lorebookManager.renderManagementList = () => {};
      globalThis.importFile = {
        name: 'legacy.lorebook.json',
        text: async () => JSON.stringify({
          format: 'GeminiPWA Lorebook',
          packageVersion: LOREBOOK_PACKAGE_VERSION,
          lorebooks: [{
            id: restored.id,
            lorebook: restored,
            sourceText: '復元元テキスト',
            order: 0,
            createdAt: 123
          }]
        })
      };
    })()`);

    await new vm.Script('lorebookManager.importLorebooks(importFile)').runInContext(context);
    const result = evaluate<{
      savedRecordId: string;
      savedLorebookId: string;
      description: string;
      stateIds: string[];
      confirmCount: number;
      alertMessage: string;
    }>(context, `({
      savedRecordId: savedRecords[0].id,
      savedLorebookId: savedRecords[0].lorebook.id,
      description: savedRecords[0].lorebook.description,
      stateIds: state.lorebookRecords.map(record => record.id),
      confirmCount,
      alertMessage
    })`);

    expect({ ...result, stateIds: Array.from(result.stateIds) }).toEqual({
      savedRecordId: 'tokyo-yunagi-high-v1',
      savedLorebookId: 'tokyo-yunagi-high-v1',
      description: 'エクスポートから復元した内容',
      stateIds: ['tokyo-yunagi-high-v1'],
      confirmCount: 1,
      alertMessage: '0件を追加し、1件を同じIDで上書きしました。',
    });
  });

  it('saves structured edits without replacing the preserved source text', async () => {
    const context = createContext();
    evaluate(context, `(() => {
      const lorebook = JSON.parse(JSON.stringify(BUILTIN_LOREBOOKS[0]));
      lorebook.id = 'user-edit-test';
      const edited = JSON.parse(JSON.stringify(lorebook));
      edited.description = '構造化編集後';
      globalThis.state = {
        currentScreen: 'settings',
        lorebookRecords: [{
          id: 'user-edit-test', lorebook, sourceText: '保持する原文', sourceLabel: 'manual-input',
          order: 0, createdAt: 1, updatedAt: 1
        }]
      };
      const classes = { add() {}, remove() {} };
      globalThis.elements = {
        lorebookSourceTextarea: { value: JSON.stringify(edited), classList: classes },
        lorebookEditorStatus: { textContent: '' },
        analyzeLorebookBtn: { textContent: '', disabled: false, classList: classes }
      };
      globalThis.dbUtils = { putLorebookRecord: async (record) => { globalThis.savedRecord = record; } };
      globalThis.uiUtils = { showCustomAlert: async () => {}, updateLorebookMenuItem: () => {} };
      globalThis.history = { back: () => {} };
      lorebookManager.editorState = {
        recordId: 'user-edit-test', mode: 'structured', jsonAdvanced: true, structuredLorebook: lorebook
      };
      lorebookManager.renderManagementList = () => {};
    })()`);

    await new vm.Script('lorebookManager.saveStructuredLorebook()').runInContext(context);
    const result = evaluate<{ description: string; sourceText: string; analyzedBy?: unknown }>(context, `({
      description: state.lorebookRecords[0].lorebook.description,
      sourceText: state.lorebookRecords[0].sourceText,
      analyzedBy: state.lorebookRecords[0].analyzedBy
    })`);

    expect({ ...result }).toMatchObject({
      description: '構造化編集後',
      sourceText: '保持する原文',
    });
  });

  it('defines persistent records, import/export controls, and a full-screen editor', () => {
    const config = readFile('src/app-config.ts');
    const database = readFile('src/database.ts');
    const html = readFile('src/index.html');
    const manager = readFile('src/lorebook-manager.ts');

    expect(config).toContain("const LOREBOOKS_STORE = 'lorebooks'");
    expect(database).toContain('getAllLorebookRecords()');
    expect(database).toContain('putLorebookRecord(record)');
    expect(html).toContain('id="settings-group-lorebooks"');
    expect(html).toContain('id="lorebook-editor-screen"');
    expect(html).toContain('id="toggle-lorebook-analysis-log-btn"');
    expect(html).toContain('id="lorebook-analysis-log-dialog"');
    expect(html).toContain('id="lorebook-analysis-progress"');
    expect(html).toContain('id="lorebook-analysis-progress-count"');
    expect(html).toContain('id="close-lorebook-analysis-log-btn"');
    expect(html).toContain('id="lorebook-structured-form"');
    expect(html).toContain('id="toggle-lorebook-json-editor-btn"');
    expect(html).toContain('id="import-lorebooks-btn"');
    expect(html).toContain('id="export-all-lorebooks-btn"');
    expect(manager).toContain('現在入力されている内容は、ファイルの内容で上書きされます。');
    expect(manager).toContain('requestCurrentProviderText');
    expect(manager).toContain("stage: '解析計画'");
    expect(manager).toContain("stage: `人物設定：${batchNames}`");
    expect(manager).toContain("stage: `呼称・人間関係：${batchNames}`");
    expect(manager).toContain("stage: `条件付き記憶：${batchLabels}`");
    expect(manager).toContain("'原文照合'");
    expect(manager).toContain("'構造修復'");
    expect(manager).toContain('state.abortController.abort()');
    expect(manager).toContain('解析を中断して設定画面に戻りますか？');
    expect(manager).toContain("mode: record ? 'structured' : 'source'");
    expect(manager).toContain('saveStructuredLorebook()');
    expect(manager).toContain('renderStructuredForm()');
    expect(manager).toContain('toggleStructuredJsonEditor()');
    expect(manager).toContain('LOREBOOK_SEED_REGISTRY_ID');
  });
});
