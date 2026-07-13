import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.resolve(projectRoot, process.argv[2] ?? 'src');
const scripts = [
  'recovery.js',
  'app-config.js',
  'dom-elements.js',
  'app-state.js',
  'database.js',
  'utilities.js',
  'webhook-manager.js',
  'api-clients.js',
  'proofreading-config.js',
  'backend-manager.js',
  'error-recovery.js',
  'api-key-manager.js',
  'twin-engine-config.js',
  'main.js',
  'input-preset.js',
];

for (const filename of scripts) {
  const scriptPath = path.join(outputDirectory, filename);
  const source = fs.readFileSync(scriptPath, 'utf8');
  const normalized = source
    .replace(/^"use strict";\r?\n/, '')
    .replace(/[ \t]+$/gm, '');
  fs.writeFileSync(scriptPath, normalized);
}
