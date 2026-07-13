import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readBaselineFile,
  readBaselineIndex,
  SPEC_BASELINE_COMMIT,
} from './spec-baseline.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineHtml = readBaselineIndex(process.argv[2]);
const generatedHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

const hash = (source) => crypto.createHash('sha256').update(source).digest('hex');
const extractBlocks = (html, tagName) =>
  [...html.matchAll(new RegExp(`<${tagName}([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi'))].map(
    (match) => ({ attributes: match[1].trim(), source: match[2] }),
  );

const stripEmbeddedCode = (html) =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/>\s+</g, '><')
    .trim();

const baselineMarkup = stripEmbeddedCode(baselineHtml);
const generatedMarkup = stripEmbeddedCode(generatedHtml);
const baselineCss = extractBlocks(baselineHtml, 'style')
  .map((block) => block.source.trim())
  .join('\n');
const generatedCss = extractBlocks(generatedHtml, 'style')
  .map((block) => block.source.trim())
  .join('\n');

console.log(`markup equal: ${baselineMarkup === generatedMarkup}`);
console.log(`markup hashes: ${hash(baselineMarkup)} / ${hash(generatedMarkup)}`);
const baselineCompactCss = baselineCss.replace(/\s/g, '');
const generatedCompactCss = generatedCss.replace(/\s/g, '');
console.log(`CSS equal without whitespace: ${baselineCompactCss === generatedCompactCss}`);

const externalScripts = (html) =>
  extractBlocks(html, 'script')
    .map((script) => script.attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);

assert.equal(generatedMarkup, baselineMarkup, 'DOM markup differs from the pre-migration version');
assert.equal(
  generatedCompactCss,
  baselineCompactCss,
  'CSS rules differ from the pre-migration version',
);
assert.deepEqual(
  externalScripts(generatedHtml),
  externalScripts(baselineHtml),
  'External script references differ from the pre-migration version',
);
for (const filename of ['manifest.json', 'marked.js']) {
  assert.equal(
    fs.readFileSync(path.join(projectRoot, filename), 'utf8'),
    readBaselineFile(filename),
    `${filename} differs from the pre-migration version`,
  );
}
assert.equal(
  fs.readFileSync(path.join(projectRoot, 'sw.js'), 'utf8').trimEnd(),
  readBaselineFile('sw.js').trimEnd(),
  'sw.js differs from the pre-migration version',
);
assert.ok(
  fs.readFileSync(path.join(projectRoot, 'icon-192x192.png')).equals(
    readBaselineFile('icon-192x192.png', null),
  ),
  'PWA icon differs from the pre-migration version',
);

for (const [name, html] of [
  ['baseline', baselineHtml],
  ['generated', generatedHtml],
]) {
  const styles = extractBlocks(html, 'style');
  const scripts = extractBlocks(html, 'script');
  const shell = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '<style></style>')
    .replace(/<script([^>]*)>[\s\S]*?<\/script>/gi, '<script$1></script>');

  console.log(`${name}: ${html.split('\n').length} lines / ${Buffer.byteLength(html)} bytes`);
  console.log(`  shell: ${shell.length} chars / ${hash(shell)}`);
  console.log(
    `  canonical shell: ${hash(shell.replace(/>\s+</g, '><').trim())}`,
  );
  styles.forEach((style, index) => {
    console.log(`  style ${index + 1}: ${style.source.trim().length} chars / ${hash(style.source.trim())}`);
  });
  scripts.forEach((script, index) => {
    console.log(
      `  script ${index + 1} (${script.attributes || 'inline'}): ${script.source.trim().length} chars / ${hash(script.source.trim())}`,
    );
  });
}

console.log(`Static specification equivalence audit passed against ${SPEC_BASELINE_COMMIT}`);
