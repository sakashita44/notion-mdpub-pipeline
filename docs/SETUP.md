# セットアップ

## リポジトリ構成の選択肢

### 単独利用

本リポジトリを clone し、そのまま使用する。

```bash
git clone https://github.com/sakashita44/notion-mdpub-pipeline.git
cd notion-mdpub-pipeline
```

シンプルだが、本リポジトリの更新を取り込むには手動でのマージが必要。

### 2 リポジトリ構成（推奨）

本リポジトリの更新を継続的に追従したい場合は、別途 private リポジトリを作成し、本リポジトリを upstream として登録する構成が必要。

```text
notion-mdpub-pipeline (public)
  ↓ fetch & merge（ワークフロー・ルールを取り込む）
記事リポジトリ (private, ローカル)
  ↓ push origin
記事リポジトリ (private, GitHub)
```

記事コンテンツは private リポジトリにのみ存在し、public 側に漏れる経路がない。

#### 手順

1. GitHub 上に記事用の private リポジトリを作成する

1. private リポジトリに本リポジトリを upstream として登録する

    ```bash
    cd <your-private-repo>
    git remote add upstream git@github.com:sakashita44/notion-mdpub-pipeline.git

    # upstream への誤 push を防止
    git remote set-url --push upstream DISABLE
    ```

1. upstream の変更を取り込む

    ```bash
    git fetch upstream
    git merge upstream/main
    ```

    ワークフローやルールが更新された場合にこの手順で追従する。

## Secrets の設定

リポジトリ（2 リポジトリ構成の場合は private 側）の Settings → Secrets and variables → Actions に以下を登録する。

| Secret or Variable名   | 用途                                   |
| ---------------------- | -------------------------------------- |
| `STORAGE_BACKEND`      | 配送先（`dropbox` / `gdrive`）         |
| `DROPBOX_ACCESS_TOKEN` | Dropbox API トークン（Dropbox 使用時） |
