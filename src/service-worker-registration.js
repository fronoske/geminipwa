// src/service-worker-registration.js is generated from this file. Edit this TypeScript source instead.
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(() => {
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data && event.data.action === 'reloadPage') {
                        alert('アプリが更新されました。この表示の後、ページがロードされます。');
                        window.location.reload();
                    }
                });
            })
                .catch(() => { });
        });
    }
}
