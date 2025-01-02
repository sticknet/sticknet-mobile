import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Platform} from 'react-native';
import Keychain from '@sticknet/react-native-keychain';
import {firebase} from '@react-native-firebase/database';
import DeviceInfo from 'react-native-device-info';
import {Dispatch} from 'redux';
import Config from 'react-native-config';
import axios from '../myaxios';
import {firebaseRef, URL} from '../URL';
import StickProtocol from '../../native-modules/stick-protocol';
import {devRegistration, endMessageKeys, globalData, startMessageKeys} from '../globalVariables';
import SPH from '../SPHandlers';
import CommonNative from '../../native-modules/common-native';
import NavigationService from '../NavigationService';
import {getDeviceName, getUniqueDeviceId} from '../../utils';
import {
    app,
    appTemp,
    errors,
    auth,
    progress,
    images,
    groups,
    fetched,
    notifications,
    stickRoom,
    albums,
    connections,
    vault,
} from '../actionTypes';
import {initOneToOne} from '../stick-room';
import {TGroup, TUser} from '../../types';

const database = firebase.app().database(firebaseRef);
const bundleId = DeviceInfo.getBundleId();

export interface IAuthActions {
    logout: (params: TLogoutParams) => void;
    changePassword: (params: TChangePasswordParams) => void;
    deleteAccount: (params: TDeleteAccountParams) => void;
    deactivate: (params: TDeactivateParams) => void;
    requestEmailCode: (params: TRequestEmailCode) => void;
    checkUsername: (params: TCheckUsername) => void;
    register: (params: TRegisterParams) => void;
    login: (params: TLoginParams) => void;
    finishRegistration: (params: TFinishRegistration) => void;
    cancelRegistration: (params: TCancelRegistration) => void;
    oneTapRecoverPassword: (params: TOneTapRecoverPasswordParams) => void;
    fetchDevices: (params: TFetchDevicesParams) => void;
    recreateUser: (params: TRecreateUserParams) => void;
    verifyEmailCode: (params: TVerifyEmailCodeParams) => void;
    codeConfirmedDeleteAccount: (params: TCodeConfirmedDeleteAccountParams) => void;
    createE2EUser: (callback: () => void) => void;
    setFolderIcon: (folderIcon: string) => void;
    fetchUserDevices: (callback: () => void) => void;
    updateChatDevice: (deviceId: string, latest: boolean) => void;
}

type TRequestEmailCode = {email: string; callback: (registered: boolean) => void};

export function requestEmailCode({email, callback}: TRequestEmailCode) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const response = await axios.post(`${URL}/api/request-email-code/`, {email, addingEmail: false});
        dispatch({type: progress.END_LOADING});
        dispatch({type: app.DISPATCH_EMAIL, payload: {email}});
        callback(response.data.registered);
    };
}

type TVerifyEmailCodeParams = {
    email: string;
    code: string;
    loginCallback: () => void;
    registerCallback: () => void;
    newPassCallback: () => void;
};

export function verifyEmailCode({
    email,
    code,
    loginCallback,
    registerCallback,
    newPassCallback,
}: TVerifyEmailCodeParams) {
    return async function (dispatch: Dispatch) {
        try {
            dispatch({type: progress.START_LOADING});
            const response = await axios.post(`${URL}/api/verify-email-code/`, {
                code,
                email,
            });
            if (!response.data.correct) {
                dispatch({type: progress.END_LOADING});
                Alert.alert(
                    'Incorrect code!',
                    'Make sure you have entered the 6-digits code sent to your email correctly.',
                );
                return;
            }
            AsyncStorage.setItem('@email', email);
            handleUserVerified(response, email, 'email', dispatch, loginCallback, registerCallback, newPassCallback);
        } catch (e) {
            console.log('ERROR', e);
            dispatch({type: progress.END_LOADING});
        }
    };
}

export function dispatchWalletVerified({address}: {address: `0x${string}` | undefined}) {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {walletVerified: address}});
    };
}

type THandleWalletVerified = {
    ethereumAddress: string;
    loginCallback: () => void;
    registerCallback: () => void;
    newPassCallback: () => void;
};

