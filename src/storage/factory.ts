import type { StorageAdapter, StorageBackend } from './adapter.js';
import { DropboxAdapter } from './dropbox.js';
import { GDriveAdapter } from './gdrive.js';

/**
 * 環境変数 `STORAGE_BACKEND` に応じた StorageAdapter を生成する。
 * 引数で明示的にバックエンドを指定することも可能。
 *
 * @param backend - 使用するバックエンド。省略時は `STORAGE_BACKEND` 環境変数を参照
 * @returns 対応する StorageAdapter インスタンス
 * @throws バックエンドが未指定または不正な場合
 */
export function createStorageAdapter(backend?: StorageBackend): StorageAdapter {
    const resolved = backend ?? (process.env.STORAGE_BACKEND as StorageBackend);

    switch (resolved) {
        case 'dropbox':
            return new DropboxAdapter();
        case 'gdrive':
            return new GDriveAdapter();
        default:
            throw new Error(
                `未対応の STORAGE_BACKEND: "${String(resolved)}"。` +
                    '有効な値: "dropbox" | "gdrive"',
            );
    }
}
