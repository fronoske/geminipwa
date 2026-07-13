import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');
const runtimeManifest = JSON.parse(readFile('scripts/runtime-scripts.json'));

describe('project configuration', () => {
  it('keeps the GitHub Pages PWA files at the project root', () => {
    for (const filename of ['index.html', 'manifest.json', 'sw.js', 'marked.js', 'icon-192x192.png']) {
      expect(fs.existsSync(path.join(projectRoot, filename)), filename).toBe(true);
    }
  });

  it('keeps all editable application sources under src', () => {
    expect(fs.existsSync(path.join(projectRoot, 'src/index.html'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'src/styles/app.css'))).toBe(true);
    for (const name of [...runtimeManifest.early, ...runtimeManifest.application]) {
      expect(fs.existsSync(path.join(projectRoot, `src/${name}.ts`)), name).toBe(true);
    }
  });

  it('uses a relative manifest start URL suitable for GitHub Pages', () => {
    expect(JSON.parse(readFile('manifest.json')).start_url).toBe('./index.html');
  });

  it('preserves the IndexedDB identity during the build migration', () => {
    const appConfig = readFile('src/app-config.ts');
    expect(appConfig).toContain("const DB_NAME = 'GeminiPWA_DB'");
    expect(appConfig).toContain('const DB_VERSION = 8');
  });

  it('pre-caches only public runtime files', () => {
    const serviceWorker = readFile('sw.js');
    for (const filename of ['./index.html', './manifest.json', './marked.js', './icon-192x192.png']) {
      expect(serviceWorker).toContain(`'${filename}'`);
    }
    expect(serviceWorker).not.toContain("'./src/");
  });
});
