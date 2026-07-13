import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');

describe('application foundation scripts', () => {
  it('loads configuration, DOM bindings, and state before main', () => {
    const html = readFile('index.html');
    const orderedScripts = [
      'src/app-config.js',
      'src/dom-elements.js',
      'src/app-state.js',
      'src/database.js',
      'src/utilities.js',
      'src/webhook-manager.js',
      'src/api-clients.js',
      'src/proofreading-config.js',
      'src/backend-manager.js',
      'src/error-recovery.js',
      'src/api-key-manager.js',
      'src/twin-engine-config.js',
      'src/main.js',
    ];
    const positions = orderedScripts.map((filename) => html.indexOf(filename));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it('preserves database and provider defaults', () => {
    const context = vm.createContext({});
    new vm.Script(readFile('src/app-config.js')).runInContext(context);

    expect(new vm.Script('DB_NAME').runInContext(context)).toBe('GeminiPWA_DB');
    expect(new vm.Script('DB_VERSION').runInContext(context)).toBe(8);
    expect(new vm.Script('DEFAULT_MODEL').runInContext(context)).toBe('gemini-3.5-flash');
    expect(new vm.Script('API_PROVIDERS.length').runInContext(context)).toBe(7);
  });

  it('initializes state from configuration defaults', () => {
    const context = vm.createContext({});
    new vm.Script(readFile('src/app-config.js')).runInContext(context);
    new vm.Script(readFile('src/app-state.js')).runInContext(context);

    expect(new vm.Script('state.currentMessages.length').runInContext(context)).toBe(0);
    expect(new vm.Script('state.settings.modelName').runInContext(context)).toBe(
      'gemini-3.5-flash',
    );
    expect(new vm.Script('state.settings.apiProvider').runInContext(context)).toBe('gemini');
  });

  it('only references element IDs present in the HTML', () => {
    const html = readFile('index.html');
    const source = readFile('src/dom-elements.ts');
    const htmlIds = new Set(
      [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]),
    );
    const referencedIds = [
      ...source.matchAll(/(?:getElementById|getRequiredDomElement)\(["']([^"']+)["']\)/g),
    ].map((match) => match[1]);

    expect([...new Set(referencedIds.filter((id) => !htmlIds.has(id)))]).toEqual([]);
  });
});
