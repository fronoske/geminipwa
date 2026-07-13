import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');
const readRuntime = (name: string): string => readFile(`.build/runtime/${name}.js`);

const serviceBoundaries = [
  ['api-clients', 'apiUtils'],
  ['backend-manager', 'multiBackendUtils'],
  ['error-recovery', 'errorRecovery'],
  ['api-key-manager', 'multiApiKeyUtils'],
] as const;

const controllerFeatures = [
  ['ui-message-rendering', 'uiUtils'],
  ['ui-message-tools', 'uiUtils'],
  ['ui-settings', 'uiUtils'],
  ['ui-header-controls', 'uiUtils'],
  ['ui-interactions', 'uiUtils'],
  ['app-initialization', 'appLogic'],
  ['event-wiring', 'appLogic'],
  ['app-navigation-panels', 'appLogic'],
  ['chat-sessions', 'appLogic'],
  ['message-sending', 'appLogic'],
  ['data-management', 'appLogic'],
  ['message-actions', 'appLogic'],
] as const;

describe('application service boundaries', () => {
  it.each(serviceBoundaries)('defines %s outside the main entry', (filename, globalName) => {
    const mainSource = readFile('src/main.ts');
    const serviceSource = readFile(`src/${filename}.ts`);

    expect(mainSource).not.toContain(`const ${globalName} = {`);
    expect(serviceSource).toContain(`const ${globalName} = {`);
  });

  it.each(serviceBoundaries)('generates the %s runtime object', (filename, globalName) => {
    const context = vm.createContext({});
    new vm.Script(readRuntime(filename)).runInContext(context);

    expect(new vm.Script(`typeof ${globalName}`).runInContext(context)).toBe('object');
  });

  it.each(controllerFeatures)('registers the %s controller feature', (filename, globalName) => {
    const context = vm.createContext({ [globalName]: {} });
    new vm.Script(readRuntime(filename)).runInContext(context);

    expect(
      new vm.Script(`Object.keys(${globalName}).length > 0`).runInContext(context),
    ).toBe(true);
  });

  it('keeps controller roots as small feature registries', () => {
    expect(readFile('src/ui-controller.ts')).toContain(
      'const uiUtils: Record<string, any> = {}',
    );
    expect(readFile('src/app-controller.ts')).toContain(
      'const appLogic: Record<string, any> = {}',
    );
  });

  it.each([
    [
      'uiUtils',
      66,
      [
        'ui-message-rendering',
        'ui-message-tools',
        'ui-settings',
        'ui-header-controls',
        'ui-interactions',
      ],
    ],
    [
      'appLogic',
      72,
      [
        'app-initialization',
        'event-wiring',
        'app-navigation-panels',
        'chat-sessions',
        'message-sending',
        'data-management',
        'message-actions',
      ],
    ],
  ] as const)('preserves all %s controller methods', (globalName, expectedCount, filenames) => {
    const context = vm.createContext({ [globalName]: {} });
    for (const filename of filenames) {
      new vm.Script(readRuntime(filename)).runInContext(context);
    }

    expect(new vm.Script(`Object.keys(${globalName}).length`).runInContext(context)).toBe(
      expectedCount,
    );
  });

  it('keeps the main entry focused on application startup', () => {
    const mainSource = readFile('src/main.ts');

    expect(mainSource.split('\n').length).toBeLessThan(20);
    expect(mainSource).toContain('errorRecovery.init()');
    expect(mainSource).toContain('window.errorRecovery = errorRecovery');
    expect(mainSource).toContain('appLogic.initializeApp()');
  });
});
