import assert from 'node:assert/strict';
import { CdpClient } from './cdp-client.mjs';

const cdpPort = Number(process.argv[2] ?? 9222);
const appPort = Number(process.argv[3] ?? 4173);
const origin = `http://127.0.0.1:${appPort}`;

async function openPage(url) {
  const response = await fetch(
    `http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(url)}`,
    { method: 'PUT' },
  );
  if (!response.ok) throw new Error(`Cannot create Chrome target: ${response.status}`);
  const target = await response.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await Promise.all([
    client.send('Page.enable'),
    client.send('Runtime.enable'),
    client.send('Log.enable'),
    client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    }),
  ]);
  return { client, target };
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitFor(client, expression, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if (await evaluate(client, expression)) return;
    } catch (error) {
      if (!error.message.includes('Execution context was destroyed')) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function captureVariant(variant) {
  const { client, target } = await openPage('about:blank');
  const errors = [];
  client.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    errors.push(exceptionDetails.exception?.description ?? exceptionDetails.text);
  });
  client.on('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error') errors.push(entry.text);
  });

  await client.send('Storage.clearDataForOrigin', {
    origin,
    storageTypes: 'all',
  });
  const loaded = client.once('Page.loadEventFired');
  await client.send('Page.navigate', { url: `${origin}/${variant}/index.html` });
  await loaded;
  await waitFor(
    client,
    `typeof state !== 'undefined' && state.db !== null && history.state?.screen === 'chat'`,
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  const snapshot = await evaluate(
    client,
    `(async () => {
      const visible = (element) => element && getComputedStyle(element).display !== 'none';
      const waitUntil = async (condition, timeoutMs = 5000) => {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          if (condition()) return;
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        throw new Error('Browser audit condition timed out');
      };
      const summarizeScreen = () => ({
        activeScreen: document.querySelector('.screen.active')?.id ?? null,
        title: document.title,
        appVersion: document.getElementById('app-version')?.textContent ?? null,
        headerButtons: [...document.querySelectorAll('.app-header button')].map((button) => ({
          id: button.id,
          text: button.textContent.trim(),
          display: getComputedStyle(button).display,
        })),
        messageCount: document.querySelectorAll('#message-container .message').length,
        bodyClasses: [...document.body.classList].sort(),
      });

      const result = { initial: summarizeScreen() };
      document.getElementById('goto-history-btn')?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      result.history = summarizeScreen();
      document.getElementById('goto-settings-btn')?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      result.settings = {
        ...summarizeScreen(),
        provider: document.getElementById('api-provider-select')?.value ?? null,
        model: document.getElementById('gemini-model-name')?.value ?? null,
        controlCount: document.querySelectorAll('#settings-screen input, #settings-screen select, #settings-screen textarea').length,
      };

      const themeSelect = document.getElementById('theme-select');
      themeSelect.value = 'dark';
      themeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      const providerSelect = document.getElementById('api-provider-select');
      providerSelect.value = 'dummy';
      providerSelect.dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('user-name-input').value = '監査ユーザー';
      document.getElementById('dummy-dummy-model').value = '監査応答';
      document.getElementById('dummy-enable-dummy-model').checked = true;
      document.getElementById('disable-save-settings-confirmation-toggle').checked = true;
      document.querySelector('#settings-screen .js-save-settings-btn').click();
      await waitUntil(() => state.settings.userName === '監査ユーザー');
      const persistedUserName = await new Promise((resolve, reject) => {
        const request = state.db.transaction([SETTINGS_STORE], 'readonly')
          .objectStore(SETTINGS_STORE)
          .get('userName');
        request.onsuccess = () => resolve(request.result?.value ?? null);
        request.onerror = () => reject(request.error);
      });
      result.settingsMutation = {
        theme: state.settings.theme,
        provider: state.settings.apiProvider,
        userName: state.settings.userName,
        persistedUserName,
        darkMode: document.body.classList.contains('dark-mode'),
      };

      document.getElementById('back-to-chat-from-settings')?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (document.querySelector('.screen.active')?.id === 'history-screen') {
        document.getElementById('back-to-chat-from-history')?.click();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      const input = document.getElementById('user-input');
      input.value = '';
      input.blur();
      input.dispatchEvent(new FocusEvent('focus'));
      await new Promise((resolve) => setTimeout(resolve, 50));
      const popup = document.getElementById('input-preset-popup');
      result.inputPreset = {
        visible: visible(popup),
        labels: [...popup.querySelectorAll('button')].map((button) => button.textContent),
      };
      popup.querySelectorAll('button')[1].click();
      await new Promise((resolve) => setTimeout(resolve, 25));
      result.inputPreset.insertedValue = input.value;
      result.inputPreset.cursor = input.selectionStart;
      result.inputPreset.hiddenAfterInsert = !visible(popup);

      input.value = '監査メッセージ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('send-button').click();
      await waitUntil(() => !state.isSending && state.currentMessages.length === 2);
      result.chatRoundTrip = {
        messages: state.currentMessages.map((message) => ({
          role: message.role,
          content: message.content,
          generatedByApiProvider: message.generatedByApiProvider ?? null,
        })),
        renderedMessages: [...document.querySelectorAll('#message-container .message')].map((message) => ({
          role: message.classList.contains('user') ? 'user' : 'model',
          text: message.querySelector('.message-content')?.textContent.trim() ?? '',
        })),
        title: document.getElementById('chat-title')?.textContent ?? null,
      };

      document.getElementById('goto-history-btn').click();
      await waitUntil(() => document.querySelectorAll('#history-list .history-item:not(.js-history-item-template)').length === 1);
      const historyItems = () => [...document.querySelectorAll('#history-list .history-item:not(.js-history-item-template)')];
      result.savedHistory = historyItems().map((item) => item.querySelector('.history-item-title')?.textContent ?? '');
      historyItems()[0].querySelector('.js-duplicate-btn').click();
      await waitUntil(() => historyItems().length === 2);
      result.duplicatedHistory = historyItems().map((item) => item.querySelector('.history-item-title')?.textContent ?? '').sort();
      historyItems()[0].querySelector('.js-delete-btn').click();
      await waitUntil(() => document.getElementById('confirmDialog').open);
      document.getElementById('confirmDialog').querySelector('.dialog-ok-btn').click();
      await waitUntil(() => historyItems().length === 1);
      result.historyAfterDelete = historyItems().map((item) => item.querySelector('.history-item-title')?.textContent ?? '');

      result.final = summarizeScreen();
      result.contract = {
        dbName: DB_NAME,
        dbVersion: DB_VERSION,
        settingsStores: [SETTINGS_STORE, CHATS_STORE],
        providerValues: API_PROVIDERS.map(({ value }) => value),
        stateSettingKeys: Object.keys(state.settings).sort(),
      };
      return result;
    })()`,
  );

  const reloaded = client.once('Page.loadEventFired');
  await client.send('Page.reload', { ignoreCache: false });
  await reloaded;
  await waitFor(
    client,
    `typeof state !== 'undefined' && state.db !== null && history.state?.screen === 'chat'`,
  );
  await new Promise((resolve) => setTimeout(resolve, 250));
  snapshot.afterReload = await evaluate(
    client,
    `(async () => ({
        screen: document.querySelector('.screen.active')?.id ?? null,
        theme: state.settings.theme,
        provider: state.settings.apiProvider,
        userName: state.settings.userName,
        messages: state.currentMessages.map((message) => ({
          role: message.role,
          content: message.content,
          generatedByApiProvider: message.generatedByApiProvider ?? null,
        })),
        historyCount: await dbUtils.getAllChats().then((chats) => chats.length),
      }))()`,
  );

  const registration = await evaluate(
    client,
    `(async () => {
      const registration = await navigator.serviceWorker.ready;
      return {
        activeState: registration.active?.state ?? null,
        controlled: Boolean(navigator.serviceWorker.controller),
        cachedIndexStatus: (await caches.match('./index.html'))?.status ?? null,
      };
    })()`,
  );
  snapshot.pwa = registration;

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
  snapshot.mobile = await evaluate(
    client,
    `(() => {
      const rect = (selector) => {
        const bounds = document.querySelector(selector).getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      };
      return {
        viewport: [innerWidth, innerHeight],
        activeScreen: document.querySelector('.screen.active')?.id ?? null,
        app: rect('.app-container'),
        header: rect('#chat-screen .app-header'),
        inputArea: rect('.chat-input-area'),
        messageMaxWidth: getComputedStyle(document.documentElement).getPropertyValue('--message-max-width'),
      };
    })()`,
  );

  await fetch(`http://127.0.0.1:${cdpPort}/json/close/${target.id}`);
  client.close();
  return { errors, snapshot };
}

const baseline = await captureVariant('baseline');
const generated = await captureVariant('current');

assert.deepEqual(generated.snapshot, baseline.snapshot);
assert.deepEqual(generated.errors, baseline.errors);
console.log('Browser equivalence audit passed');
console.log(JSON.stringify({
  activeScreens: [generated.snapshot.initial.activeScreen, generated.snapshot.history.activeScreen, generated.snapshot.settings.activeScreen],
  settingsMutation: generated.snapshot.settingsMutation,
  inputPreset: generated.snapshot.inputPreset,
  chatRoundTrip: generated.snapshot.chatRoundTrip,
  savedHistory: generated.snapshot.savedHistory,
  duplicatedHistory: generated.snapshot.duplicatedHistory,
  historyAfterDelete: generated.snapshot.historyAfterDelete,
  afterReload: generated.snapshot.afterReload,
  pwa: generated.snapshot.pwa,
  mobile: generated.snapshot.mobile,
}, null, 2));
if (generated.errors.length) console.log('Shared browser errors:', generated.errors);
