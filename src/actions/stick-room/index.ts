import _ from 'lodash';
import {firebase} from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';
import {Dispatch} from 'redux';
// import {DocumentPickerResponse} from 'react-native-document-picker';
import {AxiosResponse} from 'axios';
import axios from '@/src/actions/myaxios';
import StickProtocol from '@/modules/stick-protocol';
import {
    endMessageKeys,
    fetchingSenderKeys,
    globalData,
    messagesJustSent,
    startMessageKeys,
    stickySessionSteps,
} from '@/src/actions/globalVariables';
import {stickProtocolHandlers as SPH} from '@/src/actions/SPHandlers';
import {firebaseRef, URL} from '@/src/actions/URL';
import {
    app,
    appTemp,
    auth,
    cache,
    connections as connectionsActions,
    fetched,
    groups as groupsActions,
    progress,
    stickRoom,
    url,
} from '@/src/actions/actionTypes';
import {findLatestCreatedGroup, messageSent, parse, sendNotification} from './utils';
import {log, uploadFiles} from '@/src/actions/utils';
import {getAllNestedKeys, getUniqueDeviceId} from '@/src/utils';
import type {TUser, TGroup, TParty, TMessage, TFile, TChatAlbum, TTarget} from '@/src/types';

const database = firebase.app().database(firebaseRef);

export interface IStickRoomActions {
    fetchMessages: (params: fetchMessagesParams) => void;
    fetchOlderMessages: (params: TFetchOlderMessagesParams) => void;
    fetchMessagesSingleTarget: (params: TFetchMessagesSingleTarget) => void;
    fetchRoomFiles: (params: fetchRoomFilesParams) => void;
    dispatchCurrentTarget: (params: TDispatchCurrentTargetParams) => void;
    sendMessage: (params: SendMessageParams) => void;
    connect: (params: TConnectParams) => void;
    disconnect: (params: TDisconnectParams) => void;
    connectOneToOne: (params: TConnectOneToOneParams) => void;
    fetchChatAlbums: (params: TFetchChatAlbumsParams) => void;
    fetchAlbumPhotos: (params: TFetchAlbumPhotosParams) => void;
    decryptMessage: (params: TDecryptMessage) => void;
    fetchRepliedMessage: (params: TFetchRepliedMessage) => void;
    sendMessageReaction: (params: TSendMessageReaction) => void;
    undoMessageReaction: (params: TUndoMessageReaction) => void;
    removeChat: (roomId: string) => void;
    fetchStorages: (callback?: () => void) => void;
    deleteMessage: (params: TDeleteMessageParams) => void;
    updateAction: (user: TUser, target: TParty, isGroup: boolean, action: number) => void;
    renameAlbum: (params: TRenameAlbum) => void;
}

const fetchMessagesForTarget = (target: TParty, user: TUser, dispatch: Dispatch, reFetch = false) => {
    database.ref(`rooms/${target.roomId}/messages`).off('value');
    const query =
        startMessageKeys[target.roomId] && !reFetch
            ? database.ref(`rooms/${target.roomId}/messages`).orderByKey().startAt(startMessageKeys[target.roomId])
            : database.ref(`rooms/${target.roomId}/messages`).orderByKey().limitToLast(30);
    query.once('value', async (snapshot) => {
        const entries = Object.entries(snapshot.val() || {});
        if (entries.length <= 1) {
            onChildAdded(target, user, dispatch);
            return;
        }
        let i = 0;
        const messages: TMessage[] = [];
        const updatedMessages: TMessage[] = [];
        const deletedMessages: TMessage[] = [];
        entries.map(async (item) => {
            try {
                let message: TMessage | null = item[1] as TMessage;
                if (!endMessageKeys[target.roomId] || parseInt(item[0]) < parseInt(endMessageKeys[target.roomId])) {
                    endMessageKeys[target.roomId] = item[0];
                    AsyncStorage.setItem('@endMessageKeys', JSON.stringify(endMessageKeys));
                }
                if (!startMessageKeys[target.roomId] || parseInt(item[0]) > parseInt(startMessageKeys[target.roomId])) {
                    startMessageKeys[target.roomId] = item[0];
                    AsyncStorage.setItem('@startMessageKeys', JSON.stringify(startMessageKeys));
                }
                message = await parse(message, target.roomId, user, dispatch);
                if (message?.updated) updatedMessages.push(message);
                else if (message?.deleted) deletedMessages.push(message);
                else if (message) messages.push(message);
                i += 1;
                if (i === entries.length) {
                    dispatch({
                        type: stickRoom.FETCH_MESSAGES_MULTIPLE,
                        payload: {messages, updatedMessages, deletedMessages, roomId: target.roomId},
                    });
                    onChildAdded(target, user, dispatch);
                }
            } catch (e: any) {
                console.log('ERROR fetchMessagesForTarget', e.toString());
            }
        });
    });
};

