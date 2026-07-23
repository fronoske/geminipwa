// @ts-nocheck -- Preserve the original browser error behavior during source migration.
// Bundled into the generated index.html from this TypeScript source.

const sanitizeText = (text: unknown, maxLength = 255): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>'"&]/g, '').substring(0, maxLength);
};

const sleep = (ms: number): Promise<void> => {
  if (document.hidden) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatCompactTokenCount(value: number): string {
  const count = Number(value);
  if (!Number.isFinite(count)) return '0';

  const units = [
    { threshold: 1_000_000_000, suffix: 'G' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];
  const unit = units.find(candidate => Math.abs(count) >= candidate.threshold);
  if (!unit) return Math.round(count).toLocaleString('en-US');

  const compactValue = count / unit.threshold;
  return `${compactValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}${unit.suffix}`;
}

function normalizeAutoScrollResponseCharacterLimit(value: unknown): number {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return DEFAULT_AUTO_SCROLL_RESPONSE_CHARACTER_LIMIT;
  }
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue >= -1
    ? numericValue
    : DEFAULT_AUTO_SCROLL_RESPONSE_CHARACTER_LIMIT;
}

function shouldAutoScrollResponseBody(content: unknown, limit: unknown): boolean {
  const normalizedLimit = normalizeAutoScrollResponseCharacterLimit(limit);
  if (normalizedLimit === -1) return true;

  const characterCount = Array.from(typeof content === 'string' ? content : '').length;
  return characterCount < normalizedLimit;
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
