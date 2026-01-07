import {Action} from 'redux';
import _ from 'lodash';
import {stickRoom} from '@/src/actions/actionTypes';
import {TMessage} from '@/src/types';

export interface IMessagesState {
    [key: string]: {[key: string]: TMessage};
}

const initialState: IMessagesState = {};

export interface IFetchMessagesAction extends Action {
    payload: {
        roomId: string;
        message: TMessage;
        isMedia?: boolean;
        wasPendingDecryption?: boolean;
    };
}

export interface IFetchMessagesMultipleAction extends Action {
    payload: {
        roomId: string;
        updatedMessages: TMessage[];
        deletedMessages: TMessage[];
        messages: TMessage[];
    };
}

export interface IMessageSentAction extends Action {
    payload: {
        roomId: string;
        message: TMessage & {tempId?: string; isPending?: boolean};
    };
}

export interface IFetchMessageReactionsAction extends Action {
    payload: {
        message: TMessage;
    };
}

export interface IDeleteMessageAction extends Action {
    payload: {
        roomId: string;
        messageId: string;
    };
}

export interface IDeletePhotoInMessageAction extends Action {
    payload: {
        roomId: string;
        messageId: string;
        fileId: string;
    };
}

export interface IReplyDeletedAction extends Action {
    payload: {
        roomId: string;
        childId: string;
    };
}

export interface IDeleteGroupMessagesAction extends Action {
    payload: string;
}

export interface IRemoveChatMessagesAction extends Action {
    payload: {
        roomId: string;
    };
}

export interface IMessageReactionAction extends Action {
    payload: {
        roomId: string;
        message: TMessage;
    };
}

export interface IEditMessageAction extends Action {
    payload: {
        roomId: string;
        messageId: string;
        text: string;
    };
}

export interface IUndoMessageReactionAction extends Action {
    payload: {
        roomId: string;
        message: TMessage;
        reaction: string;
        reactionId: string;
    };
}

export interface INewRoomAction extends Action {
    payload: {
        roomId: string;
    };
}

type RoomActions =
    | IFetchMessagesAction
    | IFetchMessagesMultipleAction
    | IMessageSentAction
    | IFetchMessageReactionsAction
    | IDeleteMessageAction
    | IDeletePhotoInMessageAction
    | IReplyDeletedAction
    | IDeleteGroupMessagesAction
    | IRemoveChatMessagesAction
    | IMessageReactionAction
    | IEditMessageAction
    | IUndoMessageReactionAction
    | INewRoomAction;

function updateReaction(state: IMessagesState, roomId: string, message: TMessage) {
    if (state[roomId] && state[roomId][message.id]) {
        const updatedMsg = state[roomId][message.id];
        updatedMsg.reactions = updatedMsg.reactions || {};
        state[roomId][message.id] = {
            ...updatedMsg,
            reactions: {
                ...updatedMsg.reactions,
                [message.reaction as string]: {
                    ...updatedMsg.reactions[message.reaction as string],
                    [message.reactionId as string]: message.userId as string,
                },
            },
        };
    }
}

function updateText(state: IMessagesState, roomId: string, message: TMessage) {
    if (state[roomId] && state[roomId][message.id]) {
        const editedMsg = state[roomId][message.id];
        state[roomId][message.id] = {
            ...editedMsg,
            text: message.text as string,
        };
    }
}

function deleteMessage(state: IMessagesState, roomId: string, message: TMessage) {
    if (message.context === 'deletedMessage') {
        delete state[roomId][message.deletedMessageId as string];
    } else if (state[roomId] && state[roomId][message.updatedMessageId as string]) {
        if (message.context === 'deletedReaction') {
            const reactions = state[roomId][message.updatedMessageId as string].reactions;
            let reaction: string | null = null;
            if (reactions) {
                Object.entries(reactions).forEach((item) => {
                    if (Object.keys(item[1]).includes(message.deletedMessageId as string)) reaction = item[0];
                });
                if (reaction) {
                    delete reactions[reaction][message.deletedMessageId as string];
                    if (Object.keys(reactions[reaction]).length === 0) delete reactions[reaction];
                    state[roomId][message.updatedMessageId as string] = {
                        ...state[roomId][message.updatedMessageId as string],
                        reactions,
                    };
                }
            }
        } else if (message.context === 'deletedPhoto') {
            state[roomId][message.updatedMessageId as string].files = state[roomId][
                message.updatedMessageId as string
            ].files?.filter((id) => id !== (message.deletedMessageId as string));
        }
    }
}