type TFetchMessagesSingleTarget = {target: TParty; user: TUser};

export function fetchMessagesSingleTarget({target, user}: TFetchMessagesSingleTarget) {
    return function (dispatch: Dispatch) {
        fetchMessagesForTarget(target, user, dispatch, true);
        dispatch({type: stickRoom.TOGGLE_REMOVE_ROOM, payload: {roomId: target.roomId, value: false}});
    };
}

type fetchMessagesParams = {
    groups: Record<string, TGroup>;
    connections: Record<string, TUser>;
    user: TUser;
    callback?: () => void;
};

export function fetchMessages({groups, connections, user, callback}: fetchMessagesParams) {
    return async function (dispatch: Dispatch) {
        log('action: fetchMessages');
        _.map(groups, (group) => {
            fetchMessagesForTarget(group, user, dispatch);
        });
        _.map(connections, (connection) => {
            if (connection.roomId) fetchMessagesForTarget(connection, user, dispatch);
        });
        fetchMessagesForTarget(user, user, dispatch);
        database.ref(`users/${user?.id}/last-seen`).off('value');
        database.ref(`users/${user?.id}/last-seen`).on('value', (snapshot) => {
            dispatch({
                type: stickRoom.LAST_SEEN,
                payload: snapshot.val() || {},
            });
        });
        database.ref(`users/${user?.id}/active`).off('value');
        database.ref(`users/${user?.id}/active`).on('value', (snapshot) => {
            dispatch({type: stickRoom.ACTIVE_ROOMS, payload: snapshot.val() || {}});
        });
        database.ref(`users/${user?.id}/blocked-me`).on('value', (snapshot) => {
            globalData.blockedMe = snapshot.val() ? Object.values(snapshot.val() || {}) : [];
        });
        database.ref(`users/${user?.id}/groups`).off('value');
        database.ref(`users/${user?.id}/groups`).on('value', async (snapshot) => {
            const config = {headers: {Authorization: globalData.token}};
            if (snapshot.val() && globalData.notFirstGroupsFetch) {
                dispatch({type: stickRoom.NEW_ROOM, payload: {roomId: findLatestCreatedGroup(snapshot.val())}});
                const response = await axios.get(`${URL}/api/refresh-user/`, config);
                await SPH.decryptGroups(response.data.user.groups, dispatch);
                dispatch({type: groupsActions.FETCH_GROUPS, payload: response.data.user.groups});
            } else globalData.notFirstGroupsFetch = true;
        });
        database.ref(`users/${user?.id}/connection-requests`).off('value');
        database.ref(`users/${user?.id}/connection-requests`).on('value', async (snapshot) => {
            const config = {headers: {Authorization: globalData.token}};
            if (snapshot.val()) {
                const response = await axios.get(`${URL}/api/connection-requests/`, config);
                dispatch({type: connectionsActions.FETCH_CONNECTION_REQUESTS, payload: response.data.results});
                database.ref(`users/${user?.id}/connection-requests`).remove();
            }
        });
        database.ref(`users/${user?.id}/new-connections`).off('value');
        database.ref(`users/${user?.id}/new-connections`).on('value', async (snapshot) => {
            const config = {headers: {Authorization: globalData.token}};
            if (snapshot.val()) {
                const response = await axios.get(`${URL}/api/connections/`, config);
                await dispatch({type: connectionsActions.REMOVE_SENT_CONNECTION_REQUESTS, payload: response.data});
                await dispatch({type: connectionsActions.FETCH_CONNECTIONS_ID, payload: response.data});
                await dispatch({type: auth.UPDATE_USER_CONNECTIONS, payload: response.data});
                database.ref(`users/${user?.id}/new-connections`).remove();
            }
        });

        // pending keys
        database.ref(`users/${user?.id}/pending-keys`).off('value');
        database.ref(`users/${user?.id}/pending-keys`).on('value', async (snapshot) => {
            const config = {headers: {Authorization: globalData.token}};
            if (snapshot.val()) {
                const {data} = await axios.get(`${URL}/api/fetch-pending-keys/`, config);
                const {pendingKeys} = data;
                for (let i = 0; i < pendingKeys.length; i++) {
                    const key = pendingKeys[i];
                    const {receiverId, stickId} = key;
                    await SPH.uploadPendingKey(receiverId, stickId);
                    await database
                        .ref(`users/${receiverId}/received-keys/`)
                        .update({[stickId]: {stickId, senderId: user?.id, receiverId}});
                }
                database.ref(`users/${user?.id}/pending-keys`).remove();
            }
        });

        // received keys
        database.ref(`users/${user?.id}/received-keys`).off('value');
        database.ref(`users/${user?.id}/received-keys`).on('value', async (snapshot) => {
            if (snapshot.val()) {
                Object.values(snapshot.val()).map(async (item: any) => {
                    fetchingSenderKeys[item.stickId + item.senderId] = false;
                    await SPH.canDecrypt('', item.stickId, item.senderId, dispatch);
                });
                database.ref(`users/${user?.id}/received-keys`).remove();
            }
        });

        if (callback) {
            dispatch({type: appTemp.HIDE_PROGRESS_MODAL});
            Platform.OS === 'ios' ? setTimeout(() => callback(), 500) : callback();
        }
    };
}

