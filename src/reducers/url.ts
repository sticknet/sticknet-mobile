import {Action} from 'redux';
import {url} from '../actions/actionTypes';

export interface IUrlState {
    albumsUrls: {[key: string]: string};
    coversUrls: {[key: string]: string};
    imagesUrls: {[key: string]: string};
    filesUrls: {[key: string]: string};
    photosUrls: {[key: string]: string};
    notesUrl: string | null;
    usersUrl: string | null;
    youtubeUrl: string | null;
    selectedImagesUrl: string | null;
    searchUrl: string | null;
    vaultNotesUrl: string | null;
    roomStorageUrls: {[key: string]: string};
}

const initialState: IUrlState = {
    albumsUrls: {},
    coversUrls: {},
    imagesUrls: {},
    filesUrls: {},
    photosUrls: {},
    notesUrl: null,
    usersUrl: null,
    youtubeUrl: null,
    selectedImagesUrl: null,
    searchUrl: null,
    vaultNotesUrl: null,
    roomStorageUrls: {},
};

export interface INextAlbumImagesUrlAction extends Action {
    payload: {
        albumId: string;
        url: string;
    };
}

export interface INextNotesUrlAction extends Action {
    payload: string;
}

export interface INextAlbumsUrlAction extends Action {
    payload: {
        roomId: string;
        url: string;
    };
}

export interface INextCoversUrlAction extends Action {
    payload: {
        groupId: string;
        url: string;
    };
}

export interface INextFilesUrlAction extends Action {
    payload: {
        folderId: string;
        url: string;
    };
}

export interface INextPhotosUrlAction extends Action {
    payload: {
        albumId: string;
        url: string;
    };
}
export interface INextUsersSearchUrlAction extends Action {
    payload: string;
}

export interface INextYoutubeUrlAction extends Action {
    payload: string;
}

export interface INextSelectedImagesUrlAction extends Action {
    payload: string;
}

export interface INextSearchUrlAction extends Action {
    payload: string;
}

export interface INextVaultNotesUrlAction extends Action {
    payload: string;
}

export interface INextRoomStorageUrlAction extends Action {
    payload: {
        roomId: string;
        url: string;
    };
}

type UrlActions =
    | INextAlbumImagesUrlAction
    | INextNotesUrlAction
    | INextAlbumsUrlAction
    | INextCoversUrlAction
    | INextFilesUrlAction
    | INextPhotosUrlAction
    | INextUsersSearchUrlAction
    | INextYoutubeUrlAction
    | INextSelectedImagesUrlAction
    | INextSearchUrlAction
    | INextVaultNotesUrlAction
    | INextRoomStorageUrlAction;

export default function (state: IUrlState = initialState, action: UrlActions): IUrlState {
    switch (action.type) {
        case url.NEXT_ALBUM_IMAGES_URL:
            const nextAlbumImagesUrlPayload = action.payload as INextAlbumImagesUrlAction['payload'];
            return {
                ...state,
                imagesUrls: {...state.imagesUrls, [nextAlbumImagesUrlPayload.albumId]: nextAlbumImagesUrlPayload.url},
            };

        case url.NEXT_NOTES_URL:
            const nextNotesUrlPayload = action.payload as INextNotesUrlAction['payload'];
            return {...state, notesUrl: nextNotesUrlPayload};

        case url.NULLIFY_NOTES_URL:
            return {...state, notesUrl: null};

        case url.NULLIFY_SELECTED_IMAGES_URL:
            return {...state, selectedImagesUrl: null};

        case url.NEXT_ALBUMS_URL:
            const nextAlbumsUrlPayload = action.payload as INextAlbumsUrlAction['payload'];
            return {
                ...state,
                albumsUrls: {...state.albumsUrls, [nextAlbumsUrlPayload.roomId]: nextAlbumsUrlPayload.url},
            };

        case url.NEXT_COVERS_URL:
            const nextCoversUrlPayload = action.payload as INextCoversUrlAction['payload'];
            return {
                ...state,
                coversUrls: {...state.coversUrls, [nextCoversUrlPayload.groupId]: nextCoversUrlPayload.url},
            };

        case url.NEXT_FILES_URL:
            const nextFilesUrlPayload = action.payload as INextFilesUrlAction['payload'];
            return {...state, filesUrls: {...state.filesUrls, [nextFilesUrlPayload.folderId]: nextFilesUrlPayload.url}};

        case url.NEXT_PHOTOS_URL:
            const nextPhotosUrlPayload = action.payload as INextPhotosUrlAction['payload'];
            return {
                ...state,
                photosUrls: {...state.photosUrls, [nextPhotosUrlPayload.albumId]: nextPhotosUrlPayload.url},
            };

        case url.NEXT_USERS_SEARCH_URL:
            const nextUsersSearchUrlPayload = action.payload as INextUsersSearchUrlAction['payload'];
            return {...state, usersUrl: nextUsersSearchUrlPayload};

        case url.NEXT_YOUTUBE_URL:
            const nextYoutubeUrlPayload = action.payload as INextYoutubeUrlAction['payload'];
            return {...state, youtubeUrl: nextYoutubeUrlPayload};

        case url.NEXT_SELECTED_IMAGES_URL:
            const nextSelectedImagesUrlPayload = action.payload as INextSelectedImagesUrlAction['payload'];
            return {...state, selectedImagesUrl: nextSelectedImagesUrlPayload};

        case url.NEXT_SEARCH_URL:
            const nextSearchUrlPayload = action.payload as INextSearchUrlAction['payload'];
            return {...state, searchUrl: nextSearchUrlPayload};

        case url.NEXT_VAULT_NOTES_URL:
            const nextVaultNotesUrlPayload = action.payload as INextVaultNotesUrlAction['payload'];
            return {...state, vaultNotesUrl: nextVaultNotesUrlPayload};

        case url.NEXT_ROOM_STORAGE_URL:
            const nextRoomStorageUrlPayload = action.payload as INextRoomStorageUrlAction['payload'];
            return {
                ...state,
                roomStorageUrls: {
                    ...state.roomStorageUrls,
                    [nextRoomStorageUrlPayload.roomId]: nextRoomStorageUrlPayload.url,
                },
            };

        default:
            return state;
    }
}
