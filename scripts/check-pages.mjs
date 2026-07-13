import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = ['index.html', 'manifest.json', 'sw.js', 'marked.js', 'icon-192x192.png'];
const failures = [];

for (const filename of requiredFiles) {
  if (!fs.existsSync(path.join(projectRoot, filename))) {
    failures.push(`GitHub Pages公開ファイルがありません: ${filename}`);
  }
}

if (failures.length === 0) {
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

  if (/\b(?:src|href)=["']src\//.test(html)) {
    failures.push('index.htmlにsrc配下への外部参照が残っています');
  }
  if (!html.includes('<style>')) failures.push('CSSがindex.htmlにインライン化されていません');
  if (!html.includes('/* source: main.ts */')) {
    failures.push('TypeScriptランタイムがindex.htmlにバンドルされていません');
  }
  if (!html.includes("navigator.serviceWorker.register('./sw.js')")) {
    failures.push('Service Worker登録処理がindex.htmlにありません');
  }

  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const [index, match] of [...html.matchAll(scriptPattern)].entries()) {
    if (/\bsrc=["'][^"']+["']/i.test(match[1]) || !match[2].trim()) continue;
    try {
      new vm.Script(match[2], { filename: `index.html:inline-script-${index + 1}` });
    } catch (error) {
      failures.push(`index.htmlの構文エラー: ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error('GitHub Pages公開物の検査に失敗しました:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`GitHub Pages公開物の検査に成功しました（${requiredFiles.length}ファイル）`);