function onChildAdded(target: TParty, user: TUser, dispatch: Dispatch) {
    log('function: onChildAdded');
    const query = startMessageKeys[target.roomId]
        ? database.ref(`rooms/${target.roomId}/messages`).orderByKey().startAt(startMessageKeys[target.roomId])
        : database.ref(`rooms/${target.roomId}/messages`).orderByKey();
    database.ref(`rooms/${target.roomId}/messages`).off('child_added');
    query.on('child_added', async (snapshot) => {
        if (snapshot.key === startMessageKeys[target.roomId]) return;
        let message = snapshot.val();
        if (
            !endMessageKeys[target.roomId] ||
            (snapshot.key && parseInt(snapshot.key) < parseInt(endMessageKeys[target.roomId]))
        ) {
            endMessageKeys[target.roomId] = snapshot.key;
            AsyncStorage.setItem('@endMessageKeys', JSON.stringify(endMessageKeys));
        }
        if (
            !startMessageKeys[target.roomId] ||
            (snapshot.key && parseInt(snapshot.key) > parseInt(startMessageKeys[target.roomId]))
        ) {
            startMessageKeys[target.roomId] = snapshot.key;
            AsyncStorage.setItem('@startMessageKeys', JSON.stringify(startMessageKeys));
        }
        if (!messagesJustSent.includes(message.id)) {
            message = await parse(message, target.roomId, user, dispatch);
            dispatch({
                type: stickRoom.FETCH_MESSAGES,
                payload: {message, roomId: target.roomId},
            });
        }
    });
}

type TFetchOlderMessagesParams = {target: TParty; user: TUser; callback: () => void};

export function fetchOlderMessages({target, user, callback}: TFetchOlderMessagesParams) {
    return async function (dispatch: Dispatch) {
        log('action: fetchOlderMessages');
        if (!endMessageKeys[target.roomId]) return;
        database
            .ref(`rooms/${target.roomId}/messages`)
            .orderByKey()
            .endAt(endMessageKeys[target.roomId])
            .limitToLast(30)
            .once('value', async (snapshot) => {
                const entries = Object.entries(snapshot.val());
                if (entries.length === 1) return;
                let i = 0;
                const messages: TMessage[] = [];
                const updatedMessages: TMessage[] = [];
                const deletedMessages: TMessage[] = [];
                entries.map(async (item) => {
                    let message: TMessage | null = item[1] as TMessage;
                    if (!endMessageKeys[target.roomId] || parseInt(item[0]) < parseInt(endMessageKeys[target.roomId])) {
                        endMessageKeys[target.roomId] = item[0];
                        AsyncStorage.setItem('@endMessageKeys', JSON.stringify(endMessageKeys));
                    }
                    if (!message.updatedMessageId && !message.deletedMessageId) {
                        message = await parse(message, target.roomId, user, dispatch);
                        if (message?.updated) updatedMessages.push(message);
                        else if (message?.deleted) deletedMessages.push(message);
                        else if (message) messages.push(message);
                    }
                    i += 1;
                    if (i === entries.length) {
                        callback();
                        dispatch({
                            type: stickRoom.FETCH_MESSAGES_MULTIPLE,
                            payload: {messages, updatedMessages, deletedMessages, roomId: target.roomId},
                        });
                    }
                });
            });
    };
}

export async function initOneToOne(target: TTarget | TParty, user: TUser) {
    await database.ref(`rooms/${target.roomId}/creator`).update({[user.id]: user.id});
    await database.ref(`rooms/${target.roomId}/id`).set(target.roomId);
    await database.ref(`rooms/${target.roomId}/admins`).update({[user.id]: user.id});
    await database.ref(`rooms/${target.roomId}/members`).update({[user.id]: user.id});
    await database.ref(`rooms/${target.roomId}/members`).update({[target.id]: target.id});
    await database.ref(`rooms/${target.roomId}/auto-join`).set(false);
}

type TConnectOneToOneParams = {target: TParty; user: TUser};

export function connectOneToOne({target, user}: TConnectOneToOneParams) {
    return async function (dispatch: Dispatch) {
        if (!target.roomId) {
            const {partyId} = await SPH.getStickId([], [target as TUser], false, 'multi');
            target.roomId = partyId;
            dispatch({type: connectionsActions.FETCH_SINGLE_CONNECTION_ID, payload: {...target, roomId: partyId}});
        }
        database.ref(`rooms/${target.roomId}/id`).once('value', (snapshot) => {
            if (!snapshot.exists()) {
                initOneToOne(target, user);
            }
        });
    };
}

