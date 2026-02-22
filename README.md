# notion-mdpub-pipeline

Notion を執筆環境とし、Custom Agent で mdpub 互換 Markdown に変換、GitHub Actions 経由でクラウドストレージへ配送するパイプラインのリファレンス実装。

Gutenberg ブロック変換・WordPress 投稿は [mdpub-wpblocks](https://github.com/sakashita44/mdpub-wpblocks) の責務であり、本リポジトリでは扱わない。

## ディレクトリ構成

```text
.github/workflows/   # GitHub Actions ワークフロー
docs/                # アーキテクチャ・セットアップ手順
rules/               # mdpub 変換ルール（Agent Instructions の元文書）
src/                 # StorageAdapter 等のスクリプト
posts/               # 記事ディレクトリ（本リポジトリでは空）
```

## ドキュメント

- [アーキテクチャ](docs/ARCHITECTURE.md) — パイプライン全体の構成と各レイヤーの役割
- [セットアップ](docs/SETUP.md) — リポジトリ構成の選択肢と導入手順

## コマンド

```bash
npm run format        # Prettier + markdownlint --fix
npm run format:check  # Prettier チェックのみ
npm run lint:md       # markdownlint チェックのみ
npm run fix           # format + lint:md
```

## 関連リポジトリ

- [mdpub-wpblocks](https://github.com/sakashita44/mdpub-wpblocks) — MD → Gutenberg ブロック変換 CLI（投稿エンジン）
