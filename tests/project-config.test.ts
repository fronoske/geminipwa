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
    for (const id of ['header-menu-btn', 'attach-file-btn', 'header-menu-new-chat-btn', 'header-menu-clear-btn', 'header-menu-copy-btn']) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('>ファイル添付<span');
    expect(html).toContain('全削除（先頭を除く）');
    expect(html).toContain('id="show-header-menu-button-toggle"');
    expect(html).not.toMatch(/id="(?:new-chat|delete-session|copy-session)-btn"/);
    expect(html).not.toMatch(/id="show-(?:new-chat|delete-session|copy-session)-button-toggle"/);
    expect(readFile('src/app-state.ts')).toContain('showHeaderMenuButton: true');
  });

  it('provides configurable floating message navigation controls', () => {
    const html = readFile('src/index.html');
    for (const id of ['message-navigation-controls', 'message-navigation-up-btn', 'message-navigation-down-btn']) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('id="message-navigation-button-mode"');
    expect(html).toContain('<option value="always">常に表示</option>');
    expect(html).toContain('<option value="hidden">非表示</option>');
    expect(html).toContain('<option value="scroll">スクロール時のみ表示</option>');
    expect(readFile('src/app-state.ts')).toContain("messageNavigationButtonMode: 'scroll'");
    const navigation = readFile('src/app-navigation-panels.ts');
    expect(navigation).toContain("querySelectorAll('.message.user[data-index]')");
    expect(navigation).toContain("direction === 'up' && scrollContainer.scrollTop > 2");
    expect(navigation).toContain("scrollContainer.scrollTo({ top: 0, behavior })");
    expect(navigation).toContain('messageNavigationUpBtn.disabled');
    expect(navigation).toContain('elements.loadingIndicator.style.bottom = bottom');
    const styles = readFile('src/styles/app.css');
    expect(styles).toMatch(/\.message-navigation-controls button \{[\s\S]*?background: var\(--bg-button-action\);/);
    expect(styles).toMatch(/#loading-indicator \{[\s\S]*?position: absolute;/);
  });

  it('uses a compact one-line input with persistent paste and send actions', () => {
    const html = readFile('src/index.html');
    expect(html).toContain('id="user-input" placeholder="メッセージを入力..." rows="1"');
    expect(html).not.toContain('class="primary-input-actions"');
    expect(html.indexOf('id="paste-to-input-btn"')).toBeLessThan(html.indexOf('id="user-input"'));
    expect(html.indexOf('id="user-input"')).toBeLessThan(html.indexOf('id="send-button"'));
    const styles = readFile('src/styles/app.css');
    expect(styles).toMatch(/\.chat-input-area textarea \{[\s\S]*?min-height: 40px;[\s\S]*?height: 40px;/);
    expect(styles).toMatch(/\.app-container\.minimized-ui \.chat-input-area textarea \{[\s\S]*?min-height: 32px;[\s\S]*?height: 32px;/);
  });

  it('does not expose provider, API key, or paste visibility options in the footer', () => {
    const html = readFile('src/index.html');
    expect(html).not.toMatch(/id="(?:footer-secondary-actions|footer-api-provider-toggle-btn|footer-cycle-api-key-btn)"/);
    expect(html).not.toMatch(/id="show-(?:api-provider-toggle-footer|footer-cycle-api-key-btn-toggle|paste-button-in-footer-toggle)"/);
    const stateSource = readFile('src/app-state.ts');
    expect(stateSource).not.toMatch(/show(?:ApiProviderToggleFooter|FooterCycleApiKeyBtn|PasteButtonInFooter)/);
    const databaseSource = readFile('src/database.ts');
    expect(databaseSource).toContain('showApiProviderToggleFooter|showFooterCycleApiKeyBtn|showPasteButtonInFooter');
  });

  it('uses an accessible SVG history icon instead of a text abbreviation', () => {
    const html = readFile('src/index.html');
    expect(html).toContain('class="history-icon"');
    expect(html).not.toMatch(/id="goto-history-btn"[^>]*>履<\/button>/);
  });

  it('places the edit cursor at the end without selecting the full message', () => {
    const actions = readFile('src/message-actions.ts');
    expect(actions).toContain('textarea.setSelectionRange(textarea.value.length, textarea.value.length)');
    expect(actions).not.toContain('textarea.select()');
  });

  it('always confirms before interrupting a response to load another chat', () => {
    const html = readFile('src/index.html');
    const state = readFile('src/app-state.ts');
    const sessions = readFile('src/chat-sessions.ts');
    expect(html).not.toContain('settings-group-sending-operation');
    expect(state).not.toContain('disableLoadChatConfirmationWhileSending');
    expect(sessions).toContain('const confirmedLoad = await uiUtils.showCustomConfirm("送信中です。中断して別のチャットを読み込みますか？")');
  });

  it('separates behavior and display adjustment settings', () => {
    const html = readFile('src/index.html');
    const promptIndex = html.indexOf('id="settings-group-prompts"');
    const behaviorIndex = html.indexOf('id="settings-group-behavior-adjustment"');
    const displayIndex = html.indexOf('id="settings-group-display-adjustment"');
    const inputPresetIndex = html.indexOf('id="settings-group-input-presets"');
    expect(promptIndex).toBeGreaterThan(-1);
    expect(promptIndex).toBeLessThan(behaviorIndex);
    expect(behaviorIndex).toBeGreaterThan(-1);
    expect(behaviorIndex).toBeLessThan(displayIndex);
    const behaviorSettings = html.slice(behaviorIndex, displayIndex);
    const displaySettings = html.slice(displayIndex, inputPresetIndex);
    expect(behaviorSettings).not.toContain('settings-group-factor-style-changes');
    expect(displaySettings).toContain('settings-group-factor-style-changes');
    expect(displaySettings).toContain('settings-group-font');
    expect(displaySettings).toContain('settings-group-opacity');
    expect(displaySettings).toContain('外観とレイアウト</summary>');
    expect(displaySettings).toContain('メッセージ編集ツールバー</summary>');
    expect(displaySettings).toContain('折りたたみボタン</summary>');
    expect(displaySettings).not.toContain('画面別の表示</summary>');
    expect(displaySettings).not.toContain('id="settings-group-header-footer-buttons"');
    expect(displaySettings).toContain('id="settings-group-factor-message-edit-toolbar"');
    expect(displaySettings).toContain('id="settings-group-factor-collapse-buttons"');
    expect(displaySettings).not.toContain('id="settings-group-collapse-button-details"');
    expect(displaySettings).not.toMatch(/<hr[^>]*>\s*<label class="checkbox-label">\s*<input type="checkbox" id="enable-elevation-toggle">/);
    const appearanceStart = displaySettings.indexOf('id="settings-group-factor-style-changes"');
    const historyDisplayStart = displaySettings.indexOf('id="settings-group-factor-history-buttons"');
    expect(displaySettings.slice(0, appearanceStart)).not.toContain('id="theme-select"');
    expect(displaySettings.slice(appearanceStart, historyDisplayStart)).toContain('id="theme-select"');
    for (const id of [
      'settings-group-factor-history-buttons',
      'settings-group-factor-header-buttons',
      'settings-group-factor-message-navigation-buttons',
      'settings-group-factor-message-edit-toolbar',
      'settings-group-factor-collapse-buttons',
    ]) {
      expect(displaySettings).toMatch(new RegExp(`id="${id}" class="settings-subsection"\\s*>\\s*<summary class="settings-subsection-summary">`));
    }
    const promotedSections = displaySettings.slice(historyDisplayStart, displaySettings.indexOf('id="settings-group-font"'));
    expect(promotedSections).not.toContain('border-left: 1px solid var(--border-secondary)');
    expect(promotedSections).not.toContain('padding-top: 5px');
    expect(displaySettings).not.toContain('<hr');
    expect(html).not.toContain('id="settings-group-other"');
    expect(html).not.toMatch(/ファクター[：:]/);
  });

  it('groups provider-independent prompts in a top-level prompt section', () => {
    const html = readFile('src/index.html');
    const providerIndex = html.indexOf('id="settings-group-api-provider"');
    const geminiIndex = html.indexOf('id="gemini-settings-group"');
    const promptIndex = html.indexOf('id="settings-group-prompts"');
    const behaviorIndex = html.indexOf('id="settings-group-behavior-adjustment"');
    const providerSettings = html.slice(providerIndex, geminiIndex);
    const promptSettings = html.slice(promptIndex, behaviorIndex);
    expect(providerSettings).not.toContain('settings-group-common-system-prompt');
    expect(providerSettings).not.toContain('settings-group-common-dummy-user-prompt');
    expect(promptSettings).toContain('API共通プロンプト</summary>');
    expect(promptSettings).toContain('id="settings-group-common-system-prompt"');
    expect(promptSettings).toContain('id="settings-group-common-dummy-user-prompt"');
    expect(promptSettings).toMatch(/id="settings-group-common-system-prompt" class="settings-subsection">\s*<summary class="settings-subsection-summary">/);
    const behaviorSettings = html.slice(behaviorIndex, html.indexOf('id="settings-group-display-adjustment"'));
    expect(behaviorSettings).toMatch(/id="settings-group-factor-operation-changes" class="settings-subsection">\s*<summary class="settings-subsection-summary">/);
    const styles = readFile('src/styles/app.css');
    expect(styles).toMatch(/\.settings-subsection-summary \{[\s\S]*?font-weight: normal;/);
    expect(styles).not.toContain('#settings-screen .main-content .settings-group > details > summary');
  });

  it('uses concise settings copy and only exposes light and dark themes', () => {
    const html = readFile('src/index.html');
    expect(html).toContain('APIプロバイダー</summary>');
    expect(html).toContain('<label for="api-provider-select">APIプロバイダー:</label>');
    expect(html).toContain('システムプロンプト</summary>');
    expect(html).toContain('ダミーユーザープロンプト</summary>');
    expect(html).not.toMatch(/<label for="common-(?:system-prompt-default|dummy-user)">/);
    expect(html).toContain('アプリの挙動</summary>');
    for (const label of [
      'リトライ時の確認をスキップする',
      'メッセージ削除時の確認をスキップする',
      '添付ファイル削除時の確認をスキップする',
    ]) {
      expect(html).toContain(label);
    }
    const advancedStart = html.indexOf('id="settings-group-factor-advanced-options"');
    const displayStart = html.indexOf('id="settings-group-display-adjustment"');
    expect(html.slice(advancedStart, displayStart)).not.toMatch(/<hr|複数のAPIキーを使い分けたい場合に使用/);
    const themeStart = html.indexOf('id="theme-select"');
    const themeEnd = html.indexOf('</select>', themeStart);
    const themeOptions = html.slice(themeStart, themeEnd);
    expect(themeOptions).toContain('<option value="light">ライトモード</option>');
    expect(themeOptions).toContain('<option value="dark">ダークモード</option>');
    expect(themeOptions).not.toContain('pastel-');
    expect(html).not.toContain('margin: 15px 0 15px 0; border: none; border-top: 1px solid var(--border-secondary);');
    expect(readFile('src/database.ts')).toContain("if (!['light', 'dark'].includes(state.settings.theme))");
  });

  it('always shows both settings navigation buttons without visibility options', () => {
    const html = readFile('src/index.html');
    expect(html).toContain('id="settings-scroll-to-top-btn"');
    expect(html).toContain('id="settings-scroll-to-bottom-btn"');
    expect(html).not.toMatch(/settings-group-factor-settings-buttons|show-settings-scroll-to-(?:top|bottom)-button-toggle/);
    expect(readFile('src/app-state.ts')).not.toMatch(/showSettingsScrollTo(?:Top|Bottom)Button/);
    expect(readFile('src/database.ts')).toContain('showSettingsScrollToTopButton|showSettingsScrollToBottomButton');
  });

  it('expands top-level settings sections and collapses all nested sections when opening settings', () => {
    const settingsSource = readFile('src/ui-settings.ts');
    expect(settingsSource).toContain("document.querySelectorAll('#settings-screen .main-content > details.settings-group')");
    expect(settingsSource).toContain('topLevelDetails.open = true');
    expect(settingsSource).toContain("topLevelDetails.querySelectorAll('details')");
    expect(settingsSource).toContain('nestedDetails.open = false');
  });

  it('spaces second-level settings headings closer to their content than to the previous section', () => {
    const styles = readFile('src/styles/app.css');
    expect(styles).toMatch(/#settings-screen \.main-content > details\.settings-group > details,[\s\S]*?margin-top: 18px !important;/);
    expect(styles).toMatch(/#settings-screen \.main-content > details\.settings-group > details > summary,[\s\S]*?margin-bottom: 6px !important;/);
  });

  it('styles third-level settings summaries as field labels', () => {
    const runtime = readFile('src/layout-runtime.ts');
    const styles = readFile('src/styles/app.css');
    expect(runtime).toContain('function markSettingsHierarchyLevels(): void');
    expect(runtime).toContain('const visualLevel = Math.min(level, 3)');
    expect(runtime).toContain("details.classList.add(`settings-level-${visualLevel}`)");
    expect(runtime).toContain("details.querySelector(':scope > summary')?.classList.add(`settings-summary-level-${visualLevel}`)");
    expect(styles).toMatch(/details\.settings-level-3 > summary\.settings-summary-level-3 \{[\s\S]*?color: var\(--text-primary\) !important;[\s\S]*?font-size: 1em !important;[\s\S]*?font-weight: bold !important;/);
  });

  it('separates multi API key management from the model field and uses concise display labels', () => {
    const html = readFile('src/index.html');
    const styles = readFile('src/styles/app.css');
    expect(styles).toMatch(/details\[id\$="-multi-api-keys-section"\],[\s\S]*?#llmaggregator-multi-backends-section \{[\s\S]*?margin-bottom: 15px !important;/);
    expect(html).toContain('フォント</summary>');
    expect(html).toContain('透明度</summary>');
    expect(html).not.toContain('フォント設定</summary>');
    expect(html).not.toContain('各種透明度設定</summary>');
    const opacitySection = html.slice(
      html.indexOf('id="settings-group-opacity"'),
      html.indexOf('</details>', html.indexOf('id="settings-group-opacity"')),
    );
    expect(opacitySection).not.toContain('の透明度');
  });

  it('uses the standard settings layout without obsolete layout toggles', () => {
    const html = readFile('src/index.html');
    const styles = readFile('src/styles/app.css');
    for (const id of [
      'compact-settings-spacing-toggle',
      'slim-settings-headers-toggle',
      'flat-settings-design-toggle',
    ]) {
      expect(html).not.toContain(`id="${id}"`);
    }
    expect(styles).toMatch(/\.settings-group \{[\s\S]*?margin-bottom: 8px;/);
    expect(styles).toMatch(/\.danger-zone \{[\s\S]*?margin-top: 15px;/);
    expect(styles).toContain('#settings-screen details.settings-level-1 > summary');
    expect(styles).toContain('#settings-screen details.settings-level-2 > summary');
    expect(styles).not.toMatch(/compact-settings-mode|slim-settings-headers|flat-settings-mode/);
    for (const source of [
      'src/app-state.ts',
      'src/dom-elements.ts',
      'src/event-wiring.ts',
      'src/ui-settings.ts',
      'src/data-management.ts',
      'src/app-initialization.ts',
    ]) {
      expect(readFile(source)).not.toMatch(/compactSettingsSpacing|slimSettingsHeaders|flatSettingsDesign|applyCompactSettingsSpacing/);
    }
    const persistence = readFile('src/data-management.ts');
    expect(persistence).toContain('newSettings.clipboardStackHeight = newSettings.memoHeight;');
    expect(persistence).not.toContain('newSettings.clipboardStackHeight = state.settings.clipboardStackHeight;');
  });

  it('keeps the first message when clearing the current chat', () => {
    const sessions = readFile('src/chat-sessions.ts');
    expect(sessions).toContain('state.currentMessages.slice(0, 1)');
    expect(sessions).not.toContain('confirmDeleteCurrentSession');
    expect(sessions).not.toContain('deleteCurrentSession');
  });

  it('preserves multiple API key management as a protected core feature', () => {
    const html = readFile('src/index.html');
    const apiSettings = html.slice(
      html.indexOf('id="settings-group-api-provider"'),
      html.indexOf('id="gemini-settings-group"'),
    );
    const behaviorSettings = html.slice(
      html.indexOf('id="settings-group-behavior-adjustment"'),
      html.indexOf('id="settings-group-display-adjustment"'),
    );
    expect(runtimeManifest.application).toContain('api-key-manager');
    expect(readFile('src/api-key-manager.ts')).toContain('const multiApiKeyUtils = {');
    expect(readFile('src/app-state.ts')).toContain('geminiApiKeys: []');
    expect(apiSettings).toContain('id="show-multi-api-keys-toggle"');
    expect(behaviorSettings).not.toContain('id="show-multi-api-keys-toggle"');
    expect(readFile('docs/product-decisions.md')).toContain('Multiple API key management');
  });

  it('groups each provider into one top-level settings section at runtime', () => {
    const layout = readFile('src/layout-runtime.ts');
    for (const provider of ['gemini', 'deepseek', 'claude', 'openai', 'openrouter', 'xai', 'llmaggregator']) {
      expect(layout).toContain(`provider: '${provider}'`);
      expect(layout).toContain(`rootId: '${provider}-settings-group'`);
      expect(layout).toContain(`paramsId: '${provider}-params-group'`);
      expect(layout).toContain(`advancedId: '${provider}-advanced-group'`);
    }
    expect(layout).toContain("prepareNestedDetails(params, 'プロンプトと生成パラメータ')");
    expect(layout).toContain("prepareNestedDetails(advanced, '出力と機能')");
    expect(layout).toContain("? 'バックエンド・APIキーとモデル'");
    expect(layout).toContain(": 'APIキーとモデル'");
  });

  it('preserves input presets as a protected core feature', () => {
    expect(runtimeManifest.application).toContain('input-preset');
    expect(readFile('src/index.html')).toContain('id="input-preset-popup"');
    expect(readFile('src/index.html')).toContain('id="input-preset-settings-list"');
    expect(readFile('src/index.html')).toContain('id="add-input-preset-btn"');
    const appConfig = readFile('src/app-config.ts');
    expect(appConfig).toContain("label: '続'");
    expect(appConfig).toContain("label: '展'");
    expect(appConfig).toContain("content: '（続けて）', autoSend: true");
    expect(appConfig).toContain("content: '（【今後の展開】{|}）'");
    const presetSource = readFile('src/input-preset.ts');
    expect(presetSource).toContain("const INPUT_PRESET_CURSOR_MARKER = '{|}'");
    expect(presetSource).toContain("document.createElement('textarea')");
    expect(presetSource).toContain("this.textareaResizeObserver.observe(elements.userInput)");
    expect(readFile('src/app-state.ts')).toContain('inputPresets: DEFAULT_INPUT_PRESETS');
    expect(readFile('docs/product-decisions.md')).toContain('Input presets');
  });

  it('preserves the common Dummy User prompt as a protected core feature', () => {
    const html = readFile('src/index.html');
    expect(html).toContain('id="common-dummy-user"');
    expect(html).toContain('ダミーユーザープロンプト</summary>');
    expect(html).not.toContain('Dummy User');
    expect(readFile('src/app-state.ts')).toContain("commonDummyUser: ''");
    const sending = readFile('src/message-sending.ts');
    expect(sending).toContain("role: 'user', parts: [{ text: commonDummyUser }]");
    expect(readFile('docs/product-decisions.md')).toContain('Common Dummy User prompt');
  });

  it('does not auto-close display adjustment settings', () => {
    expect(readFile('src/index.html')).not.toMatch(/auto-close-display-settings|表示の調整』を自動で閉じる/);
    expect(readFile('src/app-state.ts')).not.toContain('autoCloseDisplaySettings');
    expect(readFile('src/ui-settings.ts')).not.toContain('autoCloseDisplaySettings');
    expect(readFile('src/database.ts')).toContain('autoCloseOtherSettings|autoCloseDisplaySettings');
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

  it('uses the current release date as the application version', () => {
    expect(readFile('src/app-config.ts')).toContain('const APP_VERSION = "2026.07.15-fronoske"');
  });

  it('pre-caches only public runtime files', () => {
    const serviceWorker = readFile('sw.js');
    for (const filename of ['./index.html', './manifest.json', './marked.js', './icon-192x192.png']) {
      expect(serviceWorker).toContain(`'${filename}'`);
    }
    expect(serviceWorker).not.toContain("'./src/");
  });

  it('updates the app without a pre-clear confirmation dialog', () => {
    const dataManagement = readFile('src/data-management.ts');
    const updateApp = dataManagement.slice(
      dataManagement.indexOf('async updateApp()'),
      dataManagement.indexOf('async confirmClearAllData()'),
    );
    expect(updateApp).not.toContain('showCustomConfirm');
    expect(updateApp).toContain("postMessage({ action: 'clearCache' })");
  });
});
