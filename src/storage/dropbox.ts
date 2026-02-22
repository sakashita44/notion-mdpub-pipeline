import type { StorageAdapter } from './adapter.js';

const DEFAULT_UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';
const DEFAULT_DELETE_URL = 'https://api.dropboxapi.com/2/files/delete_v2';

/** DropboxAdapter のコンストラクタオプション */
export interface DropboxAdapterOptions {
    /** アップロード API の URL（テスト用オーバーライド） */
    uploadUrl?: string;
    /** 削除 API の URL（テスト用オーバーライド） */
    deleteUrl?: string;
}

/** Dropbox バックエンドの StorageAdapter 実装 */
export class DropboxAdapter implements StorageAdapter {
    private readonly token: string;
    private readonly uploadUrl: string;
    private readonly deleteUrl: string;

    constructor(options?: DropboxAdapterOptions) {
        const token = process.env.DROPBOX_ACCESS_TOKEN;
        if (!token) {
            throw new Error(
                '環境変数 DROPBOX_ACCESS_TOKEN が設定されていません',
            );
        }
        this.token = token;
        this.uploadUrl = options?.uploadUrl ?? DEFAULT_UPLOAD_URL;
        this.deleteUrl = options?.deleteUrl ?? DEFAULT_DELETE_URL;
    }

    /**
     * ファイルを Dropbox にアップロードする（既存ファイルは上書き）。
     * @param path - アップロード先のパス（例: `blog/posts/my-slug/index.md`）
     * @param content - ファイル内容
     */
    async uploadFile(path: string, content: Buffer): Promise<void> {
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;

        const response = await fetch(this.uploadUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/octet-stream',
                'Dropbox-API-Arg': JSON.stringify({
                    path: dropboxPath,
                    mode: 'overwrite',
                    autorename: false,
                    mute: false,
                }),
            },
            body: new Uint8Array(content),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(
                this.formatErrorMessage('upload', response.status, error),
            );
        }
        // 成功時もレスポンスボディを消費してリソースリークを防止
        await response.text();
    }

    /**
     * Dropbox 上のファイルを削除する。
     * ファイルが存在しない場合（path_lookup/not_found）は正常終了する。
     * @param path - 削除対象のパス
     */
    async deleteFile(path: string): Promise<void> {
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;

        const response = await fetch(this.deleteUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: dropboxPath }),
        });

        const bodyText = await response.text();

        if (!response.ok) {
            // ファイルが存在しない場合は正常終了
            if (response.status === 409) {
                try {
                    const body = JSON.parse(bodyText) as {
                        error_summary?: string;
                    };
                    if (
                        body.error_summary?.startsWith('path_lookup/not_found')
                    ) {
                        return;
                    }
                } catch {
                    // JSON パース失敗は通常のエラーとして処理
                }
            }
            throw new Error(
                this.formatErrorMessage('delete', response.status, bodyText),
            );
        }
    }

    /** ステータスコードに応じたエラーメッセージを生成する */
    private formatErrorMessage(
        operation: string,
        status: number,
        body: string,
    ): string {
        const base = `Dropbox ${operation} 失敗 (${status})`;
        if (status === 401) {
            return `${base}: 認証エラー（トークンが無効または期限切れの可能性があります）: ${body}`;
        }
        return `${base}: ${body}`;
    }
}
