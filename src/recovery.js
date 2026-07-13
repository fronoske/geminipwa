        (function () {
            const TIMEOUT = 10000;
            const RECOVERY_ATTEMPT_KEY = 'GeminiPWA_RecoveryAttempt';
            let recoveryAttempt = parseInt(sessionStorage.getItem(RECOVERY_ATTEMPT_KEY) || '0', 10);

            const watchdogTimer = setTimeout(() => {
                handleInitializationFailure();
            }, TIMEOUT);

            window.initializationSuccess = function () {
                clearTimeout(watchdogTimer);
                sessionStorage.removeItem(RECOVERY_ATTEMPT_KEY);
            };

            async function handleInitializationFailure() {
                recoveryAttempt++;
                sessionStorage.setItem(RECOVERY_ATTEMPT_KEY, recoveryAttempt);

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
                        'この操作は元に戻せません。「キャンセル」を押すと、現状のままリロードします。(ステップ3/3)'
                    );
                    if (confirmed) {
                        await clearAllSiteDataAndReload();
                    } else {
                        sessionStorage.removeItem(RECOVERY_ATTEMPT_KEY);
                        window.location.reload(true);
                    }
                }
            }

            async function clearCachesAndReload() {
                try {
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        await new Promise(resolve => {
                            navigator.serviceWorker.addEventListener('message', function handler(event) {
                                if (event.data && event.data.action === 'cacheCleared') {
                                    navigator.serviceWorker.removeEventListener('message', handler);
                                    resolve();
                                }
                            });
                            navigator.serviceWorker.controller.postMessage({ action: 'clearCache' });
                        });
                    }
                } catch (e) { }
                window.location.reload(true);
            }

            async function clearAllCachesAndReload() {
                try {
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map(name => caches.delete(name)));
                    }
                } catch (e) { }
                await clearCachesAndReload();
            }

            async function clearAllSiteDataAndReload() {
                try {
                    await new Promise((resolve, reject) => {
                        const deleteRequest = indexedDB.deleteDatabase('GeminiPWA_DB');
                        deleteRequest.onsuccess = () => resolve();
                        deleteRequest.onerror = () => reject();
                        deleteRequest.onblocked = () => window.location.reload();
                    });
                } catch (e) { }

                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (e) { }

                await clearAllCachesAndReload();
            }
        })();
