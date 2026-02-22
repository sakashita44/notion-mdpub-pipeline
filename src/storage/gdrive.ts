import type { StorageAdapter } from './adapter.js';

/** Google Drive バックエンドの StorageAdapter 実装（未実装スタブ） */
export class GDriveAdapter implements StorageAdapter {
    uploadFile(_path: string, _content: Buffer): Promise<void> {
        throw new Error('GDriveAdapter.uploadFile は未実装です');
    }

    deleteFile(_path: string): Promise<void> {
        throw new Error('GDriveAdapter.deleteFile は未実装です');
    }
}