type TConnectParams = {target: TParty; user: TUser};

export function connect({target, user}: TConnectParams) {
    return async function (dispatch: Dispatch) {
        log('action: connect');
        const isGroup = !('username' in target);
        const id = target.roomId;
        const deviceId = await getUniqueDeviceId();
        let membersIds: string[] = [];
        database
            .ref(`users/${user.id}/active/${target.roomId}`)
            .update({[deviceId]: firebase.database.ServerValue.TIMESTAMP});
        database.ref(`rooms/${id}/actions`).on('value', (snapshot) => {
            const users = snapshot.val() || {};
            delete users[user.id];
            dispatch({type: stickRoom.UPDATE_ACTIONS, payload: {users, roomId: id}});
        });
        database.ref(`rooms/${id}/muted`).on('value', (snapshot) => {
            let mutedUsers: string[] = [];
            if (snapshot.val()) {
                mutedUsers = Object.values(snapshot.val());
                if (mutedUsers.includes(user.id)) dispatch({type: stickRoom.MUTE_CHAT, payload: id});
            }
            dispatch({type: stickRoom.MUTING_USERS, payload: {users: mutedUsers, roomId: id}});
        });
        if (isGroup) {
            database.ref(`rooms/${id}/members`).on('value', (snapshot) => {
                if (snapshot.val()) {
                    membersIds = Object.values(snapshot.val());
                    dispatch({type: groupsActions.UPDATE_MEMBERS_IDS, payload: {groupId: target.id, ids: membersIds}});
                }
            });
        }
        dispatch({type: stickRoom.LAST_SEEN_SELF, payload: {roomId: id, userId: user.id}});
        dispatch({type: stickRoom.MESSAGES_SEEN, payload: {userId: user.id, roomId: id}});
    };
}

type TDisconnectParams = {roomId: string; userId: string};

export function disconnect({roomId, userId}: TDisconnectParams) {
    return async function (dispatch: Dispatch) {
        const deviceId = await getUniqueDeviceId();
        dispatch({type: stickRoom.MESSAGES_SEEN, payload: {roomId}});
        dispatch({type: stickRoom.LAST_SEEN_SELF, payload: {roomId, userId}});
        await database.ref(`users/${userId}/last-seen`).update({[roomId]: firebase.database.ServerValue.TIMESTAMP});
        database.ref(`users/${userId}/active/${roomId}`).child(deviceId).remove();
        database.ref(`rooms/${roomId}/actions`).child(userId).remove();
        database.ref(`rooms/${roomId}/actions`).off('value');
        database.ref(`rooms/${roomId}/muted`).off('value');
        dispatch({type: app.DELETE_JUST_SENT});
    };
}

interface SendMessageParams {
    text?: string;
    user: TUser;
    target: TParty;
    replyMessage?: TMessage | null;
    isGroup: boolean;
    forwarded?: boolean;
    // assets?: TFile[] | DocumentPickerResponse[];
    assets?: TFile[];
    newAlbumTitle?: string;
    existingAlbum?: {id: string; title: {text: string}};
    audioAsset?: {duration: number};
    isFromVault?: boolean;
    isBasic: boolean;
}

