import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');

const serviceBoundaries = [
  ['webhook-manager', 'webhookUtils'],
  ['api-clients', 'apiUtils'],
  ['proofreading-config', 'proofreadingApiConfigUtils'],
  ['backend-manager', 'multiBackendUtils'],
  ['error-recovery', 'errorRecovery'],
  ['api-key-manager', 'multiApiKeyUtils'],
  ['twin-engine-config', 'twinEngineApiConfigUtils'],
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
    new vm.Script(readFile(`src/${filename}.js`)).runInContext(context);

    expect(new vm.Script(`typeof ${globalName}`).runInContext(context)).toBe('object');
  });
});
