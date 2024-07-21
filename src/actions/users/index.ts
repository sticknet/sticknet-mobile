import AsyncStorage from '@react-native-async-storage/async-storage';
import {firebase} from '@react-native-firebase/database';
import DeviceInfo from 'react-native-device-info';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import Share from 'react-native-share';
import Clipboard from '@react-native-community/clipboard';
import {Keyboard, Platform} from 'react-native';
import {Dispatch} from 'redux';
import axios from '../myaxios';
import {firebaseRef, URL} from '../URL';
import SPH from '../SPHandlers';
import StickProtocol from '../../native-modules/stick-protocol';
import {globalData} from '../globalVariables';
import {
    connections,
    auth,
    appTemp,
    app,
    groups,
    url,
    creating,
    fetched,
    users,
    blocked,
    progress,
    notificationsId,
    stickRoom,
} from '../actionTypes';
import channels from '../notifications/notificationChannels';
import {initOneToOne} from '../stick-room';
import {TUser} from '../../types';

const database = firebase.app().database(firebaseRef);
const bundleId = DeviceInfo.getBundleId();

type TSearchUsersParams = {currentUrl: string; loadMore?: boolean};
export function searchUsers({currentUrl, loadMore}: TSearchUsersParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.SEARCHING});
        const config = {headers: {Authorization: globalData.token}};
        axios.get(currentUrl, config).then((response) => {
            if (response.data.results.length === 0) dispatch({type: app.NO_USERS_FOUND});
            else {
                dispatch({type: app.USERS_FOUND});
                if (!loadMore) dispatch({type: groups.SEARCH_USERS, payload: response.data.results});
                else dispatch({type: groups.APPEND_USERS, payload: response.data.results});
                dispatch({type: url.NEXT_USERS_SEARCH_URL, payload: response.data.next});
            }
            dispatch({type: appTemp.SEARCH_DONE});
        });
    };
}

type TFetchUserParams = {user: TUser; isConnection: boolean; callback?: (user: TUser) => void};
export function fetchUser({user, isConnection, callback}: TFetchUserParams) {
    return async function (dispatch: Dispatch) {
        try {
            const config = {headers: {Authorization: globalData.token}};
            const query = user.id ? `id=${user.id}` : `username=${user.username}`;
            const response = await axios.get(`${URL}/api/fetch-single-user/?${query}`, config);
            if (response.data.isConnected) {
                await SPH.decryptProfile(response.data.user, dispatch);
            }
            response.data.user.isConnected = response.data.isConnected;
            response.data.user.requested = response.data.requested;
            dispatch({type: fetched.FETCHED_PROFILE, payload: response.data.user.id});
            if (isConnection) {
                dispatch({type: connections.FETCH_SINGLE_CONNECTION_ID, payload: response.data.user});
            } else {
                dispatch({type: users.FETCH_SINGLE_USER, payload: response.data.user});
            }
            if (callback) callback(response.data.user);
        } catch (e: any) {
            console.warn('Error in fetch user: ', e.response.data);
        }
    };
}

export function dispatchUser(user: TUser) {
    return function (dispatch: Dispatch) {
        dispatch({type: users.FETCH_SINGLE_USER, payload: user});
    };
}

