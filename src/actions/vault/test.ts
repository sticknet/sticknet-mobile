import {waitFor} from '@testing-library/react-native';
import configureStore from '../../store';
import axiosMock from '../test_data/axiosMock';
import state from '../test_data/state.json';
import {vault} from '..';
import {URL} from '../URL';

describe('vault actions', () => {
    let store: ReturnType<typeof configureStore>['store'];

    beforeAll(() => {
        axiosMock();
    });

    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    test('uploadVaultFiles()', async () => {
        const params = {
            assets: [
                {uri: 'file://path/to/file1.jpg', type: 'image/jpeg', fileSize: 1234},
                {uri: 'file://path/to/file2.jpg', type: 'image/jpeg', fileSize: 5678},
            ],
            folderId: 'folderId',
            albumId: 'albumId',
            isCameraUploads: false,
            isAddingToVault: true,
            context: 'vault',
            userId: 'userId',
            dispatch: store.dispatch,
            isBasic: false,
        };
        // @ts-ignore
        const func = vault.uploadVaultFiles(params);
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.files).toBeDefined();
        expect(Object.keys(newState.files).length).toBeGreaterThan(0);
        expect(newState.filesTree.folderId).toBeDefined();
        expect(newState.filesTree.folderId).toHaveLength(4);
    });

    test('fetchFiles()', async () => {
        const func = vault.fetchFiles({currentUrl: null, folderId: 'folderId', firstFetch: true, refresh: false});
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.files).toBeDefined();
        expect(Object.keys(newState.files).length).toBeGreaterThan(0);
        expect(newState.filesTree.folderId).toBeDefined();
        expect(newState.filesTree.folderId).toContain('file1');
        expect(newState.filesTree.folderId).toContain('file2');
    });

    test('fetchPhotos()', async () => {
        const func = vault.fetchPhotos(null, 'albumId', false, true);
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.photos).toBeDefined();
        expect(Object.keys(newState.photos).length).toBeGreaterThan(0);
    });

    test('fetchVaultAlbums()', async () => {
        const func = vault.fetchVaultAlbums(true);
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.vaultAlbums).toBeDefined();
        expect(Object.keys(newState.vaultAlbums).length).toBeGreaterThan(0);
    });

    test('fetchVaultNotes()', async () => {
        const func = vault.fetchVaultNotes(`${URL}/api/fetch-vault-notes/`, true);
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.vaultNotes).toBeDefined();
        expect(Object.keys(newState.vaultNotes).length).toBeGreaterThan(0);
    });

    test('createFolder()', async () => {
        const func = vault.createFolder({parentFolderId: 'parentFolderId', name: 'name'});
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.files).toBeDefined();
        expect(Object.keys(newState.files).length).toBeGreaterThan(0);
        expect(newState.filesTree.parentFolderId).toBeDefined();
    });

    test('createVaultAlbum()', async () => {
        const func = vault.createVaultAlbum('name');
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.vaultAlbums).toBeDefined();
        expect(Object.keys(newState.vaultAlbums).length).toBeGreaterThan(0);
    });

    test('createVaultNote()', async () => {
        const func = vault.createVaultNote({text: 'text', callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.vaultNotes).toBeDefined();
        expect(Object.keys(newState.vaultNotes).length).toBeGreaterThan(0);
    });

    test('updateVaultNote()', async () => {
        const func = vault.updateVaultNote({
            note: {id: 1, timestamp: 'timestamp', text: '', cipher: '', user: 1},
            text: 'text',
        });
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.vaultNotes.timestamp.text).toBe('text');
    });

    test('openFolder()', () => {
        const func = vault.openFolder('folder');
        func(store.dispatch);

        const newState = store.getState();
        expect(newState.appTemp.folderStack).toHaveLength(2);
    });

    test('closeFolder()', () => {
        const config = configureStore({
            ...state,
            appTemp: {
                ...state.appTemp,
                folderStack: [
                    {id: 'home', name: 'home'},
                    {id: 'folder', name: 'folder'},
                ],
            },
        });
        store = config.store;
        const func = vault.closeFolder();
        func(store.dispatch);

        const newState = store.getState();
        expect(newState.appTemp.folderStack).toHaveLength(1);
    });

    test('deleteFiles()', async () => {
        const func = vault.deleteFiles(['fileId']);
        // @ts-ignore
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.files.fileId).toBeUndefined();
    });

    test('deleteItem()', async () => {
        const initialState = {
            ...state,
            files: {
                uriKey: {
                    id: 'itemId',
                    uriKey: 'uriKey',
                    name: 'Test File',
                },
            },
            filesTree: {
                parentId: ['uriKey'],
            },
        };
        const config = configureStore(initialState);
        store = config.store;
        const func = vault.deleteItem({id: 'itemId', uriKey: 'uriKey'}, 'file', {id: 'parentId'});
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.files.itemId).toBeUndefined();
        expect(newState.filesTree.parentId).not.toContain('itemId');
    });

    test('searchItems()', async () => {
        const func = vault.searchItems(`${URL}/api/search-files/?q=flower&limit=15`, true);
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.files).toBeDefined();
        expect(Object.keys(newState.files).length).toBeGreaterThan(0);
        expect(newState.filesTree.search).toBeDefined();
    });

    test('clearSearchItems()', () => {
        const func = vault.clearSearchItems();
        func(store.dispatch);

        const newState = store.getState();
        expect(newState.filesTree.search).toHaveLength(0);
    });

    test('renamingItem()', () => {
        const func = vault.renamingItem({id: 'itemId'}, 'routeName');
        func(store.dispatch);

        const newState = store.getState();
        expect(newState.appTemp.renamingItem).toEqual({id: 'itemId', routeName: 'routeName'});
    });

    test('cancelRenaming()', () => {
        const func = vault.cancelRenaming();
        func(store.dispatch);

        const newState = store.getState();
        expect(newState.appTemp.renamingItem).toBeNull();
    });

    test('renameFile()', async () => {
        const initialState = {
            ...state,
            files: {
                uriKey: {
                    id: 'fileId',
                    name: 'Old Name',
                    uriKey: 'uriKey',
                },
            },
            filesTree: {
                parentId: ['uriKey'],
            },
        };
        const config = configureStore(initialState);
        store = config.store;

        const func = vault.renameFile({id: 'fileId', uriKey: 'uriKey'}, 'newName');
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.files.uriKey.name).toBe('newName');
    });

    test('movingFile()', () => {
        const func = vault.movingFile({id: 'fileId'});
        func(store.dispatch);

        const newState = store.getState();
        expect(newState.appTemp.movingFile).toEqual({id: 'fileId'});
    });

    test('cancelMovingFile()', () => {
        const func = vault.cancelMovingFile();
        func(store.dispatch);

        const newState = store.getState();
        expect(newState.appTemp.movingFile).toBeNull();
    });

    test('moveFile()', async () => {
        const initialState = {
            ...state,
            files: {
                uriKey: {
                    id: 'fileId',
                    name: 'Test File',
                    folder: 'sourceFolder',
                    uriKey: 'uriKey',
                },
            },
            filesTree: {
                sourceFolder: ['uriKey'],
                destinationFolder: [],
            },
        };
        const config = configureStore(initialState);
        store = config.store;
        const func = vault.moveFile(
            {id: 'fileId', folder: 'sourceFolder', uriKey: 'uriKey'},
            {id: 'destinationFolder'},
        );
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.filesTree.sourceFolder).not.toContain('uriKey');
        expect(newState.filesTree.destinationFolder).toContain('uriKey');
    });
});
