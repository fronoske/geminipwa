// @ts-nocheck -- Enable after this legacy controller is split into typed features.
// src/text-normalization.js is generated from this file. Edit this TypeScript source instead.
        function katakanaToHiragana(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/[\u30a1-\u30f6]/g, function (match) {
                return String.fromCharCode(match.charCodeAt(0) - 0x60);
            });
        }

        function romajiToKatakana(str) {
            if (typeof str !== 'string') return '';
            const romajiMap = {
                'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ', 'o': 'オ',
                'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
                'sa': 'サ', 'shi': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
                'ta': 'タ', 'chi': 'チ', 'tsu': 'ツ', 'te': 'テ', 'to': 'ト',
                'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
                'ha': 'ハ', 'hi': 'ヒ', 'fu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
                'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
                'ya': 'ヤ', 'yu': 'ユ', 'yo': 'ヨ',
                'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
                'wa': 'ワ', 'wo': 'ヲ', 'n': 'ン',
                'ga': 'ガ', 'gi': 'ギ', 'gu': 'グ', 'ge': 'ゲ', 'go': 'ゴ',
                'za': 'ザ', 'ji': 'ジ', 'zu': 'ズ', 'ze': 'ゼ', 'zo': 'ゾ',
                'da': 'ダ', 'di': 'ヂ', 'du': 'ヅ', 'de': 'デ', 'do': 'ド',
                'ba': 'バ', 'bi': 'ビ', 'bu': 'ブ', 'be': 'ベ', 'bo': 'ボ',
                'pa': 'パ', 'pi': 'ピ', 'pu': 'プ', 'pe': 'ペ', 'po': 'ポ',
                'kya': 'キャ', 'kyu': 'キュ', 'kyo': 'キョ',
                'sha': 'シャ', 'shu': 'シュ', 'sho': 'ショ',
                'cha': 'チャ', 'chu': 'チュ', 'cho': 'チョ',
                'nya': 'ニャ', 'nyu': 'ニュ', 'nyo': 'ニョ',
                'hya': 'ヒャ', 'hyu': 'ヒュ', 'hyo': 'ヒョ',
                'mya': 'ミャ', 'myu': 'ミュ', 'myo': 'ミョ',
                'rya': 'リャ', 'ryu': 'リュ', 'ryo': 'リョ',
                'gya': 'ギャ', 'gyu': 'ギュ', 'gyo': 'ギョ',
                'ja': 'ジャ', 'ju': 'ジュ', 'jo': 'ジョ',
                'bya': 'ビャ', 'byu': 'ビュ', 'byo': 'ビョ',
                'pya': 'ピャ', 'pyu': 'ピュ', 'pyo': 'ピョ',
                '-': 'ー'
            };
            let result = str;
            // 3文字、2文字、1文字の順で置換
            for (let len = 3; len >= 1; len--) {
                for (let i = 0; i <= result.length - len; i++) {
                    const sub = result.substring(i, i + len);
                    // ▼▼▼ ここを変更 ▼▼▼
                    const lowerSub = sub.toLowerCase();
                    if (romajiMap[lowerSub]) {
                        result = result.substring(0, i) + romajiMap[lowerSub] + result.substring(i + len);
                    }
                    // ▲▲▲ ここまで変更 ▲▲▲
                }
            }
            // 促音の処理 (簡易版: 子音の連続)
            result = result.replace(/([bcdfghjklmpqrstvwxyz])\1/gi, 'ッ$1');
            return result;
        }

        /**
         * 固有名詞リストから正規化マップを作成する
         * @param {string} namesList - カンマ区切りの固有名詞リスト
         * @returns {Map<string, string>} 正規化された名前をキー、元の名前を値とするマップ
         */
        function getNormalizationMap(namesList) {
            const map = new Map();
            if (!namesList) return map;
            const names = namesList.split(',').map(n => n.trim()).filter(Boolean);

            for (const originalName of names) {
                const nfkcName = originalName.normalize('NFKC');
                const hiraganaName = katakanaToHiragana(nfkcName);

                // 元の名前、NFKC正規化、ひらがな化したものをキーとして登録
                map.set(originalName.toLowerCase(), originalName);
                map.set(nfkcName.toLowerCase(), originalName);
                map.set(hiraganaName.toLowerCase(), originalName);
            }
            return map;
        }

        /**
                 * 2つの文字列間のレーベンシュタイン距離を計算する
                 * @param {string} a 比較する文字列1
                 * @param {string} b 比較する文字列2
                 * @returns {number} 編集距離 (整数)
                 */
        function levenshteinDistance(a, b) {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;

            const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

            for (let i = 0; i <= a.length; i++) {
                matrix[0][i] = i;
            }
            for (let j = 0; j <= b.length; j++) {
                matrix[j][0] = j;
            }

            for (let j = 1; j <= b.length; j++) {
                for (let i = 1; i <= a.length; i++) {
                    const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                    matrix[j][i] = Math.min(
                        matrix[j][i - 1] + 1,      // 削除
                        matrix[j - 1][i] + 1,      // 挿入
                        matrix[j - 1][i - 1] + cost // 置換
                    );
                }
            }
            return matrix[b.length][a.length];
        }

        /**
         * 入力文字列を正規化し、マップに存在すれば対応する固有名詞を返す (Fuzzy Search対応版)
         * @param {string} input - チェック対象の文字列
         * @param {Map<string, string>} normalizationMap - 正規化マップ
         * @param {boolean} performRomajiConversion - ローマ字変換を行うかどうかのフラグ
         * @returns {string} 処理後の文字列
         */
        function normalizeName(input, normalizationMap, performRomajiConversion) {
            if (!input || normalizationMap.size === 0) return input;

            console.groupCollapsed(`[normalizeName] Input: "${input}"`);

            // 1. NFKC正規化
            let normalized = input.normalize('NFKC');
            if (normalized !== input) {
                console.log(`  > Step 1 (NFKC): "${normalized}"`);
            }

            // 2. ローマ字 -> カタカナ (条件付き)
            let katakana = normalized;
            if (performRomajiConversion) {
                katakana = romajiToKatakana(normalized);
                if (katakana !== normalized) {
                    console.log(`  > Step 2 (Romaji to Katakana): "${katakana}"`);
                }
            } else {
                console.log(`  > Step 2 (Romaji to Katakana): Skipped`);
            }

            // 3. カタカナ -> ひらがな
            let hiragana = katakanaToHiragana(katakana);
            if (hiragana !== katakana) {
                console.log(`  > Step 3 (Katakana to Hiragana): "${hiragana}"`);
            }

            // 4. 小文字化して比較
            const lowercased = hiragana.toLowerCase();
            console.log(`  > Step 4 (Lookup Key): "${lowercased}"`);

            // 5. 完全一致のチェック
            if (normalizationMap.has(lowercased)) {
                const result = normalizationMap.get(lowercased);
                console.log(`  > Exact match found! Replacing with: "${result}"`);
                console.groupEnd();
                return result;
            }

            // ▼▼▼ ここからがFuzzy Searchのロジックです ▼▼▼
            // 6. Fuzzy Searchのチェック (設定が有効な場合のみ)
            if (state.settings.enableFuzzySearchNormalization) {
                console.log('  > No exact match. Starting Fuzzy Search...');
                const threshold = state.settings.fuzzySearchThreshold;
                let bestMatch = null;
                let minDistance = Infinity;

                // 固有名詞リストの全候補に対して距離を計算
                for (const [key, originalName] of normalizationMap.entries()) {
                    const distance = levenshteinDistance(lowercased, key);

                    if (distance < minDistance) {
                        minDistance = distance;
                        bestMatch = originalName;
                    }
                }

                console.log(`  > Closest match: "${bestMatch}" with distance: ${minDistance}`);

                // 閾値以下であれば、最も近い候補を採用
                if (bestMatch && minDistance <= threshold) {
                    console.log(`  > Fuzzy match found (distance <= threshold ${threshold})! Replacing with: "${bestMatch}"`);
                    console.groupEnd();
                    return bestMatch;
                }
            }
            // ▲▲▲ ここまでがFuzzy Searchのロジックです ▲▲▲

            console.log(`  > No match found. Returning original cleaned value.`);
            console.groupEnd();
            return input; // 完全一致もFuzzy Searchもヒットしなかった場合は元の入力を返す
        }
        // ▲▲▲ ここまで追加 ▲▲▲
