import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generatedDirectory = path.join(projectRoot, '.build/runtime');
const manifest = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'scripts/runtime-scripts.json'), 'utf8'),
);
const scripts = [...manifest.early, ...manifest.application].map((name) => `${name}.js`);
const failures = [];

for (const filename of scripts) {
  const generatedPath = path.join(generatedDirectory, filename);

  if (!fs.existsSync(generatedPath)) {
    failures.push(`TypeScript生成物がありません: ${generatedPath}`);
    continue;
  }

  try {
    new vm.Script(fs.readFileSync(generatedPath, 'utf8'), { filename });
  } catch (error) {
    failures.push(`TypeScript生成物の構文エラー: ${filename}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error('TypeScript生成物の検査に失敗しました:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`TypeScript生成物の検査に成功しました（${scripts.length}ファイル）`);