export function sendMessage(params: SendMessageParams) {
    return async function (dispatch: Dispatch) {
        log('action: sendMessage');
        const {
            text,
            user,
            target,
            replyMessage,
            isGroup,
            forwarded,
            assets,
            newAlbumTitle,
            existingAlbum,
            audioAsset,
            isFromVault,
            isBasic,
        } = params;
        if (isFromVault) {
            dispatch({
                type: progress.UPDATE_WITH_ACTIVITY,
                payload: 'Sending file...',
            });
        }

        let stickId: string;
        let partyId: string;

        if (!stickySessionSteps[target.id] || stickySessionSteps[target.id].chainStep >= 300) {
            const res = isGroup
                ? await SPH.getStickId([target as TGroup], [], false, 'group')
                : await SPH.getStickId([], [target as TUser], false, 'multi');
            stickId = res.stickId;
            partyId = res.partyId;
            stickySessionSteps[target.id] = res;
        } else {
            stickId = stickySessionSteps[target.id].stickId;
            partyId = stickySessionSteps[target.id].partyId;
        }

        const roomId = target.roomId;
        const timestamp = new Date();
        const id = timestamp.getTime().toString();
        const message: any = {
            text,
            userId: user.id,
            timestamp: timestamp.getTime(),
            roomId,
            stickId,
            isGroup,
            replyToId: replyMessage?.id,
            isPending: true,
            id,
            forwarded,
        };

        const isMedia = assets && (assets[0]?.type?.startsWith('image') || assets[0]?.type?.startsWith('video'));
        const isVideo = assets && assets[0]?.type?.startsWith('video');
        message.isMedia = isMedia;

        dispatch({type: stickRoom.FETCH_MESSAGES, payload: {message, roomId}});
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {editingMessage: null, replyMessage: null}});

        if (globalData.blockedMe && globalData.blockedMe.includes(target.id)) {
            const newMessage = {...message, timestamp: new Date()};
            setTimeout(() => messageSent(dispatch, newMessage, roomId, user.id), 200);
            return;
        }

        let encryptedText;
        let encryptedAlbumTitle;
        let files: string[] = [];
        let album: {id: any; timestamp: any; autoMonth: any};
        let audio = '';
        let response: AxiosResponse<any, any> | null = null;

        if (text) encryptedText = await StickProtocol.encryptText(user.id, stickId, text, true);
        if (newAlbumTitle) encryptedAlbumTitle = await StickProtocol.encryptText(user.id, stickId, newAlbumTitle, true);

        let messageId: string | null = null;

        if (assets && assets.length > 0) {
            const config = {headers: {Authorization: globalData.token}};
            const uploadedFiles = await uploadFiles({
                message,
                assets,
                isBasic,
                context: 'chatFile',
                roomId,
                stickId,
                userId: user.id,
                dispatch,
            });
            messageId = new Date().getTime().toString();
            message.tempId = message.id;
            message.id = messageId;
            response = await axios.post(
                `${URL}/api/upload-chat-files/`,
                {
                    files: uploadedFiles,
                    stickId,
                    partyId: !isGroup ? partyId : undefined,
                    groupId: isGroup ? roomId : undefined,
                    encryptedAlbumTitle,
                    albumId: existingAlbum?.id,
                    isMedia,
                    messageId,
                },
                config,
            );
            files = [];
            response.data.files.map((item: {id: string}) => files.push(item.id));
            dispatch({type: fetched.STORAGES, payload: {fetched: false}});
            dispatch({type: fetched.ROOM_FILES, payload: {roomId, fetched: false}});
        }

        if (audioAsset) {
            const config = {headers: {Authorization: globalData.token}};
            const uploadedFiles = await uploadFiles({
                message,
                assets: [audioAsset],
                isBasic,
                context: 'chatAudio',
                roomId,
                stickId,
                userId: user.id,
                dispatch,
            });
            response = await axios.post(
                `${URL}/api/upload-chat-audio/`,
                {
                    audio: uploadedFiles[0],
                    stickId,
                    partyId: !isGroup ? partyId : undefined,
                    groupId: isGroup ? roomId : undefined,
                },
                config,
            );
            audio = response.data.audio.id;
        }

        if (!messageId) {
            messageId = new Date().getTime().toString();
            message.tempId = message.id;
            message.id = messageId;
        }

        const chainStep = await StickProtocol.getChainStep(user.id, stickId);
        stickySessionSteps[target.id].chainStep = chainStep;

        const sendMessage = {
            ..._.cloneDeep(message),
            text: encryptedText,
            files,
            audio,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            id: messageId,
            chainStep,
        };

        if (response?.data.album) {
            album = {
                id: response.data.album.id,
                timestamp: response.data.album.timestamp,
                autoMonth: response.data.album.autoMonth,
            };
            sendMessage.album = album;
        }

        messagesJustSent.push(messageId);

        if (!process.env.LOCAL_TEST)
            database
                .ref(`rooms/${roomId}/messages`)
                .child(messageId)
                .set(sendMessage)
                .then(() => {
                    if (response?.data.files)
                        dispatch({type: stickRoom.FETCH_FILES, payload: {files: response.data.files}});
                    if (response?.data.audio)
                        dispatch({type: stickRoom.FETCH_AUDIO, payload: {audio: response.data.audio}});
                    if (response?.data.album) {
                        if (existingAlbum) {
                            const {timestamp, photosCount, videosCount} = response.data.album;
                            dispatch({
                                type: stickRoom.UPDATE_ALBUM,
                                payload: {album: {timestamp, photosCount, videosCount}, roomId},
                            });
                        } else
                            dispatch({
                                type: stickRoom.FETCH_ALBUMS,
                                payload: {
                                    albums: [{...response.data.album, title: {text: newAlbumTitle}, user: user.id}],
                                    roomId,
                                },
                            });
                        dispatch({
                            type: stickRoom.FETCH_ALBUM_IMAGES_IDS,
                            payload: {
                                images: response.data.files.reverse(),
                                albumId: response.data.album.id,
                                prepend: true,
                            },
                        });
                    }
                    const newMessage = {
                        ...message,
                        isPending: false,
                        album,
                        files,
                        audio,
                    };
                    messageSent(dispatch, newMessage, roomId, user.id);
                    sendNotification({
                        message: newMessage,
                        user,
                        target,
                        stickId,
                        isGroup,
                        newAlbumTitle,
                        existingAlbumTitle: existingAlbum?.title.text,
                        audioDuration: audioAsset?.duration,
                        isVideo,
                    });
                    if (isFromVault) {
                        dispatch({
                            type: progress.UPDATE,
                            payload: 'File sent successfully!',
                        });
                        setTimeout(() => dispatch({type: progress.UPDATED}), 4000);
                    }
                });
    };
}

