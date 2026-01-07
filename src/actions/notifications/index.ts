import PushNotification from 'react-native-push-notification';
import {Platform} from 'react-native';
import {Dispatch} from 'redux';
import axios from '@/src/actions/myaxios';
import {URL} from '@/src/actions/URL';
import {globalData} from '@/src/actions/globalVariables';
import {albums, connections, fetched, groups, notificationsId} from '@/src/actions/actionTypes';
import channels from './notificationChannels';

export function fetchNotifications() {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};

        let response = await axios.get(`${URL}/api/fetch-group-requests/`, config);
        response.data.groupRequests.forEach((request: any) => {
            dispatch({type: groups.FETCH_GROUP_REQUESTS, payload: {groupId: request.id, users: [request.user]}});
            dispatch({type: fetched.FETCHED_GROUP_REQUESTS, payload: request.id});
        });

        response = await axios.get(`${URL}/api/connection-requests/`, config);
        dispatch({type: connections.FETCH_CONNECTION_REQUESTS, payload: response.data.results});

        const arr: string[] = [];

        // Remove all delivered notifications except chat
        PushNotification.getDeliveredNotifications((data: any[]) => {
            data.forEach((notification: any) => {
                if (Platform.OS === 'android' && notification.group.includes('channel')) {
                    arr.push(notification.identifier);
                } else if (Platform.OS === 'ios' && notification.userInfo.channelId !== channels.MESSAGE) {
                    arr.push(notification.identifier);
                }
            });
            if (Platform.OS === 'android') {
                // Group channels
                arr.push('0', '1', '2', '3', '4');
            }
            PushNotification.removeDeliveredNotifications(arr);
        });
    };
}

export function readNotifications() {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        await axios.get(`${URL}/api/notification-read/`, config);
        dispatch({type: fetched.READ_NOTIFICATIONS});
    };
}

export function dispatchAlbumStickNotification(notification: any) {
    return function (dispatch: Dispatch) {
        const groupId = notification.image.groupsIds[0];
        dispatch({type: albums.FETCH_ALBUMS, payload: {groupId, albums: [notification.image.album]}});
    };
}

export function dispatchAlbumStickPN(album: any) {
    return function (dispatch: Dispatch) {
        dispatch({type: albums.FETCH_ALBUMS, payload: {groupId: album.group.id, albums: [album]}});
    };
}

export function dispatchChatNotificationId(id: string, roomId: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.CHAT_NOTIFICATION_ID, payload: {id, roomId}});
    };
}

export function clearChatNotifications(roomId: string, groupsIds: string[], connectionsIds: string[]) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.CLEAR_CHAT_NOTIFICATIONS, payload: {roomId, groupsIds, connectionsIds}});
    };
}

export function dispatchAlbumStickNotificationId(id: string, albumId: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.ALBUM_NOTIFICATION_ID, payload: {id, albumId}});
    };
}

export function dispatchInvitationNotificationId(notificationId: string, groupId: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.INVITATION_NOTIFICATION_ID, payload: {groupId, notificationId}});
    };
}

export function dispatchConnReqNotificationId(notificationId: string, userId: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.CR_NOTIFICATION_ID, payload: {userId, notificationId}});
    };
}

type TClearGroupNotifications = {groupId: string};
export function clearGroupNotifications({groupId}: TClearGroupNotifications) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.CLEAR_GROUP_NOTIFICATIONS, payload: {groupId}});
    };
}

export function dispatchAlbumNotificationId(notificationId: string, albumId: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.ALBUM_NOTIFICATION_ID, payload: {notificationId, albumId}});
    };
}

export function clearAlbumNotifications(albumId: string) {
    return function (dispatch: Dispatch) {
        dispatch({type: notificationsId.CLEAR_ALBUM_NOTIFICATIONS, payload: {albumId}});
    };
}

export interface INotificationsActions {
    fetchNotifications: () => void;
    readNotifications: () => void;
    dispatchAlbumStickNotification: (notification: any) => void;
    dispatchAlbumStickPN: (album: any, cover: any) => void;
    dispatchChatNotificationId: (id: string, roomId: string) => void;
    clearChatNotifications: (roomId: string, groupsIds: string[], connectionsIds: string[]) => void;
    dispatchAlbumStickNotificationId: (id: string, albumId: string) => void;
    dispatchInvitationNotificationId: (notificationId: string, groupId: string) => void;
    dispatchConnReqNotificationId: (notificationId: string, userId: string) => void;
    clearGroupNotifications: (payload: TClearGroupNotifications) => void;
    dispatchAlbumNotificationId: (notificationId: string, albumId: string) => void;
    clearAlbumNotifications: (albumId: string) => void;
}