export function handleWalletVerified({
    ethereumAddress,
    loginCallback,
    registerCallback,
    newPassCallback,
}: THandleWalletVerified) {
    return async function (dispatch: Dispatch) {
        try {
            dispatch({type: progress.START_LOADING});
            AsyncStorage.setItem('@ethereumAddress', ethereumAddress);
            const walletVerifyResponse = globalData.walletVerifyResponse;
            globalData.walletVerifiedResponse = null;
            handleUserVerified(
                walletVerifyResponse,
                ethereumAddress,
                'wallet',
                dispatch,
                loginCallback,
                registerCallback,
                newPassCallback,
            );
        } catch (e) {
            console.warn('ERROR', e);
            dispatch({type: progress.END_LOADING});
        }
    };
}

export function handleWalletVerifiedForDeletion() {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        globalData.accountSecret = globalData.walletVerifyResponse.data.accountSecret;
        await Keychain.setGenericPassword(
            'DeleteAccountToken',
            globalData.walletVerifyResponse.data.limitedAccessToken,
            {
                service: `${bundleId}.delete_account_token`,
            },
        );
        globalData.walletVerifyResponse = null;
        NavigationService.navigate('PasswordDeleteAccount');
        dispatch({type: progress.END_LOADING});
    };
}

type TGeneratePasswordFromWallet = {accountSecret: string; signedSecret: string; callback: (password: string) => void};

export function generatePasswordFromWallet({accountSecret, signedSecret, callback}: TGeneratePasswordFromWallet) {
    return async function () {
        const salt = await CommonNative.generateSecureRandom(32);
        const password = await StickProtocol.createPasswordHash(signedSecret, salt);
        const ethereumAddress = await AsyncStorage.getItem('@ethereumAddress');
        let token = globalData.limitedAccessToken;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.limited_access_token`});
            token = password;
        }
        const config = {headers: {Authorization: token}};
        await axios.post(
            `${URL}/api/set-account-secret/`,
            {accountSecret: accountSecret + salt, ethereumAddress},
            config,
        );
        callback(password);
    };
}

export async function handleUserVerified(
    response: any,
    authId: string,
    method: string,
    dispatch: Dispatch,
    loginCallback: () => void,
    registerCallback: () => void,
    newPassCallback: () => void,
) {
    globalData.limitedAccessToken = response.data.limitedAccessToken;
    await Keychain.setGenericPassword('LimitedAccessToken', response.data.limitedAccessToken, {
        service: `${bundleId}.limited_access_token`,
    });
    if (response.data.exists) {
        await AsyncStorage.setItem('@userId', response.data.userId);
        await AsyncStorage.setItem('@username', response.data.username);
        const ethereumAddress = method === 'wallet' ? authId : null;
        const email = method === 'email' ? authId : null;
        await dispatch({
            type: auth.DISPATCH_USER,
            payload: {
                id: response.data.userId,
                ethereumAddress,
                email,
                username: response.data.username,
            },
        });
        if (response.data.finishedRegistration) {
            globalData.passwordKey = response.data.passwordKey;
            globalData.accountSecret = response.data.accountSecret;
            await Keychain.setGenericPassword('PasswordSalt', response.data.passwordSalt, {
                service: `${bundleId}.password_salt`,
            });
            await loginCallback();
        } else {
            await newPassCallback();
        }
    } else await registerCallback();
    if (dispatch) dispatch({type: progress.END_LOADING});
}

type TRegisterParams = {
    email?: string;
    ethereumAddress?: string;
    id?: string;
    idToken?: string;
    name?: string;
    birthDay?: string;
    username?: string;
    callback?: () => void;
};

export function register(params: TRegisterParams) {
    return async function (dispatch: Dispatch) {
        await dispatch({type: errors.CLEAR_ERRORS});
        dispatch({type: progress.START_LOADING});
        const {email, ethereumAddress, id, idToken, name, birthDay, username, callback} = params;
        let token = globalData.limitedAccessToken;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.limited_access_token`});
            token = password;
        }
        const config = {headers: {Authorization: token}};
        try {
            const response = await axios.post(
                `${URL}/api/register/`,
                {
                    email,
                    ethereumAddress,
                    id,
                    idToken,
                    name,
                    birthDay,
                    username,
                    platform: Platform.OS,
                },
                config,
            );
            if (response.data.success) {
                AsyncStorage.setItem('@userId', response.data.user.id);
                await dispatch({type: auth.USER_LOADED, payload: response.data.user});
                dispatch({type: groups.FETCH_GROUPS, payload: response.data.user.groups});
                callback?.();
            } else {
                dispatch({type: errors.USERNAME_ERROR, payload: 'Username already taken!'});
            }
            dispatch({type: progress.END_LOADING});
        } catch (error) {
            if (error?.toString().includes('401')) {
                NavigationService.navigate('Authentication');
                await processLogout(dispatch);
            } else {
                Alert.alert('Unknown Error', error?.toString());
            }
            console.log('ERROR IN REGISTER', error);
            dispatch({type: progress.END_LOADING});
        }
    };
}

