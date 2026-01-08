import {Action} from 'redux';
import _ from 'lodash';
import {stickRoom} from '@/src/actions/actionTypes';
import {TChatAlbum} from '@/src/types';

export interface IChatAlbumsState {
    [key: string]: {[key: string]: TChatAlbum};
}

const initialState: IChatAlbumsState = {};

export interface IFetchAlbumsAction extends Action {
    payload: {
        roomId: string;
        firstFetch: boolean;
        albums: TChatAlbum[];
    };
}

export interface IUpdateAlbumAction extends Action {
    payload: {
        roomId: string;
        album: TChatAlbum;
    };
}

export interface IUpdateAlbumCoverAction extends Action {
    payload: {
        roomId: string;
        albumTimestamp: number;
        cover: string;
    };
}

export interface IDeleteAlbumAction extends Action {
    payload: {
        roomId: string;
        timestamp: number;
    };
}

type AlbumsActions = IFetchAlbumsAction | IUpdateAlbumAction | IUpdateAlbumCoverAction | IDeleteAlbumAction;

export default function (state: IChatAlbumsState = initialState, action: AlbumsActions): IChatAlbumsState {
    switch (action.type) {
        case stickRoom.FETCH_ALBUMS:
            const fetchAlbumsPayload = action.payload as IFetchAlbumsAction['payload'];
            if (fetchAlbumsPayload.firstFetch) {
                return {
                    ...state,
                    [fetchAlbumsPayload.roomId]: {..._.mapKeys(fetchAlbumsPayload.albums, 'timestamp')},
                };
            }
            return {
                ...state,
                [fetchAlbumsPayload.roomId]: {
                    ...state[fetchAlbumsPayload.roomId],
                    ..._.mapKeys(fetchAlbumsPayload.albums, 'timestamp'),
                },
            };

        case stickRoom.UPDATE_ALBUM:
            const updateAlbumPayload = action.payload as IUpdateAlbumAction['payload'];
            return {
                ...state,
                [updateAlbumPayload.roomId]: {
                    ...state[updateAlbumPayload.roomId],
                    [updateAlbumPayload.album.timestamp]: {
                        ...state[updateAlbumPayload.roomId][updateAlbumPayload.album.timestamp],
                        ...updateAlbumPayload.album,
                    },
                },
            };

        case stickRoom.UPDATE_ALBUM_COVER:
            const updateAlbumCoverPayload = action.payload as IUpdateAlbumCoverAction['payload'];
            return {
                ...state,
                [updateAlbumCoverPayload.roomId]: {
                    ...state[updateAlbumCoverPayload.roomId],
                    [updateAlbumCoverPayload.albumTimestamp]: {
                        ...state[updateAlbumCoverPayload.roomId][updateAlbumCoverPayload.albumTimestamp],
                        cover: updateAlbumCoverPayload.cover,
                    },
                },
            };

        case stickRoom.DELETE_ALBUM:
            const deleteAlbumPayload = action.payload as IDeleteAlbumAction['payload'];
            const newState = {...state};
            delete newState[deleteAlbumPayload.roomId][deleteAlbumPayload.timestamp];
            return {...newState, [deleteAlbumPayload.roomId]: {...newState[deleteAlbumPayload.roomId]}};

        case stickRoom.LOGOUT_ALBUMS:
            return initialState;

        default:
            return state;
    }
}
