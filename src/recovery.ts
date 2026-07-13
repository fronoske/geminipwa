// src/recovery.js is generated from this file. Edit this TypeScript source instead.
interface Window {
  initializationSuccess: () => void;
}

(() => {
  const TIMEOUT = 10000;
  const RECOVERY_ATTEMPT_KEY = 'GeminiPWA_RecoveryAttempt';
  let recoveryAttempt = Number.parseInt(sessionStorage.getItem(RECOVERY_ATTEMPT_KEY) || '0', 10);

  const watchdogTimer = window.setTimeout(() => {
    void handleInitializationFailure();
  }, TIMEOUT);

  window.initializationSuccess = () => {
    window.clearTimeout(watchdogTimer);
    sessionStorage.removeItem(RECOVERY_ATTEMPT_KEY);
  };

  async function handleInitializationFailure(): Promise<void> {
    recoveryAttempt++;
    sessionStorage.setItem(RECOVERY_ATTEMPT_KEY, String(recoveryAttempt));

    if (recoveryAttempt === 1) {
      alert('アプリの起動に時間がかかっています。キャッシュをクリアして再起動します。(ステップ1/3)');
      await clearCachesAndReload();
    } else if (recoveryAttempt === 2) {
      alert('再起動に失敗しました。より強力なキャッシュクリアを試みます。(ステップ2/3)');
      await clearAllCachesAndReload();
    } else {
      const confirmed = confirm(
        '複数回の再起動に失敗しました。アプリのデータが破損している可能性があります。\n\n' +
          'すべてのデータ（設定とチャット履歴）を消去してアプリをリセットしますか？\n' +
          'この操作は元に戻せません。「キャンセル」を押すと、現状のままリロードします。(ステップ3/3)',
      );
      if (confirmed) {
        await clearAllSiteDataAndReload();
      } else {
        sessionStorage.removeItem(RECOVERY_ATTEMPT_KEY);
        reloadPage();
      }
    }
  }

  async function clearCachesAndReload(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('message', function handler(event: MessageEvent) {
            if (event.data?.action === 'cacheCleared') {
              navigator.serviceWorker.removeEventListener('message', handler);
              resolve();
            }
          });
          navigator.serviceWorker.controller?.postMessage({ action: 'clearCache' });
        });
      }
    } catch {}
    reloadPage();
  }

  async function clearAllCachesAndReload(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    } catch {}
    await clearCachesAndReload();
  }

  async function clearAllSiteDataAndReload(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase('GeminiPWA_DB');
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onblocked = () => window.location.reload();
      });
    } catch {}

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    await clearAllCachesAndReload();
  }

  function reloadPage(): void {
    // Firefox still supports the legacy forceGet argument used by the original implementation.
    (window.location.reload as unknown as (forceGet?: boolean) => void)(true);
  }
})();