// Todo: need test, StickInit methods mocking not working

type TLoginParams = {password: string; authId: string; method: string; callback: () => void};

export function login({password, authId, method = 'email', callback}: TLoginParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: errors.CLEAR_ERRORS});
        dispatch({type: progress.START_LOADING});
        let token = globalData.limitedAccessToken;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.limited_access_token`});
            token = password;
        }
        const config = {headers: {Authorization: token}};
        const ethereumAddress = method === 'wallet' ? authId : null;
        const email = method === 'email' ? authId : null;
        const body: any = {ethereumAddress, email};
        const deviceId = await getUniqueDeviceId();
        body.deviceId = deviceId;
        dispatch({type: app.CURRENT_DEVICE_ID, payload: deviceId});
        body.deviceName = await getDeviceName();
        const res = await Keychain.getGenericPassword({service: `${bundleId}.password_salt`});
        const passwordSalt = res.password;
        body.passwordHash = await StickProtocol.createPasswordHash(password, passwordSalt);
        try {
            const response = await axios.post(`${URL}/api/login/`, body, config);
            if (response.data.correct) {
                dispatch({type: progress.END_LOADING});
                dispatch({type: appTemp.SHOW_PROGRESS_MODAL});
                dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {walletVerified: null}});
                globalData.limitedAccessToken = null;
                globalData.passwordKey = null;
                globalData.accountSecret = null;
                await Keychain.resetGenericPassword({service: `${bundleId}.limited_access_token`});
                globalData.token = `Token ${response.data.token}`;
                SPH.setUp(`Token ${response.data.token}`, response.data.user.id, response.data.user.oneTimeId);
                await Keychain.setGenericPassword('AuthToken', response.data.token, {
                    service: `${bundleId}.auth_token`,
                    accessGroup: `group.${bundleId}`,
                });
                await Keychain.resetGenericPassword({service: `${bundleId}.fcm_token`});
                dispatch({type: auth.FINISHED_REGISTRATION, payload: true});
                dispatch({type: stickRoom.NEW_ROOM, payload: {roomId: response.data.user.roomId}});
                dispatch({
                    type: images.FETCH_IMAGES_IDS,
                    payload: {images: response.data.user.highlightsIds, screenId: 'highlights'},
                });
                const {firstPreKeysSet, secondPreKeysSet} = await SPH.parsePreKeys(response.data.bundle);
                dispatch({type: app.DISPATCH_SECOND_PRE_KEYS_SET, payload: secondPreKeysSet});
                response.data.bundle.preKeys = firstPreKeysSet;
                await StickProtocol.reInitialize(response.data.bundle, password, response.data.user.id);
                await SPH.decryptProfile(response.data.user, dispatch);
                await dispatch({type: auth.USER_LOADED, payload: response.data.user});
                StickProtocol.decryptPreKeys(secondPreKeysSet).then(() => {
                    dispatch({type: app.INIT_COMPLETE});
                });
                await StickProtocol.decryptDSKs(response.data.bundle.DSKs);
                await SPH.decryptGroups(response.data.user.groups, dispatch, true);
                await dispatch({type: groups.FETCH_GROUPS, payload: response.data.user.groups});
                dispatch({type: app.INITIALIZED});
                AsyncStorage.setItem('@loggedIn', '1');
                await firebase.auth().signInWithCustomToken(response.data.firebaseToken);
                dispatch({type: appTemp.FINISHING_UP});
                const keychainResponse = await Keychain.getGenericPassword({service: `${bundleId}.auth_token`});
                token = `Token ${keychainResponse.password}`;
                const config = {headers: {Authorization: token}};
                globalData.token = config.headers.Authorization;
                const connResponse = await axios.get(`${URL}/api/connections/`, config);
                await dispatch({type: connections.FETCH_CONNECTIONS_ID, payload: connResponse.data});
                await dispatch({type: auth.UPDATE_USER_CONNECTIONS, payload: connResponse.data});
                callback();
            } else {
                dispatch({type: progress.END_LOADING});
                if (!response.data.blocked)
                    dispatch({type: errors.PASSWORD_ERROR, payload: 'The password you entered is incorrect!'});
                else {
                    Alert.alert(
                        'Temporarily Blocked!',
                        `Due to too many login attempts, we have temporarily blocked this account. Try again in ${
                            response.data.blockTime
                        } minute${response.data.blockTime !== 1 ? 's' : ''}.`,
                    );
                }
            }
        } catch (error) {
            dispatch({type: progress.END_LOADING});
            if (error?.toString().includes('401')) {
                NavigationService.navigate('Authentication');
                Alert.alert('Your session has expired', 'You need to verify your email again');
                await processLogout(dispatch);
            } else {
                Alert.alert('Unknown Error', error?.toString());
            }
        }
    };
}

// Todo: need test, StickInit methods mocking not working
type TFinishRegistration = {userId: string; method: string; password: string; authId: string; callback: () => void};

export function finishRegistration({userId, method = 'email', password, authId, callback}: TFinishRegistration) {
    return async function (dispatch: Dispatch) {
        if (Config.TESTING === '1') {
            dispatch({type: progress.START_LOADING});
        }
        dispatch({type: appTemp.SHOW_PROGRESS_MODAL});
        await Keychain.resetGenericPassword({service: `${bundleId}.fcm_token`});
        const ethereumAddress = method === 'wallet' ? authId : null;
        const email = method === 'email' ? authId : null;
        const body: any = await StickProtocol.initialize(userId, password);
        dispatch({type: appTemp.FINISHING_UP});
        dispatch({type: app.INITIALIZED});
        dispatch({type: app.INIT_COMPLETE});
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {walletVerified: null}});
        await Keychain.setGenericPassword('PasswordSalt', body.passwordSalt, {service: `${bundleId}.password_salt`});
        const deviceId = await getUniqueDeviceId();
        body.nextPreKeyId = 10;
        body.ethereumAddress = ethereumAddress;
        body.email = email;
        body.deviceId = deviceId;
        dispatch({type: app.CURRENT_DEVICE_ID, payload: deviceId});
        body.deviceName = await getDeviceName();
        let token = globalData.limitedAccessToken;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.limited_access_token`});
            token = password;
        }
        const config = {headers: {Authorization: token}};
        let res;
        try {
            res = await axios.post(`${URL}/api/upload-pkb/`, body, config);
        } catch (error) {
            dispatch({type: appTemp.HIDE_PROGRESS_MODAL});
            if (error?.toString().includes('401')) {
                NavigationService.navigate('Authentication');
                Alert.alert('Your Session has expired', 'You need to verify your email/wallet again');
                await processLogout(dispatch);
            } else {
                Alert.alert('Unknown Error', error?.toString());
            }
            return;
        }
        globalData.limitedAccessToken = null;
        Keychain.resetGenericPassword({service: `${bundleId}.limited_access_token`});
        globalData.token = `Token ${res.data.token}`;
        await SPH.setUp(`Token ${res.data.token}`, userId, body.oneTimeId);
        await Keychain.setGenericPassword('AuthToken', res.data.token, {
            service: `${bundleId}.auth_token`,
            accessGroup: `group.${bundleId}`,
        });
        await SPH.uploadSenderKeys(`${res.data.partyId}0`, [userId]);
        await SPH.uploadSenderKeys(`${res.data.selfPartyId}0`, [userId]);
        dispatch({type: auth.UPDATE_USER, payload: {roomId: res.data.selfPartyId}});
        dispatch({type: stickRoom.NEW_ROOM, payload: {roomId: res.data.selfPartyId}});
        await firebase.auth().signInWithCustomToken(res.data.firebaseToken);
        const firebaseEmail = email || `${ethereumAddress}@eth.com`;
        firebase.auth().currentUser!.updateEmail(firebaseEmail);
        await initOneToOne({id: userId, roomId: res.data.selfPartyId, isGroup: false}, {
            id: userId,
            roomId: res.data.selfPartyId,
        } as TUser);
        await dispatch({type: auth.FINISHED_REGISTRATION, payload: true});
        await AsyncStorage.setItem('@loggedIn', '1');
        dispatch({type: appTemp.HIDE_PROGRESS_MODAL});
        if (Config.TESTING === '1') {
            dispatch({type: progress.END_LOADING});
        }
        Platform.OS === 'ios' ? setTimeout(() => callback(), 500) : callback();
        dispatch({type: progress.UPDATE, payload: 'Congratulations, all is done!'});
        setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
        dispatch({type: appTemp.GENERATING_KEYS});
        // Upload extra preKeys on two batches after finishing registration
        if (Config.TESTING !== '1') {
            await SPH.refillPreKeys(10, 10);
            await SPH.refillPreKeys(20, 50);
        }
        dispatch({type: appTemp.GENERATING_KEYS_DONE});
        dispatch({type: appTemp.FINISHING_UP_DONE});
    };
}

