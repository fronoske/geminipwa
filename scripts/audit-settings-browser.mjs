const DEVTOOLS_URL = process.env.DEVTOOLS_URL || 'http://127.0.0.1:9222';
const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5173/index.html?audit=settings';
const showFullReport = process.argv.includes('--full');
const closeBrowser = process.argv.includes('--close-browser');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const targets = await fetch(`${DEVTOOLS_URL}/json`).then((response) => response.json());
const page = targets.find((target) => target.type === 'page');
if (!page?.webSocketDebuggerUrl) {
  throw new Error(`Chromeの検査対象ページが見つかりません: ${DEVTOOLS_URL}`);
}

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
  await call('Page.navigate', { url: APP_URL });
  await delay(1600);

  const expression = `JSON.stringify((() => {
    const root = document.querySelector('#settings-screen');
    const main = root.querySelector('.main-content');
    const normalize = (text) => (text || '').replace(/\\s+/g, ' ').trim();
    const directHeading = (element) => [...element.children]
      .find((child) => child.matches('summary, h3'));
    const labelFor = (control) => {
      const explicit = control.id
        ? root.querySelector('label[for="' + CSS.escape(control.id) + '"]')
        : null;
      return normalize(
        (explicit || control.closest('label'))?.textContent
        || control.getAttribute('aria-label')
        || control.getAttribute('title')
        || control.getAttribute('placeholder')
        || control.textContent
      );
    };
    const directDetailsChildren = (element) => [...element.children].flatMap((child) => {
      if (child.matches('details')) return [child];
      return [...child.children].filter((grandchild) => grandchild.matches('details'));
    });
    const section = (element) => ({
      id: element.id || null,
      title: normalize(directHeading(element)?.textContent),
      hidden: element.classList.contains('hidden'),
      controls: [...element.querySelectorAll('input, select, textarea, button')]
        .filter((control) => control.closest('details.settings-group, div.settings-group, details[id]') === element)
        .map((control) => ({
          id: control.id || null,
          tag: control.tagName.toLowerCase(),
          type: control.type || null,
          label: labelFor(control),
        })),
      children: directDetailsChildren(element).map(section),
    });

    const ids = [...root.querySelectorAll('[id]')].map((element) => element.id);
    const controls = [...root.querySelectorAll('input, select, textarea, button')];
    const providers = ['gemini', 'deepseek', 'claude', 'openai', 'openrouter', 'xai', 'llmaggregator'];
    const visibleGroupsByProvider = Object.fromEntries(providers.map((provider) => {
      uiUtils.toggleApiSettingsVisibility(provider);
      const titles = [...main.querySelectorAll(':scope > .settings-group:not(.hidden)')]
        .map((element) => normalize(directHeading(element)?.textContent));
      return [provider, titles];
    }));
    const multiApiKeysToggle = root.querySelector('#show-multi-api-keys-toggle');
    multiApiKeysToggle.checked = true;
    multiApiKeysToggle.dispatchEvent(new Event('change', { bubbles: true }));
    const multiApiKeyVisibility = Object.fromEntries(
      ['gemini', 'deepseek', 'claude', 'openai', 'openrouter', 'xai', 'llmaggregator'].map((provider) => {
        const sectionId = provider === 'llmaggregator'
          ? 'llmaggregator-multi-backends-section'
          : provider + '-multi-api-keys-section';
        const element = root.querySelector('#' + sectionId);
        return [provider, {
          exists: Boolean(element),
          hiddenClass: element?.classList.contains('hidden') ?? null,
          display: element ? getComputedStyle(element).display : null,
        }];
      }),
    );

    return {
      sections: [...main.children]
        .filter((element) => element.matches('details.settings-group, div.settings-group'))
        .map(section),
      controlCount: controls.length,
      duplicateIds: [...new Set(ids.filter((value, index) => ids.indexOf(value) !== index))],
      unlabelledControls: controls
        .filter((control) => control.id && !labelFor(control) && control.type !== 'hidden')
        .map((control) => ({ id: control.id, tag: control.tagName.toLowerCase(), type: control.type })),
      selects: [...root.querySelectorAll('select[id]')].map((select) => ({
        id: select.id,
        options: [...select.options].map((option) => ({ value: option.value, label: normalize(option.textContent) })),
      })),
      visibleGroupsByProvider,
      multiApiKeyVisibility,
    };
  })())`;

  const result = await call('Runtime.evaluate', { expression, returnByValue: true });
  if (result.result.subtype === 'error') {
    throw new Error(result.result.description || 'ブラウザ監査スクリプトの評価に失敗しました');
  }
  const report = JSON.parse(result.result.value);
  const output = showFullReport ? report : {
    controlCount: report.controlCount,
    duplicateIds: report.duplicateIds,
    unlabelledControls: report.unlabelledControls,
    sectionTitles: report.sections.map(({ title, children }) => ({
      title,
      children: children.map((child) => child.title),
    })),
    visibleGroupsByProvider: report.visibleGroupsByProvider,
    multiApiKeyVisibility: report.multiApiKeyVisibility,
  };
  console.log(JSON.stringify(output, null, 2));
} finally {
  socket.close();
}
