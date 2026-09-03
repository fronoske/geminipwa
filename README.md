# GeminiPWA (fronoske版)

## 概要

- 本リポジトリは、titan823氏版GeminiPWAをフォークし、自分が使いやすいように設定項目の見直し、機能削減、および機能追加を施したものです。
- 系譜: [ona-oni/geminipwa](https://github.com/ona-oni/geminipwa) → [titan823/geminipwa](https://github.com/titan823/geminipwa) → [fronoske/geminipwa](https://github.com/fronoske/geminipwa)
- フォーク元であるtitan823氏版のREADMEは、[README.titan823.md](README.titan823.md) として保存しています。

## titan823氏版からの主な変更点

- 単一のHTMLを直接編集する構成から、HTML・TypeScript・CSSを `src/` 配下で管理し、GitHub Pages用の `index.html` をビルドする構成へ移行しました。
- 型検査、生成物検査、自動テストを導入し、既存の設定やIndexedDB上のデータとの互換性を確認しやすくしました。
- AI応答の自動追従を止める文字数を設定できます。最後まで追従する設定や、受信時には追従しない設定も選べます。
- OpenRouterを独立したAPIプロバイダーとして追加し、利用可能なテキストモデルの取得、提供元による絞り込み、モデルの選択、出力コストの表示に対応しました。
- セッション単位でLorebookを選択し、固定ストーリーコアと会話に関連する人物・関係設定だけをプロンプトへ補足できるようにしました。
- 入力プリセットを追加し、プリセットの内容、自動送信、カーソル位置を設定画面から編集できるようにしました。
- 設定画面の階層、ヘッダーとフッター、モバイル向け入力欄を整理し、入力項目単位で移動できるフローティングナビゲーションを追加しました。
- Twin-engine、セッション間リンク、校正、Webhook、Dummy AI、サイコロ入力などの実験的または（私にとって）利用頻度の低い機能を削除しました。

## 利用方法

公開版は、ブラウザから次のURLで利用できます。

<https://fronoske.github.io/geminipwa/#chat>

1. 画面上部の設定ボタンを開きます。
2. 使用するAPIプロバイダーを選択し、APIキーとモデルを設定します。
3. 「設定を保存」を押します。
4. チャット画面の入力欄にメッセージを入力して送信します。

APIの利用条件や料金はプロバイダーごとに異なります。初めて使用する際は、無料または低価格のモデルで動作を確認してください。設定や会話履歴はブラウザ内に保存されるため、必要なデータは設定画面や履歴画面から定期的にエクスポートしてください。

## Lorebook JSON CLI

自由記述の設定テキストを、Webアプリと同じ分割解析手順でLorebook JSONへ変換できます。解析計画、人物、呼称、条件付き記憶、原文照合を順に実行し、最後に [`schemas/lorebook.schema.json`](schemas/lorebook.schema.json)、Webアプリの実装バリデーター、人物IDの参照整合性で検証します。エラーを検出した場合は、モデルによる修復と再検証を行います。すべての修正と検証後に内容を再監査し、検出した事実矛盾をまとめて修復してから、最終JSONに残っている問題だけをwarningとして表示します。原文自体の矛盾や情報不足はunresolvedとして分離します。

CLI本体はNode.jsの標準機能だけを使用するため、追加パッケージのインストールは不要です。Node.js 20以降とOpenAI APIキーを用意し、原文をUTF-8のテキストファイルとして保存してください。

```bash
export OPENAI_API_KEY="your-api-key"
node scripts/lorebook-json-cli.mjs source.txt output.json
```

PowerShellでは、APIキーを次のように設定します。

```powershell
$env:OPENAI_API_KEY = "your-api-key"
node scripts/lorebook-json-cli.mjs source.txt output.json
```

出力ファイルを省略した場合は、入力ファイルと同じ場所に `<入力名>.lorebook.json` を作成します。npm経由でも実行できます。

```bash
npm run lorebook:json -- source.txt output.json
```

生成済みJSONの検証だけを行う場合、APIキーは不要です。

```bash
node scripts/lorebook-json-cli.mjs --validate-only output.json
```

既定モデルは `gpt-5.6-terra`、既定の推論レベルは `medium` です。モデルと推論レベルは次のように指定できます。

```bash
node scripts/lorebook-json-cli.mjs source.txt output.json \
  --model gpt-5.6-terra \
  --reasoning-effort medium
```

`--reasoning-effort` には `none`、`low`、`medium`、`high`、`xhigh`、`max` を指定できます。省略時は `medium` を使用します。環境変数はAPIキーを渡す `OPENAI_API_KEY` だけを使用します。Lorebook ID、修復回数など、その他のオプションはヘルプで確認できます。

```bash
node scripts/lorebook-json-cli.mjs --help
```

解析では原文をOpenAI Responses APIへ複数回送信します。入力の長さと抽出対象の数に応じてAPI利用料と処理時間が増えるため、機密情報と利用量に注意してください。

各解析工程の応答にはResponses APIのStrict Structured Outputsを使用し、工程ごとのJSON Schemaに適合するJSONだけを受け取ります。推論レベルは工程別に変更せず、`--reasoning-effort` で指定した値を全工程に適用します。実行中は工程ごとの所要時間、人物core・呼称・条件付き記憶の件数、APIトークン使用量を表示します。

429、サーバー過負荷、5xx、タイムアウトなどの一時的なAPI障害は、指数バックオフ付きで既定4回まで再試行します。回数は `--api-retries <回数>` で変更できます。この再試行は、モデルが返したJSONの構造修復回数とは別に扱われます。

長時間の処理では、検証済みの各API応答を出力先と同じ場所の `<出力ベース名>.checkpoint.json` に逐次保存します。同じ原文・モデル・推論レベル・スキーマ・CLI実装で再実行すると、完了済み工程を自動的に再利用します。生成に成功するとチェックポイントは削除されます。API障害などで中断した場合はそのまま同じコマンドを実行してください。最初から解析し直す場合は `--no-resume` を指定します。

最終内容監査で見つかったwarningのうち、原文から一意に訂正できるものは、原文抜粋を根拠とする修正案を同じ監査応答で作成します。原文にない、または一般規則と重複する個別exactRuleは、LLMが話者ID・相手IDだけを削除対象として指定します。CLIが現在の規則と照合し、その組み合わせが一意に存在する場合に限り、現在のformsを含む規則全体を削除します。fallbackRuleは話者ID・相手の説明・文脈で一意に特定しますが、削除には同じ修復内の完全な置換規則が必要です。条件付き記憶の削除にも、同じ修復内の完全な置換項目が必要です。適用できないwarning修復案はエラーにせず、残存warningとして報告してJSON出力を完遂します。適用後はJSON Schema・実装バリデーター・参照整合性を再検証し、内容監査も再実行するため、最終的には残存問題だけをwarning表示します。修復は既定で最大1回です。追加のAPI呼び出しを避けたい場合は `--max-warning-repairs 0`、上限を変える場合は `--max-warning-repairs <回数>` を指定します。原文自体が曖昧・矛盾している事項は推測で直さず、warningまたはunresolvedとして残します。

storyCoreは単なる世界設定ではなく、舞台、中心人物の構図、主要テーマ・葛藤、継続的な関係、秘密の知識範囲、セッションの継続原則をまとめた、小説執筆時に常時参照するコンパクトな運用コアとして生成します。制服・服装・外見・個別の嗜好・細かな日課などの局所情報はstoryCoreへ入れません。文体・視点・描写・台詞の扱い・表記・出力形式・禁止事項はstyleGuideに格納して条件付き記憶から除外します。

charactersには固有名または一意の固有呼称がある人物だけを登録し、「父」「兄」「先輩」「友人」などの無名人物は本文情報として保持します。汎用的な親族名・役職名はaliasesから除去します。人物情報や条件付き記憶には一律の文字数・件数上限を設けず、原文の情報保持を優先します。完全に同一の条件・本文を持つ条件付き記憶だけを自動で重複除去します。

分割抽出後は、原文の詳細人物章を一人ずつ現在の人物core・関連する条件付き記憶と照合します。収録漏れだけをcoreまたは条件付き記憶へ追加し、この網羅性監査では既存情報を削除・置換しません。最後の全体監査で主体・対象・数値などの事実矛盾を検出した場合は、既存の条件付き記憶IDと原文抜粋を根拠に限定的な置換修復を行い、再検証・再監査します。修復後も事実矛盾が残る場合はエラー終了し、候補を `<出力名>.invalid.json` に保存します。情報の欠落はwarning、原文自体の矛盾や情報不足はunresolvedとして報告します。

## 開発・ビルド

編集対象は `src/` 配下のHTML、TypeScript、CSSです。リポジトリ直下の `index.html` はGitHub Pages公開用の生成物なので、直接編集しません。

```bash
npm install
npm run dev
```

- `npm run dev`: ビルド後、開発サーバーを起動します。
- `npm run build`: GitHub Pages用の `index.html` を生成します。
- `npm run verify`: 型検査、ビルド、生成物検査、テストをまとめて実行します。

設計上維持すべき中核機能は [Product decisions](docs/product-decisions.md)、手動確認項目は [Manual smoke test](docs/manual-smoke-test.md) に記録しています。
