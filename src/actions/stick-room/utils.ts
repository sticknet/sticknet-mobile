import {firebase} from '@react-native-firebase/database';
import {Dispatch} from 'redux';
import {stickRoom} from '@/src/actions/actionTypes';
import {globalData, syncingChain} from '@/src/actions/globalVariables';
import {formatTime} from '@/src/utils';
import channels from '@/src/actions/notifications/notificationChannels';
import StickProtocol from '@/modules/stick-protocol';
import axios from '@/src/actions/myaxios';
import {firebaseRef, URL} from '@/src/actions/URL';
import {stickProtocolHandlers as SPH} from '@/src/actions/SPHandlers';
import {log} from '@/src/actions/utils';
import {TMessage, TUser} from '@/src/types';

const database = firebase.app().database(firebaseRef);

const syncChains = async (userId: string, currentUser: TUser, stickId: string, chainStep: number) => {
    if (userId === currentUser.id) {
        if (!syncingChain[stickId]) {
            syncingChain[stickId] = chainStep;
            await SPH.syncChain(chainStep, stickId);
            syncingChain[stickId] = false;
        } else if (chainStep > syncingChain[stickId]) {
            const currentSync = syncingChain[stickId];
            syncingChain[stickId] = chainStep;
            await StickProtocol.ratchetChain(currentUser.id, stickId, chainStep - currentSync);
            syncingChain[stickId] = false;
        }
    }
};

export async function parse(message: TMessage, roomId: string, currentUser: TUser, dispatch: Dispatch | null) {
    log('function: parse');
    const {id, text, userId, stickId, files, audio, updatedMessageId, deletedMessageId, reactions, context, chainStep} =
        message;

    syncChains(userId, currentUser, stickId, chainStep!);

    if (deletedMessageId) return {...message, deleted: true};

    if (updatedMessageId) {
        if (context === 'reaction') {
            const snapshot = await database
                .ref(`rooms/${roomId}/messages/${updatedMessageId}/reactions/${id}`)
                .once('value');
            const canDecrypt = await SPH.canDecrypt(id, stickId, userId, dispatch);
            if (canDecrypt) {
                const decryptedReaction = await StickProtocol.decryptText(
                    userId,
                    stickId,
                    snapshot.val().reaction,
                    true,
                );
                return {
                    updated: true,
                    id: updatedMessageId,
                    roomId,
                    reaction: decryptedReaction,
                    userId,
                    reactionId: id,
                    context,
                } as TMessage;
            }
        } else {
            const snapshot = await database.ref(`rooms/${roomId}/messages/${updatedMessageId}/text`).once('value');
            const canDecrypt = await SPH.canDecrypt(id, stickId, userId, dispatch);
            if (canDecrypt) {
                const decryptedText = await StickProtocol.decryptText(userId, stickId, snapshot.val(), true);
                return {
                    updated: true,
                    id: updatedMessageId,
                    roomId,
                    text: decryptedText,
                    context,
                } as TMessage;
            }
        }
        return null;
    }

    message.isPending = false;
    const canDecrypt = await SPH.canDecrypt(id, stickId, userId, dispatch);
    if (!canDecrypt) {
        message.isPendingDecryption = true;
        return message;
    }

    if (reactions) {
        const entries = Object.entries(reactions);
        const msgReactions: Record<string, Record<string, string>> = {};
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const reactionId = entry[0];
            const userId = entry[1].userId;
            const encryptedReaction = entry[1].reaction;
            const canDecrypt = await SPH.canDecrypt(reactionId, entry[1].stickId || stickId, userId, dispatch);
            if (canDecrypt) {
                const decryptedReaction = await StickProtocol.decryptText(
                    userId,
                    entry[1].stickId || stickId,
                    encryptedReaction,
                    true,
                );
                if (decryptedReaction)
                    msgReactions[decryptedReaction] = {...msgReactions[decryptedReaction], [reactionId]: userId};
            }
        }
        message.reactions = msgReactions;
    }

    if (text) {
        const decryptedText = await StickProtocol.decryptText(userId, stickId, text, true);
        if (!decryptedText) {
            message.isPendingDecryption = true;
            return message;
        }
        message.text = decryptedText;
    }

    if (files) {
        await decryptFiles(message, currentUser, dispatch);
    }

    if (audio) {
        await decryptAudio(message, currentUser, dispatch);
    }

    if (message.isPendingDecryption) message.isPendingDecryption = false;

    return message;
}

// Decrypt Messages

async function decryptFiles(message: any, currentUser: TUser, dispatch: Dispatch | null) {
    log('function: decryptImages');
    try {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/fetch-chat-files/?ids=${message.files.toString()}`, config);
        if (message.album) {
            const {data} = await axios.get(`${URL}/api/fetch-single-chat-album/?id=${message.album.id}`, config);
            const roomId = message.roomId;
            await SPH.decryptAlbums([data.album]);
            if (dispatch) {
                dispatch({type: stickRoom.FETCH_ALBUMS, payload: {albums: [data.album], roomId}});
                dispatch({
                    type: stickRoom.FETCH_ALBUM_IMAGES_IDS,
                    payload: {
                        images: response.data.reverse(),
                        albumId: message.album.id,
                        prepend: true,
                    },
                });
                dispatch({type: stickRoom.FETCH_FILES, payload: {files: response.data}});
            }
        }
    } catch (e: any) {
        console.log('decryptFiles Error', e.toString());
    }
}

async function decryptAudio(message: any, currentUser: TUser, dispatch: Dispatch | null) {
    log('function: decryptImages');
    try {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/fetch-chat-audio/?id=${message.audio.toString()}`, config);
        if (dispatch) dispatch({type: stickRoom.FETCH_AUDIO, payload: {audio: response.data.audio}});
    } catch (e: any) {
        console.log('decryptAudio Error', e.toString());
    }
}

