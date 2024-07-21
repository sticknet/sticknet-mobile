import {Action} from 'redux';
import {appTemp} from '../actions/actionTypes';
import type {TDevice, TFile, TFolder, TGroup, TMessage} from '../types';

export interface IAppTempState {
    isGeneratingKeys: boolean;
    validUsername: {username?: string; valid?: boolean};
    searching: boolean;
    progressModal: boolean;
    refreshingHome: boolean;
    playingAudio: string | null;
    readingCameraAlbums: boolean;
    cameraAlbums: any[];
    devices: TDevice[];
    justCreatedGroup: TGroup | null;
    justRequestedSavePassword: boolean;
    finishingUp: boolean;
    deleteImageHorizontal: boolean;
    groupLink: string | null;
    userLink: string | null;
    isConnected: boolean;
    isServerDown: boolean;
    chatTargetIsBlocked: boolean;
    folderStack: TFolder[];
    albumStack: {id: string; name: string}[];
    emptySearch: boolean;
    renamingItem: any;
    movingFile: TFile | null;
    focusedVideo: string | null;
    reEncryptingCiphers: number;
    modals: {[key: string]: boolean};
    messageModal: {
        isVisible: boolean;
        messageId: string | null;
        reactionsOnly: boolean;
        fileActionsOnly: boolean;
        file: TFile | null;
        storage: number;
    };
    repliedModal: {messageId: string; roomId: string; isVisible: boolean} | null;
    reactionsModal: {
        isVisible: boolean;
        messageId: string | null;
        index: number;
        message: TMessage | null;
    };
    buttonIdLoading: string | null;
    editingMessage: any;
    replyMessage: any;
    albumModal: any;
    chatModal: any;
    finishedCommonInits: boolean;
    tabBarHeight: number;
    pendingModal: null | object;
}

export const appTempInitialState: IAppTempState = {
    isGeneratingKeys: false,
    validUsername: {},
    searching: false,
    progressModal: false,
    refreshingHome: false,
    playingAudio: null,
    readingCameraAlbums: false,
    cameraAlbums: [],
    devices: [],
    justCreatedGroup: null,
    justRequestedSavePassword: false,
    finishingUp: false,
    deleteImageHorizontal: false,
    groupLink: null,
    userLink: null,
    isConnected: true,
    isServerDown: false,
    chatTargetIsBlocked: false,
    folderStack: [{id: 'home', name: 'home'}],
    albumStack: [
        {id: 'home', name: 'home'},
        {id: 'recents', name: 'recents'},
    ],
    emptySearch: false,
    renamingItem: null,
    movingFile: null,
    focusedVideo: null,
    reEncryptingCiphers: 0,
    modals: {},
    messageModal: {
        isVisible: false,
        messageId: null,
        reactionsOnly: false,
        fileActionsOnly: false,
        storage: 0,
        file: null,
    },
    repliedModal: null,
    reactionsModal: {
        isVisible: false,
        messageId: null,
        index: 0,
        message: null,
    },
    editingMessage: null,
    replyMessage: null,
    albumModal: {
        isVisible: false,
        album: null,
    },
    chatModal: {
        isVisible: false,
        targetId: null,
        roomId: null,
        isGroup: null,
    },
    buttonIdLoading: null,
    finishedCommonInits: false,
    tabBarHeight: 0,
    pendingModal: null,
};

export interface IGeneratingKeysAction extends Action {
    payload?: undefined;
}

export interface IUsernameValidationAction extends Action {
    payload: {[key: string]: any};
}

export interface ISearchingAction extends Action {
    payload?: undefined;
}

export interface ISearchDoneAction extends Action {
    payload?: undefined;
}

export interface IBackgroundNotificationAction extends Action {
    payload: {[key: string]: any};
}

export interface IShowProgressModalAction extends Action {
    payload?: undefined;
}

export interface IHideProgressModalAction extends Action {
    payload?: undefined;
}

export interface IPlayingAudioAction extends Action {
    payload: any;
}

export interface IReadingCameraAlbumsAction extends Action {
    payload?: undefined;
}

