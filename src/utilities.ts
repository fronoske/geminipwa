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
