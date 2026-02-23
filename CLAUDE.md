# notion-mdpub-pipeline

## プロジェクト概要

Notion → mdpub 形式 Markdown 変換パイプラインの **テンプレート管理用 public リポジトリ**。
GitHub Actions ワークフロー、変換ルール、テンプレートを管理する。

Gutenberg ブロック変換は [mdpub-wpblocks](https://github.com/sakashita44/mdpub-wpblocks) の責務であり、本リポジトリでは扱わない。

## ワークスペース構成

- **本リポジトリ（public）**: Actions ワークフロー、変換ルール、テンプレート
- **blog-drafts（private）**: 実記事 MD、Secrets。本リポジトリを upstream として追従
- **mdpub-wpblocks**: MD → Gutenberg ブロック変換 CLI。本リポジトリとは独立した投稿エンジン

upstream merge の方向: **本リポジトリ → blog-drafts**

記事コンテンツが本リポジトリに混入してはならない。

## コマンド

```bash
npm run build         # TypeScript ビルド（dist/ に出力）
npm run build:check   # TypeScript 型チェック（noEmit）
npm run format        # Prettier + ESLint --fix + markdownlint --fix
npm run format:check  # Prettier チェックのみ
npm run lint          # ESLint + markdownlint チェック
npm run lint:md       # markdownlint チェックのみ
npm run fix           # format + lint
```

## アーキテクチャ

```text
Notion API
  ↓
notion-mdpub-pipeline (GitHub Actions)
  ├── Markdown 変換
  ├── 画像処理
  └── クラウドストレージ配送
        ↓
blog-drafts (記事リポジトリ)
        ↓
mdpub-wpblocks (WordPress 投稿)
```

### ディレクトリ構成

```text
src/
  storage/
    adapter.ts       # StorageAdapter / UploadOptions / UploadResult 型定義
    factory.ts       # createStorageAdapter() ファクトリ関数
    dropbox.ts       # Dropbox 実装
    gdrive.ts        # Google Drive 実装（スタブ）
    index.ts         # re-export
.github/workflows/
  deliver.yml        # 記事配送ワークフロー
```

## 規約

- 言語: 日本語（コメント、ドキュメント、PR、コミットメッセージ）
- コミット: Conventional Commits（`feat:`, `fix:`, `chore:` 等）
- ブランチ: `<prefix>/<yyyymm>/sakashita44/<issue_num>-<content>`
- フォーマッタ設定は mdpub-wpblocks と統一（upstream merge 時のフォーマット衝突防止）
