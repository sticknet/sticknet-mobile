import {Platform} from 'react-native';
// import PushNotification from 'react-native-push-notification';
import {Action} from 'redux';
import {notificationGroupId} from '@/src/actions/globalVariables';
import {notificationsId} from '@/src/actions/actionTypes';
import channels from '@/src/actions/notifications/notificationChannels';

export interface IGroupsNotificationsIdState {
    [key: string]: string;
}

const initialState: IGroupsNotificationsIdState = {};

export interface IGroupNotificationIdAction extends Action {
    payload: {
        groupId: string;
        notificationId: string;
    };
}

export interface IClearGroupNotificationsAction extends Action {
    payload: {
        groupId: string;
    };
}

type GroupNotificationActions = IGroupNotificationIdAction | IClearGroupNotificationsAction;

export default function (
    state: IGroupsNotificationsIdState = initialState,
    action: GroupNotificationActions,
): IGroupsNotificationsIdState {
    switch (action.type) {
        case notificationsId.GROUP_NOTIFICATION_ID:
            const groupNotificationPayload = action.payload as IGroupNotificationIdAction['payload'];
            return {...state, [groupNotificationPayload.groupId]: groupNotificationPayload.notificationId.toString()};

        case notificationsId.CLEAR_GROUP_NOTIFICATIONS:
            const clearGroupNotificationsPayload = action.payload as IClearGroupNotificationsAction['payload'];
            const notificationId = state[clearGroupNotificationsPayload.groupId];
            if (notificationId) {
                const arr = Platform.OS === 'android' ? [notificationId.toString()] : [];
                const newState = {...state};
                delete newState[clearGroupNotificationsPayload.groupId];
                let isLast = Platform.OS === 'android';
                // PushNotification.getDeliveredNotifications((data) => {
                //     for (let i = 0; i < data.length; i++) {
                //         if (Platform.OS === 'android') {
                //             if (
                //                 data[i].group === channels.GROUP &&
                //                 data[i].identifier !== notificationGroupId[channels.GROUP].toString() &&
                //                 data[i].identifier !== notificationId
                //             ) {
                //                 isLast = false;
                //                 break;
                //             }
                //         } else if (data[i].userInfo.id === notificationId) {
                //             arr.push(data[i].identifier);
                //             break;
                //         }
                //     }
                //     if (isLast) arr.push(notificationGroupId[channels.GROUP].toString());
                //     PushNotification.removeDeliveredNotifications(arr);
                // });
                return newState;
            }
            return state;

        default:
            return state;
    }
}
