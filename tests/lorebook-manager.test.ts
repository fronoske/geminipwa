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
  });

  it('redacts the active API key from transient communication logs', () => {
    const context = createContext();
    const content = evaluate<string>(context, `(() => {
      globalThis.elements = {
        lorebookAnalysisLog: { textContent: '' },
        lorebookAnalysisLogPanel: { classList: { contains: () => true } }
      };
      lorebookManager.analysisLogEntries = [];
      lorebookManager.appendAnalysisLog('監査', 'エラー', 'request failed: secret-key', {
        provider: 'test', model: 'test-model', apiKey: 'secret-key'
      });
      return lorebookManager.analysisLogEntries[0].content;
    })()`);

    expect(content).toBe('request failed: [APIキーを除去]');
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
    expect(html).toContain('id="lorebook-analysis-log-panel"');
    expect(html).toContain('id="import-lorebooks-btn"');
    expect(html).toContain('id="export-all-lorebooks-btn"');
    expect(manager).toContain('現在入力されている内容は、ファイルの内容で上書きされます。');
    expect(manager).toContain('requestCurrentProviderText');
    expect(manager).toContain("'抽出・構造化'");
    expect(manager).toContain("'原文照合'");
    expect(manager).toContain("'構造修復'");
    expect(manager).toContain('state.abortController.abort()');
    expect(manager).toContain('解析を中断して設定画面に戻りますか？');
  });
});
