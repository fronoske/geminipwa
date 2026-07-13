// src/utilities.js is generated from this file. Edit this TypeScript source instead.
const sanitizeText = (text, maxLength = 255) => {
    if (typeof text !== 'string')
        return '';
    return text.replace(/[<>'"&]/g, '').substring(0, maxLength);
};
const sleep = (milliseconds) => {
    if (document.hidden)
        return Promise.resolve();
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
};
function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const unit = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(unit));
    return `${Number.parseFloat((bytes / unit ** unitIndex).toFixed(2))} ${sizes[unitIndex]}`;
}
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                reject(new Error('FileReader returned a non-string result'));
                return;
            }
            resolve(result.split(',')[1] ?? '');
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
