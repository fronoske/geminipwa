import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = path.join(projectRoot, '.build');

fs.rmSync(buildDirectory, { recursive: true, force: true });
fs.mkdirSync(path.join(buildDirectory, 'runtime'), { recursive: true });