export default function (state: IMessagesState = initialState, action: RoomActions): IMessagesState {
    switch (action.type) {
        case stickRoom.FETCH_MESSAGES:
            const fetchMessagesPayload = action.payload as IFetchMessagesAction['payload'];
            const {roomId} = fetchMessagesPayload;
            if (fetchMessagesPayload.message.deleted) {
                deleteMessage(state, roomId, fetchMessagesPayload.message);
                return {
                    ...state,
                    [roomId]: {
                        ...state[roomId],
                        [fetchMessagesPayload.message.updatedMessageId as string]: {
                            ...state[roomId][fetchMessagesPayload.message.updatedMessageId as string],
                        },
                    },
                };
            }

            if (fetchMessagesPayload.message.updated) {
                const {message} = fetchMessagesPayload;
                if (!state[roomId] || !state[roomId][message.id]) return state;
                if (message.context === 'reaction') updateReaction(state, roomId, message);
                else updateText(state, roomId, message);
                return {...state, [roomId]: {...state[roomId]}};
            }

            if (
                !state[roomId] ||
                !state[roomId][fetchMessagesPayload.message.id] ||
                fetchMessagesPayload.isMedia ||
                fetchMessagesPayload.wasPendingDecryption
            ) {
                const messages = Object.values(state[roomId] || {});
                messages.push(fetchMessagesPayload.message);
                messages.sort((a, b) => parseInt(b.id) - parseInt(a.id));
                return {...state, [roomId]: {..._.mapKeys(messages, 'id')}};
            }
            return state;

        case stickRoom.FETCH_MESSAGES_MULTIPLE:
            const fetchMessagesMultiplePayload = action.payload as IFetchMessagesMultipleAction['payload'];
            if (!state[fetchMessagesMultiplePayload.roomId]) state[fetchMessagesMultiplePayload.roomId] = {};
            fetchMessagesMultiplePayload.updatedMessages.forEach((message) => {
                if (message.context === 'reaction') updateReaction(state, fetchMessagesMultiplePayload.roomId, message);
                else updateText(state, fetchMessagesMultiplePayload.roomId, message);
            });
            fetchMessagesMultiplePayload.deletedMessages.forEach((message) => {
                deleteMessage(state, fetchMessagesMultiplePayload.roomId, message);
            });
            let messages = Object.values(state[fetchMessagesMultiplePayload.roomId] || {});
            messages = messages.concat(fetchMessagesMultiplePayload.messages);
            messages.sort((a, b) => parseInt(b.id) - parseInt(a.id));
            return {...state, [fetchMessagesMultiplePayload.roomId]: {..._.mapKeys(messages, 'id')}};

        case stickRoom.MESSAGE_SENT:
            const messageSentPayload = action.payload as IMessageSentAction['payload'];
            const msgTargetId = messageSentPayload.roomId;
            if (
                !state[msgTargetId] ||
                !state[msgTargetId][messageSentPayload.message.id] ||
                state[msgTargetId][messageSentPayload.message.tempId as string]?.isPending !==
                    messageSentPayload.message.isPending
            ) {
                delete state[msgTargetId][messageSentPayload.message.tempId as string];
                return {
                    ...state,
                    [msgTargetId]: {[messageSentPayload.message.id]: messageSentPayload.message, ...state[msgTargetId]},
                };
            }
            return {...state};

        case stickRoom.FETCH_MESSAGE_REACTIONS:
            const fetchMessageReactionsPayload = action.payload as IFetchMessageReactionsAction['payload'];
            const {message} = fetchMessageReactionsPayload;
            const updatedMsg = {...state[message.roomId][message.id]};
            state[message.roomId][message.id] = {
                ...updatedMsg,
                reactions: message.reactions,
            };
            return {...state, [message.roomId]: {...state[message.roomId]}};

        case stickRoom.DELETE_MESSAGE:
            const deleteMessagePayload = action.payload as IDeleteMessageAction['payload'];
            delete state[deleteMessagePayload.roomId][deleteMessagePayload.messageId];
            return {...state};

        case stickRoom.DELETE_PHOTO_IN_MESSAGE:
            const deletePhotoInMessagePayload = action.payload as IDeletePhotoInMessageAction['payload'];
            if (!state[deletePhotoInMessagePayload.roomId][deletePhotoInMessagePayload.messageId]) return state;
            state[deletePhotoInMessagePayload.roomId][deletePhotoInMessagePayload.messageId].files = state[
                deletePhotoInMessagePayload.roomId
            ][deletePhotoInMessagePayload.messageId].files?.filter((id) => id !== deletePhotoInMessagePayload.fileId);
            return {
                ...state,
                [deletePhotoInMessagePayload.roomId]: {
                    ...state[deletePhotoInMessagePayload.roomId],
                    [deletePhotoInMessagePayload.messageId]: {
                        ...state[deletePhotoInMessagePayload.roomId][deletePhotoInMessagePayload.messageId],
                    },
                },
            };

        case stickRoom.REPLY_DELETED:
            const replyDeletedPayload = action.payload as IReplyDeletedAction['payload'];
            return {
                ...state,
                [replyDeletedPayload.roomId]: {
                    ...state[replyDeletedPayload.roomId],
                    [replyDeletedPayload.childId]: {
                        ...state[replyDeletedPayload.roomId][replyDeletedPayload.childId],
                        replyDeleted: true,
                    },
                },
            };

        case stickRoom.DELETE_GROUP_MESSAGES:
            const deleteGroupMessagesPayload = action.payload as IDeleteGroupMessagesAction['payload'];
            delete state[deleteGroupMessagesPayload];
            return {...state};

        case stickRoom.REMOVE_CHAT_MESSAGES:
            const removeChatMessagesPayload = action.payload as IRemoveChatMessagesAction['payload'];
            delete state[removeChatMessagesPayload.roomId];
            return {...state};

        case stickRoom.MESSAGE_REACTION: {
            const messageReactionPayload = action.payload as IMessageReactionAction['payload'];
            const {roomId, message} = messageReactionPayload;
            const reactedMsg = state[roomId]?.[message.id];
            if (!reactedMsg) return state;
            const reactionKey = message.reaction as string;
            const reactionId = message.reactionId as string;
            const userId = message.userId as string;
            reactedMsg.reactions = reactedMsg.reactions || {};
            const newReactions = {
                ...reactedMsg.reactions,
                [reactionKey]: {
                    ...reactedMsg.reactions[reactionKey],
                    [reactionId]: userId,
                },
            };
            return {
                ...state,
                [roomId]: {
                    ...state[roomId],
                    [message.id]: {
                        ...reactedMsg,
                        reactions: newReactions,
                    },
                },
            };
        }

        case stickRoom.EDIT_MESSAGE:
            const editMessagePayload = action.payload as IEditMessageAction['payload'];
            const editedMsg = state[editMessagePayload.roomId][editMessagePayload.messageId];
            state[editMessagePayload.roomId][editMessagePayload.messageId] = {
                ...editedMsg,
                text: editMessagePayload.text,
            };
            return {...state, [editMessagePayload.roomId]: {...state[editMessagePayload.roomId]}};

        case stickRoom.UNDO_MESSAGE_REACTION: {
            const undoMessageReactionPayload = action.payload as IUndoMessageReactionAction['payload'];
            const {roomId, message, reaction, reactionId} = undoMessageReactionPayload;
            const messageId = message.id;
            const messageReactions = state[roomId]?.[messageId]?.reactions;
            if (messageReactions && reaction && messageReactions[reaction]) {
                delete messageReactions[reaction][reactionId];
                if (Object.keys(messageReactions[reaction]).length === 0) {
                    delete messageReactions[reaction];
                }
            }
            return {
                ...state,
                [roomId]: {
                    ...state[roomId],
                    [messageId]: {
                        ...state[roomId][messageId],
                        reactions: messageReactions,
                    },
                },
            };
        }

        case stickRoom.NEW_ROOM:
            const newRoomPayload = action.payload as INewRoomAction['payload'];
            return {...state, [newRoomPayload.roomId]: {...state[newRoomPayload.roomId]}};

        case stickRoom.LOGOUT_MESSAGES:
            return {};

        default:
            return state;
    }
}
