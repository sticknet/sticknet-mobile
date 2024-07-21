import {Action} from 'redux';
import {fetched} from '../actions/actionTypes';

export interface IFetchedState {
    groups: {[key: string]: boolean};
    albums: {[key: string]: boolean};
    albumImages: {[key: string]: boolean};
    folders: {[key: string]: boolean};
    vaultAlbums: {[key: string]: boolean};
    profiles: {[key: string]: boolean};
    members: {[key: string]: boolean};
    groupRequests: {[key: string]: boolean};
    home: boolean;
    vaultNotes: boolean;
    storages: boolean;
    roomFiles: {[key: string]: boolean};
}

export const fetchedInitialState: IFetchedState = {
    groups: {},
    albums: {},
    albumImages: {},
    folders: {},
    vaultAlbums: {},
    profiles: {},
    members: {},
    groupRequests: {},
    home: false,
    vaultNotes: false,
    storages: false,
    roomFiles: {},
};

export interface IFetchedMembersAction extends Action {
    payload: string;
}

export interface IFetchedGroupRequestsAction extends Action {
    payload: string;
}

export interface IGroupNotFetchedAction extends Action {
    payload: string;
}

export interface IAlbumImagesNotFetchedAction extends Action {
    payload: string;
}

export interface IFetchedAlbumImagesAction extends Action {
    payload: string;
}

export interface IAlbumNotFetchedAction extends Action {
    payload: string;
}

export interface IFetchedAlbumAction extends Action {
    payload: string;
}

export interface IFetchedAlbumsAction extends Action {
    payload: {id: string}[];
}

export interface IFetchedFolderAction extends Action {
    payload: string;
}

export interface IFetchedVaultAlbumAction extends Action {
    payload: string;
}

export interface IFetchedProfileAction extends Action {
    payload: string;
}

export interface IStoragesAction extends Action {
    payload: {fetched: boolean};
}

export interface IRoomFilesAction extends Action {
    payload: {roomId: string; fetched: boolean};
}

type FetchedActions =
    | IFetchedMembersAction
    | IFetchedGroupRequestsAction
    | IGroupNotFetchedAction
    | IAlbumImagesNotFetchedAction
    | IFetchedAlbumImagesAction
    | IAlbumNotFetchedAction
    | IFetchedAlbumAction
    | IFetchedAlbumsAction
    | IFetchedFolderAction
    | IFetchedVaultAlbumAction
    | IFetchedProfileAction
    | IStoragesAction
    | IRoomFilesAction;

export default function (state: IFetchedState = fetchedInitialState, action: FetchedActions): IFetchedState {
    switch (action.type) {
        case fetched.FETCHED_MEMBERS:
            return {...state, members: {...state.members, [action.payload as IFetchedMembersAction['payload']]: true}};

        case fetched.FETCHED_GROUP_REQUESTS:
            return {
                ...state,
                groupRequests: {
                    ...state.groupRequests,
                    [action.payload as IFetchedGroupRequestsAction['payload']]: true,
                },
            };

        case fetched.GROUP_NOT_FETCHED:
            return {...state, groups: {...state.groups, [action.payload as IGroupNotFetchedAction['payload']]: false}};

        case fetched.ALBUM_IMAGES_NOT_FETCHED:
            return {
                ...state,
                albumImages: {...state.albumImages, [action.payload as IAlbumImagesNotFetchedAction['payload']]: false},
            };

        case fetched.FETCHED_ALBUM_IMAGES:
            return {
                ...state,
                albumImages: {...state.albumImages, [action.payload as IFetchedAlbumImagesAction['payload']]: true},
            };

        case fetched.ALBUM_NOT_FETCHED:
            return {...state, albums: {...state.albums, [action.payload as IAlbumNotFetchedAction['payload']]: false}};

        case fetched.FETCHED_ALBUM:
            return {...state, albums: {...state.albums, [action.payload as IFetchedAlbumAction['payload']]: true}};

        case fetched.FETCHED_ALBUMS:
            const albumsState = state.albums;
            (action.payload as IFetchedAlbumsAction['payload']).forEach((album) => {
                albumsState[album.id] = true;
            });
            return {...state, albums: albumsState};

        case fetched.FETCHED_FOLDER:
            return {...state, folders: {...state.folders, [action.payload as IFetchedFolderAction['payload']]: true}};

        case fetched.RESET_FETCHED_FOLDERS:
            return {...state, folders: {}};

        case fetched.FETCHED_VAULT_ALBUM:
            return {
                ...state,
                vaultAlbums: {...state.vaultAlbums, [action.payload as IFetchedVaultAlbumAction['payload']]: true},
            };

        case fetched.FETCHED_PROFILE:
            return {
                ...state,
                profiles: {...state.profiles, [action.payload as IFetchedProfileAction['payload']]: true},
            };

        case fetched.FETCHED_HOME:
            return {...state, home: true};

        case fetched.FETCHED_VAULT_NOTES:
            return {...state, vaultNotes: true};

        case fetched.STORAGES:
            return {...state, storages: (action.payload as IStoragesAction['payload']).fetched};

        case fetched.ROOM_FILES:
            return {
                ...state,
                roomFiles: {
                    ...state.roomFiles,
                    [(action.payload as IRoomFilesAction['payload']).roomId]: (
                        action.payload as IRoomFilesAction['payload']
                    ).fetched,
                },
            };

        case fetched.RESET_FETCHED:
            return fetchedInitialState;

        default:
            return state;
    }
}
