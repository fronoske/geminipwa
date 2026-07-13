// Bundled into the generated index.html from this TypeScript source.
        function isAllowedAggregatorDomain(urlStr: string | null | undefined): boolean {
            if (state.settings.disableLlmUrlWhitelist) return true;
            if (!urlStr) return true;
            try {
                const url = new URL(urlStr.trim());
                const host = url.hostname.toLowerCase();
                return ALLOWED_LLMAGGREGATOR_DOMAINS.some(allowed => {
                    return host === allowed || host.endsWith(`.${allowed}`);
                });
            } catch {
                return false;
            }
        }
