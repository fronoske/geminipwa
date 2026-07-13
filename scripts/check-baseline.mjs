import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readProjectFile = (filename) => fs.readFileSync(path.join(projectRoot, filename), 'utf8');

const html = readProjectFile('index.html');
const serviceWorker = readProjectFile('sw.js');
const manifest = JSON.parse(readProjectFile('manifest.json'));
const baseline = JSON.parse(readProjectFile('scripts/baseline.json'));
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const inlineScripts = [];
const externalScripts = [];
const externalStylesheets = [
  ...html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi),
].map((match) => match[1]);

for (const match of html.matchAll(scriptPattern)) {
  const attributes = match[1];
  const sourceMatch = attributes.match(/\bsrc=["']([^"']+)["']/i);
  if (sourceMatch) {
    externalScripts.push(sourceMatch[1]);
    continue;
  }

  if (match[2].trim()) inlineScripts.push(match[2]);
}

inlineScripts.forEach((source, index) => {
  try {
    new vm.Script(source, { filename: `index.html:inline-script-${index + 1}` });
  } catch (error) {
    failures.push(`インラインスクリプト${index + 1}の構文エラー: ${error.message}`);
  }
});

const htmlMarkup = html.replace(scriptPattern, '');
const ids = [...htmlMarkup.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
const idCounts = Object.fromEntries(
  [...new Set(ids)].map((id) => [id, ids.filter((candidate) => candidate === id).length]),
);
const duplicateIdCounts = Object.fromEntries(
  Object.entries(idCounts).filter(([, count]) => count > 1),
);
assert(
  JSON.stringify(duplicateIdCounts) === JSON.stringify(baseline.duplicateIdCounts),
  '既知の重複DOM ID構成が変化しました。意図した変更ならbaseline.jsonも更新してください',
);

const requiredIds = [
  'chat-screen',
  'history-screen',
  'settings-screen',
  'message-container',
  'user-input',
  'send-button',
  'app-version',
];
for (const id of requiredIds) {
  assert(ids.includes(id), `必須DOM IDがありません: ${id}`);
}

const localReferences = [
  manifest.start_url,
  ...manifest.icons.map((icon) => icon.src),
  ...externalScripts.filter((source) => !/^https?:\/\//i.test(source)),
  ...externalStylesheets.filter((source) => !/^https?:\/\//i.test(source)),
  'manifest.json',
  'sw.js',
];
for (const reference of new Set(localReferences)) {
  const relativePath = reference.replace(/^\.\//, '');
  assert(fs.existsSync(path.join(projectRoot, relativePath)), `参照先ファイルがありません: ${reference}`);
}

const localJavaScriptFiles = externalScripts
  .filter((source) => !/^https?:\/\//i.test(source) && source.endsWith('.js'))
  .map((source) => source.replace(/^\.\//, ''));
for (const filename of localJavaScriptFiles) {
  try {
    new vm.Script(readProjectFile(filename), { filename });
  } catch (error) {
    failures.push(`${filename}の構文エラー: ${error.message}`);
  }
}

const cacheEntriesMatch = serviceWorker.match(/const urlsToCache\s*=\s*\[([\s\S]*?)\];/);
assert(cacheEntriesMatch, 'Service WorkerのurlsToCacheを検出できません');
if (cacheEntriesMatch) {
  const cacheEntries = [...cacheEntriesMatch[1].matchAll(/["'](\.\/[^"']*)["']/g)].map(
    (match) => match[1],
  );
  for (const entry of cacheEntries) {
    if (entry === './') continue;
    assert(
      fs.existsSync(path.join(projectRoot, entry.replace(/^\.\//, ''))),
      `Service Workerのキャッシュ対象がありません: ${entry}`,
    );
  }
}

const applicationSource = [html, ...localJavaScriptFiles.map(readProjectFile)].join('\n');
const dbName = applicationSource.match(/const DB_NAME\s*=\s*["']([^"']+)["']/)?.[1];
const dbVersion = applicationSource.match(/const DB_VERSION\s*=\s*(\d+)/)?.[1];
const appVersion = applicationSource.match(/const APP_VERSION\s*=\s*["']([^"']+)["']/)?.[1];
assert(dbName === 'GeminiPWA_DB', `IndexedDB名が想定外です: ${dbName ?? '未検出'}`);
assert(dbVersion, 'IndexedDBバージョンを検出できません');
assert(appVersion, 'アプリバージョンを検出できません');

if (failures.length > 0) {
  console.error('ベースライン検査に失敗しました:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('ベースライン検査に成功しました');
console.log(`- HTML: ${html.split('\n').length}行 / ${Buffer.byteLength(html)} bytes`);
console.log(`- インラインスクリプト: ${inlineScripts.length}`);
console.log(`- 外部スクリプト: ${externalScripts.length}`);
console.log(`- 構文検査済みローカルスクリプト: ${localJavaScriptFiles.length}`);
console.log(`- 外部スタイルシート: ${externalStylesheets.length}`);
console.log(`- DOM ID: ${ids.length}（既知の重複ID ${Object.keys(duplicateIdCounts).length}件）`);
console.log(`- IndexedDB: ${dbName} / version ${dbVersion}`);
console.log(`- APP_VERSION: ${appVersion}`);
