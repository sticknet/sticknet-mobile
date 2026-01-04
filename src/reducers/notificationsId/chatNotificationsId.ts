// import {Platform} from 'react-native';
// // import PushNotification from 'react-native-push-notification';
// import {Action} from 'redux';
// import {hashCode} from '@/src/utils';
// import {notificationsId} from '@/src/actions/actionTypes';
//
// export interface IChatNotificationsIdState {
//     [key: string]: string[];
// }
//
// const initialState: IChatNotificationsIdState = {};
//
// export interface IChatNotificationIdAction extends Action {
//     payload: {
//         roomId: string;
//         id: string;
//     };
// }
//
// export interface IClearChatNotificationsAction extends Action {
//     payload: {
//         roomId: string;
//     };
// }
//
// type ChatNotificationActions = IChatNotificationIdAction | IClearChatNotificationsAction;
//
// export default function (
//     state: IChatNotificationsIdState = initialState,
//     action: ChatNotificationActions,
// ): IChatNotificationsIdState {
//     switch (action.type) {
//         case notificationsId.CHAT_NOTIFICATION_ID:
//             const chatNotificationPayload = action.payload as IChatNotificationIdAction['payload'];
//             if (!state[chatNotificationPayload.roomId]) state[chatNotificationPayload.roomId] = [];
//             return {
//                 ...state,
//                 [chatNotificationPayload.roomId]: [
//                     ...state[chatNotificationPayload.roomId],
//                     chatNotificationPayload.id.toString(),
//                 ],
//             };
//
//         case notificationsId.CLEAR_CHAT_NOTIFICATIONS:
//             const clearChatNotificationsPayload = action.payload as IClearChatNotificationsAction['payload'];
//             if (Platform.OS === 'android') {
//                 const code = hashCode(clearChatNotificationsPayload.roomId).toString();
//                 PushNotification.removeDeliveredNotifications([code]);
//             } else {
//                 const arr: string[] = [];
//                 PushNotification.getDeliveredNotifications((data) => {
//                     for (let i = 0; i < data.length; i++) {
//                         if (data[i].userInfo.target) {
//                             const target = JSON.parse(data[i].userInfo.target);
//                             if (clearChatNotificationsPayload.roomId === target.roomId) {
//                                 arr.push(data[i].identifier);
//                             }
//                         }
//                     }
//                     PushNotification.removeDeliveredNotifications(arr);
//                 });
//             }
//             const newState = {...state};
//             delete newState[clearChatNotificationsPayload.roomId];
//             return newState;
//
//         default:
//             return state;
//     }
// }
