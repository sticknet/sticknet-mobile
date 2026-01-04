// import PushNotification, {
//     PushNotificationObject,
//     PushNotification as PushNotificationType,
// } from 'react-native-push-notification';
//
// type NotificationHandlerCallback = (notification: PushNotificationType) => void;
// type RegisterHandlerCallback = (token: {os: string; token: string}) => void;
//
// class NotificationHandler {
//     private _onNotification?: NotificationHandlerCallback;
//
//     private _onRegister?: RegisterHandlerCallback;
//
//     onNotification(notification: PushNotificationType) {
//         if (typeof this._onNotification === 'function') {
//             this._onNotification(notification);
//         }
//     }
//
//     onRegister(token: {os: string; token: string}) {
//         if (typeof this._onRegister === 'function') {
//             this._onRegister(token);
//         }
//     }
//
//     onAction(notification: PushNotificationObject & {action?: string}) {
//         if (notification.action === 'Yes') {
//             PushNotification.invokeApp(notification);
//         }
//     }
//
//     onRegistrationError(err: Error) {
//         console.log(err);
//     }
//
//     attachRegister(handler: RegisterHandlerCallback) {
//         this._onRegister = handler;
//     }
//
//     attachNotification(handler: NotificationHandlerCallback) {
//         this._onNotification = handler;
//     }
// }
//
// const handler = new NotificationHandler();
//
// PushNotification.configure({
//     onRegister: handler.onRegister.bind(handler),
//     // @ts-ignore
//     onNotification: handler.onNotification.bind(handler),
//     // @ts-ignore
//     onAction: handler.onAction.bind(handler),
//     onRegistrationError: handler.onRegistrationError.bind(handler),
//     permissions: {
//         alert: true,
//         badge: true,
//         sound: true,
//     },
//     popInitialNotification: true,
//     requestPermissions: false,
// });
//
// export default handler;
