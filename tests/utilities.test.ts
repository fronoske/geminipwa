import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const utilitySource = fs.readFileSync(path.join(projectRoot, '.build/runtime/utilities.js'), 'utf8');
let context: vm.Context;

beforeEach(() => {
  context = vm.createContext({
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
});
