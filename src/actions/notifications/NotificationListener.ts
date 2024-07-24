import messaging, {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';
import camelize from '../../utils/camelize';
import StickProtocol from '../../native-modules/stick-protocol';
import NotifService from './NotifService';
import createChannels from './createChannels';
import registerForNotifications from './registerForNotifications';
import {globalData} from '../globalVariables';
import SPH from '../SPHandlers';
import channels from './notificationChannels';
import {nav} from '../../utils';
import NavigationService from '../NavigationService';

interface Props {
    user: any;
    finishedRegistration: boolean;
    appState: string;
    navigation: any;
    dispatchChatNotificationId: (id: number, targetId: string) => void;
    dispatchConnReqNotificationId: (id: number, fromUserId: string) => void;
    dispatchGroupNotificationId: (id: number, groupId: string) => void;
    dispatchCurrentTarget: (params: any) => void;
}

interface Notification {
    channelId: string;
    subText: string;
    title: string;
    body: string;
    id: string;
}

interface MessageData {
    [key: string]: any;
    target?: any;
    content?: any;
    album?: any;
    channelId: string;
    stickId?: string;
    memberId?: string;
    body?: string;
    title?: string;
    subText?: string;
    id?: string;
    fromUserId?: string;
    isGroup?: string;
    groupId?: string;
}

const camelizeNotif = (message: FirebaseMessagingTypes.RemoteMessage): FirebaseMessagingTypes.RemoteMessage => {
    message.data = camelize(message.data);
    if (message.data?.target) message.data.target = camelize(message.data.target);
    if (message.data?.content) message.data.content = camelize(message.data.content);
    if (message.data?.album) message.data.album = camelize(message.data.album);
    delete message.data?.Id;
    return message;
};

export default class NotificationListener {
    private props: Props;

    private notif: NotifService;

    constructor(props: Props) {
        this.props = props;
        this.notif = new NotifService(this.onNotif.bind(this));
    }

    startListeners() {
        if (this.props.user && this.props.finishedRegistration) registerForNotifications();
        if (Platform.OS === 'android') createChannels();
        globalData.unsubscribeNotifications = messaging().onMessage(
            async (message: FirebaseMessagingTypes.RemoteMessage) => {
                if (NavigationService.getRoute() === 'Messages') return;
                if (!message.notification) {
                    message = camelizeNotif(message);
                    if (Platform.OS === 'android' || (Platform.OS === 'ios' && this.props.appState === 'active')) {
                        const id = (Math.random() * 4294967296) >> 0;
                        const data = message.data as MessageData;
                        switch (data.channelId) {
                            case channels.MESSAGE:
                                const isGroup = JSON.parse(data.isGroup || 'false');
                                if (Platform.OS === 'ios') {
                                    this.props.dispatchChatNotificationId(id, JSON.parse(data.target).id);
                                }
                                const target = JSON.parse(data.target);
                                data.subText = isGroup ? target.displayName : target.name;
                                data.id = target.id;
                                break;
                            case channels.REQUEST:
                                this.props.dispatchConnReqNotificationId(id, data.fromUserId!);
                                data.subText = 'Connection Requests';
                                break;
                            case channels.GROUP:
                                this.props.dispatchGroupNotificationId(id, data.groupId!);
                                data.subText = 'Groups';
                                break;
                            case channels.MENTION:
                                data.subText = 'Mentions';
                                break;
                            default:
                                break;
                        }
                        const isSticky = true;
                        if (data.channelId !== channels.OTHER) {
                            const entityId = id.toString();
                            await SPH.canDecrypt(entityId, data.stickId!, data.memberId!, null);
                            let decryptedNotification = await StickProtocol.decryptText(
                                data.memberId!,
                                data.stickId!,
                                data.body!,
                                isSticky,
                            );
                            decryptedNotification = JSON.parse(decryptedNotification);
                            data.title = decryptedNotification.title;
                            data.body = decryptedNotification.body;
                        }

                        this.notif.localNotif(
                            data as Notification,
                            message.messageId!,
                            id,
                            data.channelId === channels.MESSAGE,
                        );
                    }
                }
            },
        );

        // IOS BACKGROUND NOTIFICATION
        messaging().onNotificationOpenedApp((notification: FirebaseMessagingTypes.RemoteMessage) => {
            // @ts-ignore
            notification.data = {...notification.data, userInteraction: true};
            this.onNotif(notification);
        });

        // IOS & ANDROID KILLED NOTIFICATION
        PushNotification.popInitialNotification((notification) => {
            if (notification) {
                notification.data = {...notification.data, userInteraction: true};
                // @ts-ignore
                this.onNotif(notification);
            }
        });
    }

    async onNotif(message: FirebaseMessagingTypes.RemoteMessage) {
        message = camelizeNotif(message);
        const data = message.data as MessageData;
        let {channelId} = data;
        if (data.userInteraction && Platform.OS === 'ios') {
            channelId = data.channelId;
        }
        switch (channelId) {
            case channels.MESSAGE:
                const isGroup = JSON.parse(data.isGroup || 'false');
                const target = JSON.parse(data.target);
                const params = {
                    roomId: target.roomId,
                    isGroup,
                    id: target.id,
                };
                nav(this.props.navigation, 'StickRoomTab', {
                    screen: 'Messages',
                    params,
                });
                this.props.dispatchCurrentTarget({target: params});
                break;
            case channels.REQUEST:
                this.props.navigation.navigate('ChatsTab', {screen: 'Chats'});
                break;
            case channels.GROUP:
                this.props.navigation.navigate('ChatsTab', {screen: 'Chats'});
                break;
            default:
                break;
        }
    }
}
