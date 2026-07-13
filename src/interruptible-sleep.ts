// @ts-nocheck -- Enable after abortable task types are defined.
// Bundled into the generated index.html from this TypeScript source.
function interruptibleSleep(ms, signal) {
            return new Promise((resolve, reject) => {
                if (signal.aborted) {
                    const error = new Error("Sleep aborted");
                    error.name = "AbortError";
                    return reject(error);
                }
                let timeoutId;
                const onAbort = () => {
                    clearTimeout(timeoutId);
                    const error = new Error("Sleep aborted");
                    error.name = "AbortError";
                    reject(error);
                };
                timeoutId = setTimeout(() => {
                    signal.removeEventListener('abort', onAbort);
                    resolve();
                }, ms);
                signal.addEventListener('abort', onAbort, { once: true });
            });
        }
