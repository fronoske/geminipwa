import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedDirectory = path.join(projectRoot, 'dist/generated-scripts');
const scripts = ['recovery.js', 'main.js', 'input-preset.js'];
const failures = [];

for (const filename of scripts) {
  const committedPath = path.join(projectRoot, 'src', filename);
  const generatedPath = path.join(generatedDirectory, filename);

  if (!fs.existsSync(generatedPath)) {
    failures.push(`TypeScript生成物がありません: ${generatedPath}`);
    continue;
  }

  if (fs.readFileSync(committedPath, 'utf8') !== fs.readFileSync(generatedPath, 'utf8')) {
    failures.push(`生成済みJavaScriptがTypeScriptソースと一致しません: src/${filename}`);
  }
}

if (failures.length > 0) {
  console.error('TypeScript生成物の検査に失敗しました:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error('npm run generate:scripts を実行して生成物を更新してください');
  process.exit(1);
}

console.log(`TypeScript生成物の検査に成功しました（${scripts.length}ファイル）`);
