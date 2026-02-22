# アーキテクチャ

## 概要

```text
Notion (執筆環境)
  ↓ Custom Agent（mdpub 形式 MD に変換）
GitHub (テキスト中継点・private リポジトリ)
  ↓ GitHub Actions → StorageAdapter
記事ディレクトリ（配送先）
  ├── index.md    ← 自動配送
  └── images/     ← 手動配置 or 自動配送
  ↓ mdpub publish（PC 上で実行）
WordPress
```

## 各レイヤーの役割

### Notion（執筆環境）

リッチテキストで記事を執筆し、DB プロパティで slug・categories・tags 等のメタ情報を管理する。

### Custom Agent（変換レイヤー）

Notion ページを読み取り、mdpub 互換の Markdown（frontmatter + 本文）を生成する。

- frontmatter は DB プロパティから、本文はページ内容からそれぞれ変換
- mdpub 固有記法（`:::columns`、KaTeX `$...$`、oEmbed 単独行 URL 等）への変換は Agent のドメイン知識で処理
- 生成した MD は GitHub MCP 経由でリポジトリに push

### GitHub Actions（配送レイヤー）

`posts/` 配下への push をトリガーに、StorageAdapter 経由で該当記事ディレクトリへファイルを配送する。初期対応は Dropbox / Google Drive。

### 記事ディレクトリ

```text
<sync-root>/blog/posts/
├── <slug>/
│   ├── index.md       ← GitHub Actions から自動配送
│   └── images/
│       └── *.jpg/png  ← 手動配置 or 自動配送
└── ...
```

### mdpub publish（投稿実行）

PC 上で `mdpub publish` を実行し、MD → Gutenberg ブロック変換 → WordPress REST API で投稿する。
詳細は [mdpub-wpblocks](https://github.com/sakashita44/mdpub-wpblocks) を参照。

## 画像の扱い

Agent が出力する MD 内の画像参照には 2 つのモードがある。1 記事内での混在も可能。

### モード A: ローカル画像（手動配置）

```markdown
![alt](images/photo.jpg 'caption')
```

記事ディレクトリに手動で画像を配置する。Agent は Notion 上の画像ブロックからファイル名参照を生成する。

### モード B: Notion 画像（自動配送）

```markdown
![alt](notion-image://block_id 'caption')
```

Actions が `notion-image://` スキームを検出し、Notion API で画像を取得して自動配送する。
初期段階ではモード A のみで運用し、必要に応じてモード B を有効化できる。