export interface IReadingCameraAlbumsDoneAction extends Action {
    payload?: undefined;
}

export interface ICameraAlbumsAction extends Action {
    payload: any[];
}

export interface IFetchDevicesAction extends Action {
    payload: any[];
}

export interface IJustCreatedGroupAction extends Action {
    payload: any;
}

export interface IJustCreatedGroupDoneAction extends Action {
    payload?: undefined;
}

export interface IJustRequestedSavePasswordAction extends Action {
    payload?: undefined;
}

export interface IFinishingUpAction extends Action {
    payload?: undefined;
}

export interface IReEncryptingCiphersAction extends Action {
    payload?: undefined;
}

export interface IReEncryptingCiphersDoneAction extends Action {
    payload?: undefined;
}

export interface IFinishingUpDoneAction extends Action {
    payload?: undefined;
}

export interface IDeleteImageHorizontalAction extends Action {
    payload?: undefined;
}

export interface IDeleteImageHorizontalDoneAction extends Action {
    payload?: undefined;
}

export interface IGroupLinkAction extends Action {
    payload: any;
}

export interface IConnectionChangeAction extends Action {
    payload: boolean;
}

export interface IChatTargetIsBlockedAction extends Action {
    payload: boolean;
}

export interface IOpenFolderAction extends Action {
    payload: {id: string; name: string};
}

export interface ICloseFolderAction extends Action {
    payload?: undefined;
}

export interface IOpenAlbumAction extends Action {
    payload: {id: string; name: string};
}

export interface ICloseAlbumAction extends Action {
    payload?: undefined;
}

export interface ISetActiveVaultTabAction extends Action {
    payload: any;
}

export interface IIsEmptySearchAction extends Action {
    payload: boolean;
}

export interface IRenamingItemAction extends Action {
    payload: any;
}

export interface IFocusedVideoAction extends Action {
    payload: any;
}

export interface IMovingFileAction extends Action {
    payload: any;
}

export interface IDispatchAppTempPropertyAction extends Action {
    payload: {[key: string]: any};
}

export interface IToggleMessageModalAction extends Action {
    payload: {
        isVisible: boolean;
        message: any;
        reactionsOnly: boolean;
        file: any;
    };
}

export interface IToggleReactionsModalAction extends Action {
    payload: {
        isVisible: boolean;
        message: any;
        index: number;
    };
}

export interface IResetAppTempStateAction extends Action {
    payload?: undefined;
}

export interface IToggleModalAction extends Action {
    payload: {[key: string]: any};
}

type AppTempActions =
    | IGeneratingKeysAction
    | IUsernameValidationAction
    | ISearchingAction
    | ISearchDoneAction
    | IBackgroundNotificationAction
    | IShowProgressModalAction
    | IHideProgressModalAction
    | IPlayingAudioAction
    | IReadingCameraAlbumsAction
    | IReadingCameraAlbumsDoneAction
    | ICameraAlbumsAction
    | IFetchDevicesAction
    | IJustCreatedGroupAction
    | IJustCreatedGroupDoneAction
    | IJustRequestedSavePasswordAction
    | IFinishingUpAction
    | IReEncryptingCiphersAction
    | IReEncryptingCiphersDoneAction
    | IFinishingUpDoneAction
    | IDeleteImageHorizontalAction
    | IDeleteImageHorizontalDoneAction
    | IGroupLinkAction
    | IConnectionChangeAction
    | IChatTargetIsBlockedAction
    | IOpenFolderAction
    | ICloseFolderAction
    | IOpenAlbumAction
    | ICloseAlbumAction
    | ISetActiveVaultTabAction
    | IIsEmptySearchAction
    | IRenamingItemAction
    | IFocusedVideoAction
    | IMovingFileAction
    | IDispatchAppTempPropertyAction
    | IToggleMessageModalAction
    | IToggleReactionsModalAction
    | IResetAppTempStateAction
    | IToggleModalAction;

