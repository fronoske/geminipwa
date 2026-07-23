const readArgument = (name) => process.argv
  .find((argument) => argument.startsWith(`--${name}=`))
  ?.slice(name.length + 3);
const DEVTOOLS_URL = readArgument('devtools-url') || 'http://127.0.0.1:9222';
const APP_URL = readArgument('app-url') || 'http://127.0.0.1:5173/index.html?audit=lorebook';
const closeBrowser = process.argv.includes('--close-browser');
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const targets = await fetch(`${DEVTOOLS_URL}/json`).then((response) => response.json());
const page = targets.find((target) => target.type === 'page');
if (!page?.webSocketDebuggerUrl) throw new Error(`Chromeの検査対象ページが見つかりません: ${DEVTOOLS_URL}`);

const socket = new WebSocket(page.webSocketDebuggerUrl);
let requestId = 0;
const pending = new Map();
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++requestId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(JSON.stringify(message.error)));
  else request.resolve(message.result);
});
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

if (closeBrowser) {
  socket.send(JSON.stringify({ id: ++requestId, method: 'Browser.close' }));
  await delay(300);
  socket.close();
  process.exit(0);
}

try {
  await call('Network.enable');
  await call('Network.setBypassServiceWorker', { bypass: true });
  await call('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await call('Page.navigate', { url: APP_URL });
  await delay(1800);

  const expression = `(async () => {
    const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const result = { errors: [] };
    window.addEventListener('error', (event) => result.errors.push(event.message));
    window.addEventListener('unhandledrejection', (event) => result.errors.push(String(event.reason)));

    uiUtils.showScreen('settings');
    await delay(400);
    result.topLevelVisible = document.querySelector('#settings-group-lorebooks')?.open === true;
    result.initialRows = document.querySelectorAll('.lorebook-management-item').length;
    result.managementRowsCompact = [...document.querySelectorAll('.lorebook-management-item')]
      .every((row) => row.getBoundingClientRect().height < 160);
    const storedLorebookItems = await dbUtils.getAllLorebookRecords();
    result.seededRecordsStored = BUILTIN_LOREBOOKS.every((lorebook) =>
      storedLorebookItems.some((item) => item.id === lorebook.id && item.lorebook?.id === lorebook.id));
    result.seededRecordsUnified = [...document.querySelectorAll('.lorebook-management-item')].every((row) => {
      const labels = [...row.querySelectorAll('button')].map((button) => button.textContent);
      return labels.includes('編集') && labels.includes('削除') && !row.textContent.includes('組み込み');
    });
    document.querySelector('#add-lorebook-btn').click();
    await delay(400);
    result.editorActive = state.currentScreen === 'lorebook-editor'
      && document.querySelector('#lorebook-editor-screen').classList.contains('active');
    result.analyzeInitiallyDisabled = document.querySelector('#analyze-lorebook-btn').disabled;
    result.logInitiallyClosed = !document.querySelector('#lorebook-analysis-log-dialog').open;
    document.querySelector('#toggle-lorebook-analysis-log-btn').click();
    const logDialogRect = document.querySelector('#lorebook-analysis-log-dialog').getBoundingClientRect();
    result.logShownFullScreen = document.querySelector('#lorebook-analysis-log-dialog').open
      && logDialogRect.width >= innerWidth - 1
      && logDialogRect.height >= innerHeight - 1
      && document.querySelector('#toggle-lorebook-analysis-log-btn').getAttribute('aria-expanded') === 'true';
    document.querySelector('#close-lorebook-analysis-log-btn').click();
    result.logClosedByX = !document.querySelector('#lorebook-analysis-log-dialog').open;

    const source = document.querySelector('#lorebook-source-textarea');
    source.value = '既存の設定情報';
    source.dispatchEvent(new Event('input', { bubbles: true }));
    result.analyzeEnabledAfterInput = !document.querySelector('#analyze-lorebook-btn').disabled;

    let abortCalled = false;
    lorebookManager.isAnalyzing = true;
    lorebookManager.analysisCancelRequested = false;
    state.abortController = { abort: () => { abortCalled = true; } };
    lorebookManager.updateEditorState();
    document.querySelector('#analyze-lorebook-btn').click();
    result.cancelButtonAborts = abortCalled
      && lorebookManager.analysisCancelRequested
      && document.querySelector('#analyze-lorebook-btn').textContent === '中断中…';
    lorebookManager.isAnalyzing = false;
    lorebookManager.analysisCancelRequested = false;
    state.abortController = null;
    lorebookManager.updateEditorState();
    lorebookManager.resetAnalysisLog({ hide: false });

    const overwritePromise = lorebookManager.loadSourceFile({
      name: 'replacement.md',
      size: 16,
      text: async () => '置換後の設定情報',
    });
    await delay(50);
    result.overwriteWarningShown = document.querySelector('#confirmDialog').open;
    document.querySelector('#confirmDialog .dialog-cancel-btn').click();
    await overwritePromise;
    result.cancelPreservesSource = source.value === '既存の設定情報';

    const candidate = {
      lorebook: {
        name: 'ブラウザ監査Lorebook',
        description: '管理画面の監査用',
        storyCore: '監査用の学校を舞台に、現在の会話を優先する。',
        styleGuide: {
          narration: ['三人称一元視点で描く'],
          dialogue: ['会話の間を大切にする'],
          formatting: ['台詞は鉤括弧で表記する'],
          avoid: ['設定を列挙しない'],
        },
        characters: [
          { id: 'audit-a', name: '監査A', aliases: ['監査A', 'A'], core: '監査Aは女子高校生。' },
          { id: 'audit-b', name: '監査B', aliases: ['監査B', 'B'], core: '監査Bは男子高校生。' },
        ],
        addressing: {
          instruction: '個別呼称を優先し、逆方向へ推測しない。',
          exactRules: [{ speakerId: 'audit-a', targetId: 'audit-b', forms: [{ context: 'spoken', value: 'Bくん' }] }],
          fallbackRules: [],
        },
        conditionalMemories: [{ id: 'audit-memory', allCharacters: ['audit-a', 'audit-b'], priority: 80, content: '二人は幼なじみ。' }],
      },
      reviewReport: {
        warnings: [], unresolvedQuestions: [], sourceAddressingCount: 1, structuredAddressingCount: 1,
      },
    };
    let analysisCalls = 0;
    apiUtils.requestCurrentProviderText = async () => {
      analysisCalls += 1;
      return { text: JSON.stringify(candidate), provider: 'browser-audit', model: 'mock-model' };
    };
    document.querySelector('#analyze-lorebook-btn').click();
    for (let index = 0; index < 50 && !document.querySelector('#lorebookAnalysisDialog').open; index += 1) {
      await delay(20);
    }
    result.analysisCalls = analysisCalls;
    result.analysisDialogShown = document.querySelector('#lorebookAnalysisDialog').open;
    result.analysisReport = document.querySelector('#lorebook-analysis-report').textContent.trim();
    const communicationLog = document.querySelector('#lorebook-analysis-log').textContent;
    result.logContainsStages = communicationLog.includes('抽出・構造化 — 送信')
      && communicationLog.includes('抽出・構造化 — 受信')
      && communicationLog.includes('原文照合 — 送信')
      && communicationLog.includes('原文照合 — 受信')
      && communicationLog.includes('[SYSTEM]')
      && communicationLog.includes('[USER]');
    result.logOmitsSourceText = communicationLog.includes('"sourceText":"(省略)"')
      && !communicationLog.includes('"sourceText":"既存の設定情報"');
    document.querySelector('#lorebook-analysis-save-btn').click();
    for (let index = 0; index < 50 && !document.querySelector('#alertDialog').open; index += 1) {
      await delay(20);
    }
    result.savedAlertShown = document.querySelector('#alertDialog').open;
    document.querySelector('#alertDialog .dialog-ok-btn').click();
    await delay(500);
    result.savedRecordCount = state.lorebookRecords.length;
    result.savedName = state.lorebookRecords.find((record) => record.lorebook.name === 'ブラウザ監査Lorebook')?.lorebook?.name || null;
    result.savedSource = state.lorebookRecords.find((record) => record.lorebook.name === 'ブラウザ監査Lorebook')?.sourceText || null;
    const savedLorebookRecord = state.lorebookRecords.find((record) => record.lorebook.name === 'ブラウザ監査Lorebook');
    const savedLorebookPrompt = lorebookUtils.buildPrompt(savedLorebookRecord?.id, [], '');
    result.styleGuideSavedAndInjected = savedLorebookRecord?.lorebook?.styleGuide?.narration?.[0] === '三人称一元視点で描く'
      && savedLorebookPrompt.includes('【文体・スタイル（常時適用）】')
      && savedLorebookPrompt.includes('設定を列挙しない');
    result.selectorContainsSaved = lorebookUtils.getAvailableLorebooks()
      .some((lorebook) => lorebook.name === 'ブラウザ監査Lorebook');
    result.settingsListContainsSaved = [...document.querySelectorAll('.lorebook-management-item')]
      .some((row) => row.textContent.includes('ブラウザ監査Lorebook'));

    const savedRow = [...document.querySelectorAll('.lorebook-management-item')]
      .find((row) => row.textContent.includes('ブラウザ監査Lorebook'));
    [...savedRow.querySelectorAll('button')].find((button) => button.textContent === '編集').click();
    await delay(400);
    const structuredTextarea = document.querySelector('#lorebook-source-textarea');
    const structuredLorebook = JSON.parse(structuredTextarea.value);
    result.structuredEditMode = lorebookManager.editorState?.mode === 'structured'
      && structuredLorebook.name === 'ブラウザ監査Lorebook'
      && document.querySelector('#analyze-lorebook-btn').textContent === '保存'
      && document.querySelector('#lorebook-editor-provider-row').classList.contains('hidden')
      && document.querySelector('#lorebook-editor-file-actions').classList.contains('hidden')
      && document.querySelector('#toggle-lorebook-analysis-log-btn').classList.contains('hidden');
    structuredLorebook.description = '構造化データを直接編集済み';
    structuredTextarea.value = JSON.stringify(structuredLorebook, null, 2);
    structuredTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#analyze-lorebook-btn').click();
    for (let index = 0; index < 50 && !document.querySelector('#alertDialog').open; index += 1) {
      await delay(20);
    }
    document.querySelector('#alertDialog .dialog-ok-btn').click();
    await delay(500);
    const editedRecord = state.lorebookRecords.find((record) => record.lorebook.name === 'ブラウザ監査Lorebook');
    result.structuredEditSavedWithoutLlm = editedRecord?.lorebook?.description === '構造化データを直接編集済み'
      && editedRecord?.sourceText === '既存の設定情報'
      && analysisCalls === 2;
    return JSON.stringify(result);
  })()`;

  const response = await call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.result.subtype === 'error') {
    throw new Error(response.result.description || 'Lorebookブラウザ監査に失敗しました');
  }
  console.log(JSON.stringify(JSON.parse(response.result.value), null, 2));
} finally {
  socket.close();
}
