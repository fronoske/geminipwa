# GeminiPWA (fronoske版)

## 概要

- 本リポジトリは、titan823氏版GeminiPWAをフォークし、自分が使いやすいように設定項目の見直し、機能削減、および機能追加を施したものです。
- 系譜: [ona-oni/geminipwa](https://github.com/ona-oni/geminipwa) → [titan823/geminipwa](https://github.com/titan823/geminipwa) → [fronoske/geminipwa](https://github.com/fronoske/geminipwa)
- フォーク元であるtitan823氏版のREADMEは、[README.titan823.md](README.titan823.md) として保存しています。

## titan823氏版からの主な変更点

- 単一のHTMLを直接編集する構成から、HTML・TypeScript・CSSを `src/` 配下で管理し、GitHub Pages用の `index.html` をビルドする構成へ移行しました。
- 型検査、生成物検査、自動テストを導入し、既存の設定やIndexedDB上のデータとの互換性を確認しやすくしました。
- 長い応答では冒頭のみ自動スクロールし、一定量を超えると追従を止めることで、読み始めた位置が動き続けないようにしました。
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