type TBlockUserParams = {user: TUser; callback?: () => void};
export function blockUser({user, callback}: TBlockUserParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        try {
            await axios.post(`${URL}/api/block/`, {id: user.id}, config);
            const userId = await AsyncStorage.getItem('@userId');
            database.ref(`users/${user.id}/blocked-me`).update({[userId as string]: userId});
            if (callback) await callback();
            dispatch({type: auth.BLOCK, payload: user.id});
            dispatch({type: connections.REMOVE_CONNECTION, payload: {user}});
            dispatch({type: connections.REMOVE_CONNECTION_ID, payload: {user}});
            dispatch({type: progress.END_LOADING});
            dispatch({type: progress.UPDATE, payload: 'User blocked!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
        } catch (error) {
            console.warn('ERROR in blockUser', error);
            dispatch({type: progress.END_LOADING});
            dispatch({type: progress.ERROR_UPDATE, payload: 'Something went wrong!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
            setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
        }
    };
}

type TUnblockUser = {user: TUser; callback?: () => void};
export function unblockUser({user, callback}: TUnblockUser) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        dispatch({type: progress.START_LOADING});
        try {
            await axios.post(`${URL}/api/unblock/`, {id: user.id}, config);
            const userId = await AsyncStorage.getItem('@userId');
            dispatch({type: auth.UNBLOCK, payload: user.id});
            database
                .ref(`users/${user.id}/blocked-me`)
                .child(userId as string)
                .remove();
            dispatch({type: progress.END_LOADING});
            dispatch({type: progress.UPDATE, payload: 'User unblocked!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
            if (callback) callback();
        } catch (error) {
            dispatch({type: progress.END_LOADING});
            dispatch({type: progress.ERROR_UPDATE, payload: 'Something went wrong!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4500);
            setTimeout(() => dispatch({type: progress.ERROR_UPDATED}), 5000);
        }
    };
}

export function fetchBlocked() {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        axios.get(`${URL}/api/fetch-blocked/`, config).then((res) => {
            dispatch({type: blocked.FETCH_BLOCKED, payload: {users: res.data}});
        });
    };
}

type TSendConnectionRequestParams = {currentUser: TUser; username: string; buttonId?: string; callback?: () => void};
export function sendConnectionRequest({currentUser, username, buttonId, callback}: TSendConnectionRequestParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {buttonIdLoading: buttonId}});
        const config = {headers: {Authorization: globalData.token}};
        const {data} = await axios.post(
            `${URL}/api/send-connection-request/`,
            {username: username.toLowerCase()},
            config,
        );
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {buttonIdLoading: null}});
        if (data.userExists) {
            dispatch({type: users.SEND_CONNECTION_REQUEST_USER, payload: {id: data.user.id}});
            dispatch({type: connections.ADD_SENT_CONNECTION_REQUEST, payload: {user: data.user}});
            dispatch({type: progress.UPDATE, payload: 'Connection request sent!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
            if (callback) callback();
            const userId = await AsyncStorage.getItem('@userId');
            database.ref(`users/${data.user.id}/connection-requests`).update({[userId as string]: userId});

            const {stickId} = await SPH.getStickId([], [data.user.id], false, 'multi');
            const body = {
                toUser: [data.user.id],
                data: {
                    title: 'Connection Request',
                    body: `${currentUser.name} has sent you a connection request`,
                    channelId: channels.REQUEST,
                    fromUserId: currentUser.id,
                    isConnReq: JSON.stringify(true),
                    stickId,
                    memberId: currentUser.id,
                },
            };
            const notification = {title: body.data.title, body: body.data.body};
            const encryptedNotification = await StickProtocol.encryptText(
                currentUser.id,
                stickId,
                JSON.stringify(notification),
                true,
            );
            body.data.title = 'Sticknet';
            body.data.body = encryptedNotification;
            await axios.post(`${URL}/api/push-notification/`, body, config);
        } else {
            dispatch({type: progress.ERROR_UPDATE, payload: 'No user with that username!'});
            setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
        }
    };
}

type TCancelConnectionRequest = {target: TUser};
export function cancelConnectionRequest({target}: TCancelConnectionRequest) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        axios
            .post(`${URL}/api/cancel-connection-request/`, {id: target.id}, config)
            .then(() => {
                dispatch({type: users.CANCEL_CONNECTION_REQUEST_USER, payload: {id: target.id}});
                dispatch({type: connections.REMOVE_SENT_CONNECTION_REQUEST, payload: target.id});
                dispatch({type: progress.END_LOADING});
            })
            .catch((err) => {
                console.log('ERROR in cancelConnectionRequest', err.toString());
                dispatch({type: progress.END_LOADING});
            });
    };
}

