import { describe, expect, it } from 'vitest';
import { modelCharacterCount, parseArgs, parseSessions, renderSession } from '../src/session-markdown-cli.ts';

const session = {
  title: '物語',
  messages: [
    { role: 'user', content: '始めて', attachments: [{ name: 'memo.txt', textData: 'secret' }] },
    { role: 'model', content: '旧稿', isCascaded: true, siblingGroupId: 'a', isSelected: true },
    { role: 'model', content: '# 第一章\n\n新稿', isCascaded: true, siblingGroupId: 'a', isSelected: false },
    { role: 'user', content: '続けて' },
    { role: 'model', content: '続き' },
  ],
};

describe('session Markdown CLI', () => {
  it('uses OpenRouter and DeepSeek Flash by default', () => {
    expect(parseArgs(['sessions.json', '--mode', 'novel'])).toMatchObject({
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'deepseek/deepseek-v4.1-flash',
      reasoningEffort: 'medium',
      maxOutputTokens: 65_536,
    });
    expect(parseArgs(['sessions.json', '--mode', 'novel', '--max-output-tokens', '32768']))
      .toMatchObject({ maxOutputTokens: 32_768 });
    expect(() => parseArgs(['sessions.json', '--mode', 'novel', '--max-output-tokens', '0']))
      .toThrow('--max-output-tokens');
  });

  it('uses the last generated answer even if an older answer is selected', () => {
    const [parsed] = parseSessions([session]);
    expect(renderSession(parsed, 'novel')).toBe('# 第一章\n\n新稿\n\n続き\n');
    expect(renderSession(parsed, 'novel')).not.toContain('secret');
    expect(modelCharacterCount(parsed)).toBe(Array.from('# 第一章\n\n新稿').length + 2);
  });

  it('writes the visible user and model turns as a chat', () => {
    const [parsed] = parseSessions(session);
    expect(renderSession(parsed, 'chat')).toBe(
      '## ユーザー\n\n始めて\n\n## LLM\n\n# 第一章\n\n新稿\n\n## ユーザー\n\n続けて\n\n## LLM\n\n続き\n',
    );
  });

  it('rejects invalid exported message data', () => {
    expect(() => parseSessions([{ title: 'bad', messages: [{ role: 'model', content: null }] }]))
      .toThrow('メッセージ形式が不正');
  });
});