type TSendMessageReaction = {
    message: TMessage;
    roomId: string;
    reaction: string;
    user: TUser;
    target: TParty;
    isVideo: boolean;
};
export function sendMessageReaction({message, roomId, reaction, user, target, isVideo}: TSendMessageReaction) {
    return async function (dispatch: Dispatch) {
        log('action: sendMessageReaction');
        let stickId;
        if (!stickySessionSteps[target.id] || stickySessionSteps[target.id].chainStep >= 300) {
            const res = !('username' in target)
                ? await SPH.getStickId([target], [], false, 'group')
                : await SPH.getStickId([], [target], false, 'multi');
            stickId = res.stickId;
            stickySessionSteps[target.id] = res;
        } else {
            stickId = stickySessionSteps[target.id].stickId;
        }
        const userId = user.id;
        const ref = `rooms/${roomId}`;
        const reactionId = new Date().getTime().toString();
        dispatch({
            type: stickRoom.MESSAGE_REACTION,
            payload: {
                roomId,
                message: {
                    id: message.id,
                    reaction,
                    userId,
                    reactionId,
                },
            },
        });
        const encryptedReaction = await StickProtocol.encryptText(userId, stickId, reaction, true);
        messagesJustSent.push(reactionId);
        database
            .ref(`${ref}/messages/${message.id}/reactions`)
            .child(reactionId)
            .set({userId, reaction: encryptedReaction, stickId});
        database.ref(`${ref}/messages`).child(reactionId).set({
            updatedMessageId: message.id,
            context: 'reaction',
            userId,
            id: reactionId,
            stickId,
        });
        if (message.userId !== user.id)
            sendNotification({
                message,
                user,
                target,
                stickId,
                isGroup: message.isGroup,
                reaction,
                isVideo,
            });
    };
}

export function editMessage({message, roomId, text}: {message: TMessage; roomId: string; text: string}) {
    return async function (dispatch: Dispatch) {
        log('action: editMessage');
        const ref = `rooms/${roomId}`;
        const updateId = new Date().getTime().toString();
        dispatch({
            type: stickRoom.EDIT_MESSAGE,
            payload: {
                roomId,
                text,
                messageId: message.id,
            },
        });
        const encryptedText = await StickProtocol.encryptText(message.userId, message.stickId, text, true);
        database.ref(`${ref}/messages/${message.id}/text`).set(encryptedText);
        messagesJustSent.push(updateId);
        database.ref(`${ref}/messages`).child(updateId).set({
            updatedMessageId: message.id,
            context: 'editText',
            userId: message.userId,
            id: updateId,
            stickId: message.stickId,
        });
        dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {editingMessage: null}});
    };
}

type TUndoMessageReaction = {message: TMessage; reaction: string; roomId: string; reactionId: string; userId: string};
export function undoMessageReaction({message, reaction, reactionId, roomId, userId}: TUndoMessageReaction) {
    return async function (dispatch: Dispatch) {
        log('action: undoMessageReaction');
        const ref = `rooms/${roomId}`;
        database.ref(`${ref}/messages/${message.id}/reactions`).child(reactionId).remove();
        database.ref(`${ref}/messages`).child(reactionId).remove();
        const messageId = new Date().getTime().toString();
        messagesJustSent.push(messageId);
        database.ref(`${ref}/messages`).child(messageId).set({
            id: messageId,
            deletedMessageId: reactionId,
            updatedMessageId: message.id,
            context: 'deletedReaction',
            userId,
        });
        dispatch({type: stickRoom.UNDO_MESSAGE_REACTION, payload: {message, reaction, reactionId, roomId}});
    };
}

