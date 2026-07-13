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

  it('does not ship the removed Twin-engine feature', () => {
    expect(readFile('src/index.html')).not.toMatch(/twin[-_ ]?engine|resummarize/i);
    expect(readFile('src/app-state.ts')).not.toMatch(/twin[-_ ]?engine|resummarize/i);
    expect(readFile('scripts/runtime-scripts.json')).not.toMatch(/twin[-_ ]?engine/i);
    expect(fs.readdirSync(path.join(projectRoot, 'src')).join('\n')).not.toMatch(/twin[-_ ]?engine/i);
    expect(readFile('src/database.ts')).toContain('removedSettingKeys');
  });

  it('does not ship session linking or custom scrolling', () => {
    const retiredFeaturePattern = /session[-_ ]?link|ai[-_ ]?to[-_ ]?ai|cryscroller|immersive[-_ ]?scroll/i;
    expect(readFile('src/index.html')).not.toMatch(retiredFeaturePattern);
    expect(readFile('src/app-state.ts')).not.toMatch(retiredFeaturePattern);
    expect(readFile('scripts/runtime-scripts.json')).not.toMatch(retiredFeaturePattern);
    expect(fs.readdirSync(path.join(projectRoot, 'src')).join('\n')).not.toMatch(retiredFeaturePattern);
  });

  it('does not ship proofreading', () => {
    expect(readFile('src/index.html')).not.toMatch(/proofread|校正/i);
    expect(readFile('src/app-state.ts')).not.toMatch(/proofread/i);
    expect(readFile('scripts/runtime-scripts.json')).not.toMatch(/proofread/i);
    expect(fs.readdirSync(path.join(projectRoot, 'src')).join('\n')).not.toMatch(/proofread/i);
  });

  it('does not ship image URL replacement or fuzzy normalization', () => {
    const retiredFeaturePattern = /image[-_ ]?url[-_ ]?replacement|fuzzy[-_ ]?search|romaji[-_ ]?to[-_ ]?katakana|character[-_ ]?names/i;
    expect(readFile('src/index.html')).not.toMatch(retiredFeaturePattern);
    expect(readFile('src/app-state.ts')).not.toMatch(retiredFeaturePattern);
    expect(readFile('scripts/runtime-scripts.json')).not.toMatch(/text-normalization/i);
    expect(fs.readdirSync(path.join(projectRoot, 'src')).join('\n')).not.toMatch(/text-normalization/i);
  });

  it('keeps message sending on the foreground chat path', () => {
    expect(readFile('src/message-sending.ts')).not.toMatch(
      /sourceSessionContext|isBackgroundProcess|isTopLevelCall/,
    );
  });

  it('does not ship the Dummy AI provider', () => {
    expect(readFile('src/index.html')).not.toMatch(/Dummy AI|value="dummy"/);
    expect(readFile('src/app-config.ts')).not.toContain("value: 'dummy'");
    expect(readFile('src/message-sending.ts')).not.toMatch(/apiProvider === 'dummy'|selectedApiProvider === 'dummy'/);
  });

  it('does not ship provider-specific dummy prompts or Dummy Model prompts', () => {
    const providerDummyPattern = /(?:gemini|deepSeek|claude|openai|xai|llmAggregator).*Dummy(?:User|Model)/i;
    expect(readFile('src/index.html')).not.toMatch(/(?:gemini|deepseek|claude|openai|xai|llmaggregator)-dummy-(?:user|model)/i);
    expect(readFile('src/app-state.ts')).not.toMatch(providerDummyPattern);
    expect(readFile('src/message-sending.ts')).not.toMatch(providerDummyPattern);
    expect(readFile('src/index.html')).not.toMatch(/Dummy Model|ダミーModel/i);
  });

  it('does not ship webhook forwarding', () => {
    expect(runtimeManifest.application).not.toContain('webhook-manager');
    expect(fs.existsSync(path.join(projectRoot, 'src/webhook-manager.ts'))).toBe(false);
    expect(readFile('src/index.html')).not.toMatch(/webhook/i);
    expect(readFile('src/app-state.ts')).not.toMatch(/webhook/i);
    expect(readFile('src/message-sending.ts')).not.toMatch(/webhook/i);
  });

  it('does not ship dice input and still preserves input presets', () => {
    expect(readFile('src/index.html')).not.toMatch(/roll-dice|dice-value|ダイスボタン/);
    expect(readFile('src/app-state.ts')).not.toMatch(/showDice|diceMin|diceMax/);
    expect(runtimeManifest.application).toContain('input-preset');
  });

  it('does not ship retired appearance customizations', () => {
    const retiredFeaturePattern = /turf-mode|backgroundImageBlob|userIconBlob|aiIconBlob|userNameBubble|aiNameBubble/;
    expect(readFile('src/index.html')).not.toMatch(/value="turf"|settings-group-icons|settings-group-image/);
    expect(readFile('src/app-state.ts')).not.toMatch(retiredFeaturePattern);
    expect(readFile('src/ui-settings.ts')).not.toMatch(retiredFeaturePattern);
  });

  it('uses one configurable header menu for chat-wide actions', () => {
    const html = readFile('src/index.html');
    for (const id of ['header-menu-btn', 'header-menu-new-chat-btn', 'header-menu-clear-btn', 'header-menu-copy-btn']) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('id="show-header-menu-button-toggle"');
    expect(html).not.toMatch(/id="(?:new-chat|delete-session|copy-session)-btn"/);
    expect(html).not.toMatch(/id="show-(?:new-chat|delete-session|copy-session)-button-toggle"/);
    expect(readFile('src/app-state.ts')).toContain('showHeaderMenuButton: true');
  });

  it('keeps the first message when clearing the current chat', () => {
    const sessions = readFile('src/chat-sessions.ts');
    expect(sessions).toContain('state.currentMessages.slice(0, 1)');
    expect(sessions).not.toContain('confirmDeleteCurrentSession');
    expect(sessions).not.toContain('deleteCurrentSession');
  });

  it('preserves multiple API key management as a protected core feature', () => {
    expect(runtimeManifest.application).toContain('api-key-manager');
    expect(readFile('src/api-key-manager.ts')).toContain('const multiApiKeyUtils = {');
    expect(readFile('src/app-state.ts')).toContain('geminiApiKeys: []');
    expect(readFile('src/index.html')).toContain('id="show-multi-api-keys-toggle"');
    expect(readFile('docs/product-decisions.md')).toContain('Multiple API key management');
  });

  it('preserves input presets as a protected core feature', () => {
    expect(runtimeManifest.application).toContain('input-preset');
    expect(readFile('src/index.html')).toContain('id="input-preset-popup"');
    const presetSource = readFile('src/input-preset.ts');
    expect(presetSource).toContain("label: '続'");
    expect(presetSource).toContain("label: '展'");
    expect(presetSource).toContain('autoSend: true');
    expect(readFile('docs/product-decisions.md')).toContain('Input presets');
  });

  it('preserves the common Dummy User prompt as a protected core feature', () => {
    expect(readFile('src/index.html')).toContain('id="common-dummy-user"');
    expect(readFile('src/app-state.ts')).toContain("commonDummyUser: ''");
    const sending = readFile('src/message-sending.ts');
    expect(sending).toContain("role: 'user', parts: [{ text: commonDummyUser }]");
    expect(readFile('docs/product-decisions.md')).toContain('Common Dummy User prompt');
  });

  it('preserves memo and clipboard stack as protected core features', () => {
    const html = readFile('src/index.html');
    const panels = readFile('src/app-navigation-panels.ts');
    expect(html).toContain('id="memo-editor"');
    expect(html).toContain('id="clipboard-stack-editor"');
    expect(panels).toContain('toggleMemo()');
    expect(panels).toContain('toggleClipboardStack()');
    expect(readFile('docs/product-decisions.md')).toContain('Memo and clipboard stack');
  });

  it('preserves response branching as a protected core feature', () => {
    const sending = readFile('src/message-sending.ts');
    const actions = readFile('src/message-actions.ts');
    expect(sending).toContain('siblingGroupId');
    expect(sending).toContain('isCascaded');
    expect(actions).toContain('navigateCascade');
    expect(readFile('docs/product-decisions.md')).toContain('Response branching');
  });

  it('preserves streaming output as a protected core feature', () => {
    const html = readFile('src/index.html');
    const sending = readFile('src/message-sending.ts');
    expect(html).toContain('id="gemini-streaming-output"');
    expect(html).toContain('id="gemini-streaming-speed"');
    expect(html).toContain('id="gemini-pseudo-streaming"');
    expect(sending).toContain('contextStreamingSpeed');
    expect(sending).toContain('usePseudoForThisCall');
    expect(readFile('docs/product-decisions.md')).toContain('Streaming output');
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
