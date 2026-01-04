import {waitFor} from '@testing-library/react-native';
import state from '@/src/actions/test_data/state.json';
import axiosMock from '@/src/actions/test_data/axiosMock';
import configureStore from '@/src/store';
import {app} from '@/src/actions/index';
import {TFile} from '@/src/types';

describe('app.js actions functions', () => {
    const mockContent = {
        id: 'blobA',
        imageId: 'imageA',
        uri: 'uri',
        stickId: 'stickId',
        cipher: 'cipher',
        fileSize: [1000],
        user: {id: 'userX'},
    };
    let store: ReturnType<typeof configureStore>['store'];
    beforeAll(() => {
        axiosMock();
    });
    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    test('cachePhoto()', async () => {
        // store initial state
        expect(store.getState().photosCache.blobA).toBeUndefined();

        const func = app.cachePhoto({image: mockContent, userId: state.auth.user.id, type: '', isConnected: true});
        await waitFor(() => func(store.dispatch));

        // store updated state
        expect(store.getState().photosCache.blobA).toBeTruthy();
        expect(store.getState().download.blobA).toBeUndefined();
        expect(store.getState().pendingSessions.stickId).toBeUndefined();
    });
    test('cacheFile()', async () => {
        // store initial state
        expect(store.getState().vaultCache.fileA).toBeUndefined();
        const func = app.cacheFile({
            file: {
                uriKey: 'fileA',
                name: 'file_name',
                stickId: 'stickId',
                cipher: 'cipher',
                fileSize: 100,
                user: 'userX',
            } as TFile,
            context: 'vault',
        });
        await waitFor(() => func(store.dispatch));

        // store updated state
        expect(store.getState().vaultCache.fileA).toBeTruthy();
        expect(store.getState().pendingSessions.stickId).toBeUndefined();
    });
});
