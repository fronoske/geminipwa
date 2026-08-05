import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readRuntime = (name: string): string =>
  fs.readFileSync(path.join(projectRoot, `.build/runtime/${name}.js`), 'utf8');

describe('streaming token usage', () => {
  it('extracts non-streaming finish reasons and usage for Lorebook analysis', () => {
    const context = vm.createContext({});
    new vm.Script(readRuntime('api-clients')).runInContext(context);

    const gemini = new vm.Script(`apiUtils.extractNonStreamingMetadata('gemini', {
      candidates: [{ finishReason: 'MAX_TOKENS', finishMessage: 'limit' }],
      usageMetadata: { candidatesTokenCount: 16384, totalTokenCount: 18000 }
    })`).runInContext(context);
    const openai = new vm.Script(`apiUtils.extractNonStreamingMetadata('openai', {
      choices: [{ finish_reason: 'length' }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }
    })`).runInContext(context);

    expect(JSON.parse(JSON.stringify(gemini))).toEqual({
      finishReason: 'MAX_TOKENS',
      finishMessage: 'limit',
      usageMetadata: { candidatesTokenCount: 16384, totalTokenCount: 18000 },
    });
    expect(JSON.parse(JSON.stringify(openai))).toEqual({
      finishReason: 'length',
      finishMessage: null,
      usageMetadata: { candidatesTokenCount: 200, totalTokenCount: 300 },
    });
  });

  it('keeps reading after finish_reason so the final usage-only chunk is retained', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const sse = [
          'data: {"choices":[{"delta":{"content":"OK"},"finish_reason":null}]}',
          'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
          'data: {"choices":[],"usage":{"prompt_tokens":90,"completion_tokens":10,"total_tokens":100}}',
          'data: [DONE]',
          '',
        ].join('\n');
        controller.enqueue(new TextEncoder().encode(sse));
        controller.close();
      },
    });
    const context = vm.createContext({
      state: { abortController: null },
      TextDecoderStream,
      response: { body: stream },
    });
    new vm.Script(readRuntime('api-clients')).runInContext(context);

    const iterator = new vm.Script(
      "apiUtils.handleOpenAICompatibleStreamingResponse(response, 'openrouter')",
    ).runInContext(context) as AsyncGenerator<Record<string, unknown>>;
    const events: Array<Record<string, unknown>> = [];
    for await (const event of iterator) events.push(event);

    expect(events).toContainEqual({ type: 'chunk', contentText: 'OK', thoughtText: null });
    expect(events.at(-1)).toEqual({
      type: 'metadata',
      finishReason: 'stop',
      usageMetadata: { candidatesTokenCount: 10, totalTokenCount: 100 },
      safetyRatings: null,
      groundingMetadata: null,
    });
  });
});
