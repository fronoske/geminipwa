// Bundled into the generated index.html from this TypeScript source.
        function updateMessageMaxWidthVar(): void {
            const container = elements.messageContainer;
            if (!container) return;
            let maxWidthPx = container.clientWidth * 0.8;
            document.documentElement.style.setProperty('--message-max-width', `${maxWidthPx}px`);
        }

        let resizeTimer: ReturnType<typeof setTimeout> | undefined;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateMessageMaxWidthVar, 150);
        });

        function organizeApiSettingsHierarchy(): void {
            const layouts = [
                { provider: 'gemini', rootId: 'gemini-settings-group', paramsId: 'gemini-params-group', advancedId: 'gemini-advanced-group', featureId: 'gemini-grounding-param' },
                { provider: 'deepseek', rootId: 'deepseek-settings-group', paramsId: 'deepseek-params-group', advancedId: 'deepseek-advanced-group' },
                { provider: 'claude', rootId: 'claude-settings-group', paramsId: 'claude-params-group', advancedId: 'claude-advanced-group' },
                { provider: 'openai', rootId: 'openai-settings-group', paramsId: 'openai-params-group', advancedId: 'openai-advanced-group' },
                { provider: 'openrouter', rootId: 'openrouter-settings-group', paramsId: 'openrouter-params-group', advancedId: 'openrouter-advanced-group' },
                { provider: 'xai', rootId: 'xai-settings-group', paramsId: 'xai-params-group', advancedId: 'xai-advanced-group' },
                { provider: 'llmaggregator', rootId: 'llmaggregator-settings-group', paramsId: 'llmaggregator-params-group', advancedId: 'llmaggregator-advanced-group' },
            ];

            const prepareNestedDetails = (details: HTMLDetailsElement, title: string): void => {
                details.classList.remove('settings-group');
                details.classList.add('settings-subsection');
                details.open = false;
                const summary = details.querySelector(':scope > summary');
                if (summary) {
                    summary.className = 'settings-subsection-summary';
                    summary.removeAttribute('style');
                    summary.textContent = title;
                }
            };

            layouts.forEach(({ provider, rootId, paramsId, advancedId, featureId }) => {
                const root = document.getElementById(rootId) as HTMLDetailsElement | null;
                const params = document.getElementById(paramsId) as HTMLDetailsElement | null;
                const advanced = document.getElementById(advancedId) as HTMLDetailsElement | null;
                if (!root || !params || !advanced) return;

                const connectionContent = Array.from(root.children)
                    .find(child => child.tagName === 'DIV') as HTMLDivElement | undefined;
                if (connectionContent) {
                    const connection = document.createElement('details');
                    connection.id = `${provider}-connection-settings`;
                    connection.className = 'settings-subsection';
                    const summary = document.createElement('summary');
                    summary.className = 'settings-subsection-summary';
                    summary.textContent = provider === 'llmaggregator'
                        ? 'バックエンド・APIキーとモデル'
                        : 'APIキーとモデル';
                    connection.append(summary, connectionContent);
                    root.appendChild(connection);
                }

                prepareNestedDetails(params, 'プロンプトと生成パラメータ');
                root.appendChild(params);

                if (featureId) {
                    const featureContent = document.getElementById(featureId);
                    if (featureContent) {
                        featureContent.classList.remove('settings-group');
                        featureContent.querySelector(':scope > h3')?.remove();
                        const feature = document.createElement('details');
                        feature.id = `${provider}-feature-settings`;
                        feature.className = 'settings-subsection';
                        const summary = document.createElement('summary');
                        summary.className = 'settings-subsection-summary';
                        summary.textContent = '検索機能';
                        feature.append(summary, featureContent);
                        root.appendChild(feature);
                    }
                }

                prepareNestedDetails(advanced, '出力と機能');
                root.appendChild(advanced);
            });
        }

        organizeApiSettingsHierarchy();

        function markSettingsHierarchyLevels(): void {
            const main = document.querySelector('#settings-screen .main-content');
            if (!main) return;

            main.querySelectorAll('details').forEach((details) => {
                details.classList.remove('settings-level-1', 'settings-level-2', 'settings-level-3');
                details.querySelector(':scope > summary')?.classList.remove(
                    'settings-summary-level-1',
                    'settings-summary-level-2',
                    'settings-summary-level-3',
                );
            });

            main.querySelectorAll(':scope > details.settings-group').forEach((topLevelDetails) => {
                topLevelDetails.classList.add('settings-level-1');
                topLevelDetails.querySelector(':scope > summary')?.classList.add('settings-summary-level-1');

                topLevelDetails.querySelectorAll('details').forEach((details) => {
                    let level = 1;
                    let ancestor = details.parentElement?.closest('details');
                    while (ancestor && topLevelDetails.contains(ancestor)) {
                        level += 1;
                        if (ancestor === topLevelDetails) break;
                        ancestor = ancestor.parentElement?.closest('details');
                    }

                    const visualLevel = Math.min(level, 3);
                    details.classList.add(`settings-level-${visualLevel}`);
                    details.querySelector(':scope > summary')?.classList.add(`settings-summary-level-${visualLevel}`);
                });
            });
        }

        markSettingsHierarchyLevels();
