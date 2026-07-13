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
      'src/aggregator-security.js',
      'src/layout-runtime.js',
      'src/service-worker-registration.js',
      'src/text-normalization.js',
      'src/database.js',
      'src/utilities.js',
      'src/interruptible-sleep.js',
      'src/webhook-manager.js',
      'src/api-clients.js',
      'src/proofreading-config.js',
      'src/backend-manager.js',
      'src/error-recovery.js',
      'src/api-key-manager.js',
      'src/twin-engine-config.js',
      'src/ui-controller.js',
      'src/ui-message-rendering.js',
      'src/ui-message-tools.js',
      'src/ui-settings.js',
      'src/ui-header-controls.js',
      'src/ui-interactions.js',
      'src/app-controller.js',
      'src/app-initialization.js',
      'src/event-wiring.js',
      'src/app-navigation-panels.js',
      'src/chat-sessions.js',
      'src/message-sending.js',
      'src/data-management.js',
      'src/message-actions.js',
      'src/twin-engine-runtime.js',
      'src/scrolling-runtime.js',
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
      'aggregator-security.js',
      'layout-runtime.js',
      'service-worker-registration.js',
      'text-normalization.js',
      'database.js',
      'utilities.js',
      'interruptible-sleep.js',
      'webhook-manager.js',
      'api-clients.js',
      'proofreading-config.js',
      'backend-manager.js',
      'error-recovery.js',
      'api-key-manager.js',
      'twin-engine-config.js',
      'ui-controller.js',
      'ui-message-rendering.js',
      'ui-message-tools.js',
      'ui-settings.js',
      'ui-header-controls.js',
      'ui-interactions.js',
      'app-controller.js',
      'app-initialization.js',
      'event-wiring.js',
      'app-navigation-panels.js',
      'chat-sessions.js',
      'message-sending.js',
      'data-management.js',
      'message-actions.js',
      'twin-engine-runtime.js',
      'scrolling-runtime.js',
      'main.js',
      'input-preset.js',
    ];

    for (const filename of scripts) {
      expect(serviceWorker).toContain(`'./src/${filename}'`);
    }
  });
});
