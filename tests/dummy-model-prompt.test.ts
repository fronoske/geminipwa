import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const runtimeSource = fs.readFileSync(
  path.join(projectRoot, '.build/runtime/message-sending.js'),
  'utf8',
);

const runPromptAppend = ({
  settings,
  allowDummyModel = true,
}: {
  settings: Record<string, unknown>;
  allowDummyModel?: boolean;
}) => {
  const context = vm.createContext({ appLogic: {} });
  new vm.Script(runtimeSource).runInContext(context);
  context.testSettings = settings;
  context.testAllowDummyModel = allowDummyModel;
  return JSON.parse(new vm.Script(`JSON.stringify((() => {
    const messages = [{ role: 'user', parts: [{ text: 'actual message' }] }];
    const result = appendTransientDummyPrompts(messages, testSettings, {
      allowDummyModel: testAllowDummyModel
    });
    return { messages, result };
  })())`).runInContext(context));
};

describe('common Dummy Model prompt', () => {
  it('applies the optional prefix to streaming and non-streaming responses', () => {
    const source = fs.readFileSync(path.join(projectRoot, 'src/message-sending.ts'), 'utf8');
    expect(source).toContain('state.partialStreamContent = dummyModelPrefix;');
    expect(source).toContain('finalContent = dummyModelPrefix + rawContentFromApi;');
  });

  it('appends transient user and model prompts in order without changing the displayed prefix', () => {
    const result = runPromptAppend({
      settings: {
        commonDummyUser: '  continue  ',
        enableCommonDummyUser: true,
        commonDummyModel: '  opening line  ',
        enableCommonDummyModel: true,
        concatCommonDummyModel: false,
      },
    });

    expect(result.messages).toEqual([
      { role: 'user', parts: [{ text: 'actual message' }] },
      { role: 'user', parts: [{ text: 'continue' }] },
      { role: 'model', parts: [{ text: 'opening line' }] },
    ]);
    expect(result.result).toEqual({
      dummyModelText: 'opening line',
      dummyModelPrefix: '',
    });
  });

  it('returns the enabled Dummy Model text as the response prefix when concatenation is enabled', () => {
    const result = runPromptAppend({
      settings: {
        commonDummyUser: '',
        enableCommonDummyUser: true,
        commonDummyModel: 'opening line',
        enableCommonDummyModel: true,
        concatCommonDummyModel: true,
      },
    });

    expect(result.messages.at(-1)).toEqual({
      role: 'model',
      parts: [{ text: 'opening line' }],
    });
    expect(result.result.dummyModelPrefix).toBe('opening line');
  });

  it('suppresses the Dummy Model prompt when disabled or incompatible with the request', () => {
    const disabled = runPromptAppend({
      settings: {
        commonDummyUser: '',
        enableCommonDummyUser: false,
        commonDummyModel: 'opening line',
        enableCommonDummyModel: false,
        concatCommonDummyModel: true,
      },
    });
    const incompatible = runPromptAppend({
      settings: {
        commonDummyUser: '',
        enableCommonDummyUser: false,
        commonDummyModel: 'opening line',
        enableCommonDummyModel: true,
        concatCommonDummyModel: true,
      },
      allowDummyModel: false,
    });

    expect(disabled.messages).toHaveLength(1);
    expect(disabled.result.dummyModelPrefix).toBe('');
    expect(incompatible.messages).toHaveLength(1);
    expect(incompatible.result.dummyModelPrefix).toBe('');
  });
});
