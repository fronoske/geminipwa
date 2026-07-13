import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');

describe('database boundary', () => {
  it('keeps IndexedDB utilities outside the main entry source', () => {
    expect(readFile('src/main.ts')).not.toContain('const dbUtils = {');
    expect(readFile('src/database.ts')).toContain('const dbUtils = {');
  });

  it('preserves the database API surface', () => {
    const context = vm.createContext({});
    new vm.Script(readFile('.build/runtime/database.js')).runInContext(context);
    const methodNames = new vm.Script('Object.keys(dbUtils)').runInContext(context);

    expect(Array.from(methodNames)).toEqual([
      '_initPromise',
      'openDB',
      '_getStore',
      'saveSetting',
      'loadSettings',
      'saveChat',
      'updateChatTitleDb',
      'getChat',
      'getAllChats',
      'deleteChat',
      'clearAllData',
      'clearAllChatsStore',
    ]);
  });
});
