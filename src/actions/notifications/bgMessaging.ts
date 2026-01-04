// import Keychain from '@sticknet/react-native-keychain';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import DeviceInfo from 'react-native-device-info';
// import StickProtocol from '@/modules/stick-protocol';
// import NotifService from './NotifService';
// import {bgNotif} from '@/src/actions/globalVariables';
// import {stickProtocolHandlers as SPH} from '@/src/actions/SPHandlers';
// import channels from './notificationChannels';
// import camelize from '@/src/utils/camelize';
//
// const bundleId = DeviceInfo.getBundleId();
//
// function onNotif(notif: any) {
//     bgNotif.data = notif;
// }
//
// interface MessageData {
//     channelId: string;
//     isGroup: string;
//     target: string;
//     subText: string;
//     id: string;
//     stickId: string;
//     memberId: string;
//     body: string;
//     title: string;
// }
//
// interface Message {
//     data: MessageData;
//     messageId: string;
// }
//
// export default async (message: Message) => {
//     message = camelize(message) as Message;
//     const notif = new NotifService(onNotif);
//     const id = (Math.random() * 4294967296) >> 0;
//
//     switch (message.data.channelId) {
//         case channels.MESSAGE:
//             const isGroup = JSON.parse(message.data.isGroup);
//             const target = JSON.parse(message.data.target);
//             message.data.subText = isGroup ? target.displaName : target.name;
//             message.data.id = target.id;
//             break;
//         case channels.GROUP:
//             message.data.subText = 'Groups';
//             break;
//         case channels.MENTION:
//             message.data.subText = 'Mentions';
//             break;
//         default:
//             break;
//     }
//
//     const isSticky = true;
//     if (message.data.channelId !== channels.OTHER) {
//         const entityId = id.toString();
//
//         const {password} = await Keychain.getGenericPassword({service: `${bundleId}.auth_token`});
//         const token = `Token ${password}`;
//         const res = await AsyncStorage.multiGet(['@userId', '@oneTimeId']);
//         const userId = res[0][1] as string;
//         const oneTimeId = res[1][1] as string;
//         await SPH.setUp(token, userId, oneTimeId);
//         await SPH.canDecrypt(entityId, message.data.stickId, message.data.memberId, null);
//         let decryptedNotification = await StickProtocol.decryptText(
//             message.data.memberId,
//             message.data.stickId,
//             message.data.body,
//             isSticky,
//         );
//         decryptedNotification = JSON.parse(decryptedNotification);
//         message.data.title = decryptedNotification.title;
//         message.data.body = decryptedNotification.body;
//     }
//
//     notif.localNotif(message.data, message.messageId, id, message.data.channelId === channels.MESSAGE);
//     return Promise.resolve();
// };
