// @ts-nocheck -- Enable after shared application service types are defined.
// src/error-recovery.js is generated from this file. Edit this TypeScript source instead.
const errorRecovery = {
    errorCount: 0,
    errorTimeWindow: 60000,
    maxErrors: 3,
    lastErrorTime: 0,
    isRecovering: false,
    errorLog: [],
    maxLogSize: 20,
    logError(type, errorInfo) {
        const now = new Date();
        const logEntry = {
            timestamp: now.toISOString(),
            type: type,
            info: this.serializeErrorInfo(errorInfo)
        };
        this.errorLog.unshift(logEntry);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.pop();
        }
    },
    serializeErrorInfo(errorInfo) {
        try {
            const cache = new Set();
            return JSON.stringify(errorInfo, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (value instanceof Window)
                        return '[Window Object]';
                    if (cache.has(value)) {
                        return '[Circular Reference]';
                    }
                    cache.add(value);
                }
                return value;
            }, 2);
        }
        catch (e) {
            if (errorInfo instanceof Error) {
                return JSON.stringify({ message: errorInfo.message, stack: errorInfo.stack, name: errorInfo.name }, null, 2);
            }
            return `Failed to serialize error: ${e.message}`;
        }
    },
    getErrorLogAsString() {
        if (this.errorLog.length === 0) {
            return "これまでに記録されたエラーはありません。";
        }
        return this.errorLog.map(log => `Timestamp: ${log.timestamp}\nType: ${log.type}\nInfo:\n${log.info}`).join('\n\n====================\n\n');
    },
    init() {
        window.addEventListener('error', (event) => {
            this.handleError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('error', (event) => {
                this.handleError('Service Worker Error', event);
            });
        }
    },
    handleError(type, errorInfo) {
        if (this.isRecovering)
            return;
        const now = Date.now();
        if (now - this.lastErrorTime > this.errorTimeWindow) {
            this.errorCount = 0;
        }
        this.errorCount++;
        this.lastErrorTime = now;
        this.logError(type, errorInfo);
        const isCriticalError = this.isCriticalError(errorInfo);
        if (this.errorCount >= this.maxErrors || isCriticalError) {
            this.triggerForceReload(type, errorInfo, isCritical);
        }
    },
    isCriticalError(errorInfo) {
        const criticalPatterns = [
            /Cannot read prop/i,
            /Cannot access before initialization/i,
            /is not defined/i,
            /IndexedDB/i,
            /QuotaExceededError/i,
            /localStorage/i,
            /sessionStorage/i,
            /Service Worker/i,
            /Failed to fetch/i,
            /NetworkError/i
        ];
        const errorMessage = JSON.stringify(errorInfo).toLowerCase();
        return criticalPatterns.some(pattern => pattern.test(errorMessage));
    },
    async triggerForceReload(errorType, errorInfo, isCritical) {
        if (this.isRecovering)
            return;
        this.isRecovering = true;
        const reason = isCritical ? '致命的なエラー' : `連続エラー(${this.errorCount}回)`;
        try {
            await this.showRecoveryNotification(reason, errorType);
            await this.clearCacheAndReload();
        }
        catch (recoveryError) {
            window.location.reload(true);
        }
    },
    async showRecoveryNotification(reason, errorType) {
        if (typeof uiUtils !== 'undefined' && uiUtils.showCustomAlert) {
            try {
                await uiUtils.showCustomAlert(`アプリで${reason}が発生しました。\n` +
                    `安定性を保つため、キャッシュをクリアして再起動します。\n\n` +
                    `エラータイプ: ${errorType}\n` +
                    `この操作は自動で実行されます。`);
            }
            catch (e) {
                alert(`アプリで${reason}が発生しました。キャッシュをクリアして再起動します。`);
            }
        }
        else {
            alert(`アプリで${reason}が発生しました。キャッシュをクリアして再起動します。`);
        }
    },
    async clearCacheAndReload() {
        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => reject(new Error('Service Worker timeout')), 5000);
                    const messageHandler = (event) => {
                        if (event.data && event.data.action === 'cacheCleared') {
                            clearTimeout(timeoutId);
                            navigator.serviceWorker.removeEventListener('message', messageHandler);
                            resolve();
                        }
                    };
                    navigator.serviceWorker.addEventListener('message', messageHandler);
                    navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
                });
            }
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            this.clearStorageSelectively();
            window.location.reload(true);
        }
        catch (error) {
            window.location.href = window.location.href + '?recovery=' + Date.now();
        }
    },
    clearStorageSelectively() {
        try {
            const protectedKeys = [
                'GeminiPWA_DB',
            ];
            if (typeof Storage !== 'undefined' && sessionStorage) {
                sessionStorage.clear();
            }
            if (typeof Storage !== 'undefined' && localStorage) {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && !protectedKeys.some(protected => key.includes(protected))) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
        }
        catch (error) {
        }
    },
    manualRecovery() {
        this.triggerForceReload('Manual Recovery', { reason: 'User triggered' }, true);
    }
};
