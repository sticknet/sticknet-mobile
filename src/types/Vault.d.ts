import type {TGroup, TUser} from './User';

export type TFile = {
    id: number | string;
    uriKey: string;
    previewUriKey: string;
    uri?: string;
    previewUri?: string;
    name: string;
    type: string;
    fileSize: number;
    previewFileSize: number;
    folder?: number;
    album?: number;
    isPhoto: boolean;
    isFolder?: boolean;
    folderType?: string;
    user: string;
    cipher?: string;
    previewCipher?: string;
    createdAt: number;
    width: number;
    height: number;
    duration: number;
    timestamp: number;
    party?: TUser | TGroup | null;
    messageId?: string;
    stickId: string;
    presignedUrl?: string;
    previewPresignedUrl?: string;
    fileIndex?: number;
};

export type TFolder = {id: string | number; name: string};

export type TVaultNote = {
    id: number;
    user: number | null;
    cipher: string;
    text: string;
    timestamp: string;
};
