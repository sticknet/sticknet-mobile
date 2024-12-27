import AsyncStorage from '@react-native-async-storage/async-storage';
import {waitFor} from '@testing-library/react-native';
import MockAdapter from 'axios-mock-adapter';
import {Alert} from 'react-native';
import axios from 'axios';
import state from '../test_data/state.json';
import axiosMock from '../test_data/axiosMock';
import configureStore from '../../store';
import {auth} from '..';
import {authInitialState} from '../../reducers/auth';
import {fetchedInitialState} from '../../reducers/fetched';
import {appInitialState} from '../../reducers/app';
import {appTempInitialState} from '../../reducers/appTemp';
import {URL} from '../URL';
import {globalData} from '../globalVariables';

describe('auth.js actions functions', () => {
    let store: ReturnType<typeof configureStore>['store'];
    let mock: MockAdapter;
    process.env.LOCAL_TEST = 'true';
    const initialAuthState = {...state, auth: {...state.auth, finishedRegistration: false, user: null}};

    beforeEach(() => {
        axiosMock();
        const config = configureStore(state);
        store = config.store;
    });

    test('requestEmailCode()', async () => {
        const config = configureStore(initialAuthState);
        store = config.store;

        expect(store.getState().app.email).toBe('');

        const func = auth.requestEmailCode({email: 'test@test.com', callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().app.email).toBe('test@test.com');
    });

    test('verifyEmailCode()', async () => {
        const config = configureStore(initialAuthState);
        store = config.store;

        expect(store.getState().auth.user).toBeNull();

        const func = auth.verifyEmailCode({
            email: 'test@test.com',
            code: '123456',
            loginCallback: jest.fn(),
            registerCallback: jest.fn(),
            newPassCallback: jest.fn(),
        });
        await waitFor(() => func(store.dispatch));

        expect(store.getState().auth.user.id).toBe('abc');
    });

    test('register()', async () => {
        const config = configureStore({
            ...state,
            groups: {},
            auth: {...state.auth, finishedRegistration: false, user: null},
        });
        store = config.store;

        expect(store.getState().auth.user).toBeNull();
        expect(store.getState().groups).toStrictEqual({});

        const func = auth.register({});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.auth.user.id).toBe('userX');
        expect(updatedState.auth.user.email).toBe('test@test.com');
        expect(updatedState.groups.groupX).toBeTruthy();
        const userId = await AsyncStorage.getItem('@userId');
        expect(userId).toBe('userX');
    });

    test('login() - case: incorrect password', async () => {
        const config = configureStore(initialAuthState);
        store = config.store;
        mock = new MockAdapter(axios);
        mock.onPost(`${URL}/api/login/`).reply(200, {correct: false});

        expect(store.getState().errors.passwordError).toBeNull();

        const func = auth.login({password: 'password', authId: 'test@test.com', callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().errors.passwordError).toBe('Incorrect password!');
        expect(store.getState().auth.user).toBeNull();
    });

    test('login() - case: too many attempts', async () => {
        const config = configureStore(initialAuthState);
        store = config.store;
        mock = new MockAdapter(axios);
        mock.onPost(`${URL}/api/login/`).reply(200, {correct: false, blocked: true, blockTime: 10});

        expect(store.getState().errors.passwordError).toBeNull();

        let isTitleCorrect = false;
        let isMessageCorrect = false;
        jest.spyOn(Alert, 'alert').mockImplementation(async (title, message) => {
            isTitleCorrect = title === 'Temporarily Blocked!';
            isMessageCorrect =
                message ===
                'Due to too many login attempts, we have temporarily blocked this account. Try again in 10 minutes.';
        });

        const func = auth.login({password: 'password', authId: 'test@test.com', callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        expect(isTitleCorrect).toBe(true);
        expect(isMessageCorrect).toBe(true);
    });

    test('logout()', async () => {
        globalData.unsubscribeNotifications = jest.fn();
        await AsyncStorage.setItem('@userId', 'userId');
        await AsyncStorage.setItem('@loggedIn', 'loggedIn');
        const initialState = store.getState();
        expect(initialState.auth.finishedRegistration).toBe(true);

        const func = auth.logout({callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.auth).toStrictEqual(authInitialState);
        expect(updatedState.imagesIds).toStrictEqual({});
        expect(updatedState.images).toStrictEqual({});
        expect(updatedState.messages).toStrictEqual({});
        expect(updatedState.groups).toStrictEqual({});
        expect(updatedState.connections).toStrictEqual({});
        expect(updatedState.fetched).toStrictEqual(fetchedInitialState);
        expect(updatedState.app).toStrictEqual(appInitialState);
        expect(updatedState.appTemp).toStrictEqual(appTempInitialState);
        const userId = await AsyncStorage.getItem('@userId');
        const loggedIn = await AsyncStorage.getItem('@loggedIn');
        expect(userId).toBeNull();
        expect(loggedIn).toBeNull();
    });

    test('checkUsername()', async () => {
        const initialState = store.getState();
        expect(initialState.appTemp.validUsername).toStrictEqual({});

        const func = auth.checkUsername({username: 'username'});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        expect(updatedState.appTemp.validUsername).toStrictEqual({username: 'username', valid: true});
        expect(updatedState.appTemp.searching).toBe(false);
    });

    test('fetchDevices()', async () => {
        expect(store.getState().appTemp.devices).not.toStrictEqual([{id: 'deviceA'}]);

        const func = auth.fetchDevices({callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        expect(store.getState().appTemp.devices).toStrictEqual([{id: 'deviceA'}]);
    });

    test('fetchUserDevices()', async () => {
        expect(store.getState().appTemp.devices).not.toStrictEqual([{id: 'deviceA'}]);

        const func = auth.fetchUserDevices(jest.fn());
        await waitFor(() => func(store.dispatch));

        expect(store.getState().appTemp.devices).toStrictEqual([{id: 'deviceA'}]);
    });

    test('updateChatDevice()', async () => {
        expect(store.getState().app.chatDeviceId).not.toBe('newDeviceId');

        const func = auth.updateChatDevice('newDeviceId', false);
        await waitFor(() => func(store.dispatch));

        expect(store.getState().app.preferences.chatDeviceId).toBe('newDeviceId');
    });

    test('cancelRegistration()', async () => {
        const config = configureStore({
            ...state,
            appTemp: {...state.appTemp, country: {code: 'US', dialCode: '+1', name: 'United States'}},
        });
        store = config.store;
        await AsyncStorage.setItem('@userId', 'userId');
        await AsyncStorage.setItem('@loggedIn', '1');

        const func = auth.cancelRegistration({callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        const userId = await AsyncStorage.getItem('@userId');
        const loggedIn = await AsyncStorage.getItem('@loggedIn');
        expect(userId).toBeNull();
        expect(loggedIn).toBeNull();
        expect(store.getState().appTemp).toStrictEqual(appTempInitialState);
    });

    test('recreateUser()', async () => {
        const config = configureStore({...state, auth: authInitialState, groups: {}});
        store = config.store;
        await AsyncStorage.setItem('@userId', 'oldUserId');

        const func = auth.recreateUser({callback: jest.fn()});
        await waitFor(() => func(store.dispatch));

        const updatedState = store.getState();
        const userId = await AsyncStorage.getItem('@userId');
        expect(updatedState.auth.user.id).toBe('newUserId');
        expect(updatedState.groups.groupX).toBeTruthy();
        expect(userId).toBe('newUserId');
    });
});
