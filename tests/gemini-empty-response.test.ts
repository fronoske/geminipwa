import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');
const readRuntime = (name: string): string => readFile(`.build/runtime/${name}.js`);

const collectGeminiEvents = async (sseLines: string[]) => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode([...sseLines, ''].join('\n')));
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
    'apiUtils.handleGeminiStreamingResponse(response)',
  ).runInContext(context) as AsyncGenerator<Record<string, unknown>>;
  const events: Array<Record<string, unknown>> = [];
  for await (const event of iterator) events.push(event);
  return { context, events };
};

describe('Gemini empty-response diagnostics', () => {
  it('preserves promptFeedback, its block reason, and token usage', async () => {
    const promptFeedback = {
      blockReason: 'PROHIBITED_CONTENT',
      blockReasonMessage: 'The prompt was blocked.',
      safetyRatings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', blocked: true }],
    };
    const usageMetadata = {
      promptTokenCount: 42,
      candidatesTokenCount: 0,
      thoughtsTokenCount: 128,
      totalTokenCount: 170,
    };
    const { events } = await collectGeminiEvents([
      `data: ${JSON.stringify({ promptFeedback, usageMetadata })}`,
    ]);

    expect(events.at(-1)).toMatchObject({
      type: 'metadata',
      finishReason: 'PROHIBITED_CONTENT',
      finishMessage: 'The prompt was blocked.',
      promptFeedback,
      safetyRatings: promptFeedback.safetyRatings,
      usageMetadata,
    });
  });

  it('preserves a candidate finishMessage when no text part is returned', async () => {
    const usageMetadata = { promptTokenCount: 80, candidatesTokenCount: 0, totalTokenCount: 80 };
    const { events } = await collectGeminiEvents([
      `data: ${JSON.stringify({
        candidates: [{
          content: { role: 'model', parts: [] },
          finishReason: 'RECITATION',
          finishMessage: 'Candidate matched protected text.',
          safetyRatings: [],
        }],
        usageMetadata,
      })}`,
    ]);

    expect(events.at(-1)).toMatchObject({
      type: 'metadata',
      finishReason: 'RECITATION',
      finishMessage: 'Candidate matched protected text.',
      promptFeedback: null,
      usageMetadata,
    });
  });

  it('turns malformed Gemini SSE JSON into a visible stream error', async () => {
    const { events } = await collectGeminiEvents(['data: {"candidates":']);
    expect(events).toContainEqual(expect.objectContaining({
      type: 'error',
      message: expect.stringContaining('Geminiストリームの解析に失敗しました'),
    }));
  });

  it('formats an empty-response explanation without changing model content', async () => {
    const { context } = await collectGeminiEvents([]);
    const diagnostic = new vm.Script(`apiUtils.formatGeminiEmptyResponse({
      content: '',
      finishReason: 'MAX_TOKENS',
      finishMessage: 'Output token limit reached.',
      usageMetadata: { candidatesTokenCount: 0, thoughtsTokenCount: 2048 }
    })`).runInContext(context) as string;

    expect(diagnostic).toContain('終了理由: MAX_TOKENS');
    expect(diagnostic).toContain('詳細: Output token limit reached.');
    expect(diagnostic).toContain('通常出力: 0 tokens');
    expect(diagnostic).toContain('思考: 2048 tokens');
  });

  it('persists and renders the diagnostic metadata', () => {
    const sending = readFile('src/message-sending.ts');
    const database = readFile('src/database.ts');
    const dataManagement = readFile('src/data-management.ts');
    const rendering = readFile('src/ui-message-rendering.ts');

    expect(sending).toContain('msgToUpdate.finishMessage = modelResponseMetadata.finishMessage');
    expect(sending).toContain('msgToUpdate.promptFeedback = modelResponseMetadata.promptFeedback');
    expect(sending).toContain("modelResponseMetadata.finishReason = 'EMPTY_RESPONSE'");
    expect(database).toContain('finishMessage: msg.finishMessage');
    expect(database).toContain('promptFeedback: msg.promptFeedback');
    expect(dataManagement).toContain('messageExport.finishMessage = msg.finishMessage');
    expect(dataManagement).toContain('messageExport.promptFeedback = msg.promptFeedback');
    expect(rendering).toContain('_renderEmptyModelResponseDiagnostic');
    expect(rendering).toContain('apiUtils.formatGeminiEmptyResponse');
  });
});
