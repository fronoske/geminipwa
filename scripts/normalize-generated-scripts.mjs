import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.resolve(projectRoot, process.argv[2] ?? '.build/runtime');
const manifest = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'scripts/runtime-scripts.json'), 'utf8'),
);
const scripts = [...manifest.early, ...manifest.application].map((name) => `${name}.js`);

for (const filename of scripts) {
  const scriptPath = path.join(outputDirectory, filename);
  const source = fs.readFileSync(scriptPath, 'utf8');
  const normalized = source
    .replace(/^"use strict";\r?\n/, '')
    .replace(/[ \t]+$/gm, '');
  fs.writeFileSync(scriptPath, normalized);
}
