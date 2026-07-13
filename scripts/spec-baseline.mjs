import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

export const SPEC_BASELINE_COMMIT = '863b245';

export function readBaselineFile(filename, encoding = 'utf8') {
  try {
    return execFileSync('git', ['show', `${SPEC_BASELINE_COMMIT}:${filename}`], {
      encoding,
      maxBuffer: 4 * 1024 * 1024,
    });
  } catch (error) {
    // Managed sandboxes can report EPERM after git has returned complete stdout.
    if (typeof error.stdout === 'string' && error.stdout.length > 0) {
      return error.stdout;
    }
    if (Buffer.isBuffer(error.stdout) && error.stdout.length > 0) {
      return error.stdout;
    }
    throw error;
  }
}

export function readBaselineIndex(explicitPath) {
  if (explicitPath) return fs.readFileSync(explicitPath, 'utf8');
  return readBaselineFile('index.html');
}
