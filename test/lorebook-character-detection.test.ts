import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
type Message = { role: string; content: string };
type Candidate = {
  id: string;
  matchedMessageCount: number;
  detectionScore: number;
  mostRecentIndex: number;
};

const createContext = (messages: Message[], roleInstruction = '') => {
  const lorebook = {
    id: 'character-detection-test',
    storyCore: '物語の設定',
    retrieval: {
      scanMessageCount: 10, maxDynamicCharacters: 12000, maxCharacterCores: 1,
      maxAddressingRules: 14, maxAddressingCharacters: 1000, maxConditionalMemories: 6,
    },
    characters: [
      { id: 'ken', name: '健', aliases: ['健', 'ケン'], core: '回想された人物' },
      { id: 'taro', name: '太郎', aliases: ['太郎', 'たろう', 'TARO'], core: '会話を続けている人物' },
      { id: 'aoi', name: '葵', aliases: ['葵'], core: 'システムプロンプトの人物' },
    ],
    addressing: {
      instruction: '個別呼称を優先する。',
      exactRules: [],
      fallbackRules: [
        { speakerId: 'ken', targetDescription: '男子', context: 'spoken', formTemplate: '{姓}くん' },
        { speakerId: 'taro', targetDescription: '男子', context: 'spoken', formTemplate: '{姓}さん' },
      ],
    },
    conditionalMemories: [
      { id: 'taro-memory', anyCharacters: ['taro'], content: '太郎との約束', priority: 50 },
      { id: 'ken-memory', anyCharacters: ['ken'], content: '健との思い出', priority: 50 },
    ],
  };
  const context = vm.createContext({
    lorebook, messages, roleInstruction, state: { lorebookRecords: [{ lorebook }] }, uiUtils: {}, TextEncoder,
  });
  new vm.Script(fs.readFileSync(path.join(projectRoot, '.build/runtime/lorebook.js'), 'utf8'))
    .runInContext(context);
  new vm.Script(fs.readFileSync(path.join(projectRoot, '.build/runtime/ui-message-tools.js'), 'utf8'))
    .runInContext(context);
  const evaluate = <T>(expression: string): T => new vm.Script(expression).runInContext(context) as T;
  return {
    lorebook,
    evaluate,
    detect: () => evaluate<Candidate[]>('lorebookUtils.detectCharacters(lorebook, messages, roleInstruction)'),
    prompt: () => evaluate<string>("lorebookUtils.buildPrompt(lorebook.id, messages, roleInstruction)"),
  };
};

