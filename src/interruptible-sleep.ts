// @ts-nocheck -- Enable after abortable task types are defined.
// src/interruptible-sleep.js is generated from this file. Edit this TypeScript source instead.
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
