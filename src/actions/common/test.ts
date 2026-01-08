import {waitFor} from '@testing-library/react-native';
import state from '@/src/actions/test_data/state.json';
import axiosMock from '@/src/actions/test_data/axiosMock';
import configureStore from '@/src/store';
import {common} from '..';

describe('common.js actions functions', () => {
    let store: ReturnType<typeof configureStore>['store'];
    process.env.LOCAL_TEST = 'true';

    beforeEach(() => {
        axiosMock();
        const config = configureStore(state);
        store = config.store;
    });

    test('refreshUser()', async () => {
        // store initial state
        expect(store.getState().fetched.notificationsUnreadCount).toBe(1);
        expect(store.getState().auth.user.username).toBe('bob123');
        expect(Object.keys(store.getState().groups)).toHaveLength(1);
        expect(store.getState().imagesIds.highlights).toHaveLength(0);
        expect(store.getState().imagesIds.hidden).toHaveLength(0);

        expect(store.getState().imagesIds.favorites).not.toStrictEqual(['favA', 'favB']);
        expect(store.getState().app.chatDeviceId).not.toBe('deviceX');

        // Method call and state update
        const func = common.refreshUser({isGeneratingKeys: false, callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        // store updated state
        expect(store.getState().auth.user.username).toBe('bob999');
        expect(Object.keys(store.getState().groups)).toHaveLength(2);
        expect(store.getState().imagesIds.highlights).toHaveLength(1);
        expect(store.getState().imagesIds.hidden).toHaveLength(1);

        expect(store.getState().imagesIds.favorites).toStrictEqual(['favA', 'favB']);
        expect(store.getState().app.preferences.chatDeviceId).toBe('deviceX');
    });

    test('decryptPreKeys()', async () => {
        const config = configureStore({
            ...state,
            app: {...state.app, initComplete: false, secondPreKeysSet: [{keyId: '0'}]},
        });
        store = config.store;

        const func = common.decryptPreKeys({keys: []});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().app.initComplete).toBe(true);
        expect(store.getState().app.secondPreKeysSet).toBeNull();
    });

    test('fetchConnections()', async () => {
        // store initial state
        expect(Object.keys(store.getState().connections)).toHaveLength(1);
        expect(store.getState().auth.user.connectionsIds).toHaveLength(1);

        const func = common.fetchConnections();
        await waitFor(() => func(store.dispatch));

        // store updated state
        expect(Object.keys(store.getState().connections)).toHaveLength(2);
        expect(store.getState().auth.user.connectionsIds).toHaveLength(2);
    });
});
