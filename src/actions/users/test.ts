import {waitFor} from '@testing-library/react-native';
import state from '../test_data/state.json';
import axiosMock from '../test_data/axiosMock';
import configureStore from '../../store';
import {users} from '..';
import {URL} from '../URL';
import {TUser} from '../../types';

describe('users.js actions functions', () => {
    let store: ReturnType<typeof configureStore>['store'];
    const mockURL = URL;

    beforeAll(() => {
        axiosMock();
    });

    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    test('searchUsers()', async () => {
        expect(store.getState().users.userX).toBeUndefined();
        expect(store.getState().url.usersUrl).not.toBe('next-search-url');

        const func = users.searchUsers({currentUrl: `${mockURL}/api/search/?q=omar`, loadMore: false});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().users.userX).toBeTruthy();
        expect(store.getState().url.usersUrl).toBe('next-search-url');
    });

    test('fetchUser()', async () => {
        const initialState = store.getState();
        expect(initialState.images.imageX).toBeUndefined();
        expect(initialState.imagesIds['userX-highlights']).toBeUndefined();
        expect(initialState.fetched.profiles.userX).toBeUndefined();
        expect(initialState.connections.firebaseRefX).toBeUndefined();
        expect(initialState.images.isProfileImageA).toBeUndefined();
        expect(initialState.imagesIds.userX).toBeUndefined();
        expect(initialState.url.imagesUrls.userX).not.toBe('next-images-url');

        const user = {id: 'userX'} as unknown as TUser;
        const func = users.fetchUser({user, isConnection: true, callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        // expect(updatedState.images.imageX).toBeTruthy();
        // expect(updatedState.imagesIds['userX-highlights']).toContain('abc-xyz');
        expect(updatedState.fetched.profiles.userX).toBe(true);
        // expect(updatedState.imagesIds.userX).toContain('isProfileImageA');
        // expect(updatedState.url.imagesUrls.userX).toBe('next-images-url');
    });

    test('blockUser()', async () => {
        // @ts-ignore
        const connection = state.connections[Object.keys(state.connections)[0]];

        expect(store.getState().auth.user.blockedIds).not.toContain(connection.id);

        const func = users.blockUser({user: connection, callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.auth.user.blockedIds).toContain(connection.id);
        expect(updatedState.connections[connection.firebaseRef]).toBeUndefined();
    });

    test('unblockUser()', async () => {
        const state = require('../test_data/_state.json');
        const connection: TUser = state.connections[Object.keys(state.connections)[0]];
        const user = {...state.auth.user, blockedIds: [connection.id]};
        const config = configureStore({...state, auth: {...state.auth, user}});
        store = config.store;

        const func = users.unblockUser({user: connection, callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().auth.user.blockedIds).not.toContain(connection.id);
    });

    test('fetchBlocked()', async () => {
        expect(store.getState().blocked.userX).toBeUndefined();

        const func = users.fetchBlocked();
        await waitFor(() => func(store.dispatch));

        expect(store.getState().blocked.userX).toBeTruthy();
    });

    test('sendConnectionRequest()', async () => {
        const target = {id: 'userX'} as unknown as TUser;
        const config = configureStore({...state, users: {userX: target}});
        store = config.store;

        const func = users.sendConnectionRequest({
            currentUser: state.auth.user as unknown as TUser,
            username: 'username',
            callback: jest.fn(),
        });
        await waitFor(() => func(store.dispatch));

        expect(store.getState().users.userX.requested).toBe(true);
    });

    test('cancelConnectionRequest()', async () => {
        const target = {id: 'userX', requested: true} as unknown as TUser;
        const config = configureStore({...state, users: {userX: target}});
        store = config.store;

        const func = users.cancelConnectionRequest({target});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().users.userX.requested).toBe(false);
    });

    test('connReqRes()', async () => {
        const fromUser = {id: 'userX', email: 'test@test.com'} as unknown as TUser;
        const request = {timestamp: '999', fromUser};
        const config = configureStore({...state, connectionRequests: {999: request}});
        store = config.store;

        expect(store.getState().connections.userX).toBeUndefined();

        const func = users.connReqRes(fromUser, state.auth.user as unknown as TUser, request, true);
        await func(store.dispatch);

        expect(store.getState().connectionRequests['999'].accepted).toBe(true);
    });
});
