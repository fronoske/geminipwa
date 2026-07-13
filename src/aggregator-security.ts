// src/aggregator-security.js is generated from this file. Edit this TypeScript source instead.
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