type TLogoutParams = {callback: () => void};

export function logout({callback}: TLogoutParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        try {
            await axios.get(`${URL}/api/flush-session/`);
            await axios.post(`${URL}/api/auth/logout/`, {}, config);
        } catch (e) {
            await processLogout(dispatch, callback);
        }
        await processLogout(dispatch, callback);
    };
}

const resetGlobalVars = () => {
    globalData.unsubscribeNotifications();

    Object.keys(startMessageKeys).forEach((prop) => {
        delete startMessageKeys[prop];
    });

    Object.keys(endMessageKeys).forEach((prop) => {
        delete endMessageKeys[prop];
    });

    Object.keys(globalData).forEach((prop) => {
        delete globalData[prop];
    });

    globalData.tabBarDisplay = 'none';
};

export async function processLogout(dispatch: Dispatch, callback?: () => void) {
    dispatch({type: progress.END_LOADING});
    StickProtocol.resetDatabase();
    dispatch({type: auth.FINISHED_REGISTRATION, payload: false});
    await dispatch({type: images.LOGOUT_IMAGES_IDS});
    await dispatch({type: images.LOGOUT_IMAGES});
    await dispatch({type: notifications.LOGOUT_NOTIFICATIONS});
    await dispatch({type: stickRoom.LOGOUT_MESSAGES});
    await dispatch({type: stickRoom.LOGOUT_LATEST_MESSAGES});
    await dispatch({type: auth.LOGOUT_SUCCESSFUL});
    if (callback) await callback();
    Keychain.resetGenericPassword({service: `${bundleId}.auth_token`});
    Keychain.resetGenericPassword({service: `${bundleId}.fcm_token`});
    Keychain.resetGenericPassword({service: `${bundleId}.password_salt`});
    AsyncStorage.removeItem('@userId');
    AsyncStorage.removeItem('@oneTimeId');
    AsyncStorage.removeItem('@loggedIn');
    AsyncStorage.removeItem('@startMessageKeys');
    AsyncStorage.removeItem('@endMessageKeys');
    resetGlobalVars();
    if (!process.env.LOCAL_TEST)
        await firebase
            .auth()
            .signOut()
            .then((res: any) => console.log('firebase success', res))
            .catch((err: any) => console.log('firebase error', err));
    dispatch({type: groups.LOGOUT_GROUPS});
    dispatch({type: groups.LOGOUT_GROUP_REQUESTS});
    dispatch({type: albums.LOGOUT_ALBUMS});
    dispatch({type: connections.LOGOUT_CONNECTIONS});
    dispatch({type: connections.LOGOUT_CONNECTIONS_ID});
    dispatch({type: fetched.RESET_FETCHED});
    dispatch({type: app.RESET_APP_STATE});
    dispatch({type: appTemp.RESET_APP_TEMP_STATE});
    dispatch({type: vault.LOGOUT_FILES});
    dispatch({type: vault.LOGOUT_FILES_TREE});
    dispatch({type: vault.LOGOUT_PHOTOS});
    dispatch({type: vault.LOGOUT_ALBUMS});
    dispatch({type: vault.LOGOUT_NOTES});
    dispatch({type: stickRoom.LAST_SEEN_LOGOUT});
    dispatch({type: stickRoom.REMOVED_ROOMS_LOGOUT});
}

