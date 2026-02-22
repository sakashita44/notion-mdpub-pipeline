import type { StorageAdapter } from './adapter.js';

const UPLOAD_URL = 'https://content.dropboxapi.com/2/files/upload';
const DELETE_URL = 'https://api.dropboxapi.com/2/files/delete_v2';

/** Dropbox バックエンドの StorageAdapter 実装 */
export class DropboxAdapter implements StorageAdapter {
    private readonly token: string;

    constructor() {
        const token = process.env.DROPBOX_ACCESS_TOKEN;
        if (!token) {
            throw new Error(
                '環境変数 DROPBOX_ACCESS_TOKEN が設定されていません',
            );
        }
        this.token = token;
    }

    /**
     * ファイルを Dropbox にアップロードする（既存ファイルは上書き）。
     * @param path - アップロード先のパス（例: `blog/posts/my-slug/index.md`）
     * @param content - ファイル内容
     */
    async uploadFile(path: string, content: Buffer): Promise<void> {
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;

        const response = await fetch(UPLOAD_URL, {
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
                `Dropbox upload 失敗 (${response.status}): ${error}`,
            );
        }
    }

    /**
     * Dropbox 上のファイルを削除する。
     * ファイルが存在しない場合（path_lookup/not_found）は正常終了する。
     * @param path - 削除対象のパス
     */
    async deleteFile(path: string): Promise<void> {
        const dropboxPath = path.startsWith('/') ? path : `/${path}`;

        const response = await fetch(DELETE_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: dropboxPath }),
        });

        if (!response.ok) {
            const bodyText = await response.text();
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
                `Dropbox delete 失敗 (${response.status}): ${bodyText}`,
            );
        }
    }
}
