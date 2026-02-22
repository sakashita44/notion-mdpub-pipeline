import type { StorageAdapter } from './adapter.js';

/** Dropbox バックエンドの StorageAdapter 実装（未実装スタブ） */
export class DropboxAdapter implements StorageAdapter {
    uploadFile(_path: string, _content: Buffer): Promise<void> {
        throw new Error('DropboxAdapter.uploadFile は未実装です');
    }

    deleteFile(_path: string): Promise<void> {
        throw new Error('DropboxAdapter.deleteFile は未実装です');
    }
}
