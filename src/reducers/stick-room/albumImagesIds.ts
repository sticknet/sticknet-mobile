import {Action} from 'redux';
import {stickRoom} from '@/src/actions/actionTypes';

export interface IAlbumImagesIdsState {
    [key: string]: string[];
}

const initialState: IAlbumImagesIdsState = {};

export interface IFetchAlbumImagesIdsAction extends Action {
    payload: {
        albumId: string;
        images: {id: string}[];
        prepend: boolean;
        refresh: boolean;
    };
}

export interface IDeleteAlbumImagesIdsAction extends Action {
    payload: {
        albumId: string;
        deletedIds: string[];
    };
}

type AlbumImagesActions = IFetchAlbumImagesIdsAction | IDeleteAlbumImagesIdsAction;

export default function (state: IAlbumImagesIdsState = initialState, action: AlbumImagesActions): IAlbumImagesIdsState {
    switch (action.type) {
        case stickRoom.FETCH_ALBUM_IMAGES_IDS:
            const fetchPayload = action.payload as IFetchAlbumImagesIdsAction['payload'];
            const ids = fetchPayload.images.map((image) => image.id);
            const imagesState = state[fetchPayload.albumId] || [];
            if (fetchPayload.prepend) {
                return {
                    ...state,
                    [fetchPayload.albumId]: [...new Set(ids.concat(imagesState))],
                };
            }
            if (!fetchPayload.refresh) {
                return {
                    ...state,
                    [fetchPayload.albumId]: [...new Set(imagesState.concat(ids))],
                };
            }
            return {
                ...state,
                [fetchPayload.albumId]: ids,
            };

        case stickRoom.DELETE_ALBUM_IMAGES_IDS:
            const deletePayload = action.payload as IDeleteAlbumImagesIdsAction['payload'];
            const remainingIds = state[deletePayload.albumId].filter((id) => !deletePayload.deletedIds.includes(id));
            return {
                ...state,
                [deletePayload.albumId]: [...remainingIds],
            };

        case stickRoom.LOGOUT_ALBUMS:
            return initialState;

        default:
            return state;
    }
}