type TDeleteMessageParams = {
    roomId: string;
    uriKeys: string[];
    previewUriKeys: string[];
    file?: TFile;
    message?: TMessage;
};
export function deleteMessage(params: TDeleteMessageParams) {
    return async function (dispatch: Dispatch) {
        const {roomId, uriKeys, previewUriKeys, file} = params;
        let {message} = params;
        if (!message) {
            const snapshot = await database.ref(`rooms/${roomId}/messages/${file?.messageId}/files`).once('value');
            message = {files: snapshot.val(), id: file?.messageId, userId: file?.user} as TMessage;
        }
        if (file && message.files && message.files.length > 1) {
            // @ts-ignore
            deletePhotoInMessage({...params, message}, dispatch);
            return;
        }
        const ref = `rooms/${roomId}`;
        const config = {headers: {Authorization: globalData.token}};
        if (message.files) {
            axios.post(`${URL}/api/delete-chat-files/`, {ids: message.files}, config).then((res) => {
                if (res.data.cover)
                    dispatch({
                        type: stickRoom.UPDATE_ALBUM_COVER,
                        payload: {roomId, ...res.data},
                    });
                else if (res.data.isAlbumDeleted)
                    dispatch({
                        type: stickRoom.DELETE_ALBUM,
                        payload: {timestamp: res.data.albumTimestamp, roomId},
                    });
            });
        }
        if (message.audio) axios.post(`${URL}/api/delete-chat-audio/`, {id: message.audio}, config);
        const reactionIds = getAllNestedKeys(message.reactions || {});
        reactionIds.map((reactionId) => {
            database.ref(`${ref}/messages`).child(reactionId).remove();
        });
        database.ref(`${ref}/messages`).child(message.id).remove();
        const messageId = new Date().getTime().toString();
        messagesJustSent.push(messageId);
        database.ref(`${ref}/messages`).child(messageId).set({
            id: messageId,
            deletedMessageId: message.id,
            context: 'deletedMessage',
            userId: message.userId,
        });
        dispatch({type: stickRoom.DELETE_MESSAGE, payload: {messageId: message.id, roomId}});
        if (message.files) {
            dispatch({type: stickRoom.DELETE_STORAGE_FILES, payload: {roomId, ids: message.files}});
            dispatch({type: stickRoom.DELETE_FILES, payload: {ids: message.files}});
            dispatch({type: fetched.STORAGES, payload: {fetched: false}});
            dispatch({type: fetched.ROOM_FILES, payload: {roomId, fetched: false}});
        }
        if (message.audio) dispatch({type: stickRoom.DELETE_AUDIO, payload: {id: message.audio}});
        if (uriKeys.length > 0)
            dispatch({type: cache.DELETE_CACHE_FILES_CHAT, payload: {uriKeys: uriKeys.concat(previewUriKeys)}});
    };
}

function deletePhotoInMessage(
    {message, roomId, file}: {message: TMessage; roomId: string; file: TFile},
    dispatch: Dispatch,
) {
    const ref = `rooms/${roomId}`;
    const config = {headers: {Authorization: globalData.token}};
    axios.post(`${URL}/api/delete-chat-files/`, {ids: [file.id]}, config).then((res) => {
        if (res.data.cover)
            dispatch({
                type: stickRoom.UPDATE_ALBUM_COVER,
                payload: {roomId, ...res.data},
            });
    });
    if (message.files)
        database
            .ref(`${ref}/messages/${message.id}`)
            .update({files: message.files.filter((id) => id !== file.id!.toString())});
    const messageId = new Date().getTime().toString();
    messagesJustSent.push(messageId);
    database.ref(`${ref}/messages`).child(messageId).set({
        id: messageId,
        deletedMessageId: file.id,
        updatedMessageId: message.id,
        fileUriKey: file.uriKey,
        context: 'deletedPhoto',
        userId: message.userId,
    });
    dispatch({type: stickRoom.DELETE_STORAGE_FILE, payload: {roomId, id: file.id}});
    dispatch({
        type: stickRoom.DELETE_PHOTO_IN_MESSAGE,
        payload: {messageId: message.id, roomId, fileId: file.id},
    });
    dispatch({type: stickRoom.DELETE_FILES, payload: {ids: [file.id]}});
    dispatch({type: cache.DELETE_CACHE_FILES_CHAT, payload: {uriKeys: [file.uriKey, file.previewUriKey]}});
    dispatch({type: stickRoom.DELETE_ALBUM_IMAGES_IDS, payload: {albumId: file.album, deletedIds: [file.id]}});
    dispatch({type: fetched.STORAGES, payload: {fetched: false}});
    dispatch({type: fetched.ROOM_FILES, payload: {roomId, fetched: false}});
}

type TDecryptMessage = {message: TMessage; roomId: string; currentUser: TUser};
export function decryptMessage({message, roomId, currentUser}: TDecryptMessage) {
    return async function (dispatch: Dispatch) {
        log('action: decryptMessage');
        const decryptedMessage = await parse(message, roomId, currentUser, dispatch);
        dispatch({
            type: stickRoom.FETCH_MESSAGES,
            payload: {message: decryptedMessage, roomId, wasPendingDecryption: true},
        });
    };
}

type TFetchRepliedMessage = {roomId: string; messageId: string; currentUser: TUser; childId: string};
export function fetchRepliedMessage({roomId, messageId, currentUser, childId}: TFetchRepliedMessage) {
    return async function (dispatch: Dispatch) {
        log('action: fetchSingleMessage');
        database.ref(`rooms/${roomId}/messages/${messageId}`).once('value', async (snapshot) => {
            if (!snapshot.val()) {
                dispatch({
                    type: stickRoom.REPLY_DELETED,
                    payload: {childId, roomId},
                });
                return;
            }
            const decryptedMessage = await parse(snapshot.val(), roomId, currentUser, dispatch);
            dispatch({
                type: stickRoom.FETCH_MESSAGES,
                payload: {message: decryptedMessage, roomId},
            });
        });
    };
}

