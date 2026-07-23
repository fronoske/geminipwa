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
      lorebook.conditionalMemories[0].characters = ['missing-character'];
      return lorebookManager.validateLorebook(lorebook);
    })()`);

    expect(Array.from(errors).join('\n')).toContain('許可されていない項目');
    expect(Array.from(errors).join('\n')).toContain('矛盾する呼称');
    expect(Array.from(errors).join('\n')).toContain('missing-character');
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
    expect(readFile('src/lorebook-manager.ts')).toContain('JSON.stringify(extractionPayload)');
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
      lorebookManager.editorState = { recordId: 'user-edit-test', mode: 'structured' };
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
    expect(html).toContain('id="close-lorebook-analysis-log-btn"');
    expect(html).toContain('id="import-lorebooks-btn"');
    expect(html).toContain('id="export-all-lorebooks-btn"');
    expect(manager).toContain('現在入力されている内容は、ファイルの内容で上書きされます。');
    expect(manager).toContain('requestCurrentProviderText');
    expect(manager).toContain("'抽出・構造化'");
    expect(manager).toContain("'原文照合'");
    expect(manager).toContain("'構造修復'");
    expect(manager).toContain('state.abortController.abort()');
    expect(manager).toContain('解析を中断して設定画面に戻りますか？');
    expect(manager).toContain("mode: record ? 'structured' : 'source'");
    expect(manager).toContain('saveStructuredLorebook()');
    expect(manager).toContain('LOREBOOK_SEED_REGISTRY_ID');
  });
});