export function messageSent(dispatch: Dispatch, newMessage: any, roomId: string, userId: string) {
    log('function: messageSent');
    dispatch({
        type: stickRoom.MESSAGE_SENT,
        payload: {roomId, message: newMessage},
    });
    dispatch({type: stickRoom.MESSAGES_SEEN, payload: {userId, roomId}});
    if (newMessage.images) {
        dispatch({type: stickRoom.FILES_MESSAGE_SENT, payload: {ids: newMessage.files}});
    }
    if (newMessage.audio) dispatch({type: stickRoom.AUDIO_MESSAGE_SENT, payload: {id: newMessage.audio}});
}

const parseReactedMessage = (message: any, isVideo: boolean) => {
    if (message.album && !message.album.autoMonth) return '🎞';
    if (isVideo) return '📹';
    if (message.isMedia) return '🖼';
    if (message.files) return '📄';
    if (message.audio) return '🎤';
    if (message.text) return `"${message.text}"`;
    return '';
};

interface SendNotificationParams {
    message: any;
    user: TUser;
    target: any;
    stickId: string;
    isGroup: boolean;
    newAlbumTitle?: string;
    existingAlbumTitle?: string;
    audioDuration?: number;
    isVideo?: boolean;
    reaction?: string;
}

export async function sendNotification(params: SendNotificationParams) {
    log('function: sendNotification');
    const {
        message,
        user,
        target,
        stickId,
        isGroup,
        newAlbumTitle,
        existingAlbumTitle,
        audioDuration,
        isVideo,
        reaction,
    } = params;
    const toUser: string[] = [];
    if (isGroup)
        target.membersIds.map((member: string) => {
            if (user.id !== member) {
                toUser.push(member);
            }
        });
    else toUser.push(target.id);

    if (toUser.length > 0) {
        const config = {headers: {Authorization: globalData.token}};
        let bodyInitial;
        let notificationTarget;
        if (isGroup) {
            bodyInitial = `${user.name}: `;
            notificationTarget = {
                id: target.id,
                displayName: target.displayName.text,
                cover: target.cover,
                stickId,
                membersIds: target.membersIds,
                roomId: target.roomId,
            };
        } else {
            bodyInitial = '';
            notificationTarget = {
                id: user.id,
                name: user.name,
                profile_picture: user.profilePicture,
                stickId,
                roomId: target.roomId,
            };
        }
        const body = {
            toUser,
            data: {
                title: target.displayName ? target.displayName.text : user.name,
                body: reaction
                    ? `${bodyInitial} ${reaction} to ${parseReactedMessage(message, isVideo as boolean)}`
                    : message.audio
                    ? `${bodyInitial}🎤 Voice message (${formatTime(audioDuration as number)})`
                    : newAlbumTitle
                    ? `${bodyInitial}🎞️️ Created a new album (${newAlbumTitle})`
                    : existingAlbumTitle
                    ? `${bodyInitial}🎞➕️️ Added more photos to album (${existingAlbumTitle})`
                    : isVideo
                    ? `${bodyInitial}📹️ Video`
                    : message.isMedia
                    ? `${bodyInitial}🖼 Photo`
                    : message.files.length > 0
                    ? `${bodyInitial}📄 File`
                    : message.text
                    ? `${bodyInitial}${message.text}`
                    : '',
                target: JSON.stringify(notificationTarget),
                channelId: channels.MESSAGE,
                isGroup: JSON.stringify(isGroup),
                id: message.id,
                memberId: user.id,
                userId: user.id,
                stickId: notificationTarget.stickId,
                isText: message.text ? JSON.stringify(true) : JSON.stringify(false),
            },
        };
        const notification = {title: body.data.title, body: body.data.body};
        const encryptedNotification = await StickProtocol.encryptText(
            user.id,
            stickId,
            JSON.stringify(notification),
            true,
        );
        body.data.title = 'Sticknet';
        body.data.body = encryptedNotification as string;
        axios.post(`${URL}/api/push-notification-multicast/`, body, config).catch((err) => console.log('error', err));
    }
}

export async function deleteChatMedia(message: any) {
    log('function: deleteChatMedia');
    const config = {headers: {Authorization: globalData.token}};
    if (message.images) {
        const ids: string[] = [];
        message.images.map((image: any) => {
            ids.push(image.id);
        });
        setTimeout(() => axios.post(`${URL}/api/delete-image-messages/`, {ids}, config), 3000);
    } else if (message.audio)
        setTimeout(() => axios.post(`${URL}/api/delete-audio-messages/`, {id: message.audio.id}, config), 3000);
    else if (message.video)
        setTimeout(() => axios.post(`${URL}/api/delete-video-messages/`, {id: message.video.id}, config), 3000);
}

export function findLatestCreatedGroup(map: Record<string, number | any>) {
    let maxKey = null;
    let maxValue = -Infinity;
    Object.entries(map).forEach(([key, value]) => {
        if (Number.isInteger(value) && value > maxValue) {
            maxValue = value;
            maxKey = key;
        }
    });
    return maxKey;
}