describe('Lorebook character detection frequency', () => {
  it('keeps an ongoing conversation participant ahead of a latest single recollection at the candidate cap', () => {
    const { detect, prompt } = createContext([
      { role: 'user', content: '太郎に話しかける' },
      { role: 'model', content: '太郎が返事をする' },
      { role: 'user', content: '太郎に質問する' },
      { role: 'model', content: '太郎が答える' },
      { role: 'user', content: 'ふと健を思い出した' },
    ]);

    expect(detect().map(candidate => candidate.id)).toEqual(['taro', 'ken']);
    expect(detect()[0]).toMatchObject({ matchedMessageCount: 4, detectionScore: 10, mostRecentIndex: 3 });
    expect(detect()[1]).toMatchObject({ matchedMessageCount: 1, detectionScore: 5, mostRecentIndex: 4 });
    const reference = prompt();
    expect(reference).toContain('太郎 → 男子: 発話では「{姓}さん」');
    expect(reference).toContain('太郎 (10): 会話を続けている人物');
    expect(reference).toContain('太郎との約束');
    expect(reference).not.toContain('健 → 男子:');
    expect(reference).not.toContain('回想された人物');
    expect(reference).not.toContain('健との思い出');
  });

  it('counts repeated names and normalized aliases in one message only once', () => {
    const { detect } = createContext([
      { role: 'user', content: '太郎、太郎、たろう、ＴＡＲＯ、taro、TARO' },
    ]);

    expect(detect()).toHaveLength(1);
    expect(detect()[0]).toMatchObject({ id: 'taro', matchedMessageCount: 1, detectionScore: 1 });
  });

  it('gives a recent appearance more weight than appearances in two older messages', () => {
    const { detect } = createContext([
      { role: 'user', content: '太郎' },
      { role: 'model', content: '太郎' },
      { role: 'user', content: '場面が変わる' },
      { role: 'model', content: '健が登場する' },
    ]);

    expect(detect().map(candidate => candidate.id)).toEqual(['ken', 'taro']);
    expect(detect()[0]).toMatchObject({ matchedMessageCount: 1, detectionScore: 4 });
    expect(detect()[1]).toMatchObject({ matchedMessageCount: 2, detectionScore: 3 });
  });

  it('uses the latest appearance to break equal weighted scores', () => {
    const { detect } = createContext([
      { role: 'user', content: '太郎' },
      { role: 'model', content: '太郎' },
      { role: 'user', content: '健' },
    ]);

    expect(detect().map(candidate => candidate.id)).toEqual(['ken', 'taro']);
    expect(detect().map(candidate => candidate.detectionScore)).toEqual([3, 3]);
  });

  it.each([
    { roleInstruction: 'あなたは太郎', expected: ['taro', 'ken'] },
    { roleInstruction: '', expected: ['ken', 'taro'] },
  ])('preserves system prompt and stored order tie breakers with role instruction "$roleInstruction"', settings => {
    const { detect } = createContext([{ role: 'user', content: '太郎と健が話す' }], settings.roleInstruction);

    expect(detect().map(candidate => candidate.id)).toEqual(settings.expected);
  });

  it('detects system-only characters without counting repeated system prompt mentions', () => {
    const { lorebook, detect, prompt } = createContext([{ role: 'user', content: '太郎' }], '葵'.repeat(100));
    lorebook.retrieval.maxCharacterCores = 2;

    expect(detect().map(candidate => candidate.id)).toEqual(['taro', 'aoi']);
    expect(detect()[1]).toMatchObject({ matchedMessageCount: 0, detectionScore: 0, mostRecentIndex: -1 });
    expect(prompt()).toContain('太郎 (1): 会話を続けている人物');
    expect(prompt()).toContain('葵 (0): システムプロンプトの人物');
  });

  it('recomputes the ranking from the configured recent window without accumulating older matches', () => {
    const { lorebook, prompt } = createContext([
      ...Array.from({ length: 5 }, () => ({ role: 'user', content: '太郎' })),
      { role: 'model', content: '場面が変わる' },
      { role: 'user', content: '健が登場する' },
    ]);
    lorebook.retrieval.scanMessageCount = 2;

    const reference = prompt();
    expect(reference).toContain('健 → 男子: 発話では「{姓}くん」');
    expect(reference).toContain('健 (2): 回想された人物');
    expect(reference).not.toContain('太郎 → 男子:');
    expect(reference).not.toContain('会話を続けている人物');
  });

  it('shows the saved send-time score in response details after retrieval settings change', () => {
    const { lorebook, evaluate, prompt } = createContext([
      { role: 'user', content: '太郎' },
      { role: 'model', content: '太郎' },
      { role: 'user', content: '太郎' },
      { role: 'model', content: '太郎' },
      { role: 'user', content: 'ふと健を思い出した' },
    ]);
    evaluate(`globalThis.savedSnapshot = lorebookUtils.createContextSnapshot(
      lorebook.id, lorebookUtils.buildPrompt(lorebook.id, messages, roleInstruction)
    )`);
    lorebook.retrieval.scanMessageCount = 1;

    const details = evaluate<{ lorebookReference: string }>(
      'uiUtils.buildResponseDetailsViewModel({ lorebookContext: savedSnapshot })',
    );

    expect(details.lorebookReference).toContain('太郎 (10): 会話を続けている人物');
    expect(details.lorebookReference).not.toContain('健 (1):');
    expect(prompt()).toContain('健 (1): 回想された人物');
  });
});
