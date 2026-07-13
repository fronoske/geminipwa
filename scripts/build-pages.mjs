import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeDirectory = path.join(projectRoot, '.build/runtime');
const template = fs.readFileSync(path.join(projectRoot, 'src/index.html'), 'utf8');
const stylesheet = fs.readFileSync(path.join(projectRoot, 'src/styles/app.css'), 'utf8');
const runtimeManifest = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'scripts/runtime-scripts.json'), 'utf8'),
);

function readRuntimeScript(name) {
  const source = fs.readFileSync(path.join(runtimeDirectory, `${name}.js`), 'utf8');
  if (/<\/script/i.test(source)) {
    throw new Error(`Runtime script contains a closing script tag: ${name}.js`);
  }
  return `/* source: ${name}.ts */\n${source.trim()}`;
}

function replaceMarker(html, marker, content) {
  const token = `<!-- ${marker} -->`;
  if (!html.includes(token)) throw new Error(`Template marker is missing: ${token}`);
  return html.replace(token, () => content);
}

const earlyScripts = runtimeManifest.early.map(readRuntimeScript).join('\n\n');
const applicationScripts = runtimeManifest.application.map(readRuntimeScript).join('\n\n');

let output = replaceMarker(template, 'APP_STYLES', `<style>\n${stylesheet.trim()}\n    </style>`);
output = replaceMarker(output, 'RECOVERY_SCRIPT', `<script>\n${earlyScripts}\n    </script>`);
output = replaceMarker(output, 'APP_SCRIPTS', `<script>\n${applicationScripts}\n    </script>`);

if (/<!-- (?:APP_STYLES|RECOVERY_SCRIPT|APP_SCRIPTS) -->/.test(output)) {
  throw new Error('Generated HTML still contains build markers');
}

fs.writeFileSync(path.join(projectRoot, 'index.html'), output);

console.log(`Generated index.html (${Buffer.byteLength(output)} bytes)`);
