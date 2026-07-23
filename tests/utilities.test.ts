import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const utilitySource = fs.readFileSync(path.join(projectRoot, '.build/runtime/utilities.js'), 'utf8');
let context: vm.Context;

beforeEach(() => {
  context = vm.createContext({
    DEFAULT_AUTO_SCROLL_RESPONSE_CHARACTER_LIMIT: -1,
    document: { hidden: false },
    FileReader: class {},
    setTimeout,
    window: { setTimeout },
  });
  new vm.Script(utilitySource).runInContext(context);
});

describe('generated utilities', () => {
  it('sanitizes unsafe punctuation and applies the length limit', () => {
    const result = new vm.Script("sanitizeText('<abc>&\"def', 5)").runInContext(context);

    expect(result).toBe('abcde');
  });

  it.each([
    [0, '0 Bytes'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1024 ** 2, '1 MB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    context.bytes = bytes;

    expect(new vm.Script('formatFileSize(bytes)').runInContext(context)).toBe(expected);
  });

  it('resolves sleep immediately while the page is hidden', async () => {
    context.document.hidden = true;

    await expect(new vm.Script('sleep(1000)').runInContext(context)).resolves.toBeUndefined();
  });

  it.each([
    [undefined, -1],
    [null, -1],
    ['', -1],
    ['  ', -1],
    [false, -1],
    [-2, -1],
    [1.5, -1],
    ['-1', -1],
    ['0', 0],
    [200, 200],
  ])('normalizes the AI-response auto-scroll limit %j to %d', (value, expected) => {
    context.value = value;

    expect(
      new vm.Script('normalizeAutoScrollResponseCharacterLimit(value)').runInContext(context),
    ).toBe(expected);
  });

  it('applies -1, 0, and positive AI-response auto-scroll limits to body text', () => {
    context.content = '長いAI応答';

    expect(new vm.Script('shouldAutoScrollResponseBody(content, -1)').runInContext(context)).toBe(true);
    expect(new vm.Script('shouldAutoScrollResponseBody(content, 0)').runInContext(context)).toBe(false);
    expect(new vm.Script('shouldAutoScrollResponseBody(content, 7)').runInContext(context)).toBe(true);
    expect(new vm.Script('shouldAutoScrollResponseBody(content, 6)').runInContext(context)).toBe(false);
  });

  it('counts Unicode code points rather than UTF-16 code units', () => {
    context.content = '😀a';

    expect(new vm.Script('shouldAutoScrollResponseBody(content, 3)').runInContext(context)).toBe(true);
    expect(new vm.Script('shouldAutoScrollResponseBody(content, 2)').runInContext(context)).toBe(false);
  });
});