type TCheckUsername = {username: string};

export function checkUsername({username}: TCheckUsername) {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.SEARCHING});
        axios
            .post(`${URL}/api/check-username/`, {username})
            .then((res: any) => {
                dispatch({type: appTemp.USERNAME_VALIDATION, payload: {username, valid: res.data.valid}});
                dispatch({type: appTemp.SEARCH_DONE});
            })
            .catch((err: any) => console.log('err check user', err));
    };
}

type TFetchDevicesParams = {callback: () => void};

export function fetchDevices({callback}: TFetchDevicesParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.limitedAccessToken}};
        const phone = await AsyncStorage.getItem('@phone');
        const email = await AsyncStorage.getItem('@email');
        const currentDeviceId = await getUniqueDeviceId();
        let data;
        try {
            // TODO: change to GET
            const response = await axios.post(`${URL}/api/fetch-devices/`, {phone, email, currentDeviceId}, config);
            data = response.data;
        } catch (error) {
            if (error?.toString().includes('401')) {
                NavigationService.navigate('Authentication');
                Alert.alert('Your Session has expired', 'You need to verify your phone number again');
                await processLogout(dispatch);
            } else {
                Alert.alert('Unknown Error', error?.toString());
            }
            return;
        }
        dispatch({type: appTemp.FETCH_DEVICES, payload: data});
        callback();
    };
}

