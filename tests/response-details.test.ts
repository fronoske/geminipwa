import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');

const createContext = () => {
  const context = vm.createContext({
    uiUtils: {},
    TextEncoder,
    lorebookUtils: {
      normalizeContextSnapshot(snapshot: unknown) {
        if (!snapshot || typeof snapshot !== 'object') return null;
        return snapshot;
      },
    },
  });
  new vm.Script(readFile('.build/runtime/ui-message-tools.js')).runInContext(context);
  return context;
};

const evaluate = <T>(context: vm.Context, expression: string): T =>
  new vm.Script(expression).runInContext(context) as T;

describe('Response send details', () => {
  it('shows an exact applied Lorebook reference with response metadata', () => {
    const context = createContext();
    const details = evaluate<Record<string, string>>(context, `uiUtils.buildResponseDetailsViewModel({
      generatedByApiProvider: 'gemini', generatedByModel: 'test-model',
      finishReason: 'STOP', contextWindowTokens: 100000,
      usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 200, thoughtsTokenCount: 50, totalTokenCount: 1250 },
      lorebookContext: {
        version: 1, status: 'applied', lorebookId: 'school', lorebookName: '学園',
        reference: '<lorebook-reference>設定</lorebook-reference>'
      }
    })`);

    expect(details.model).toBe('gemini / test-model');
    expect(details.tokens).toContain('合計 1,250 tokens');
    expect(details.tokens).toContain('Context上限 100,000 tokens (1 %)');
    expect(details.lorebookStatus).toBe('学園（ID: school）');
    expect(details.lorebookReference).toBe('<lorebook-reference>設定</lorebook-reference>');
    expect(details.lorebookSize).toContain('文字 / 約');
  });

  it('distinguishes no Lorebook from a legacy response without a snapshot', () => {
    const context = createContext();
    const statuses = evaluate<string[]>(context, `[
      uiUtils.buildResponseDetailsViewModel({ lorebookContext: {
        version: 1, status: 'none', lorebookId: null, lorebookName: null, reference: ''
      }}).lorebookStatus,
      uiUtils.buildResponseDetailsViewModel({}).lorebookStatus
    ]`);

    expect(Array.from(statuses)).toEqual([
      '使用していません',
      '送信時の記録なし（この機能の導入前に生成された応答です）',
    ]);
  });

  it('provides a full-screen response details dialog and a delegated trigger', () => {
    expect(readFile('src/index.html')).toContain('id="response-details-dialog"');
    expect(readFile('src/ui-message-rendering.ts')).toContain("'js-response-details-btn'");
    expect(readFile('src/event-wiring.ts')).toContain("button.classList.contains('js-response-details-btn')");
  });

  it('persists and exports the exact per-response Lorebook snapshot', () => {
    expect(readFile('src/message-sending.ts')).toContain(
      'responseModelMetadata.lorebookContext = lorebookUtils.createContextSnapshot',
    );
    expect(readFile('src/database.ts')).toContain('lorebookContext: msg.lorebookContext');
    expect(readFile('src/data-management.ts')).toContain(
      'messageExport.lorebookContext = msg.lorebookContext',
    );
    expect(readFile('src/data-management.ts')).toContain(
      'lorebookContext: lorebookUtils.normalizeContextSnapshot(msg.lorebookContext)',
    );
  });
});