export function updateAction(user: TUser, target: TParty, isGroup: boolean, action: number) {
    return function (dispatch: Dispatch) {
        log('action: updateAction');
        const ref = `rooms/${target.roomId}`;
        database.ref(`${ref}/actions`).child(user.id).off();
        if (action === 0) database.ref(`${ref}/actions`).child(user.id).remove();
        else database.ref(`${ref}/actions`).update({[user.id]: action});
    };
}

type TDispatchCurrentTargetParams = {target: TTarget};
export function dispatchCurrentTarget({target}: TDispatchCurrentTargetParams) {
    return function (dispatch: Dispatch) {
        dispatch({type: app.CURRENT_TARGET, payload: target});
    };
}

type TRenameAlbum = {album: TChatAlbum; title: string; isGroup: boolean; target: TParty};
export function renameAlbum({album, title, isGroup, target}: TRenameAlbum) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const userId = await AsyncStorage.getItem('@userId');
        const {stickId} = isGroup
            ? await SPH.getStickId([target as TGroup], [], false, 'group')
            : await SPH.getStickId([], [target as TUser], false, 'multi');
        const encryptedAlbumTitle = await StickProtocol.encryptText(userId!, stickId, title, true);
        axios.post(`${URL}/api/rename-album/`, {albumId: album.id, encryptedAlbumTitle, stickId}, config);
        dispatch({
            type: stickRoom.UPDATE_ALBUM,
            payload: {roomId: target.roomId, album: {...album, title: {text: title, decrypted: true}}},
        });
    };
}

type TFetchChatAlbumsParams = {roomId: string; firstFetch?: boolean; currentUrl: string; callback?: () => void};
export function fetchChatAlbums(params: TFetchChatAlbumsParams) {
    return async function (dispatch: Dispatch) {
        log('action: fetchAlbums');
        const {roomId, firstFetch, callback, currentUrl} = params;
        const config = {headers: {Authorization: globalData.token}};
        const {data} = await axios.get(currentUrl, config);
        await SPH.decryptAlbums(data.results);
        dispatch({type: stickRoom.FETCH_ALBUMS, payload: {albums: data.results, roomId, firstFetch}});
        dispatch({type: fetched.FETCHED_ALBUM, payload: roomId});
        dispatch({type: url.NEXT_ALBUMS_URL, payload: {url: data.next, roomId}});
        if (callback) callback();
    };
}

type TFetchAlbumPhotosParams = {albumId: number; currentUrl: string; refresh: boolean; callback?: () => void};
export function fetchAlbumPhotos({albumId, currentUrl, refresh, callback}: TFetchAlbumPhotosParams) {
    return async function (dispatch: Dispatch) {
        log('action: fetchAlbumPhotos');
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(currentUrl, config);
        dispatch({type: stickRoom.FETCH_FILES, payload: {files: response.data.results, refresh}});
        dispatch({type: stickRoom.FETCH_ALBUM_IMAGES_IDS, payload: {images: response.data.results, albumId, refresh}});
        dispatch({type: fetched.FETCHED_ALBUM_IMAGES, payload: albumId});
        dispatch({type: url.NEXT_ALBUM_IMAGES_URL, payload: {url: response.data.next, albumId}});
        if (callback) callback();
    };
}

export function removeChat(roomId: string) {
    return async function (dispatch: Dispatch) {
        dispatch({type: stickRoom.REMOVE_CHAT_MESSAGES, payload: {roomId}});
        dispatch({type: stickRoom.TOGGLE_REMOVE_ROOM, payload: {roomId, value: true}});
    };
}

export function fetchStorages(callback = () => {}) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const {data} = await axios.get(`${URL}/api/fetch-storages/`, config);
        dispatch({type: stickRoom.FETCH_STORAGES, payload: data});
        dispatch({type: fetched.STORAGES, payload: {fetched: true}});
        callback();
    };
}

type fetchRoomFilesParams = {roomId: string; firstFetch?: boolean; currentUrl: string; callback?: () => void};
export function fetchRoomFiles({roomId, firstFetch, currentUrl, callback}: fetchRoomFilesParams) {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const {data} = await axios.get(currentUrl, config);
        dispatch({type: stickRoom.FETCH_ROOM_FILES, payload: {files: data.results, roomId, firstFetch}});
        dispatch({type: url.NEXT_ROOM_STORAGE_URL, payload: {roomId, url: data.next}});
        dispatch({type: fetched.ROOM_FILES, payload: {roomId, fetched: true}});
        if (callback) callback();
    };
}
