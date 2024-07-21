import PushNotification from 'react-native-push-notification';
import channels from './notificationChannels';

export default async () => {
    PushNotification.createChannel(
        {
            channelId: channels.MESSAGE,
            channelName: 'Messages',
            channelDescription: 'Groups chat messages',
            soundName: 'default',
            importance: 5,
            vibrate: true,
        },
        () => {},
    );
    PushNotification.createChannel(
        {
            channelId: channels.REQUEST,
            channelName: 'Connections Requests',
            channelDescription: 'Requests to connect with you.',
            soundName: 'default',
            importance: 5,
            vibrate: true,
        },
        () => {},
    );
    PushNotification.createChannel(
        {
            channelId: channels.GROUP,
            channelName: 'Group Additions',
            channelDescription: 'Notifications when added to a new Group',
            soundName: 'default',
            importance: 5,
            vibrate: true,
        },
        () => {},
    );
    PushNotification.createChannel(
        {
            channelId: channels.MENTION,
            channelName: 'Mentions',
            channelDescription: 'Mentions in posts and comments',
            soundName: 'default',
            importance: 5,
            vibrate: true,
        },
        () => {},
    );
    PushNotification.createChannel(
        {
            channelId: channels.OTHER,
            channelName: 'Other',
            channelDescription: 'Other notifications',
            soundName: 'default',
            importance: 5,
            vibrate: true,
        },
        () => {},
    );
};
