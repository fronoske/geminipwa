import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');

describe('project configuration', () => {
  it('keeps the current PWA entry files at the project root', () => {
    const requiredFiles = [
      'index.html',
      'manifest.json',
      'sw.js',
      'marked.js',
      'icon-192x192.png',
      'src/styles/app.css',
      'src/recovery.js',
      'src/app-config.js',
      'src/dom-elements.js',
      'src/app-state.js',
      'src/database.js',
      'src/utilities.js',
      'src/main.js',
      'src/input-preset.js',
    ];

    for (const filename of requiredFiles) {
      expect(fs.existsSync(path.join(projectRoot, filename)), filename).toBe(true);
    }
  });

  it('uses a relative manifest start URL suitable for GitHub Pages', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf8'));

    expect(manifest.start_url).toBe('./index.html');
  });

  it('preserves the IndexedDB identity during the build migration', () => {
    const appConfig = fs.readFileSync(path.join(projectRoot, 'src/app-config.js'), 'utf8');

    expect(appConfig).toContain("const DB_NAME = 'GeminiPWA_DB'");
    expect(appConfig).toContain('const DB_VERSION = 8');
  });

  it('pre-caches the extracted stylesheet', () => {
    const serviceWorker = fs.readFileSync(path.join(projectRoot, 'sw.js'), 'utf8');

    expect(serviceWorker).toContain("'./src/styles/app.css'");
  });

  it('pre-caches the extracted application scripts', () => {
    const serviceWorker = fs.readFileSync(path.join(projectRoot, 'sw.js'), 'utf8');
    const scripts = [
      'recovery.js',
      'app-config.js',
      'dom-elements.js',
      'app-state.js',
      'database.js',
      'utilities.js',
      'main.js',
      'input-preset.js',
    ];

    for (const filename of scripts) {
      expect(serviceWorker).toContain(`'./src/${filename}'`);
    }
  });
});