export function fetchUserDevices(callback: () => void) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/fetch-user-devices/`, config);
        dispatch({type: appTemp.FETCH_DEVICES, payload: response.data});
        callback();
    };
}

export function updateChatDevice(deviceId: string, latest: boolean) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        try {
            await axios.post(`${URL}/api/update-chat-device/`, {deviceId, latest}, config);
            dispatch({type: app.USER_PREFERENCES, payload: {chatDeviceId: !latest ? deviceId : null}});
        } catch (err: any) {
            dispatch({type: progress.END_LOADING});
        }
        dispatch({type: progress.END_LOADING});
    };
}

type TCancelRegistration = {callback: () => void};

export function cancelRegistration({callback}: TCancelRegistration) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        await Keychain.resetGenericPassword({service: `${bundleId}.limited_access_token`});
        AsyncStorage.removeItem('@userId');
        AsyncStorage.removeItem('@loggedIn');
        dispatch({type: appTemp.RESET_APP_TEMP_STATE});
        if (!process.env.LOCAL_TEST)
            await firebase
                .auth()
                .signOut()
                .then((res: any) => console.log('firebase success', res))
                .catch((err: any) => console.log('firebase error', err));
        callback();
        dispatch({type: progress.END_LOADING});
    };
}

type TRecreateUserParams = {callback: (userId: string) => void};

export function recreateUser({callback}: TRecreateUserParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        let token = globalData.limitedAccessToken;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.limited_access_token`});
            token = password;
        }
        const userId = await AsyncStorage.getItem('@userId');
        const phone = await AsyncStorage.getItem('@phone');
        const config = {headers: {Authorization: token}};
        let data;
        try {
            const response = await axios.post(`${URL}/api/recreate-user/`, {userId, phone}, config);
            data = response.data;
        } catch (error) {
            if (error?.toString().includes('401')) {
                NavigationService.navigate('Authentication');
                Alert.alert('Your Session has expired', 'You need to verify your phone number again');
                await processLogout(dispatch);
            } else {
                Alert.alert('Unknown Error', error?.toString());
            }
            return;
        }
        AsyncStorage.setItem('@userId', data.user.id);
        AsyncStorage.setItem('@phone', data.user.phone);
        await dispatch({type: auth.USER_LOADED, payload: data.user});
        dispatch({type: groups.FETCH_GROUPS, payload: data.user.groups});
        dispatch({type: progress.END_LOADING});
        callback(data.user.id);
    };
}

