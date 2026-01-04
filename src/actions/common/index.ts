import Keychain from '@sticknet/react-native-keychain';
import {Alert, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {firebase} from '@react-native-firebase/database';
import {Dispatch} from 'redux';
import {
    app,
    appState,
    appTemp,
    auth,
    connections,
    fetched,
    groups,
    images,
    notificationsId,
    progress,
    vault,
} from '@/src/actions/actionTypes';
import StickProtocol from '@/modules/stick-protocol';
import {globalData} from '@/src/actions/globalVariables';
import {stickProtocolHandlers as SPH} from '@/src/actions/SPHandlers';
import {getUniqueDeviceId} from '@/src/utils';
import axios from '@/src/actions/myaxios';
import {URL} from '@/src/actions/URL';
import registerForNotifications from '@/src/actions/notifications/registerForNotifications';
import channels from '@/src/actions/notifications/notificationChannels';
import CommonNative from '@/modules/common-native';
import {joinedGroupProcessing} from '@/src/actions/groups';
import {TGroup, TGroupRequest, TPreKey, TUser} from '@/src/types';

const bundleId = DeviceInfo.getBundleId();

export interface ICommonActions {
    refreshUser: (params?: TRefreshUserParams) => void;
    fetchConnections: (params?: TFetchConnectionsParams) => void;
    oneTapSavePassword: (params: TOneTapSavePasswordParams) => void;
    fetchHomeItems: (params?: TFetchHomeItemsParams) => void;
    groupLinkJoin: (params: TGroupLinkJoinParams) => void;
    requestToJoin: (params: TRequestToJoinParams) => void;
    dispatchNotificationsPermission: (params: TDispatchNotificationsPermissionParams) => void;
    dispatchAppState: (params: TDispatchAppStateParams) => void;
    decryptPreKeys: (params: TDecryptPreKeysParams) => void;
    setUpSPH: (params: TSetUpSPHParams) => void;
    connectionChange: (params: TConnectionChangeParams) => void;
    refreshDone: () => void;
    fetchPreferences: (dispatch: Dispatch) => void;
    dispatchGroupNotificationId: (notificationId: string, groupId: string) => void;
}

type TDispatchNotificationsPermissionParams = {value: string};
export function dispatchNotificationsPermission({value}: TDispatchNotificationsPermissionParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: app.DISPATCH_NOTIFICATIONS_PERMISSION, payload: value});
    };
}

type TDispatchAppStateParams = {appCurrentState: string};
export function dispatchAppState({appCurrentState}: TDispatchAppStateParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: appState.APP_STATE, payload: appCurrentState});
    };
}

type TDecryptPreKeysParams = {keys: TPreKey[]};
export function decryptPreKeys({keys}: TDecryptPreKeysParams) {
    return function (dispatch: Dispatch) {
        StickProtocol.decryptPreKeys(keys).then(() => {
            dispatch({type: app.INIT_COMPLETE});
        });
    };
}

type TSetUpSPHParams = {userId: string};
export function setUpSPH({userId}: TSetUpSPHParams) {
    return async function () {
        let {token} = globalData;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.auth_token`});
            token = `Token ${password}`;
            globalData.token = token;
        }
        await SPH.setUp(token, userId);
    };
}

export async function fetchPreferences(dispatch: Dispatch) {
    const config = {headers: {Authorization: globalData.token}};
    const response = await axios.get(`${URL}/api/fetch-preferences/`, config);
    if (!response.data.folderIcon) {
        axios.post(`${URL}/api/set-platform/`, {platform: Platform.OS}, config);
        response.data.folderIcon = Platform.OS === 'ios' ? 'blue' : 'yellow';
    }
    dispatch({type: images.FETCH_IMAGES_IDS, payload: {images: response.data.favoritesIds, screenId: 'favorites'}});
    dispatch({type: app.USER_PREFERENCES, payload: response.data});
}

type TRefreshUserParams =
    | {
          isGeneratingKeys?: boolean;
          callback?: () => void;
      }
    | undefined;

export function refreshUser(params?: TRefreshUserParams) {
    return async function (dispatch: Dispatch) {
        const {isGeneratingKeys, callback} = params || {};
        let {token} = globalData;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.auth_token`});
            token = `Token ${password}`;
        }
        const config = {headers: {Authorization: token}};
        globalData.token = config.headers.Authorization;
        const deviceId = await getUniqueDeviceId();
        try {
            const shouldGetFirebaseToken = true;
            const response = await axios.get(
                `${URL}/api/refresh-user/?should_get_firebase_token=${shouldGetFirebaseToken}`,
                config,
            );
            if (shouldGetFirebaseToken) await firebase.auth().signInWithCustomToken(response.data.firebaseToken);
            callback?.();
            globalData.dateJoined = response.data.user.dateJoined;
            await SPH.decryptProfile(response.data.user, dispatch);
            dispatch({type: fetched.NOTIFICATIONS_UNREAD_COUNT, payload: response.data.unreadCount});
            const {user} = response.data;
            await dispatch({type: auth.USER_LOADED, payload: response.data.user});
            await SPH.decryptGroups(user.groups, dispatch);
            await dispatch({type: groups.FETCH_GROUPS, payload: user.groups});
            dispatch({
                type: images.FETCH_IMAGES_IDS,
                payload: {images: response.data.user.highlightsIds, screenId: 'highlights'},
            });
            dispatch({
                type: images.FETCH_IMAGES_IDS,
                payload: {images: response.data.user.hiddenImages, screenId: 'hidden'},
            });
            if (!user.pntDevices.includes(deviceId)) {
                await Keychain.resetGenericPassword({service: `${bundleId}.fcm_token`});
                registerForNotifications();
            }
            if (response.data.preKeysCount < 50 && !isGeneratingKeys) {
                dispatch({type: appTemp.GENERATING_KEYS});
                await SPH.refillPreKeys(response.data.user.nextPreKeyId, 50);
                dispatch({type: appTemp.GENERATING_KEYS_DONE});
            }
            dispatch({type: app.INITIALIZED});
            fetchPreferences(dispatch);
        } catch (err) {
            console.warn('ERROR IN REFRESH USER', err);
        }
    };
}

