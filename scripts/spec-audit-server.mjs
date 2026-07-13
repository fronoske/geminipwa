import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBaselineIndex } from './spec-baseline.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = process.argv[2] && !/^\d+$/.test(process.argv[2]) ? process.argv[2] : undefined;
const port = Number((baselinePath ? process.argv[3] : process.argv[2]) ?? 4173);
const baselineHtml = Buffer.from(readBaselineIndex(baselinePath));
const generatedHtml = fs.readFileSync(path.join(projectRoot, 'index.html'));
const publicFiles = new Map([
  ['manifest.json', 'application/manifest+json; charset=utf-8'],
  ['sw.js', 'text/javascript; charset=utf-8'],
  ['marked.js', 'text/javascript; charset=utf-8'],
  ['icon-192x192.png', 'image/png'],
]);

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const match = url.pathname.match(/^\/(baseline|current)\/(.*)$/);
  if (!match) {
    response.writeHead(404).end('Not found');
    return;
  }

  const [, variant, requestedFile] = match;
  if (requestedFile === '' || requestedFile === 'index.html') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(variant === 'baseline' ? baselineHtml : generatedHtml);
    return;
  }

  const contentType = publicFiles.get(requestedFile);
  if (!contentType) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': contentType });
  response.end(fs.readFileSync(path.join(projectRoot, requestedFile)));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Spec audit server: http://127.0.0.1:${port}`);
});
