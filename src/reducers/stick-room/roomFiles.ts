import {Action} from 'redux';
import _ from 'lodash';
import {stickRoom} from '@/src/actions/actionTypes';
import {TFile} from '@/src/types';

export interface IRoomFilesState {
    [key: string]: {[key: string]: TFile};
}

const initialState: IRoomFilesState = {};

export interface IFetchRoomFilesAction extends Action {
    payload: {
        roomId: string;
        files: TFile[];
        firstFetch: boolean;
    };
}

export interface IDeleteStorageFileAction extends Action {
    payload: {
        roomId: string;
        id: string;
    };
}

export interface IDeleteStorageFilesAction extends Action {
    payload: {
        roomId: string;
        ids: string[];
    };
}

type RoomFilesActions = IFetchRoomFilesAction | IDeleteStorageFileAction | IDeleteStorageFilesAction;

export default function (state: IRoomFilesState = initialState, action: RoomFilesActions): IRoomFilesState {
    switch (action.type) {
        case stickRoom.FETCH_ROOM_FILES:
            const fetchRoomFilesPayload = action.payload as IFetchRoomFilesAction['payload'];
            if (fetchRoomFilesPayload.firstFetch) {
                return {
                    ...state,
                    [fetchRoomFilesPayload.roomId]: {..._.mapKeys(fetchRoomFilesPayload.files, 'id')},
                };
            }
            return {
                ...state,
                [fetchRoomFilesPayload.roomId]: {
                    ...state[fetchRoomFilesPayload.roomId],
                    ..._.mapKeys(fetchRoomFilesPayload.files, 'id'),
                },
            };

        case stickRoom.DELETE_STORAGE_FILE:
            const deleteStorageFilePayload = action.payload as IDeleteStorageFileAction['payload'];
            if (!state[deleteStorageFilePayload.roomId]) return state;
            const newState = {...state};
            delete newState[deleteStorageFilePayload.roomId][deleteStorageFilePayload.id];
            return {...newState, [deleteStorageFilePayload.roomId]: {...newState[deleteStorageFilePayload.roomId]}};

        case stickRoom.DELETE_STORAGE_FILES:
            const deleteStorageFilesPayload = action.payload as IDeleteStorageFilesAction['payload'];
            if (!state[deleteStorageFilesPayload.roomId]) return state;
            deleteStorageFilesPayload.ids.forEach((fileId) => {
                delete state[deleteStorageFilesPayload.roomId][fileId];
            });
            return {...state};

        case stickRoom.LOGOUT_FILES:
            return initialState;

        default:
            return state;
    }
}