// TODO: E2E test
type TOneTapRecoverPasswordParams = {callback: (password: string) => void; failCallback: () => void};

export function oneTapRecoverPassword({callback, failCallback}: TOneTapRecoverPasswordParams) {
    return async function () {
        const userId = await AsyncStorage.getItem('@userId');
        const res = await CommonNative.oneTapRecoverPassword(userId!, globalData.passwordKey);
        if (!res) {
            Alert.alert('No Password Saved', 'You have no Sticknet password saved with your Google account');
            failCallback();
        } else {
            const {password, status} = res;
            if (status === 'WRONG_ACCOUNT') {
                const email = await AsyncStorage.getItem('@email');
                Alert.alert('Wrong Account Selected', `Please select the account corresponding to ${email}.`);
                failCallback();
            } else if (status === 'SUCCESS') {
                callback(password);
            }
        }
    };
}

type TChangePasswordParams = {currentPass: string; newPass: string; callback: () => void};

export function changePassword({currentPass, newPass, callback}: TChangePasswordParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const res = await Keychain.getGenericPassword({service: `${bundleId}.password_salt`});
        const passwordSalt = res.password;
        const passwordHash = await StickProtocol.createPasswordHash(currentPass, passwordSalt);
        const {data} = await axios.post(`${URL}/api/verify-password/`, {password: passwordHash}, config);
        const response = await axios.get(`${URL}/api/fetch-all-vault-cipher/`, config);
        dispatch({type: progress.END_LOADING});
        setTimeout(async () => {
            if (data.verified) {
                dispatch({type: appTemp.SHOW_PROGRESS_MODAL});
                dispatch({type: appTemp.REENCRYPTING_CIPHERS});
                const vaultCipher = await StickProtocol.reEncryptCiphers(response.data, currentPass, newPass);
                dispatch({type: appTemp.REENCRYPTING_CIPHERS_DONE});
                const keysBody = await StickProtocol.reEncryptKeys(newPass);
                dispatch({type: appTemp.FINISHING_UP});
                keysBody.currentPass = passwordHash;
                const {salt, hash} = await StickProtocol.createNewPasswordHash(newPass);
                keysBody.newPass = hash;
                keysBody.newSalt = salt;
                const deviceId = await getUniqueDeviceId();
                const {data} = await axios.post(
                    `${URL}/api/change-password/`,
                    {vaultCipher, keys: keysBody, deviceId},
                    config,
                );
                if (data.success) {
                    await StickProtocol.updateKeychainPassword(newPass);
                    await Keychain.setGenericPassword('PasswordSalt', salt, {service: `${bundleId}.password_salt`});
                    await NavigationService.navigate('Profile');
                    dispatch({type: appTemp.HIDE_PROGRESS_MODAL});
                    dispatch({type: appTemp.FINISHING_UP_DONE});
                    dispatch({type: progress.UPDATE, payload: 'Password Changed Successfully!'});
                    setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
                    callback();
                } else {
                    dispatch({type: appTemp.HIDE_PROGRESS_MODAL});
                    Alert.alert('Process Unsuccessful', 'An unknown error has occurred!');
                }
            } else {
                Alert.alert('Incorrect password', 'The password you have entered is incorrect!');
            }
        }, 300);
    };
}

