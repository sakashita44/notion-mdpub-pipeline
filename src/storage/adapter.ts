/** uploadFile() のオプション */
export interface UploadOptions {
    /** 既存ファイルを上書きするか（デフォルト: false） */
    overwrite?: boolean;
}

/** uploadFile() の結果 */
export interface UploadResult {
    /** `'uploaded'`: アップロード成功、`'skipped'`: 既存ファイルがあるためスキップ */
    status: 'uploaded' | 'skipped';
}

/**
 * クラウドストレージへのファイル配送を抽象化するインターフェース。
 * Dropbox / Google Drive 等のバックエンドを差し替え可能にする。
 */
export interface StorageAdapter {
    /**
     * ファイルをストレージにアップロードする。
     * @param path - アップロード先のパス（例: `blog/posts/my-slug/index.md`）
     * @param content - ファイル内容
     * @param options - アップロードオプション
     */
    uploadFile(
        path: string,
        content: Buffer,
        options?: UploadOptions,
    ): Promise<UploadResult>;

    /**
     * ストレージ上のファイルを削除する。
     * @param path - 削除対象のパス
     */
    deleteFile(path: string): Promise<void>;
}

/** `createStorageAdapter()` の `backend` パラメータに指定可能な値 */
export type StorageBackend = 'dropbox' | 'gdrive';
