/**
 * クラウドストレージへのファイル配送を抽象化するインターフェース。
 * Dropbox / Google Drive 等のバックエンドを差し替え可能にする。
 */
export interface StorageAdapter {
    /**
     * ファイルをストレージにアップロードする。
     * @param path - アップロード先のパス（例: `blog/posts/my-slug/index.md`）
     * @param content - ファイル内容
     */
    uploadFile(path: string, content: Buffer): Promise<void>;

    /**
     * ストレージ上のファイルを削除する。
     * @param path - 削除対象のパス
     */
    deleteFile(path: string): Promise<void>;
}

/** `createStorageAdapter()` の `backend` パラメータに指定可能な値 */
export type StorageBackend = 'dropbox' | 'gdrive';
