import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const cliModulePath: string = '../scripts/lorebook-json-cli.mjs';
const {
  analyzeLorebook,
  applyCharacterCoverageAdditions,
  applyGroundedMemoryRepairs,
  applyGroundedWarningRepairs,
  collectValidationErrors,
  createCheckpointPath,
  createCheckpointStore,
  createInvalidOutputPath,
  createOpenAIClient,
  ensureExplicitStoryCoreFacts,
  extractExplicitStoryCoreFacts,
  extractCharacterSourceSection,
  extractResponseText,
  filterCharacterCoverageAdditions,
  formatBatchStage,
  formatApiUsage,
  isStyleGuideMemory,
  isStyleGuideTopic,
  loadLorebookRuntime,
  normalizeAddressContexts,
  normalizeConditionalMemories,
  parseArgs,
  parseModelJson,
  requestAnalysisJson,
  sanitizeCharacterAliases,
  validateJsonSchema,
  validateBaseExtraction,
  validatePlanningGranularity,
  validateReferences,
} = await import(cliModulePath);

const projectRoot = path.resolve(import.meta.dirname, '..');
const readJson = (filename: string) => JSON.parse(fs.readFileSync(path.join(projectRoot, filename), 'utf8'));

describe('Lorebook JSON CLI', () => {
  it('parses CLI options without external dependencies', () => {
    expect(parseArgs([
      'source.txt',
      'output.json',
      '--model', 'test-model',
      '--reasoning-effort', 'high',
      '--id', 'test-id',
      '--max-repairs', '3',
      '--max-warning-repairs', '1',
      '--api-retries', '6',
      '--no-resume',
    ])).toMatchObject({
      positionals: ['source.txt', 'output.json'],
      model: 'test-model',
      reasoningEffort: 'high',
      id: 'test-id',
      maxRepairs: 3,
      maxWarningRepairs: 1,
      apiRetries: 6,
      resume: false,
    });
  });

  it('defaults to gpt-5.6-terra with medium reasoning and validates reasoning effort', () => {
    expect(parseArgs([])).toMatchObject({ model: 'gpt-5.6-terra', reasoningEffort: 'medium' });
    expect(() => parseArgs(['--reasoning-effort', 'extreme'])).toThrow(/none, low, medium, high, xhigh, max/);
  });

  it('formats indexed batch progress with ASCII ranges', () => {
    expect(formatBatchStage('人物設定', 1, 3, 15, '田中美咲／鈴木千尋／加藤あずさ'))
      .toBe('人物設定[1-3/15]: 田中美咲／鈴木千尋／加藤あずさ');
    expect(formatBatchStage('人物網羅性監査', 4, 4, 12, '相沢桃子'))
      .toBe('人物網羅性監査[4/12]: 相沢桃子');
  });

  it('uses a sibling .invalid.json path for an unsuccessful candidate', () => {
    expect(createInvalidOutputPath('/tmp/result.json')).toBe('/tmp/result.invalid.json');
    expect(createInvalidOutputPath('/tmp/result')).toBe('/tmp/result.invalid.json');
  });

  it('uses a sibling checkpoint path', () => {
    expect(createCheckpointPath('/tmp/result.json')).toBe('/tmp/result.checkpoint.json');
    expect(createCheckpointPath('/tmp/result')).toBe('/tmp/result.checkpoint.json');
  });

  it('sends reasoning effort to the Responses API', async () => {
    let requestBody: Record<string, unknown> | undefined;
    const client = createOpenAIClient({
      apiKey: 'test-key',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'xhigh',
      baseUrl: 'https://example.test/v1',
      timeoutMs: 1_000,
      fetchImplementation: async (_url: string, init: RequestInit) => {
        requestBody = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ status: 'completed', output_text: '{"ok":true}' }), { status: 200 });
      },
    });

    await client({ instructions: 'test', input: 'test', maxOutputTokens: 100 });
    expect(requestBody).toMatchObject({
      model: 'gpt-5.6-luna',
      reasoning: { effort: 'xhigh' },
    });
  });

  it('sends strict Structured Outputs to the Responses API', async () => {
    let requestBody: Record<string, any> | undefined;
    const client = createOpenAIClient({
      apiKey: 'test-key',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'medium',
      baseUrl: 'https://example.test/v1',
      timeoutMs: 1_000,
      fetchImplementation: async (_url: string, init: RequestInit) => {
        requestBody = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ status: 'completed', output_text: '{"ok":true}' }), { status: 200 });
      },
    });
    const schema = {
      type: 'object',
      additionalProperties: false,
      required: ['ok'],
      properties: { ok: { type: 'boolean' } },
    };

    await client({
      instructions: 'test',
      input: 'test',
      maxOutputTokens: 100,
      outputFormat: { name: 'test_output', schema },
    });
    expect(requestBody?.text).toEqual({
      format: { type: 'json_schema', name: 'test_output', strict: true, schema },
    });
  });

  it('retries transient API errors separately and aggregates usage', async () => {
    let calls = 0;
    const delays: number[] = [];
    const retries: Array<{ reason: string }> = [];
    const client = createOpenAIClient({
      apiKey: 'test-key',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'medium',
      baseUrl: 'https://example.test/v1',
      timeoutMs: 1_000,
      maxApiRetries: 2,
      retryBaseMs: 10,
      randomImplementation: () => 0.5,
      sleepImplementation: async (delay: number) => { delays.push(delay); },
      onRetry: (event: { reason: string }) => retries.push(event),
      fetchImplementation: async () => {
        calls += 1;
        if (calls === 1) {
          return new Response(JSON.stringify({ error: { message: 'Our servers are currently overloaded.' } }), {
            status: 503,
          });
        }
        return new Response(JSON.stringify({
          status: 'completed',
          output_text: '{"ok":true}',
          usage: {
            input_tokens: 10,
            output_tokens: 5,
            total_tokens: 15,
            output_tokens_details: { reasoning_tokens: 3 },
          },
        }), { status: 200 });
      },
    });

    await client({ instructions: 'test', input: 'test', maxOutputTokens: 100 });
    expect(calls).toBe(2);
    expect(delays).toEqual([10]);
    expect(retries[0].reason).toContain('overloaded');
    expect(client.getUsage()).toMatchObject({
      requests: 2,
      retries: 1,
      inputTokens: 10,
      outputTokens: 5,
      reasoningTokens: 3,
      totalTokens: 15,
    });
    expect(formatApiUsage(client.getUsage())).toContain('再試行1回');
  });

  it('does not treat a permanent API error as a JSON repair attempt', async () => {
    let calls = 0;
    const client = createOpenAIClient({
      apiKey: 'bad-key',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'medium',
      baseUrl: 'https://example.test/v1',
      timeoutMs: 1_000,
      fetchImplementation: async () => {
        calls += 1;
        return new Response(JSON.stringify({ error: { message: 'Invalid API key.' } }), { status: 401 });
      },
    });

    await expect(requestAnalysisJson({
      stage: '認証テスト',
      systemPrompt: 'system',
      payload: {},
      maxOutputTokens: 100,
      outputFormat: undefined,
      validate: undefined,
      client,
      log: () => {},
    })).rejects.toThrow(/Invalid API key/);
    expect(calls).toBe(1);
  });

  it('reuses only validated JSON from a matching checkpoint', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lorebook-checkpoint-'));
    const filePath = path.join(directory, 'run.checkpoint.json');
    try {
      const store = await createCheckpointStore({ filePath, metadata: { source: 'same' } });
      let calls = 0;
      const client = async () => {
        calls += 1;
        return { data: { status: 'completed' }, text: '{"ok":true}' };
      };
      const request = {
        stage: 'test-stage',
        systemPrompt: 'system',
        payload: { input: 'same' },
        maxOutputTokens: 100,
        outputFormat: undefined,
        validate: (data: { ok?: boolean }) => data.ok ? '' : 'ok is required',
        client,
        checkpointStore: store,
        log: () => {},
      };
      expect((await requestAnalysisJson(request)).data).toEqual({ ok: true });

      const reloaded = await createCheckpointStore({ filePath, metadata: { source: 'same' } });
      expect((await requestAnalysisJson({ ...request, checkpointStore: reloaded })).data).toEqual({ ok: true });
      expect(calls).toBe(1);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('leaves topic granularity to the model', () => {
    const characters = [{ id: 'alice', name: 'アリス', aliases: ['アリス'] }];
    expect(validatePlanningGranularity({
      characters,
      memoryTopics: [{
        id: 'daily',
        label: '各人物の家族・生い立ち・住環境・日常',
        keywords: ['家族'],
        characterIds: ['alice'],
      }],
    })).toBe('');
    expect(validatePlanningGranularity({
      characters,
      memoryTopics: [{
        id: 'alice-family',
        label: 'アリスの家族と生い立ち',
        keywords: ['アリス', '家族'],
        characterIds: ['alice'],
      }],
    })).toBe('');
  });

  it('separates global style and output rules from conditional-memory topics', () => {
    expect(isStyleGuideTopic({
      id: 'narrative-style',
      label: 'ラノベ風の文体と内心ツッコミ',
      keywords: ['文体'],
      characterIds: [],
    })).toBe(true);
    expect(isStyleGuideTopic({
      id: 'dialogue-output',
      label: '台詞の扱いと出力末尾',
      keywords: ['出力形式'],
      characterIds: [],
    })).toBe(true);
    expect(isStyleGuideTopic({
      id: 'momoko-writing',
      label: '相沢桃子の小説の文体',
      keywords: ['小説'],
      characterIds: ['momoko'],
    })).toBe(false);
    expect(isStyleGuideMemory({ content: '出力の最後は必ず人物の台詞にする。' })).toBe(true);
    expect(isStyleGuideMemory({ content: '真下結菜はラノベを月に5冊読む。' })).toBe(false);
  });

  it('keeps the stage in storyCore while rejecting local clothing details', () => {
    const sourceText = `## 舞台設定
東京都内の中高一貫校

## 特記事項（重要）
- 田中美咲と鈴木千尋は同じクラスである。
- 田中美咲は染谷翔太に恋している。

## 文体・スタイル
- 軽妙な文体。

# 表記・出力形式
出力の最後は人物の台詞にする。`;
    expect(extractExplicitStoryCoreFacts(sourceText)).toBe('東京都内の中高一貫校');
    expect(extractExplicitStoryCoreFacts(sourceText)).not.toContain('染谷翔太');

    expect(validateBaseExtraction({
      storyCore: '舞台は学校。女子制服は白いブラウスとチェックのスカート。',
    }, { sourceText })).toContain('制服・服装');
    expect(validateBaseExtraction({
      storyCore: '舞台は学校。',
    }, { sourceText })).toContain('東京都内の中高一貫校');
    expect(validateBaseExtraction({
      storyCore: ensureExplicitStoryCoreFacts('', sourceText),
      styleGuide: {
        narration: ['軽妙な文体にする。'],
        dialogue: [],
        formatting: [],
        avoid: [],
      },
    }, { sourceText })).toContain('styleGuide.formatting');
    expect(validateBaseExtraction({
      storyCore: ensureExplicitStoryCoreFacts('', sourceText),
      styleGuide: {
        narration: ['軽妙な文体にする。'],
        dialogue: [],
        formatting: ['出力の最後は人物の台詞にする。'],
        avoid: [],
      },
    }, { sourceText })).toBe('');
  });

  it('defines storyCore as a compact story-writing operating core', async () => {
    const runtime = await loadLorebookRuntime();
    const prompt = runtime.manager.buildBaseExtractionPrompt();

    expect(prompt).toContain('コンパクトな物語運用コア');
    expect(prompt).toContain('中心人物と集団の構図');
    expect(prompt).toContain('主要テーマ・葛藤');
    expect(prompt).toContain('秘密を知る人物の範囲');
    expect(prompt).toContain('セッション内で成立した出来事');
    expect(prompt).toContain('制服、服装、外見');
  });

  it('extracts one character section and applies coverage additions without replacing existing data', () => {
    const sourceText = `## 登場人物
### アリス（ありす）
#### 基本情報
- 高校生。
- 好きな色は青。
### ボブ（ぼぶ）
- 大学生。`;
    const section = extractCharacterSourceSection(sourceText, { name: 'アリス', aliases: ['アリス'] });
    expect(section).toContain('好きな色は青');
    expect(section).not.toContain('ボブ');

    const result = applyCharacterCoverageAdditions({
      characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'], core: '既存の人物情報。' }],
      conditionalMemories: [{
        id: 'existing-memory',
        anyCharacters: ['alice'],
        keywords: ['既存'],
        priority: 50,
        content: '既存の条件付き情報。',
      }],
    }, 'alice', [
      {
        destination: 'core',
        content: '高校生である。',
        allCharacters: [],
        anyCharacters: [],
        keywords: [],
        priority: 50,
      },
      {
        destination: 'conditionalMemory',
        content: '好きな色は青。',
        allCharacters: [],
        anyCharacters: ['alice'],
        keywords: ['好きな色'],
        priority: 40,
      },
    ]);

    expect(result.candidate.characters[0].core).toContain('既存の人物情報。');
    expect(result.candidate.characters[0].core).toContain('高校生である。');
    expect(result.candidate.conditionalMemories[0].content).toBe('既存の条件付き情報。');
    expect(result.candidate.conditionalMemories[1].content).toBe('好きな色は青。');
    expect(result).toMatchObject({ coreAdditions: 1, memoryAdditions: 1 });
  });

  it('accepts harmless formatting differences in coverage evidence and rejects unsupported additions', () => {
    const sourceSection = `### アリス（ありす）
- **好きな色**: 青
- 朝は 6:30 に起きる。`;
    const supported = { sourceExcerpt: '好きな色: 青', content: '好きな色は青。' };
    const unsupported = { sourceExcerpt: '実は赤が好き。', content: '実は赤が好き。' };
    const result = filterCharacterCoverageAdditions(sourceSection, [supported, unsupported]);

    expect(result.additions).toEqual([supported]);
    expect(result.rejected).toEqual([unsupported]);
  });

  it('replaces only an existing conditional memory with source-grounded content', () => {
    const lorebook = {
      characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'], core: '高校生。' }],
      conditionalMemories: [{
        id: 'alice-grade',
        anyCharacters: ['alice'],
        keywords: ['成績'],
        priority: 40,
        content: 'アリスは成績が悪い。',
      }],
    };
    const validRepair = {
      memoryId: 'alice-grade',
      sourceExcerpt: '成績優秀である。',
      allCharacters: [],
      anyCharacters: ['alice'],
      keywords: ['成績'],
      priority: 50,
      content: 'アリスは成績優秀である。',
    };
    const invalidRepair = { ...validRepair, memoryId: 'missing-memory' };
    const result = applyGroundedMemoryRepairs(lorebook, '- 成績優秀である。', [validRepair, invalidRepair]);

    expect(result.applied).toBe(1);
    expect(result.rejected).toEqual(['missing-memory']);
    expect(result.candidate.conditionalMemories[0].content).toBe('アリスは成績優秀である。');
  });

  it('applies source-grounded warning repairs and rejects deletion-only memory changes', () => {
    const lorebook = {
      storyCore: '舞台は学校。',
      styleGuide: { narration: [], dialogue: [], formatting: [], avoid: [] },
      characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'], core: '高校生。' }],
      addressing: { instruction: '', exactRules: [], fallbackRules: [] },
      conditionalMemories: [{
        id: 'alice-color',
        allCharacters: [],
        anyCharacters: ['alice'],
        keywords: ['色'],
        priority: 40,
        content: 'アリスの好きな色は赤。',
      }],
    };
    const validRepair = {
      issue: '好きな色が原文と異なる。',
      sourceExcerpt: '好きな色は青。',
      storyCoreAddition: null,
      styleGuideAdditions: { narration: [], dialogue: [], formatting: [], avoid: [] },
      coreAdditions: [],
      addressing: {
        removeExactRules: [],
        exactRules: [],
        removeFallbackRules: [],
        fallbackRules: [],
      },
      removeConditionalMemoryIds: ['alice-color'],
      conditionalMemories: [{
        id: 'alice-color',
        allCharacters: [],
        anyCharacters: ['alice'],
        keywords: ['色'],
        priority: 50,
        content: 'アリスの好きな色は青。',
      }],
    };
    const deletionOnlyRepair = {
      ...validRepair,
      issue: '根拠のない削除。',
      removeConditionalMemoryIds: ['alice-color'],
      conditionalMemories: [],
    };
    const result = applyGroundedWarningRepairs(
      lorebook,
      '- 好きな色は青。',
      [validRepair, deletionOnlyRepair],
    );

    expect(result.applied).toBe(1);
    expect(result.rejected).toEqual(['根拠のない削除。']);
    expect(result.operations).toBe(2);
    expect(result.candidate.conditionalMemories[0].content).toBe('アリスの好きな色は青。');
  });

  it('resolves deletion-only exact addressing repairs from a unique speaker-target selector', () => {
    const exactRule = {
      speakerId: 'alice',
      targetId: 'bob',
      forms: [
        { context: 'public', value: 'ボブさん' },
        { context: 'private', value: 'ボブ' },
      ],
    };
    const lorebook = {
      storyCore: '舞台は学校。',
      styleGuide: { narration: [], dialogue: [], formatting: [], avoid: [] },
      characters: [
        { id: 'alice', name: 'アリス', aliases: ['アリス'], core: '高校生。' },
        { id: 'bob', name: 'ボブ', aliases: ['ボブ'], core: '高校生。' },
      ],
      addressing: {
        instruction: '',
        exactRules: [exactRule],
        fallbackRules: [{
          speakerId: 'alice',
          targetDescription: 'クラスメイト',
          context: 'spoken',
          formTemplate: 'ファミリーネーム＋さん',
        }],
      },
      conditionalMemories: [],
    };
    const repair = {
      issue: '原文にない個別呼称を削除する。',
      sourceExcerpt: 'クラスメイトには一般呼称を使う。',
      storyCoreAddition: null,
      styleGuideAdditions: { narration: [], dialogue: [], formatting: [], avoid: [] },
      coreAdditions: [],
      addressing: {
        removeExactRules: [{ speakerId: 'alice', targetId: 'bob' }],
        exactRules: [],
        removeFallbackRules: [],
        fallbackRules: [],
      },
      removeConditionalMemoryIds: [],
      conditionalMemories: [],
    };
    const staleRepair = {
      ...repair,
      issue: '現在値と異なる削除指定。',
      addressing: {
        ...repair.addressing,
        removeExactRules: [{
          speakerId: 'alice',
          targetId: 'missing',
        }],
      },
    };
    const fallbackDeletionOnlyRepair = {
      ...repair,
      issue: 'fallbackを置換せず削除する。',
      addressing: {
        ...repair.addressing,
        removeExactRules: [],
        removeFallbackRules: [{
          speakerId: 'alice',
          targetDescription: 'クラスメイト',
          context: 'spoken',
        }],
      },
    };
    const result = applyGroundedWarningRepairs(
      lorebook,
      '- クラスメイトには一般呼称を使う。',
      [staleRepair, fallbackDeletionOnlyRepair, repair],
    );

    expect(result.applied).toBe(1);
    expect(result.operations).toBe(1);
    expect(result.rejected).toEqual(['現在値と異なる削除指定。', 'fallbackを置換せず削除する。']);
    expect(result.candidate.addressing.exactRules).toEqual([]);
    expect(result.candidate.addressing.fallbackRules).toHaveLength(1);
  });

  it('rejects an ambiguous exact addressing removal selector', () => {
    const lorebook = {
      storyCore: '舞台は学校。',
      styleGuide: { narration: [], dialogue: [], formatting: [], avoid: [] },
      characters: [
        { id: 'alice', name: 'アリス', aliases: ['アリス'], core: '高校生。' },
        { id: 'bob', name: 'ボブ', aliases: ['ボブ'], core: '高校生。' },
      ],
      addressing: {
        instruction: '',
        exactRules: [
          { speakerId: 'alice', targetId: 'bob', forms: [{ context: 'public', value: 'ボブさん' }] },
          { speakerId: 'alice', targetId: 'bob', forms: [{ context: 'private', value: 'ボブ' }] },
        ],
        fallbackRules: [],
      },
      conditionalMemories: [],
    };
    const repair = {
      issue: '重複した組み合わせは一意に削除できない。',
      sourceExcerpt: '一般呼称を使う。',
      storyCoreAddition: null,
      styleGuideAdditions: { narration: [], dialogue: [], formatting: [], avoid: [] },
      coreAdditions: [],
      addressing: {
        removeExactRules: [{ speakerId: 'alice', targetId: 'bob' }],
        exactRules: [],
        removeFallbackRules: [],
        fallbackRules: [],
      },
      removeConditionalMemoryIds: [],
      conditionalMemories: [],
    };

    const result = applyGroundedWarningRepairs(lorebook, '一般呼称を使う。', [repair]);

    expect(result.applied).toBe(0);
    expect(result.rejected).toEqual(['重複した組み合わせは一意に削除できない。']);
    expect(result.candidate.addressing.exactRules).toHaveLength(2);
  });

  it('resolves a fallback removal selector only when a complete replacement is supplied', () => {
    const lorebook = {
      storyCore: '舞台は学校。',
      styleGuide: { narration: [], dialogue: [], formatting: [], avoid: [] },
      characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'], core: '高校生。' }],
      addressing: {
        instruction: '',
        exactRules: [],
        fallbackRules: [{
          speakerId: 'alice',
          targetDescription: 'クラスメイト',
          context: 'spoken',
          formTemplate: '名字＋さん',
        }],
      },
      conditionalMemories: [],
    };
    const repair = {
      issue: '一般呼称の表記を訂正する。',
      sourceExcerpt: '名字＋くんで呼ぶ。',
      storyCoreAddition: null,
      styleGuideAdditions: { narration: [], dialogue: [], formatting: [], avoid: [] },
      coreAdditions: [],
      addressing: {
        removeExactRules: [],
        exactRules: [],
        removeFallbackRules: [{
          speakerId: 'alice',
          targetDescription: 'クラスメイト',
          context: 'spoken',
        }],
        fallbackRules: [{
          speakerId: 'alice',
          targetDescription: 'クラスメイト',
          context: 'spoken',
          formTemplate: '名字＋くん',
        }],
      },
      removeConditionalMemoryIds: [],
      conditionalMemories: [],
    };

    const result = applyGroundedWarningRepairs(lorebook, '名字＋くんで呼ぶ。', [repair]);

    expect(result.applied).toBe(1);
    expect(result.candidate.addressing.fallbackRules).toEqual([{
      speakerId: 'alice',
      targetDescription: 'クラスメイト',
      context: 'spoken',
      formTemplate: '名字＋くん',
    }]);
  });

  it('rejects unnamed characters without requiring a topic count', () => {
    expect(validatePlanningGranularity({
      characters: [{ id: 'alice-father', name: 'アリスの父', aliases: ['父'] }],
      memoryTopics: [],
    })).toContain('固有名のない人物参照');
    expect(validatePlanningGranularity({
      characters: [{ id: 'teacher', name: '数学の若い男性教師', aliases: ['数学教師'] }],
      memoryTopics: [],
    })).toContain('固有名のない人物参照');

    const characters = [{ id: 'alice', name: 'アリス', aliases: ['アリス'] }];
    const topic = (id: string, label: string) => ({
      id,
      label,
      keywords: [label],
      characterIds: ['alice'],
    });
    expect(validatePlanningGranularity({
      characters,
      memoryTopics: [topic('alice-past', 'アリスの過去')],
    })).toBe('');
  });

  it('allows genuinely shared group topics', () => {
    const characters = ['a', 'b', 'c', 'd'].map(id => ({ id, name: id.toUpperCase(), aliases: [id.toUpperCase()] }));
    expect(validatePlanningGranularity({
      characters,
      memoryTopics: [{
        id: 'lunch-group',
        label: '昼食グループと居場所',
        keywords: ['昼食'],
        characterIds: ['a', 'b', 'c', 'd'],
      }],
    })).toBe('');
  });

  it('removes generic kinship and role aliases', () => {
    expect(sanitizeCharacterAliases(['アリス', 'ありす', 'お姉ちゃん', '先輩', 'アリス']))
      .toEqual(['アリス', 'ありす']);
  });

  it('normalizes invalid addressing contexts deterministically', () => {
    const result = normalizeAddressContexts({
      addressing: {
        exactRules: [{
          speakerId: 'alice',
          targetId: 'bob',
          forms: [
            { context: '会話時', value: 'ボブ' },
            { context: 'spoken', value: 'ボブ君' },
            { context: '心の中', value: 'ボブ' },
            { context: 'unexpected', value: 'ボブさん' },
          ],
        }],
        fallbackRules: [{
          speakerId: 'alice',
          targetDescription: '親しい相手',
          context: '二人きり',
          formTemplate: '名前',
        }],
      },
    });

    expect(result.changes).toBeGreaterThan(0);
    expect(result.lorebook.addressing.exactRules[0].forms).toEqual([
      { context: 'spoken', value: 'ボブ君' },
      { context: 'innerThought', value: 'ボブ' },
    ]);
    expect(result.lorebook.addressing.fallbackRules[0].context).toBe('private');
  });

  it('clears schema and implementation errors caused by invalid addressing contexts', async () => {
    const schema = readJson('schemas/lorebook.schema.json');
    const runtime = await loadLorebookRuntime();
    const lorebook = structuredClone(readJson('tests/fixtures/lorebook.json')[0]);
    lorebook.addressing.exactRules[0].forms[0].context = '心の中';
    lorebook.addressing.fallbackRules[0].context = '二人きり';

    expect(collectValidationErrors(lorebook, schema, runtime.manager).join('\n')).toContain('context');
    const normalized = normalizeAddressContexts(lorebook).lorebook;
    expect(collectValidationErrors(normalized, schema, runtime.manager)).toEqual([]);
  });

  it('deduplicates only exact conditional memories without applying caps', () => {
    const memories = Array.from({ length: 41 }, (_, topicIndex) => (
      Array.from({ length: 6 }, (_, memoryIndex) => ({
        id: `topic-${topicIndex + 1}-${memoryIndex + 1}`,
        anyCharacters: ['alice'],
        keywords: [`話題${topicIndex + 1}`],
        priority: memoryIndex,
        content: `話題${topicIndex + 1}の固有情報${memoryIndex + 1}。`,
      }))
    )).flat();
    memories.push({
      id: 'topic-1-duplicate',
      anyCharacters: ['alice'],
      keywords: ['追加キーワード'],
      priority: 99,
      content: '話題1の固有情報6。',
    });

    const result = normalizeConditionalMemories({ conditionalMemories: memories });
    expect(result.lorebook.conditionalMemories).toHaveLength(246);
    expect(result.lorebook.conditionalMemories.filter((memory: { id: string }) => memory.id.startsWith('topic-1-')))
      .toHaveLength(6);
    expect(result.lorebook.conditionalMemories.some((memory: { id: string }) => memory.id.startsWith('topic-41-')))
      .toBe(true);
    const merged = result.lorebook.conditionalMemories.find((memory: { content: string }) => memory.content.includes('固有情報6'));
    expect(merged.keywords).toContain('追加キーワード');
    expect(merged.priority).toBe(99);
    expect(result.changes).toBe(1);
  });

  it('omits empty optional trigger arrays from conditional memories', () => {
    const result = normalizeConditionalMemories({
      conditionalMemories: [{
        id: 'always-on',
        allCharacters: [],
        anyCharacters: [],
        keywords: [],
        priority: 50,
        content: '常に参照する情報。',
      }],
    });

    expect(result.lorebook.conditionalMemories).toEqual([{
      id: 'always-on',
      priority: 50,
      content: '常に参照する情報。',
    }]);
  });

  it('extracts JSON from Responses API text and optional code fences', () => {
    expect(extractResponseText({
      output: [{ content: [{ type: 'output_text', text: '{"ok":true}' }] }],
    })).toBe('{"ok":true}');
    expect(parseModelJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('uses the formal schema, implementation validator, and reference audit', async () => {
    const schema = readJson('schemas/lorebook.schema.json');
    const fixture = readJson('tests/fixtures/lorebook.json')[0];
    const runtime = await loadLorebookRuntime();

    expect(validateJsonSchema(fixture, schema)).toEqual([]);
    expect(validateReferences(fixture)).toEqual([]);
    expect(collectValidationErrors(fixture, schema, runtime.manager)).toEqual([]);

    const broken = structuredClone(fixture);
    broken.addressing.exactRules[0].targetId = 'missing-character';
    expect(collectValidationErrors(broken, schema, runtime.manager).join('\n')).toContain('参照先');
  });

  it('runs the split analysis pipeline with a Responses-compatible client', async () => {
    const schema = readJson('schemas/lorebook.schema.json');
    const runtime = await loadLorebookRuntime();
    let postAuditCalls = 0;
    let globalAuditCalls = 0;
    const logs: string[] = [];
    const client = async ({ instructions }: { instructions: string }) => {
      let output: object;
      if (instructions.includes('後続処理のための索引')) {
        output = {
          characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'] }],
          memoryTopics: [
            { id: 'alice-secret', label: 'アリスの秘密', keywords: ['秘密'], characterIds: ['alice'] },
            { id: 'alice-daily', label: 'アリスの日常', keywords: ['日常'], characterIds: ['alice'] },
            { id: 'alice-past', label: 'アリスの過去', keywords: ['過去'], characterIds: ['alice'] },
            { id: 'narrative-style', label: 'ラノベ風の文体', keywords: ['文体'], characterIds: [] },
          ],
        };
      } else if (instructions.includes('コンパクトな物語運用コア')) {
        output = {
          name: 'テストLorebook',
          description: 'CLIテスト',
          storyCore: '舞台はテスト校。',
          styleGuide: { narration: [], dialogue: [], formatting: [], avoid: [] },
          addressingInstruction: '原文に明記された呼称を優先する。',
        };
      } else if (instructions.includes('指定された人物ごと')) {
        output = { characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'], core: '高校生。一人称は「私」。' }] };
      } else if (instructions.includes('指定された人物を話者')) {
        output = { exactRules: [], fallbackRules: [] };
      } else if (instructions.includes('指定された各話題')) {
        output = {
          topicResults: [
            {
              topicId: 'alice-secret',
              memories: [{ id: 'ignored', anyCharacters: ['alice'], keywords: ['秘密'], priority: 50, content: '秘密を持つ。' }],
            },
            {
              topicId: 'alice-daily',
              memories: [{ id: 'ignored', anyCharacters: ['alice'], keywords: ['日常'], priority: 40, content: '毎日登校する。' }],
            },
            {
              topicId: 'alice-past',
              memories: [{ id: 'ignored', anyCharacters: ['alice'], keywords: ['過去'], priority: 40, content: '過去がある。' }],
            },
          ],
        };
      } else if (instructions.includes('項目ごとに照合する網羅性監査')) {
        output = {
          characterId: 'alice',
          additions: [
            {
              sourceExcerpt: '成績優秀である。',
              destination: 'core',
              content: '成績優秀である。',
              allCharacters: [],
              anyCharacters: [],
              keywords: [],
              priority: 50,
            },
            {
              sourceExcerpt: '好きな色は青。',
              destination: 'conditionalMemory',
              content: '好きな色は青。',
              allCharacters: [],
              anyCharacters: ['alice'],
              keywords: ['好きな色'],
              priority: 40,
            },
            {
              sourceExcerpt: '原文に存在しない情報。',
              destination: 'conditionalMemory',
              content: '原文に存在しない情報。',
              allCharacters: [],
              anyCharacters: ['alice'],
              keywords: ['存在しない'],
              priority: 40,
            },
          ],
        };
      } else if (instructions.includes('すべての修正・正規化・構造検証が完了したfinalLorebook')) {
        postAuditCalls += 1;
        output = postAuditCalls === 1
          ? {
              reviewReport: {
                warnings: ['修復前だけの警告'],
                unresolvedQuestions: ['修正後監査で追加発見した矛盾'],
                sourceAddressingCount: 0,
                structuredAddressingCount: 0,
              },
              factualMemoryRepairs: [{
                memoryId: 'alice-past',
                issue: '過去の内容が原文と異なる。',
                sourceExcerpt: '成績優秀である。',
                allCharacters: [],
                anyCharacters: ['alice'],
                keywords: ['成績'],
                priority: 50,
                content: '成績優秀である。',
              }],
              warningRepairs: [{
                issue: '好きな色が人物coreに未収録である。',
                sourceExcerpt: '好きな色は青。',
                storyCoreAddition: null,
                styleGuideAdditions: { narration: [], dialogue: [], formatting: [], avoid: [] },
                coreAdditions: [{ characterId: 'alice', content: '好きな色は青。' }],
                addressing: {
                  removeExactRules: [],
                  exactRules: [],
                  removeFallbackRules: [],
                  fallbackRules: [],
                },
                removeConditionalMemoryIds: [],
                conditionalMemories: [],
              }, {
                issue: '安全に適用できないwarning修復は警告として残す。',
                sourceExcerpt: '原文に存在しない修復根拠。',
                storyCoreAddition: null,
                styleGuideAdditions: { narration: [], dialogue: [], formatting: [], avoid: [] },
                coreAdditions: [{ characterId: 'alice', content: '根拠のない追加。' }],
                addressing: {
                  removeExactRules: [],
                  exactRules: [],
                  removeFallbackRules: [],
                  fallbackRules: [],
                },
                removeConditionalMemoryIds: [],
                conditionalMemories: [],
              }],
              fatalErrors: [],
            }
          : {
              reviewReport: {
                warnings: ['最終結果に残る警告'],
                unresolvedQuestions: ['修正後監査で追加発見した矛盾'],
                sourceAddressingCount: 0,
                structuredAddressingCount: 0,
              },
              factualMemoryRepairs: [],
              warningRepairs: [],
              fatalErrors: [],
            };
      } else if (instructions.includes('原文とcandidateを照合')) {
        globalAuditCalls += 1;
        output = {
          reviewReport: {
            warnings: ['初回監査で修正された警告'],
            unresolvedQuestions: ['原文自体の矛盾'],
            sourceAddressingCount: 0,
            structuredAddressingCount: 0,
          },
          corrections: {
            conditionalMemories: [{
              id: 'late-style-rule',
              keywords: ['出力形式'],
              priority: 50,
              content: '出力の最後は必ず人物の台詞にする。',
            }],
          },
        };
      } else {
        throw new Error('Unexpected analysis prompt');
      }
      return { data: { status: 'completed' }, text: JSON.stringify(output) };
    };

    const result = await analyzeLorebook({
      sourceText: `### アリス（ありす）
- 高校生である。
- 成績優秀である。
- 好きな色は青。`,
      inputPath: '/tmp/source.txt',
      requestedId: 'test-lorebook',
      sourceLabel: 'test',
      schema,
      runtime,
      client,
      log: (message: string) => logs.push(message),
    });

    expect(result.lorebook.id).toBe('test-lorebook');
    expect(result.lorebook.characters).toHaveLength(1);
    expect(result.lorebook.characters[0].core).toContain('高校生。一人称は「私」。');
    expect(result.lorebook.characters[0].core).toContain('成績優秀である。');
    expect(result.lorebook.characters[0].core).toContain('好きな色は青。');
    expect(result.lorebook.conditionalMemories).toHaveLength(4);
    expect(result.lorebook.conditionalMemories.some((memory: { content: string }) => memory.content === '好きな色は青。')).toBe(true);
    expect(result.lorebook.conditionalMemories.find((memory: { id: string }) => memory.id === 'alice-past')?.content)
      .toBe('成績優秀である。');
    expect(collectValidationErrors(result.lorebook, schema, runtime.manager)).toEqual([]);
    expect(postAuditCalls).toBe(2);
    expect(globalAuditCalls).toBe(0);
    expect(result.reviewReport.warnings).toEqual([
      '最終結果に残る警告',
      '安全に適用できないwarning修復は警告として残す。',
    ]);
    expect(result.reviewReport.warnings).not.toContain('修復前だけの警告');
    expect(result.reviewReport.warnings).not.toContain('初回監査で修正された警告');
    expect(result.reviewReport.unresolvedQuestions).toEqual(['修正後監査で追加発見した矛盾']);
    expect(logs.some(message => message.includes('人物設定抽出: 1名'))).toBe(true);
    expect(logs.some(message => message.includes('条件付き記憶抽出: 3件'))).toBe(true);
    expect(logs.some(message => message.includes('人物網羅性監査: 1名'))).toBe(true);
    expect(logs.some(message => message.includes('人物網羅性補正: アリス core +1、条件付き記憶 +1'))).toBe(true);
    expect(logs.some(message => message.includes('人物網羅性監査補正除外: アリス') && message.includes('1件'))).toBe(true);
    expect(logs.some(message => message.includes('事実矛盾修復[1/2]') && message.includes('1件を置換'))).toBe(true);
    expect(logs).toContain('事実矛盾修復対象: alice-past — 過去の内容が原文と異なる。');
    expect(logs.some(message => message.includes('warning修復[1/1]') && message.includes('1件'))).toBe(true);
    expect(logs).toContain('warning修復対象: 好きな色が人物coreに未収録である。');
    expect(logs).toContain('warning修復見送り: 安全に適用できないwarning修復は警告として残す。');
    expect(logs).not.toContain('人物設定: アリス');
    expect(logs).not.toContain('呼称・人間関係: アリス');
    expect(logs).not.toContain('人物網羅性監査: アリス');
    expect(logs.some(message => /^人物設定\[1\/1\]: アリス \(\d+\.\ds\)$/.test(message))).toBe(true);
    expect(logs.some(message => /^呼称・人間関係\[1\/1\]: アリス \(\d+\.\ds\)$/.test(message))).toBe(true);
    expect(logs.some(message => /^条件付き記憶\[1-3\/3\]: アリスの秘密／アリスの日常／アリスの過去 \(\d+\.\ds\)$/.test(message))).toBe(true);
    expect(logs.some(message => /^人物網羅性監査\[1\/1\]: アリス \(\d+\.\ds\)$/.test(message))).toBe(true);
    expect(logs.some(message => message.includes('styleGuide専用トピック') && message.includes('1件'))).toBe(true);
    expect(logs.some(message => message.includes('最終構造:'))).toBe(true);
    expect(logs.some(message => /^総所要時間 \(\d+\.\ds\)$/.test(message))).toBe(true);
  });

  it('fails with the candidate attached when a factual contradiction remains unrepairable', async () => {
    const schema = readJson('schemas/lorebook.schema.json');
    const runtime = await loadLorebookRuntime();
    const client = async ({ instructions }: { instructions: string }) => {
      let output: object;
      if (instructions.includes('後続処理のための索引')) {
        output = {
          characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'] }],
          memoryTopics: [],
        };
      } else if (instructions.includes('コンパクトな物語運用コア')) {
        output = {
          name: 'テストLorebook',
          description: 'CLIテスト',
          storyCore: '舞台はテスト校。',
          styleGuide: { narration: [], dialogue: [], formatting: [], avoid: [] },
          addressingInstruction: '原文に明記された呼称を優先する。',
        };
      } else if (instructions.includes('指定された人物ごと')) {
        output = { characters: [{ id: 'alice', name: 'アリス', aliases: ['アリス'], core: '高校生である。' }] };
      } else if (instructions.includes('指定された人物を話者')) {
        output = { exactRules: [], fallbackRules: [] };
      } else if (instructions.includes('項目ごとに照合する網羅性監査')) {
        output = { characterId: 'alice', additions: [] };
      } else if (instructions.includes('すべての修正・正規化・構造検証が完了したfinalLorebook')) {
        output = {
          reviewReport: {
            warnings: [],
            unresolvedQuestions: [],
            sourceAddressingCount: 0,
            structuredAddressingCount: 0,
          },
          factualMemoryRepairs: [],
          warningRepairs: [],
          fatalErrors: ['人物coreに原文と矛盾する主体反転が残っている。'],
        };
      } else {
        throw new Error('Unexpected analysis prompt');
      }
      return { data: { status: 'completed' }, text: JSON.stringify(output) };
    };

    let caught: any;
    try {
      await analyzeLorebook({
        sourceText: `## 舞台設定
テスト校。
## 登場人物
### アリス（ありす）
- 高校生である。`,
        inputPath: '/tmp/source.txt',
        requestedId: 'fatal-test',
        sourceLabel: 'test',
        schema,
        runtime,
        client,
        maxRepairs: 1,
        log: () => {},
      });
    } catch (error) {
      caught = error;
    }

    expect(caught?.message).toContain('修復不能な事実矛盾');
    expect(caught?.lorebook?.id).toBe('fatal-test');
  });
});
