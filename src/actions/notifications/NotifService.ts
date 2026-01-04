// import {Platform} from 'react-native';
// import PushNotification, {PushNotificationScheduledLocalObject} from 'react-native-push-notification';
// import NotificationHandler from './NotificationHandler';
// import {notificationGroupId} from '@/src/actions/globalVariables';
// import {hashCode} from '@/src/utils';
// import channels from './notificationChannels';
//
// type Notification = {
//     channelId: string;
//     subText: string;
//     title: string;
//     body: string;
//     id: string;
// };
//
// export default class NotifService {
//     private lastId: number;
//
//     private lastChannelCounter: number;
//
//     private ids: typeof notificationGroupId;
//
//     constructor(onNotification: (notification: any) => void) {
//         this.lastId = 0;
//         this.lastChannelCounter = 0;
//         this.ids = notificationGroupId;
//         NotificationHandler.attachNotification(onNotification);
//
//         // Clear badge number at start
//         PushNotification.getApplicationIconBadgeNumber((number) => {
//             if (number > 0) {
//                 PushNotification.setApplicationIconBadgeNumber(0);
//             }
//         });
//
//         PushNotification.getChannels((channels) => {
//             console.log(channels);
//         });
//     }
//
//     createOrUpdateChannel() {
//         this.lastChannelCounter++;
//         PushNotification.createChannel(
//             {
//                 channelId: 'custom-channel-id', // (required)
//                 channelName: `Custom channel - Counter: ${this.lastChannelCounter}`, // (required)
//                 channelDescription: `A custom channel to categorise your custom notifications. Updated at: ${Date.now()}`, // (optional) default: undefined.
//                 soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
//                 importance: 4, // (optional) default: 4. Int value of the Android notification importance
//                 vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
//             },
//             (created) => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
//         );
//     }
//
//     popInitialNotification() {
//         PushNotification.popInitialNotification((notification) => console.log('InitialNotification:', notification));
//     }
//
//     localNotif(notification: Notification, messageId: string, id: number, isChat: boolean) {
//         this.lastId++;
//
//         PushNotification.localNotification({
//             /* Android Only Properties */
//             // @ts-ignore
//             data: notification,
//             showWhen: true, // (optional) default: true
//             autoCancel: true, // (optional) default: true
//             smallIcon: '@drawable/ic_stat_name', // (optional) default: "ic_notification" with fallback for "ic_launcher". Use "" for default small icon.
//             subText: notification.subText, // (optional) default: none
//             color: '#6060FF', // (optional) default: system default
//             vibrate: true, // (optional) default: true
//             vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
//             group: !isChat ? notification.channelId : notification.id, // (optional) add group to message
//             ongoing: false, // (optional) set whether this is an "ongoing" notification
//             priority: 'high', // (optional) set notification priority, default: high
//             visibility: 'private', // (optional) set notification visibility, default: private
//             importance: 'high', // (optional) set notification importance, default: high
//             allowWhileIdle: false, // (optional) set notification to work while on doze, default: false
//             ignoreInForeground: false, // (optional) if true, the notification will not be visible when the app is in the foreground (useful for parity with how iOS notifications appear)
//             channelId: notification.channelId, // (optional) custom channelId, if the channel doesn't exist, it will be created with options passed above (importance, vibration, sound). Once the channel is created, the channel will not be updated. Make sure your channelId is different if you change these options. If you have created a custom channel, it will apply options of the channel.
//             onlyAlertOnce: false, // (optional) alert will open only once with sound and notify, default: false
//             messageId,
//             id,
//             invokeApp: true, // (optional) This enables click on actions to bring back the application to foreground or stay in background, default: true
//
//             /* iOS only properties */
//             alertAction: 'view', // (optional) default: view
//             category: '', // (optional) default: empty string
//
//             /* iOS and Android properties */
//             title: notification.title, // (optional)
//             message: notification.body, // (required)
//             userInfo: {...notification, userInteraction: true, id: id.toString()}, // (optional) default: {} (using null throws a JSON value '<null>' error)
//             playSound: true, // (optional) default: true
//             soundName: 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
//         });
//
//         if (Platform.OS === 'android') {
//             let code = 0;
//             if (notification.channelId === channels.MESSAGE) {
//                 code = hashCode(notification.id);
//             }
//             PushNotification.localNotification({
//                 channelId: notification.channelId,
//                 id: !isChat ? this.ids[notification.channelId] : code,
//                 group: !isChat ? notification.channelId : notification.id,
//                 subText: notification.subText,
//                 smallIcon: '@drawable/ic_stat_name',
//                 color: '#6060FF',
//                 groupSummary: true,
//                 title: notification.title, // (optional)
//                 message: notification.body,
//                 // @ts-ignore
//                 data: notification,
//             });
//         }
//     }
//
//     scheduleNotif(soundName?: string) {
//         this.lastId++;
//         PushNotification.localNotificationSchedule({
//             date: new Date(Date.now() + 30 * 1000), // in 30 secs
//
//             /* Android Only Properties */
//             ticker: 'My Notification Ticker', // (optional)
//             autoCancel: true, // (optional) default: true
//             largeIcon: 'ic_launcher', // (optional) default: "ic_launcher"
//             smallIcon: 'ic_notification', // (optional) default: "ic_notification" with fallback for "ic_launcher"
//             bigText: 'My big text that will be shown when notification is expanded', // (optional) default: "message" prop
//             subText: 'This is a subText', // (optional) default: none
//             color: 'blue', // (optional) default: system default
//             vibrate: true, // (optional) default: true
//             vibration: 300, // vibration length in milliseconds, ignored if vibrate=false, default: 1000
//             tag: 'some_tag', // (optional) add tag to message
//             group: 'group', // (optional) add group to message
//             ongoing: false, // (optional) set whether this is an "ongoing" notification
//             actions: ['Yes', 'No'], // (Android only) See the doc for notification actions to know more
//             invokeApp: false, // (optional) This enables click on actions to bring back the application to foreground or stay in background, default: true
//
//             /* iOS only properties */
//             category: '', // (optional) default: empty string
//
//             /* iOS and Android properties */
//             id: this.lastId, // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
//             title: 'Scheduled Notification', // (optional)
//             message: 'My Notification Message', // (required)
//             userInfo: {screen: 'home'}, // (optional
//             playSound: !!soundName, // (optional) default: true playSound: !!soundName, // (optional) default: true
//             number: 10, // (optional) Valid 32 bit integer specified as string. default: none (Cannot be zero)
//             soundName: soundName || 'default', // (optional) Sound to play when the notification is shown. Value of 'default' plays the default sound. It can be set to a custom sound such as 'android.resource://com.xyz/raw/my_sound'. It will look for the 'my_sound' audio file in 'res/raw' directory and play it. default: 'default' (default sound is played)
//         });
//     }
//
//     requestPermissions() {
//         return PushNotification.requestPermissions();
//     }
//
//     cancelNotif() {
//         PushNotification.cancelLocalNotifications({id: `${this.lastId}`});
//     }
//
//     cancelAll() {
//         PushNotification.cancelAllLocalNotifications();
//     }
//
//     abandonPermissions() {
//         PushNotification.abandonPermissions();
//     }
//
//     getScheduledLocalNotifications(callback: (notifications: PushNotificationScheduledLocalObject[]) => void) {
//         PushNotification.getScheduledLocalNotifications(callback);
//     }
// }