type TConnectionChangeParams = {isConnected: boolean};
export function connectionChange({isConnected}: TConnectionChangeParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: appTemp.CONNECTION_CHANGE, payload: isConnected});
    };
}

type TFetchConnectionsParams = {callback?: () => void} | undefined;
export function fetchConnections(params?: TFetchConnectionsParams) {
    return async function (dispatch: Dispatch) {
        const {callback} = params || {};
        let {token} = globalData;
        if (!token) {
            const {password} = await Keychain.getGenericPassword({service: `${bundleId}.auth_token`});
            token = `Token ${password}`;
        }
        const config = {headers: {Authorization: token}};
        globalData.token = config.headers.Authorization;
        const response = await axios.get(`${URL}/api/connections/`, config);
        await dispatch({type: connections.FETCH_CONNECTIONS_ID, payload: response.data});
        await dispatch({type: auth.UPDATE_USER_CONNECTIONS, payload: response.data});
        callback?.();
    };
}

type TFetchHomeItemsParams = {callback?: () => void};
export function fetchHomeItems(params?: TFetchHomeItemsParams) {
    return async function (dispatch: Dispatch) {
        const {callback} = params || {};
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/fetch-home-items/`, config);
        dispatch({type: vault.FETCH_FILES, payload: {files: response.data.files}});
        dispatch({
            type: vault.FETCH_FILES_TREE,
            payload: {files: response.data.files, folderId: 'mostRecent', refresh: true},
        });
        dispatch({
            type: vault.FETCH_PHOTOS,
            payload: {albumId: 'recents', photos: response.data.photos, refresh: true},
        });
        const notes = response.data.notes;
        for (let i = 0; i < notes.length; i++) {
            notes[i].text = await StickProtocol.decryptTextVault(notes[i].cipher);
        }
        dispatch({type: vault.FETCH_VAULT_NOTES, payload: {notes, mostRecent: true}});
        callback?.();
    };
}

export function refreshDone() {
    return function (dispatch: Dispatch) {
        dispatch({type: progress.REFRESH_DONE});
    };
}

type TGroupLinkJoinParams = {group: TGroup; user: TUser; callback: () => void};
export function groupLinkJoin({group, user, callback}: TGroupLinkJoinParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const res = await axios.post(
            `${URL}/api/group-link-join/`,
            {
                groupId: group.id,
                verificationId: group.verificationId,
            },
            config,
        );
        if (res.data.success) {
            res.data.group.displayName.text = group.displayName;
            res.data.group.displayName.decrypted = true;
            await joinedGroupProcessing(user, res.data.group, dispatch);
            await callback();
        } else {
            Alert.alert('This group link is not active anymore!');
        }
        dispatch({type: progress.END_LOADING});
    };
}

type TRequestToJoinParams = {group: TGroup; user: TUser};
export function requestToJoin({group, user}: TRequestToJoinParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        const {stickId} = await SPH.getStickId(null, null, true, 'individual');
        const encryptedDisplayName = await StickProtocol.encryptText(
            user.id,
            stickId,
            group.displayName as unknown as string,
            true,
        );
        const body = {
            groupId: group.id,
            verificationId: group.verificationId,
            text: encryptedDisplayName,
            stickId,
            data: {},
        };
        body.data = {
            channelId: channels.REQUEST,
            groupId: group.id,
            fromUserId: user.id,
            body: '',
            title: '',
            isConnReq: JSON.stringify(false),
        };
        const res = await axios.post(`${URL}/api/request-to-join/`, body, config);
        const groupRequest: TGroupRequest = {
            stickId,
            id: group.id,
            displayName: group.displayName as unknown as string,
        };
        user.groupRequests.push(groupRequest);
        dispatch({type: auth.UPDATE_PROFILE, payload: user});
        dispatch({type: progress.END_LOADING});
        if (res.data.success) {
            dispatch({type: progress.UPDATE, payload: 'Request sent!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
        } else {
            dispatch({type: progress.ERROR_UPDATE, payload: 'This group link is not active anymore!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
            setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
        }
    };
}

type TOneTapSavePasswordParams = {user: TUser; successCallback: () => void; cancelCallback?: () => void};
export function oneTapSavePassword({user, successCallback, cancelCallback}: TOneTapSavePasswordParams) {
    return async function (dispatch: Dispatch) {
        const userId = user.id;
        const password = await StickProtocol.recoverPassword(userId);
        const {passwordKey, ciphertext} = await CommonNative.encryptPassword(password);
        const config = {headers: {Authorization: globalData.token}};
        const {status, error} = await CommonNative.oneTapSavePassword(user.username, userId + ciphertext);
        if (status === 'SUCCESS') {
            user.hasPasswordKey = true;
            dispatch({type: auth.UPDATE_PROFILE, payload: user});
            successCallback();
            await axios.post(`${URL}/api/upload-pk/`, {passwordKey}, config);
        } else if (status === 'CANCELLED' && cancelCallback) cancelCallback();
        else if (error.includes('Cannot find an eligible account'))
            Alert.alert('You are not signed into any Google account', 'Add a Google account to your device');
        else Alert.alert('Unknown error has occurred', error);
    };
}

export function dispatchGroupNotificationId(notificationId: string, groupId: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.GROUP_NOTIFICATION_ID, payload: {notificationId, groupId}});
    };
}