export function connReqRes(fromUser: TUser, user: TUser, request: any, accepted: boolean) {
    // TODO: test push notification
    return async function (dispatch: Dispatch) {
        const body = {
            id: request.id,
            accepted,
            data: {title: '', body: '', channelId: '', memberId: '', fromUserId: '', isConnReq: ''},
            toUser: [] as string[],
        };
        if (accepted) {
            dispatch({type: connections.STICK_IN_CR, payload: request.timestamp});
            setTimeout(() => dispatch({type: connections.REMOVE_CR, payload: request.timestamp}), 3000);
            const {partyId, stickId} = await SPH.getStickId([], [request.fromUser], false, 'multi');
            request.fromUser.roomId = partyId;
            body.data = {
                title: user.name,
                body: `${user.name} has accepted your connection request`,
                channelId: channels.REQUEST,
                memberId: user.id,
                fromUserId: user.id,
                isConnReq: JSON.stringify(false),
            };
            const notification = {title: body.data.title, body: body.data.body};
            const encryptedNotification = await StickProtocol.encryptText(
                user.id,
                stickId,
                JSON.stringify(notification),
                true,
            );
            body.data.title = 'Sticknet';
            body.data.body = encryptedNotification;
            body.toUser = [fromUser.id];
            database.ref(`rooms/${request.fromUser.roomId}/id`).once('value', async (snapshot) => {
                if (!snapshot.exists()) {
                    await initOneToOne(request.fromUser, user);
                }
                await dispatch({type: connections.ADD_CONNECTIONS_ID, payload: [request.fromUser]});
                dispatch({type: stickRoom.NEW_ROOM, payload: {roomId: request.fromUser.roomId}});
                database.ref(`users/${request.fromUser.id}/new-connections`).update({[user.id]: user.id});
            });
        } else dispatch({type: connections.REMOVE_CR, payload: request.timestamp});
        dispatch({type: auth.DECREMENT_CR});
        const config = {headers: {Authorization: globalData.token}};
        await axios.post(`${URL}/api/conn-req-res/`, body, config);
        dispatch({type: notificationsId.CLEAR_CR_NOTIFICATIONS, payload: {userId: request.fromUser.id}}); // TODO: test clear notif
    };
}

export function clearUsersSearch() {
    return function (dispatch: Dispatch) {
        dispatch({type: groups.CLEAR_USERS_SEARCH});
    };
}

type TDispatchUsersIdsParams = {usersIds: string[]; users: TUser[]};
export function dispatchUsersIds({usersIds, users}: TDispatchUsersIdsParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: creating.DISPATCH_USERS_IDS, payload: {usersIds, users}});
    };
}

type TRemoveSelectedUserParams = {user: TUser};
export function removeSelectedUser({user}: TRemoveSelectedUserParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: creating.REMOVE_SELECTED_USER, payload: user});
    };
}

export function blockDone() {
    return function (dispatch: Dispatch) {
        dispatch({type: progress.END_LOADING});
        dispatch({type: progress.UPDATE, payload: 'User blocked!'});
        setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
    };
}

type TReportUserParams = {toUserId: string; reason: string};
export function reportUser({toUserId, reason}: TReportUserParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        await axios.post(`${URL}/api/report-user/`, {toUserId, reason}, config);
        dispatch({type: progress.END_LOADING});
        dispatch({type: progress.UPDATE, payload: 'Report sent!'});
        setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
    };
}

export function reportPost(image: any, reason: string) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        const config = {headers: {Authorization: globalData.token}};
        await axios.post(`${URL}/api/report-post/`, {toUserId: image.user.id, imageId: image.id, reason}, config);
        dispatch({type: progress.END_LOADING});
        dispatch({type: progress.UPDATE, payload: 'Report sent!'});
        setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
    };
}

type TRemoveConnectionParams = {user: TUser};
export function removeConnection({user}: TRemoveConnectionParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        axios.post(`${URL}/api/remove-connection/`, {userId: user.id}, config);
        dispatch({type: connections.REMOVE_CONNECTION, payload: {user}});
        dispatch({type: connections.REMOVE_CONNECTION_ID, payload: {user}});
    };
}

