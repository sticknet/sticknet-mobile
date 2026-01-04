import type {TCipher, TUser} from './User';
import type {TFile} from './Vault';

export type TMessage = {
    id: string;
    text?: string;
    userId: string;
    stickId: string;
    timestamp: number;
    roomId: string;
    isGroup: boolean;
    replyToId?: string;
    isPending: boolean;
    forwarded?: boolean;
    isMedia?: boolean;
    files?: string[];
    audio?: string;
    album?: {
        id: string;
        timestamp: number;
        autoMonth: boolean;
    };
    chainStep?: number;
    updated?: boolean;
    deleted?: boolean;
    reactions?: Record<string, Record<string, string>>;
    reaction?: string;
    reactionId?: string;
    context?: string;
    updatedMessageId?: string;
    deletedMessageId?: string;
    isPendingDecryption?: boolean;
    tempId?: string;
    replyDeleted?: boolean;
};

export type TTarget = {
    id: string;
    roomId: string;
    isGroup: boolean;
};

export type TChatStorage = {
    id: string;
    storage: number;
    isParty?: boolean;
};

export type TConnectionRequest = {
    id: number;
    fromUser: TUser;
    toUser: TUser;
    accepted?: boolean;
    connectionRequest?: boolean;
};

export type TChatAlbum = {
    id: number;
    user?: number;
    group?: number;
    party?: number;
    title: TCipher;
    photosCount: number;
    videosCount: number;
    timestamp: string;
    autoMonth?: string;
    cover?: TFile;
};