export default function (state: IAppTempState = appTempInitialState, action: AppTempActions): IAppTempState {
    switch (action.type) {
        case appTemp.GENERATING_KEYS:
            return {...state, isGeneratingKeys: true};

        case appTemp.GENERATING_KEYS_DONE:
            return {...state, isGeneratingKeys: false};

        case appTemp.USERNAME_VALIDATION:
            return {...state, validUsername: action.payload};

        case appTemp.SEARCHING:
            return {...state, searching: true};

        case appTemp.SEARCH_DONE:
            return {...state, searching: false};

        case appTemp.SHOW_PROGRESS_MODAL:
            return {...state, progressModal: true};

        case appTemp.HIDE_PROGRESS_MODAL:
            return {...state, progressModal: false, finishingUp: false};

        case appTemp.PLAYING_AUDIO:
            return {...state, playingAudio: action.payload};

        case appTemp.READING_CAMERA_ALBUMS:
            return {...state, readingCameraAlbums: true};

        case appTemp.READING_CAMERA_ALBUMS_DONE:
            return {...state, readingCameraAlbums: false};

        case appTemp.CAMERA_ALBUMS:
            return {...state, cameraAlbums: action.payload};

        case appTemp.FETCH_DEVICES:
            return {...state, devices: action.payload};

        case appTemp.JUST_CREATED_GROUP:
            return {...state, justCreatedGroup: action.payload};

        case appTemp.JUST_CREATED_GROUP_DONE:
            return {...state, justCreatedGroup: null};

        case appTemp.JUST_REQUESTED_SAVE_PASSWORD:
            return {...state, justRequestedSavePassword: true};

        case appTemp.FINISHING_UP:
            return {...state, finishingUp: true};

        case appTemp.REENCRYPTING_CIPHERS:
            return {...state, reEncryptingCiphers: 1};

        case appTemp.REENCRYPTING_CIPHERS_DONE:
            return {...state, reEncryptingCiphers: 0};

        case appTemp.FINISHING_UP_DONE:
            return {...state, finishingUp: false};

        case appTemp.DELETE_IMAGE_HORIZONTAL:
            return {...state, deleteImageHorizontal: true};

        case appTemp.DELETE_IMAGE_HORIZONTAL_DONE:
            return {...state, deleteImageHorizontal: false};

        case appTemp.GROUP_LINK:
            return {...state, groupLink: action.payload};

        case appTemp.CONNECTION_CHANGE:
            return {...state, isConnected: action.payload};

        case appTemp.CHAT_TARGET_IS_BLOCKED:
            return {...state, chatTargetIsBlocked: action.payload};

        case appTemp.OPEN_FOLDER:
            return {...state, folderStack: [...state.folderStack, action.payload]};

        case appTemp.CLOSE_FOLDER:
            if (state.folderStack.length === 1) return state;
            const folderStackCopy = [...state.folderStack];
            folderStackCopy.pop();
            return {...state, folderStack: folderStackCopy};

        case appTemp.OPEN_ALBUM:
            return {...state, albumStack: [...state.albumStack, action.payload]};

        case appTemp.CLOSE_ALBUM:
            if (state.albumStack.length === 1) return state;
            const albumStackCopy = [...state.albumStack];
            albumStackCopy.pop();
            return {...state, albumStack: albumStackCopy};

        case appTemp.IS_EMTPY_SEARCH:
            return {...state, emptySearch: action.payload};

        case appTemp.RENAMING_ITEM:
            return {...state, renamingItem: action.payload};

        case appTemp.FOCUSED_VIDEO:
            return {...state, focusedVideo: action.payload};

        case appTemp.MOVING_FILE:
            return {...state, movingFile: action.payload};

        case appTemp.DISPATCH_APPTEMP_PROPERTY:
            return {...state, ...action.payload};

        case appTemp.TOGGLE_MESSAGE_MODAL:
            return {...state, messageModal: {...state.messageModal, ...action.payload}};

        case appTemp.TOGGLE_REACTIONS_MODAL:
            return {...state, reactionsModal: {...state.reactionsModal, ...action.payload}};

        case appTemp.RESET_APP_TEMP_STATE:
            return appTempInitialState;

        case appTemp.TOGGLE_MODAL:
            return {...state, modals: {...state.modals, ...action.payload}};

        default:
            return state;
    }
}