type TFetchSentConnectionRequestsParams = {callback?: () => void};
export function fetchSentConnectionRequests(params?: TFetchSentConnectionRequestsParams) {
    const {callback = () => {}} = params || {};
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/sent-connection-requests/`, config);
        dispatch({type: connections.FETCH_SENT_CONNECTION_REQUESTS, payload: response.data.connectionRequests});
        callback();
    };
}

export function clearConnectionRequests() {
    return function (dispatch: Dispatch) {
        dispatch({type: connections.CLEAR_CONNECTION_REQUESTS});
    };
}

type TConnectLinkParams = {share: boolean};
export function connectLink({share}: TConnectLinkParams) {
    return async function (dispatch: Dispatch) {
        Keyboard.dismiss();
        const userId = await AsyncStorage.getItem('@userId');
        const params = {
            link: `https://sticknet.org/?userId=${userId}`,
            domainUriPrefix: 'https://invite.sticknet.org',
            ios: {
                bundleId,
                appStoreId: '1576169188',
            },
            android: {
                packageName: bundleId,
            },
            navigation: {
                forcedRedirectEnabled: true,
            },
            social: {
                title: 'Sticknet Invitation',
                descriptionText: 'Connect with me on Sticknet!',
                imageUrl:
                    'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/sticknet-icon.png?alt=media&token=2b665dae-a63d-4884-a92e-59d5899530dc',
            },
        };
        // @ts-ignore
        const link = await dynamicLinks().buildShortLink(params, 'SHORT');
        if (share) Share.open({url: link}).catch((err) => console.log('ERR share', err));
        else {
            Clipboard.setString(link);
            if (Platform.OS === 'ios') {
                dispatch({type: progress.UPDATE, payload: 'Connect link copied!'});
                setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
            }
        }
    };
}

function findCommonItems(arr1: string[], arr2: string[]) {
    const setArr1 = new Set(arr1);
    return arr2.filter((item) => setArr1.has(item));
}

type TFetchMutualConnectionsParams = {connectionsIds: string[]; userId: string};
export function fetchMutualConnections({connectionsIds, userId}: TFetchMutualConnectionsParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const {data} = await axios.get(`${URL}/api/fetch-target-connection-ids/?user_id=${userId}`, config);
        dispatch({
            type: users.MUTUAL_CONNECTIONS,
            payload: {[userId]: findCommonItems(connectionsIds, data.targetConnectionIds)},
        });
    };
}

type TFetchMutualGroupsParams = {groupsIds: string[]; userId: string};
export function fetchMutualGroups({groupsIds, userId}: TFetchMutualGroupsParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const {data} = await axios.get(`${URL}/api/fetch-target-group-ids/?user_id=${userId}`, config);

        dispatch({
            type: groups.MUTUAL_GROUPS,
            payload: {[userId]: findCommonItems(groupsIds, data.targetGroupIds)},
        });
    };
}

export interface IUsersActions {
    reportUser: (params: TReportUserParams) => void;
    blockUser: (params: TBlockUserParams) => void;
    removeConnection: (params: TRemoveConnectionParams) => void;
    cancelConnectionRequest: (params: TCancelConnectionRequest) => void;
    fetchUser: (params: TFetchUserParams) => void;
    sendConnectionRequest: (params: TSendConnectionRequestParams) => void;
    unblockUser: (params: TUnblockUser) => void;
    fetchMutualGroups: (params: TFetchMutualGroupsParams) => void;
    fetchMutualConnections: (params: TFetchMutualConnectionsParams) => void;
    fetchBlocked: () => void;
    fetchSentConnectionRequests: (params?: TFetchSentConnectionRequestsParams) => void;
    clearConnectionRequests: () => void;
    removeSelectedUser: (params: TRemoveSelectedUserParams) => void;
    dispatchUsersIds: (params: TDispatchUsersIdsParams) => void;
    searchUsers: (params: TSearchUsersParams) => void;
    clearUsersSearch: () => void;
    connectLink: (params: TConnectLinkParams) => void;
}
