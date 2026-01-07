import {waitFor} from '@testing-library/react-native';
import state from '@/src/actions/test_data/state.json';
import axiosMock from '@/src/actions/test_data/axiosMock';
import configureStore from '@/src/store';
import {notifications} from '..';
import CommonNative from '@/modules/common-native';

describe('notifications.js actions functions', () => {
    const mockURL = CommonNative.mainURL;
    const groupId = state.auth.user.groupsIds[0];
    let store: ReturnType<typeof configureStore>['store'];

    beforeAll(() => {
        axiosMock();
    });

    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    test('fetchNotifications()', async () => {
        // store initial state
        // notifications
        expect(store.getState().url.notificationsUrl).toBeUndefined();
        expect(store.getState().fetched.notifications).toBe(false);

        // group requests
        expect(store.getState().groupRequests.groupA).toBeUndefined();
        expect(store.getState().groupRequests.groupB).toBeUndefined();
        expect(store.getState().fetched.groupRequests.groupA).toBeUndefined();
        expect(store.getState().fetched.groupRequests.groupB).toBeUndefined();

        // connection requests
        expect(Object.keys(store.getState().connectionRequests)).toHaveLength(0);

        const func = notifications.fetchNotifications();
        await waitFor(() => func(store.dispatch));

        // store updated state
        // group requests
        expect(store.getState().groupRequests.groupA).toBeTruthy();
        expect(store.getState().groupRequests.groupB).toBeTruthy();
        expect(store.getState().fetched.groupRequests.groupA).toBe(true);
        expect(store.getState().fetched.groupRequests.groupB).toBe(true);

        // connection requests
        expect(Object.keys(store.getState().connectionRequests)).toHaveLength(1);
    });
});
