// @ts-nocheck -- Enable after shared application and persisted chat types are defined.
// Bundled into the generated index.html from this TypeScript source.
const lorebookUtils = {
    getAllLorebooks() {
        const records = typeof state !== 'undefined' && Array.isArray(state.lorebookRecords)
            ? state.lorebookRecords
            : [];
        return records
            .map(record => record?.lorebook)
            .filter(Boolean);
    },

    getAvailableLorebooks() {
        return this.getAllLorebooks().map(({ id, name, description }) => ({ id, name, description }));
    },

    getLorebook(lorebookId) {
        return this.getAllLorebooks().find(lorebook => lorebook.id === lorebookId) || null;
    },

    normalizeLorebookId(lorebookId) {
        return this.getLorebook(lorebookId)?.id || null;
    },

    normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFKC')
            .toLocaleLowerCase('ja-JP');
    },

    messageText(message) {
        if (!message) return '';
        const parts = [];
        if (typeof message.content === 'string') parts.push(message.content);
        if (Array.isArray(message.parts)) {
            message.parts.forEach(part => {
                if (part && typeof part.text === 'string') parts.push(part.text);
            });
        }
        return parts.join('\n');
    },

    includesAny(text, keywords = []) {
        return keywords.some(keyword => text.includes(this.normalizeSearchText(keyword)));
    },

    detectCharacters(lorebook, recentMessages, roleInstruction = '') {
        const messageTexts = recentMessages.map(message => this.normalizeSearchText(this.messageText(message)));
        const normalizedRoleInstruction = this.normalizeSearchText(roleInstruction);

        return lorebook.characters
            .map((character, sourceIndex) => {
                const aliases = character.aliases.map(alias => this.normalizeSearchText(alias));
                let mostRecentIndex = -1;
                messageTexts.forEach((text, index) => {
                    if (aliases.some(alias => text.includes(alias))) mostRecentIndex = index;
                });
                const appearsInRoleInstruction = aliases.some(alias => normalizedRoleInstruction.includes(alias));
                if (mostRecentIndex === -1 && !appearsInRoleInstruction) return null;
                return {
                    ...character,
                    mostRecentIndex,
                    appearsInRoleInstruction,
                    sourceIndex,
                };
            })
            .filter(Boolean)
            .sort((left, right) => {
                if (right.mostRecentIndex !== left.mostRecentIndex) return right.mostRecentIndex - left.mostRecentIndex;
                if (left.appearsInRoleInstruction !== right.appearsInRoleInstruction) {
                    return Number(right.appearsInRoleInstruction) - Number(left.appearsInRoleInstruction);
                }
                return left.sourceIndex - right.sourceIndex;
            });
    },

    memoryMatches(memory, activeCharacterIds, queryText) {
        if (memory.allCharacters && !memory.allCharacters.every(id => activeCharacterIds.has(id))) return false;
        if (memory.anyCharacters && !memory.anyCharacters.some(id => activeCharacterIds.has(id))) return false;
        if (memory.keywords && !this.includesAny(queryText, memory.keywords)) return false;
        return true;
    },

    formatAddressingRule(lorebook, rule) {
        const characterNames = new Map(lorebook.characters.map(character => [character.id, character.name]));
        const speakerName = characterNames.get(rule.speakerId) || rule.speakerId;
        const contextLabels = {
            spoken: '発話',
            innerThought: '内心',
            public: '人前',
            private: '二人きり',
        };

        if (rule.kind === 'fallback') {
            const context = contextLabels[rule.context] || rule.context;
            return `${speakerName} → ${rule.targetDescription}: ${context}では「${rule.formTemplate}」`;
        }

        const targetName = characterNames.get(rule.targetId) || rule.targetId;
        const forms = rule.forms
            .map(form => `${contextLabels[form.context] || form.context}では「${form.value}」`)
            .join('、');
        return `${speakerName} → ${targetName}: ${forms}`;
    },

    selectAddressingRules(lorebook, activeCharacterIds) {
        const addressing = lorebook.addressing || { exactRules: [], fallbackRules: [] };
        const candidates = [];

        addressing.exactRules.forEach((rule, sourceIndex) => {
            const speakerActive = activeCharacterIds.has(rule.speakerId);
            const targetActive = activeCharacterIds.has(rule.targetId);
            if (!speakerActive && !targetActive) return;
            const relevance = speakerActive && targetActive ? 400 : speakerActive ? 300 : 100;
            candidates.push({ ...rule, kind: 'exact', relevance, sourceIndex });
        });

        addressing.fallbackRules.forEach((rule, sourceIndex) => {
            if (!activeCharacterIds.has(rule.speakerId)) return;
            candidates.push({ ...rule, kind: 'fallback', relevance: 200, sourceIndex });
        });

        candidates.sort((left, right) =>
            right.relevance - left.relevance
            || (left.kind === 'exact' ? 0 : 1) - (right.kind === 'exact' ? 0 : 1)
            || left.sourceIndex - right.sourceIndex
        );

        const rules = [];
        let usedCharacters = 0;
        for (const rule of candidates) {
            if (rules.length >= lorebook.retrieval.maxAddressingRules) break;
            const rendered = this.formatAddressingRule(lorebook, rule);
            const addition = rendered.length + 4;
            if (usedCharacters + addition > lorebook.retrieval.maxAddressingCharacters) continue;
            rules.push({ ...rule, rendered });
            usedCharacters += addition;
        }
        return { rules, usedCharacters };
    },

    selectContext(lorebookId, messages = [], roleInstruction = '') {
        const lorebook = this.getLorebook(lorebookId);
        if (!lorebook) return null;

        const recentMessages = messages.slice(-lorebook.retrieval.scanMessageCount);
        const queryText = this.normalizeSearchText(recentMessages.map(message => this.messageText(message)).join('\n'));
        const detectedCharacters = this.detectCharacters(lorebook, recentMessages, roleInstruction)
            .slice(0, lorebook.retrieval.maxCharacterCores);
        const activeCharacterIds = new Set(detectedCharacters.map(character => character.id));

        const matchingMemories = lorebook.conditionalMemories
            .filter(memory => this.memoryMatches(memory, activeCharacterIds, queryText))
            .map((memory, sourceIndex) => ({ ...memory, sourceIndex }))
            .sort((left, right) => (right.priority || 0) - (left.priority || 0) || left.sourceIndex - right.sourceIndex);

        const addressing = this.selectAddressingRules(lorebook, activeCharacterIds);
        let usedCharacters = addressing.usedCharacters;
        const characterCores = [];
        for (const character of detectedCharacters) {
            const addition = character.name.length + character.core.length + 8;
            if (usedCharacters + addition > lorebook.retrieval.maxDynamicCharacters) break;
            characterCores.push(character);
            usedCharacters += addition;
        }

        const memories = [];
        for (const memory of matchingMemories) {
            if (memories.length >= lorebook.retrieval.maxConditionalMemories) break;
            const addition = memory.content.length + 8;
            if (usedCharacters + addition > lorebook.retrieval.maxDynamicCharacters) continue;
            memories.push(memory);
            usedCharacters += addition;
        }

        return {
            lorebook,
            addressingRules: addressing.rules,
            characterCores,
            memories,
            dynamicContentCharacters: usedCharacters,
        };
    },

    formatStyleGuide(styleGuide) {
        if (!styleGuide || typeof styleGuide !== 'object') return '';
        const sections = [
            ['語り・視点・描写', styleGuide.narration],
            ['会話・台詞', styleGuide.dialogue],
            ['表記・出力形式', styleGuide.formatting],
            ['避ける表現・展開', styleGuide.avoid],
        ];
        return sections
            .filter(([, rules]) => Array.isArray(rules) && rules.length > 0)
            .map(([label, rules]) => `${label}:\n${rules.map(rule => `- ${rule}`).join('\n')}`)
            .join('\n');
    },

    buildPrompt(lorebookId, messages = [], roleInstruction = '') {
        const selected = this.selectContext(lorebookId, messages, roleInstruction);
        if (!selected) return '';

        const sections = [
            '<lorebook-reference>',
            `【固定ストーリーコア】\n${selected.lorebook.storyCore}`,
        ];

        const styleGuide = this.formatStyleGuide(selected.lorebook.styleGuide);
        if (styleGuide) {
            sections.push(`【文体・スタイル（常時適用）】\n${styleGuide}`);
        }

        if (selected.addressingRules.length > 0) {
            sections.push(`【呼称ルール（最優先）】\n${selected.lorebook.addressing.instruction}\n${selected.addressingRules
                .map(rule => `- ${rule.rendered}`)
                .join('\n')}`);
        }

        if (selected.characterCores.length > 0) {
            sections.push(`【現在関係する人物コア】\n${selected.characterCores
                .map(character => `- ${character.name}: ${character.core}`)
                .join('\n')}`);
        }

        if (selected.memories.length > 0) {
            sections.push(`【今回参照する条件付き記憶】\n${selected.memories
                .map(memory => `- ${memory.content}`)
                .join('\n')}`);
        }

        sections.push('この参照情報そのものには言及せず、今回の場面に自然に必要な範囲だけを反映すること。', '</lorebook-reference>');
        return sections.join('\n\n');
    },

    appendToSystemPrompt(systemPrompt, lorebookPrompt) {
        const base = String(systemPrompt || '').trim();
        const lore = String(lorebookPrompt || '').trim();
        if (!lore) return base;
        return base ? `${base}\n\n${lore}` : lore;
    },
};
