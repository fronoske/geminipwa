// Bundled into the generated index.html from this TypeScript source.
        function registerServiceWorker(): void {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js')
                        .then(registration => {
                            navigator.serviceWorker.addEventListener('message', event => {
                                if (event.data && event.data.action === 'reloadPage') {
                                    alert('アプリが更新されました。この表示の後、ページがロードされます。');
                                    window.location.reload();
                                }
                            });
                        })
                        .catch(err => { });
                });
            }
        }
