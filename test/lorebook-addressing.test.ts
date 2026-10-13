import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');

const createContext = () => {
  const lorebook = {
    id: 'addressing-test',
    storyCore: '物語の設定',
    retrieval: {
      scanMessageCount: 10,
      maxDynamicCharacters: 12000,
      maxCharacterCores: 5,
      maxAddressingRules: 14,
      maxAddressingCharacters: 1000,
      maxConditionalMemories: 6,
    },
    characters: [
      { id: 'haru', name: '春', aliases: ['春'], core: '絵が好き' },
      { id: 'sora', name: '空', aliases: ['空'], core: '音楽が好き' },
      { id: 'umi', name: '海', aliases: ['海'], core: '運動が好き' },
    ],
    addressing: {
      instruction: '個別呼称を優先し、未定義の相手には一般ルールを適用する。',
      exactRules: [
        { speakerId: 'haru', targetId: 'sora', forms: [{ context: 'spoken', value: '空さん' }] },
        { speakerId: 'sora', targetId: 'haru', forms: [{ context: 'spoken', value: '春くん' }] },
      ],
      fallbackRules: [
        ...Array.from({ length: 15 }, (_, index) => ({
          speakerId: 'haru', targetDescription: `男子グループ${index}`,
          context: 'spoken', formTemplate: index === 0 ? '長い呼称'.repeat(400) : '{姓}くん',
        })),
        { speakerId: 'sora', targetDescription: '同級生', context: 'innerThought', formTemplate: '{名}' },
        { speakerId: 'umi', targetDescription: '先輩', context: 'public', formTemplate: '{姓}先輩' },
      ],
    },
    conditionalMemories: [
      { id: 'art', anyCharacters: ['haru'], keywords: ['絵'], content: '校内展で入選', priority: 50 },
    ],
  };
  const context = vm.createContext({ state: { lorebookRecords: [{ lorebook }] } });
  new vm.Script(fs.readFileSync(path.join(projectRoot, '.build/runtime/lorebook.js'), 'utf8'))
    .runInContext(context);
  const evaluate = <T>(expression: string): T => new vm.Script(expression).runInContext(context) as T;
  return { lorebook, evaluate };
};

describe('general Lorebook addressing rules', () => {
  it.each([
    { limit: 'rule count', maxAddressingRules: 1, maxAddressingCharacters: 1000 },
    { limit: 'character count', maxAddressingRules: 14, maxAddressingCharacters: 20 },
  ])('includes every candidate speaker general rule when the exact $limit budget is full', limits => {
    const { lorebook, evaluate } = createContext();
    lorebook.retrieval.maxAddressingRules = limits.maxAddressingRules;
    lorebook.retrieval.maxAddressingCharacters = limits.maxAddressingCharacters;

    const prompt = evaluate<string>(
      "lorebookUtils.buildPrompt('addressing-test', [{ role: 'user', content: '春と空が話す' }])",
    );

    expect(prompt).toContain('<lorebook-reference>');
    expect(prompt).toContain('春 → 空: 発話では「空さん」');
    expect(prompt).not.toContain('空 → 春:');
    for (let index = 0; index < 15; index += 1) {
      expect(prompt).toContain(`春 → 男子グループ${index}: 発話では「`);
    }
    expect(prompt).toContain(lorebook.addressing.fallbackRules[0].formTemplate);
    expect(prompt).toContain('空 → 同級生: 内心では「{名}」');
    expect(prompt).not.toContain('海 → 先輩:');
    expect(prompt).toContain(lorebook.addressing.instruction);
  });

  it('keeps general rules outside the shared budget without displacing cores or memories', () => {
    const { lorebook, evaluate } = createContext();
    lorebook.retrieval.maxDynamicCharacters = 35;
    lorebook.retrieval.maxAddressingCharacters = 1;

    const prompt = evaluate<string>(
      "lorebookUtils.buildPrompt('addressing-test', [{ role: 'user', content: '絵の話をして' }], 'あなたは春')",
    );
    const selected = evaluate<{ dynamicContentCharacters: number }>(
      "lorebookUtils.selectContext('addressing-test', [{ role: 'user', content: '絵の話をして' }], 'あなたは春')",
    );

    expect(prompt).toContain('春 → 男子グループ0:');
    expect(prompt).toContain(lorebook.addressing.fallbackRules[0].formTemplate);
    expect(prompt).toContain('春 → 男子グループ14:');
    expect(prompt).not.toContain('空 → 同級生:');
    expect(prompt).not.toContain('春 → 空:');
    expect(prompt).toContain('春 (0): 絵が好き');
    expect(prompt).toContain('校内展で入選');
    expect(selected.dynamicContentCharacters).toBeLessThanOrEqual(35);
  });

  it('omits general rules when no speaker candidate is detected', () => {
    const { evaluate } = createContext();
    const prompt = evaluate<string>(
      "lorebookUtils.buildPrompt('addressing-test', [{ role: 'user', content: '誰も登場しない場面' }])",
    );

    expect(prompt).toContain('【固定ストーリーコア】');
    expect(prompt).not.toContain('【呼称ルール（最優先）】');
  });
});
