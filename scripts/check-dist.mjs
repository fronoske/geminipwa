import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(projectRoot, 'dist');
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
const failures = [];

for (const filename of requiredFiles) {
  if (!fs.existsSync(path.join(distDirectory, filename))) {
    failures.push(`生成物がありません: dist/${filename}`);
  }
}

if (failures.length === 0) {
  const html = fs.readFileSync(path.join(distDirectory, 'index.html'), 'utf8');
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  for (const [index, match] of [...html.matchAll(scriptPattern)].entries()) {
    if (/\bsrc=["'][^"']+["']/i.test(match[1]) || !match[2].trim()) continue;
    try {
      new vm.Script(match[2], { filename: `dist/index.html:inline-script-${index + 1}` });
    } catch (error) {
      failures.push(`dist/index.htmlの構文エラー: ${error.message}`);
    }
  }

  const requiredReferences = [
    'manifest.json',
    'marked.js',
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
  for (const reference of requiredReferences) {
    if (!html.includes(reference)) failures.push(`dist/index.htmlに参照がありません: ${reference}`);
  }

  const mainScript = fs.readFileSync(path.join(distDirectory, 'src/main.js'), 'utf8');
  if (!mainScript.includes('./sw.js')) {
    failures.push('dist/src/main.jsにService Worker登録先の参照がありません: ./sw.js');
  }

  for (const filename of requiredFiles.filter((filename) => filename.endsWith('.js'))) {
    try {
      new vm.Script(fs.readFileSync(path.join(distDirectory, filename), 'utf8'), { filename });
    } catch (error) {
      failures.push(`dist/${filename}の構文エラー: ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error('生成物の検査に失敗しました:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`生成物の検査に成功しました（${requiredFiles.length}ファイル）`);
