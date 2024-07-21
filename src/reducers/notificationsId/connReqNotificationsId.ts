import {Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';
import {Action} from 'redux';
import {notificationGroupId} from '../../actions/globalVariables';
import {notificationsId} from '../../actions/actionTypes';
import channels from '../../actions/notifications/notificationChannels';

export interface ICrNotificationState {
    [key: string]: string;
}

const initialState: ICrNotificationState = {};

export interface ICrNotificationIdAction extends Action {
    payload: {
        userId: string;
        notificationId: string;
    };
}

export interface IClearCrNotificationsAction extends Action {
    payload: {
        userId: string;
    };
}

type CrNotificationActions = ICrNotificationIdAction | IClearCrNotificationsAction;

export default function (
    state: ICrNotificationState = initialState,
    action: CrNotificationActions,
): ICrNotificationState {
    switch (action.type) {
        case notificationsId.CR_NOTIFICATION_ID:
            const crNotificationPayload = action.payload as ICrNotificationIdAction['payload'];
            return {...state, [crNotificationPayload.userId]: crNotificationPayload.notificationId.toString()};

        case notificationsId.CLEAR_CR_NOTIFICATIONS:
            const clearCrNotificationsPayload = action.payload as IClearCrNotificationsAction['payload'];
            const notificationId = state[clearCrNotificationsPayload.userId];
            if (notificationId) {
                const arr = Platform.OS === 'android' ? [notificationId.toString()] : [];
                const newState = {...state};
                delete newState[clearCrNotificationsPayload.userId];
                let isLast = Platform.OS === 'android';
                PushNotification.getDeliveredNotifications((data) => {
                    for (let i = 0; i < data.length; i++) {
                        if (Platform.OS === 'android') {
                            if (
                                data[i].group === channels.REQUEST &&
                                data[i].identifier !== notificationGroupId[channels.REQUEST].toString() &&
                                data[i].identifier !== notificationId
                            ) {
                                isLast = false;
                                break;
                            }
                        } else if (data[i].userInfo.id === notificationId) {
                            arr.push(data[i].identifier);
                            break;
                        }
                    }
                    if (isLast) arr.push(notificationGroupId[channels.REQUEST].toString());
                    PushNotification.removeDeliveredNotifications(arr);
                });
                return newState;
            }
            return state;

        default:
            return state;
    }
}
