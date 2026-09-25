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
const measurementId = (process.env.GA_MEASUREMENT_ID ?? 'G-LYK4N70WLR').trim();

if (measurementId && !/^G-[A-Z0-9]+$/.test(measurementId)) {
  throw new Error('GA_MEASUREMENT_ID must be a GA4 measurement ID (G- followed by letters and digits)');
}

const analyticsTag = measurementId ? `<!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_title: 'GeminiPWA',
        page_location: location.origin + location.pathname
      });
    </script>` : '';
const includeLocalLorebook = process.argv.includes('--include-local-lorebook')
  && fs.existsSync(path.join(projectRoot, 'lorebook.local.js'));
const localLorebookScript = includeLocalLorebook
  ? '<script src="lorebook.local.js"></script>'
  : '';

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
  if (!content) return html.replace(new RegExp(`^[\\t ]*${token}\\r?\\n`, 'm'), '');
  return html.replace(token, () => content);
}

const earlyScripts = runtimeManifest.early.map(readRuntimeScript).join('\n\n');
const applicationScripts = runtimeManifest.application.map(readRuntimeScript).join('\n\n');

let output = replaceMarker(template, 'GOOGLE_ANALYTICS', analyticsTag);
output = replaceMarker(output, 'LOCAL_LOREBOOK_SCRIPT', localLorebookScript);
output = replaceMarker(output, 'APP_STYLES', `<style>\n${stylesheet.trim()}\n    </style>`);
output = replaceMarker(output, 'RECOVERY_SCRIPT', `<script>\n${earlyScripts}\n    </script>`);
output = replaceMarker(output, 'APP_SCRIPTS', `<script>\n${applicationScripts}\n    </script>`);

if (/<!-- (?:GOOGLE_ANALYTICS|LOCAL_LOREBOOK_SCRIPT|APP_STYLES|RECOVERY_SCRIPT|APP_SCRIPTS) -->/.test(output)) {
  throw new Error('Generated HTML still contains build markers');
}

fs.writeFileSync(path.join(projectRoot, 'index.html'), output);

console.log(`Generated index.html (${Buffer.byteLength(output)} bytes)`);
