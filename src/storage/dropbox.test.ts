import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DropboxAdapter } from './dropbox.js';

/** テスト用の fetch モックレスポンスを生成する */
function mockResponse(status: number, body: string | object): Response {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    return {
        ok: status >= 200 && status < 300,
        status,
        text: () => Promise.resolve(bodyStr),
    } as unknown as Response;
}

describe('DropboxAdapter', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv, DROPBOX_ACCESS_TOKEN: 'test-token' };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    describe('コンストラクタ', () => {
        it('DROPBOX_ACCESS_TOKEN が未設定の場合エラーをスローする', () => {
            delete process.env.DROPBOX_ACCESS_TOKEN;
            expect(() => new DropboxAdapter()).toThrowError(
                '環境変数 DROPBOX_ACCESS_TOKEN が設定されていません',
            );
        });

        it('DROPBOX_ACCESS_TOKEN が設定されている場合インスタンスを生成する', () => {
            expect(() => new DropboxAdapter()).not.toThrow();
        });
    });

    describe('uploadFile', () => {
        it('正常にアップロードできる', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(mockResponse(200, '{}')),
            );
            const adapter = new DropboxAdapter();
            const result = await adapter.uploadFile(
                'blog/posts/index.md',
                Buffer.from('content'),
            );
            expect(result).toEqual({ status: 'uploaded' });
        });

        it('パスに先頭スラッシュがない場合は付与する', async () => {
            const mockFetch = vi
                .fn()
                .mockResolvedValue(mockResponse(200, '{}'));
            vi.stubGlobal('fetch', mockFetch);
            const adapter = new DropboxAdapter();
            await adapter.uploadFile('blog/index.md', Buffer.from('content'));
            const callArg = mockFetch.mock.calls[0][1] as {
                headers: Record<string, string>;
            };
            const arg = JSON.parse(callArg.headers['Dropbox-API-Arg']) as {
                path: string;
            };
            expect(arg.path).toBe('/blog/index.md');
        });

        it('パスに先頭スラッシュがある場合は二重付与しない', async () => {
            const mockFetch = vi
                .fn()
                .mockResolvedValue(mockResponse(200, '{}'));
            vi.stubGlobal('fetch', mockFetch);
            const adapter = new DropboxAdapter();
            await adapter.uploadFile('/blog/index.md', Buffer.from('content'));
            const callArg = mockFetch.mock.calls[0][1] as {
                headers: Record<string, string>;
            };
            const arg = JSON.parse(callArg.headers['Dropbox-API-Arg']) as {
                path: string;
            };
            expect(arg.path).toBe('/blog/index.md');
        });

        it('API がエラーを返した場合はエラーをスローする', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(mockResponse(500, 'Server Error')),
            );
            const adapter = new DropboxAdapter();
            await expect(
                adapter.uploadFile('blog/index.md', Buffer.from('content')),
            ).rejects.toThrowError('Dropbox upload 失敗 (500): Server Error');
        });

        it('401 の場合はトークン期限切れの可能性を示すメッセージを含む', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(mockResponse(401, 'Unauthorized')),
            );
            const adapter = new DropboxAdapter();
            await expect(
                adapter.uploadFile('blog/index.md', Buffer.from('content')),
            ).rejects.toThrowError(
                'Dropbox upload 失敗 (401): 認証エラー（トークンが無効または期限切れの可能性があります）: Unauthorized',
            );
        });

        describe('overwrite オプション', () => {
            it('デフォルト（overwrite 未指定）では mode: add で送信する', async () => {
                const mockFetch = vi
                    .fn()
                    .mockResolvedValue(mockResponse(200, '{}'));
                vi.stubGlobal('fetch', mockFetch);
                const adapter = new DropboxAdapter();
                await adapter.uploadFile(
                    'blog/index.md',
                    Buffer.from('content'),
                );
                const callArg = mockFetch.mock.calls[0][1] as {
                    headers: Record<string, string>;
                };
                const arg = JSON.parse(callArg.headers['Dropbox-API-Arg']) as {
                    mode: string;
                };
                expect(arg.mode).toBe('add');
            });

            it('overwrite: false で既存ファイルと衝突した場合はスキップ結果を返す', async () => {
                vi.stubGlobal(
                    'fetch',
                    vi.fn().mockResolvedValue(
                        mockResponse(409, {
                            error_summary: 'path/conflict/file/...',
                        }),
                    ),
                );
                const adapter = new DropboxAdapter();
                const result = await adapter.uploadFile(
                    'blog/index.md',
                    Buffer.from('content'),
                    { overwrite: false },
                );
                expect(result).toEqual({ status: 'skipped' });
            });

            it('overwrite: false で 409 だが path/conflict 以外はエラーをスローする', async () => {
                vi.stubGlobal(
                    'fetch',
                    vi.fn().mockResolvedValue(
                        mockResponse(409, {
                            error_summary: 'other/error/...',
                        }),
                    ),
                );
                const adapter = new DropboxAdapter();
                await expect(
                    adapter.uploadFile('blog/index.md', Buffer.from('content')),
                ).rejects.toThrowError('Dropbox upload 失敗 (409)');
            });

            it('overwrite: true では mode: overwrite で送信する', async () => {
                const mockFetch = vi
                    .fn()
                    .mockResolvedValue(mockResponse(200, '{}'));
                vi.stubGlobal('fetch', mockFetch);
                const adapter = new DropboxAdapter();
                const result = await adapter.uploadFile(
                    'blog/index.md',
                    Buffer.from('content'),
                    { overwrite: true },
                );
                const callArg = mockFetch.mock.calls[0][1] as {
                    headers: Record<string, string>;
                };
                const arg = JSON.parse(callArg.headers['Dropbox-API-Arg']) as {
                    mode: string;
                };
                expect(arg.mode).toBe('overwrite');
                expect(result).toEqual({ status: 'uploaded' });
            });

            it('overwrite: true で 409 が返った場合はスキップせずエラーをスローする', async () => {
                vi.stubGlobal(
                    'fetch',
                    vi.fn().mockResolvedValue(
                        mockResponse(409, {
                            error_summary: 'path/conflict/file/...',
                        }),
                    ),
                );
                const adapter = new DropboxAdapter();
                await expect(
                    adapter.uploadFile(
                        'blog/index.md',
                        Buffer.from('content'),
                        { overwrite: true },
                    ),
                ).rejects.toThrowError('Dropbox upload 失敗 (409)');
            });
        });
    });

    describe('deleteFile', () => {
        it('正常に削除できる', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(mockResponse(200, '{}')),
            );
            const adapter = new DropboxAdapter();
            await expect(
                adapter.deleteFile('blog/index.md'),
            ).resolves.toBeUndefined();
        });

        it('ファイルが存在しない場合（path_lookup/not_found）はエラーにならない', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(
                    mockResponse(409, {
                        error_summary: 'path_lookup/not_found/...',
                    }),
                ),
            );
            const adapter = new DropboxAdapter();
            await expect(
                adapter.deleteFile('blog/index.md'),
            ).resolves.toBeUndefined();
        });

        it('409 でも path_lookup/not_found 以外はエラーをスローする', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(
                    mockResponse(409, {
                        error_summary: 'path_write/conflict/...',
                    }),
                ),
            );
            const adapter = new DropboxAdapter();
            await expect(
                adapter.deleteFile('blog/index.md'),
            ).rejects.toThrowError('Dropbox delete 失敗 (409)');
        });

        it('401 の場合はトークン期限切れの可能性を示すメッセージを含む', async () => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValue(mockResponse(401, 'Unauthorized')),
            );
            const adapter = new DropboxAdapter();
            await expect(
                adapter.deleteFile('blog/index.md'),
            ).rejects.toThrowError(
                'Dropbox delete 失敗 (401): 認証エラー（トークンが無効または期限切れの可能性があります）: Unauthorized',
            );
        });
    });
});