type TDeactivateParams = {callback: () => void};

export function deactivate({callback}: TDeactivateParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        await axios.post(`${URL}/api/deactivate/`, {}, config);
        processLogout(dispatch, callback);
    };
}

type TCodeConfirmedDeleteAccountParams = {code: string; callback: () => void};

export function codeConfirmedDeleteAccount({code, callback}: TCodeConfirmedDeleteAccountParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const {data} = await axios.post(`${URL}/api/code-confirmed-delete-account/`, {code}, config);
        if (data.correct) {
            await Keychain.setGenericPassword('DeleteAccountToken', data.deleteAccountToken, {
                service: `${bundleId}.delete_account_token`,
            });
            callback();
        } else {
            Alert.alert(
                'Incorrect code!',
                'Make sure you have entered the 6-digits code sent to your email correctly.',
            );
        }
        dispatch({type: progress.END_LOADING});
    };
}

type TDeleteAccountParams = {user: TUser; groups: TGroup[]; password: string; callback: () => void};

export function deleteAccount({user, groups, password, callback}: TDeleteAccountParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const {password: deleteAccountToken} = await Keychain.getGenericPassword({
            service: `${bundleId}.delete_account_token`,
        });
        const {password: passwordSalt} = await Keychain.getGenericPassword({service: `${bundleId}.password_salt`});
        const passwordHash = await StickProtocol.createPasswordHash(password, passwordSalt);
        const body = {password: passwordHash, deleteAccountToken};
        axios
            .post(`${URL}/api/delete-account/`, body, config)
            .then(async (res: any) => {
                if (res.data.success) {
                    const {id} = user;
                    await database.ref(`users/${id}`).remove();
                    for (let i = 0; i < groups.length; i++) {
                        const groupId = groups[i].id;
                        database.ref(`rooms/${groupId}/members/${id}`).remove();
                        database.ref(`rooms/${groupId}/invited-users/${id}`).remove();
                        database.ref(`rooms/${groupId}/last-seen/${id}`).remove();
                        database.ref(`rooms/${groupId}/active/${id}`).remove();
                        database.ref(`rooms/${groupId}/muted/${id}`).remove();
                    }
                    firebase.auth().currentUser?.delete();
                    Keychain.resetGenericPassword({service: `${bundleId}.delete_account_token`});
                    await processLogout(dispatch, callback);
                    dispatch({type: progress.UPDATE, payload: 'Account deleted successfully!'});
                    setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
                } else {
                    dispatch({type: progress.END_LOADING});
                    if (!res.data.correctToken) {
                        Alert.alert('Error', 'An error has occurred');
                    } else if (!res.data.correctPassword) Alert.alert('Incorrect Password');
                    else Alert.alert('Unknown Error', 'An error has occurred');
                }
            })
            .catch((err: any) => {
                console.log('ERROR', err);
                dispatch({type: progress.END_LOADING});
                Alert.alert('Error', 'An error has occurred');
            });
    };
}

export function createE2EUser(callback: () => void) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        axios
            .post(`${URL}/api/create-e2e-user/`)
            .then(async (res: any) => {
                if (res.data.success) {
                    globalData.limitedAccessToken = res.data.limitedAccessToken;
                    devRegistration.params = res.data.params;
                    await Keychain.setGenericPassword('LimitedAccessToken', res.data.limitedAccessToken, {
                        service: `${bundleId}.limited_access_token`,
                    });
                    callback();
                } else {
                    Alert.alert('Not successful!', 'delete some accounts!');
                }
                dispatch({type: progress.END_LOADING});
            })
            .catch((err: any) => {
                dispatch({type: progress.END_LOADING});
                console.log('error creating dev user', err, err.response);
            });
    };
}

export function setFolderIcon(folderIcon: string) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        dispatch({type: app.USER_PREFERENCES, payload: {folderIcon}});
        axios.post(`${URL}/api/set-folder-icon/`, {folderIcon}, config);
    };
}
