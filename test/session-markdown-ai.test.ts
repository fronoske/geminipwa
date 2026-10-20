import { describe, expect, it, vi } from 'vitest';
import { createAnalysisClient, createTokenUsage, findContradictions, formatTokenUsage,
  insertHeadings, splitPassages } from '../src/session-markdown-ai.ts';

describe('novel LLM analysis', () => {
  it('inserts headings at verified paragraph boundaries without changing the novel text', async () => {
    const novel = '雨の朝だった。\n\n三日後、晴れた。\n';
    const ask = vi.fn(async (name: string) => {
      expect(name).toBe('novel_headings');
      return { headings: [{ paragraph: 1, title: '雨の朝' }, { paragraph: 2, title: '三日後' }] };
    });
    const result = await insertHeadings(novel, ask);
    expect(result).toBe('## 雨の朝\n\n雨の朝だった。\n\n## 三日後\n\n三日後、晴れた。\n');
    expect(result.replace(/## (雨の朝|三日後)\n\n/g, '')).toBe(novel);
    expect(splitPassages(novel).map(p => p.offset)).toEqual([0, 9]);
  });

  it('rejects heading positions that are absent from the source', async () => {
    await expect(insertHeadings('本文。\n', async () => ({ headings: [{ paragraph: 99, title: '誤り' }] })))
      .rejects.toThrow('無効な見出し位置');
  });

  it('keeps every character when a long novel needs multiple analysis requests', async () => {
    const novel = Array.from({ length: 25 }, (_, index) => `場面${index + 1}。${'あ'.repeat(900)}`).join('\n\n');
    const ask = vi.fn(async (_name: string, _schema: unknown, _instructions: string, input: string) => ({
      headings: input.includes('"paragraph":1,') ? [{ paragraph: 1, title: '冒頭' }] : [],
    }));
    const result = await insertHeadings(novel, ask);
    expect(ask.mock.calls.length).toBeGreaterThan(1);
    expect(result.replace('## 冒頭\n\n', '')).toBe(novel);
  });

  it('reports evidence-backed contradictions in a separate Markdown report', async () => {
    const novel = '綾は左利きだった。\n\n綾は生まれつき右利きだった。\n';
    const ask = vi.fn(async (name: string) => name === 'novel_facts'
      ? { observations: [
        { person: '綾', category: 'setting', fact: '左利き', paragraph: 1, quote: '左利きだった' },
        { person: '綾', category: 'setting', fact: '生まれつき右利き', paragraph: 2, quote: '生まれつき右利きだった' },
      ] }
      : { conflicts: [{ firstId: 1, secondId: 2, reason: '利き手の設定が一致しない。' }] });
    const report = await findContradictions(novel, '短編', ask);
    expect(report).toContain('# 矛盾チェック: 短編');
    expect(report).toContain('段落 1: 「左利きだった」');
    expect(report).toContain('段落 2: 「生まれつき右利きだった」');
    expect(report).toContain('利き手の設定が一致しない');
    expect(ask).toHaveBeenCalledTimes(2);
  });

  it('accepts a quote with whitespace differences and cites the exact source text', async () => {
    const ask = vi.fn(async (name: string) => name === 'novel_facts'
      ? { observations: [
        { person: '綾', category: 'memory', fact: '合言葉を覚えている', paragraph: 1, quote: '合言葉を覚えている' },
        { person: '綾', category: 'memory', fact: '合言葉を知らない', paragraph: 2, quote: '合言葉を知らない' },
      ] }
      : { conflicts: [{ firstId: 1, secondId: 2, reason: '記憶が一致しない。' }] });
    const report = await findContradictions('綾は合言葉を\n覚えている。\n\n綾は合言葉を知らない。', '短編', ask);
    expect(report).toContain('「合言葉を\n覚えている」');
    expect(report).not.toContain('除外しました');
  });

  it('retries an unsupported quote, then reports unresolved rows without claiming full coverage', async () => {
    const ask = vi.fn(async () => ({ observations: [
      { person: '綾', category: 'memory', fact: '架空', paragraph: 1, quote: '存在しない引用' },
    ] }));
    const report = await findContradictions('本文。', '短編', ask);
    expect(ask).toHaveBeenCalledTimes(2);
    expect(report).toContain('本文と照合できない抽出を 1 件除外');
    expect(report).toContain('段落 1 に引用が一致しない');
    expect(report).toContain('検出漏れの可能性');
    expect(report).not.toContain('本文。');
  });

  it('sends structured Responses API requests with the model supplied by the caller', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      expect(body.model).toBe('deepseek/deepseek-v4.1-flash');
      expect(body.reasoning.effort).toBe('medium');
      expect(body.text.format.type).toBe('json_schema');
      expect(body.store).toBe(false);
      return { ok: true, status: 200, json: async () => ({ status: 'completed', output_text: '{"headings":[]}' }) } as Response;
    });
    const ask = createAnalysisClient({ apiKey: 'test-key', model: 'deepseek/deepseek-v4.1-flash',
      reasoningEffort: 'medium', baseUrl: 'https://example.test/v1', timeoutMs: 1000,
      fetchImplementation: fetchMock as typeof fetch });
    await expect(ask('headings', { type: 'object' }, 'instructions', 'novel', 1000)).resolves.toEqual({ headings: [] });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/v1/responses');
  });

  it('counts usage on completed and failed responses without adding reasoning tokens twice', async () => {
    const usage = createTokenUsage();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({
        status: 'completed', output_text: '{"headings":[]}',
        usage: { input_tokens: 100, output_tokens: 30, total_tokens: 130,
          output_tokens_details: { reasoning_tokens: 20 } },
      }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({
        id: 'resp_example', status: 'incomplete',
        incomplete_details: { reason: 'max_output_tokens' },
        error: { code: 'limit_reached', message: 'Generation stopped' },
        usage: { input_tokens: 50, output_tokens: 10, total_tokens: 60,
          output_tokens_details: { reasoning_tokens: 8 } },
      }) });
    const ask = createAnalysisClient({ apiKey: 'test-key', model: 'gpt-5.6-terra',
      reasoningEffort: 'medium', baseUrl: 'https://example.test/v1', timeoutMs: 1000,
      fetchImplementation: fetchMock as typeof fetch, usage });
    await ask('headings', {}, 'instructions', 'novel', 1000);
    await expect(ask('headings', {}, 'instructions', 'novel', 65_536)).rejects.toThrow(
      'incomplete（理由: max_output_tokens（出力トークンの上限に到達）、出力トークン: 10 / 設定上限: 65,536、うち推論: 8、APIエラーコード: limit_reached、APIメッセージ: Generation stopped、応答ID: resp_example）',
    );
    expect(usage).toEqual({ requests: 2, unreportedRequests: 0, inputTokens: 150,
      outputTokens: 40, reasoningTokens: 28, totalTokens: 190 });
    expect(formatTokenUsage(usage)).toContain('合計 190 トークン');
  });

  it('does not resend a request that reached its output-token limit', async () => {
    const usage = createTokenUsage();
    const limits: number[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      limits.push(JSON.parse(init.body as string).max_output_tokens);
      return { ok: true, status: 200, json: async () => ({
        status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' },
        usage: { input_tokens: 40, output_tokens: 65_536, total_tokens: 65_576 },
      }) } as Response;
    });
    const ask = createAnalysisClient({ apiKey: 'test-key', model: 'deepseek/deepseek-v4.1-flash',
      reasoningEffort: 'medium', baseUrl: 'https://example.test/v1', timeoutMs: 1000,
      fetchImplementation: fetchMock as typeof fetch, usage });
    await expect(ask('headings', {}, 'instructions', 'novel', 65_536)).rejects.toThrow('max_output_tokens');
    expect(limits).toEqual([65_536]);
    expect(usage).toMatchObject({ requests: 1, unreportedRequests: 0, totalTokens: 65_576 });
  });

  it('uses the full output allowance on the first heading request', async () => {
    const limits: number[] = [];
    await insertHeadings('本文。', async (_name, _schema, _instructions, _input, maxOutputTokens) => {
      limits.push(maxOutputTokens);
      return { headings: [{ paragraph: 1, title: '冒頭' }] };
    });
    expect(limits).toEqual([65_536]);
  });

  it('marks a failed request without API usage as unreported', async () => {
    const usage = createTokenUsage();
    const ask = createAnalysisClient({ apiKey: 'test-key', model: 'gpt-5.6-terra',
      reasoningEffort: 'medium', baseUrl: 'https://example.test/v1', timeoutMs: 1000,
      fetchImplementation: vi.fn(async () => { throw new Error('network failure'); }) as typeof fetch,
      usage });
    await expect(ask('headings', {}, 'instructions', 'novel', 1000)).rejects.toThrow('network failure');
    expect(usage.requests).toBe(1);
    expect(usage.unreportedRequests).toBe(1);
    expect(formatTokenUsage(usage)).toContain('usage未取得 1 回');
  });

  it('says when the API omits the incomplete reason', async () => {
    const ask = createAnalysisClient({ apiKey: 'test-key', model: 'deepseek/deepseek-v4.1-flash',
      reasoningEffort: 'medium', baseUrl: 'https://example.test/v1', timeoutMs: 1000,
      fetchImplementation: vi.fn(async () => ({ ok: true, status: 200,
        json: async () => ({ status: 'incomplete' }) } as Response)) as typeof fetch });
    await expect(ask('headings', {}, 'instructions', 'novel', 2048)).rejects.toThrow(
      '理由: API から返されませんでした、設定上限: 2,048 トークン',
    );
  });
});
