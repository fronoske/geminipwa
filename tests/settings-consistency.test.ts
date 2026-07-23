import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '..');
const readFile = (filename: string): string =>
  fs.readFileSync(path.join(projectRoot, filename), 'utf8');
const readRuntime = (name: string): string => readFile(`.build/runtime/${name}.js`);

describe('settings behavior consistency', () => {
  it('places the AI-response auto-scroll limit under its parent and applies it to every response mode', () => {
    const html = readFile('src/index.html');
    const parentIndex = html.indexOf('id="auto-scroll-on-new-message"');
    const childIndex = html.indexOf('id="auto-scroll-response-character-limit"');
    const nextSiblingSettingIndex = html.indexOf('id="header-tap-scroll-to-top-toggle"');
    const streamingTools = readFile('src/ui-message-tools.ts');
    const sending = readFile('src/message-sending.ts');

    expect(parentIndex).toBeGreaterThan(-1);
    expect(childIndex).toBeGreaterThan(parentIndex);
    expect(childIndex).toBeLessThan(nextSiblingSettingIndex);
    expect(html).toContain('min="-1" step="1" value="-1"');
    expect(streamingTools).toContain('shouldAutoScrollResponseBody(\n                        state.partialStreamContent');
    expect(streamingTools).toContain('shouldAutoScrollResponseBody(\n                    finalResponseContent');
    expect(streamingTools).not.toMatch(/textContent\?\.length < 200/);
    expect(sending).toContain('shouldAutoScrollResponseBody(\n                                        msgToUpdate.content');
  });

  it('does not claim that the common system prompt overrides provider prompts', () => {
    const html = readFile('src/index.html');
    expect(html).toContain('API共通プロンプト</summary>');
    expect(html).toContain('placeholder="例: あなたは優秀なアシスタントです。"');
    expect(html).toContain('この共通システムプロンプトを有効にする (ただしAPI別システムプロンプトが常に優先されます)');
    expect(html).not.toMatch(/APIごとの設定より優先されます|API別システムプロンプトより優先度低/);
  });

  it('uses the attachment confirmation setting and provides every attachment action', async () => {
    const confirm = vi.fn().mockResolvedValue(false);
    const render = vi.fn();
    const save = vi.fn().mockResolvedValue(undefined);
    const context = vm.createContext({
      appLogic: {},
      state: {
        settings: { disableAttachmentConfirmation: false },
        currentMessages: [{ attachments: [{ name: 'sample.txt' }] }],
      },
      uiUtils: {
        showCustomConfirm: confirm,
        showCustomAlert: vi.fn(),
        renderChatMessages: render,
      },
      dbUtils: { saveChat: save },
    });
    new vm.Script(readRuntime('message-actions')).runInContext(context);

    const methodNames = new vm.Script(
      "['removeAttachment', 'editAttachment', 'addMoreAttachments', 'previewAttachment'].filter(name => typeof appLogic[name] === 'function')",
    ).runInContext(context);
    expect(Array.from(methodNames)).toEqual([
      'removeAttachment',
      'editAttachment',
      'addMoreAttachments',
      'previewAttachment',
    ]);

    await new vm.Script('appLogic.removeAttachment(0, 0)').runInContext(context);
    expect(confirm).toHaveBeenCalledOnce();
    expect(new vm.Script('state.currentMessages[0].attachments.length').runInContext(context)).toBe(1);
    expect(save).not.toHaveBeenCalled();

    new vm.Script('state.settings.disableAttachmentConfirmation = true').runInContext(context);
    await new vm.Script('appLogic.removeAttachment(0, 0)').runInContext(context);
    expect(confirm).toHaveBeenCalledOnce();
    expect(new vm.Script('state.currentMessages[0].attachments.length').runInContext(context)).toBe(0);
    expect(render).toHaveBeenCalledWith(true);
    expect(save).toHaveBeenCalledOnce();
  });

  it('treats API-key deletion confirmation identically for providers and aggregator backends', async () => {
    const providerConfirm = vi.fn().mockResolvedValue(false);
    const providerContext = vm.createContext({
      state: {
        settings: {
          disableDeleteApiKeyConfirmation: true,
          geminiApiKeys: [{ id: 'key-1', label: 'キー 1', value: 'secret', isActive: false }],
        },
      },
      uiUtils: { showCustomConfirm: providerConfirm, updateApiKeyCycleButtons: vi.fn() },
    });
    new vm.Script(readRuntime('api-key-manager')).runInContext(providerContext);
    new vm.Script(
      'multiApiKeyUtils.renderApiKeyList = () => {}; multiApiKeyUtils.updateMainApiKeyInput = () => {};',
    ).runInContext(providerContext);
    await new vm.Script("multiApiKeyUtils.deleteApiKey('gemini', 'key-1')").runInContext(providerContext);

    const backendConfirm = vi.fn().mockResolvedValue(false);
    const backendContext = vm.createContext({
      state: {
        settings: {
          disableDeleteApiKeyConfirmation: true,
          llmaggregatorBackends: [{
            id: 'backend-1',
            apiKeys: [{ id: 'key-1', label: 'キー 1', value: 'secret', isActive: false }],
          }],
        },
      },
      uiUtils: { showCustomConfirm: backendConfirm, updateApiKeyCycleButtons: vi.fn() },
      document: { querySelector: vi.fn(() => null) },
    });
    new vm.Script(readRuntime('backend-manager')).runInContext(backendContext);
    new vm.Script(
      'multiBackendUtils.renderApiKeysForBackend = () => {}; multiBackendUtils.updateMainBackendInput = () => {};',
    ).runInContext(backendContext);
    await new vm.Script("multiBackendUtils.deleteApiKeyFromBackend('backend-1', 'key-1')").runInContext(backendContext);

    expect(providerConfirm).toHaveBeenCalledOnce();
    expect(backendConfirm).toHaveBeenCalledOnce();
    expect(new vm.Script('state.settings.geminiApiKeys.length').runInContext(providerContext)).toBe(1);
    expect(new vm.Script('state.settings.llmaggregatorBackends[0].apiKeys.length').runInContext(backendContext)).toBe(1);

    new vm.Script('state.settings.disableDeleteApiKeyConfirmation = false').runInContext(providerContext);
    new vm.Script('state.settings.disableDeleteApiKeyConfirmation = false').runInContext(backendContext);
    await new vm.Script("multiApiKeyUtils.deleteApiKey('gemini', 'key-1')").runInContext(providerContext);
    await new vm.Script("multiBackendUtils.deleteApiKeyFromBackend('backend-1', 'key-1')").runInContext(backendContext);

    expect(providerConfirm).toHaveBeenCalledOnce();
    expect(backendConfirm).toHaveBeenCalledOnce();
    expect(new vm.Script('state.settings.geminiApiKeys.length').runInContext(providerContext)).toBe(0);
    expect(new vm.Script('state.settings.llmaggregatorBackends[0].apiKeys.length').runInContext(backendContext)).toBe(0);
  });

  it('describes duplicate prevention rather than deletion', () => {
    const html = readFile('src/index.html');
    expect(html).not.toContain('重複登録されたAPIキーを削除');
    expect(html.match(/重複するAPIキーを登録しない/g)).toHaveLength(6);
  });

  it('uses section titles that cover every setting they contain', () => {
    const html = readFile('src/index.html');
    expect(html).toContain('確認ダイアログ</summary>');
    expect(html).toContain('履歴画面</summary>');
    expect(html).toContain('ヘッダー</summary>');
    expect(html).not.toMatch(/確認ダイアログのスキップ<\/summary>|履歴画面のボタン<\/summary>|ヘッダーのボタン<\/summary>/);
  });

  it('applies the multiple API-key switch to every provider including LLM Aggregator', () => {
    const interactions = readFile('src/ui-interactions.ts');
    const settings = readFile('src/ui-settings.ts');
    expect(interactions).toContain('multiBackendUtils.toggleMultiBackendsVisibility(show)');
    expect(settings).not.toContain('multiBackendUtils.toggleMultiBackendsVisibility(true)');
  });

  it('places multiple API-key management after API provider selection', () => {
    const html = readFile('src/index.html');
    const apiSettings = html.slice(
      html.indexOf('id="settings-group-api-provider"'),
      html.indexOf('id="gemini-settings-group"'),
    );
    expect(apiSettings.indexOf('id="api-provider-cycle-settings-group"')).toBeLessThan(
      apiSettings.indexOf('id="show-multi-api-keys-toggle"'),
    );
  });

  it('registers OpenRouter as a complete independent API provider', () => {
    const html = readFile('src/index.html');
    const stateSource = readFile('src/app-state.ts');
    const sendingSource = readFile('src/message-sending.ts');
    const keyManagerSource = readFile('src/api-key-manager.ts');
    for (const id of [
      'openrouter-settings-group',
      'openrouter-params-group',
      'openrouter-advanced-group',
      'openrouter-api-key',
      'openrouter-multi-api-keys-section',
      'openrouter-model-name',
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('<option value="openrouter">OpenRouter</option>');
    expect(stateSource).toContain("openrouterModelName: DEFAULT_OPENROUTER_MODEL");
    expect(stateSource).toContain('openrouterApiKeys: []');
    expect(sendingSource).toContain("selectedApiProvider === 'openrouter'");
    expect(keyManagerSource).toContain("case 'openrouter': return state.settings.openrouterApiKeys");
    expect(readFile('src/database.ts')).toContain('const openRouterBackend = backends.find');
  });

  it('sends OpenRouter requests to its official endpoint with attribution headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    const context = vm.createContext({
      state: { abortController: null, settings: {} },
      fetch: fetchMock,
      AbortController,
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1/chat/completions',
      OPENROUTER_API_BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
    });
    new vm.Script(readRuntime('api-clients')).runInContext(context);
    await new vm.Script(`apiUtils.callOpenAICompatibleApi(
      'sk-or-test',
      'test/model',
      'openrouter',
      [{ role: 'user', parts: [{ text: 'hello' }] }],
      {},
      null,
      false,
      false
    )`).runInContext(context);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(request.headers.Authorization).toBe('Bearer sk-or-test');
    expect(request.headers['HTTP-Referer']).toBe('https://geminipwa.pages.dev/');
    expect(request.headers['X-OpenRouter-Title']).toBe('GeminiPWA');
  });

  it('explains OpenRouter rate limits using Retry-After', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: vi.fn(() => '30') },
      json: vi.fn().mockResolvedValue({
        error: { message: 'Rate limit exceeded', metadata: { error_type: 'rate_limit_exceeded' } },
      }),
    });
    const context = vm.createContext({
      state: { abortController: null, settings: {} },
      fetch: fetchMock,
      AbortController,
      OPENAI_API_BASE_URL: 'https://api.openai.com/v1/chat/completions',
      OPENROUTER_API_BASE_URL: 'https://openrouter.ai/api/v1/chat/completions',
    });
    new vm.Script(readRuntime('api-clients')).runInContext(context);
    const request = new vm.Script(`apiUtils.callOpenAICompatibleApi(
      'sk-or-test', 'test/model', 'openrouter',
      [{ role: 'user', parts: [{ text: 'hello' }] }], {}, null, false, false
    )`).runInContext(context);

    await expect(request).rejects.toThrow(
      'OpenRouterのレート上限に達しました。30秒後に再試行してください。 (rate_limit_exceeded)',
    );
  });

  it('persists every provider-specific slider upper limit', () => {
    const stateSource = readFile('src/app-state.ts');
    const saveSource = readFile('src/data-management.ts');
    const setupSource = readFile('src/event-wiring.ts');
    const restoreSource = readFile('src/ui-settings.ts');
    const sliderSettings = [
      ['deepseekMaxTokensSliderMax', 'deepseek-max-tokens'],
      ['claudeMaxTokensSliderMax', 'claude-max-tokens'],
      ['claudeTopKSliderMax', 'claude-top-k'],
      ['claudeThinkingBudgetSliderMax', 'claude-thinking-budget'],
      ['openaiMaxTokensSliderMax', 'openai-max-tokens'],
      ['openrouterMaxTokensSliderMax', 'openrouter-max-tokens'],
      ['xaiMaxTokensSliderMax', 'xai-max-tokens'],
      ['llmaggregatorMaxTokensSliderMax', 'llmaggregator-max-tokens'],
      ['llmaggregatorTopKSliderMax', 'llmaggregator-top-k'],
    ];

    for (const [settingKey, controlId] of sliderSettings) {
      expect(stateSource).toContain(`${settingKey}: null`);
      expect(saveSource).toContain(
        `newSettings.${settingKey} = getSliderMaxValue('${controlId}')`,
      );
      expect(setupSource).toContain(`'${controlId}'`);
      expect(setupSource).toContain(`'${settingKey}'`);
      expect(restoreSource).toContain(`setupParamUI('${controlId}', '${settingKey}')`);
    }
  });
});
