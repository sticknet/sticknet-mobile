import {Action} from 'redux';
import _ from 'lodash';
import {stickRoom} from '@/src/actions/actionTypes';
import {TFile} from '@/src/types';

export interface IChatFilesState {
    [key: string]: TFile;
}

const initialState: IChatFilesState = {};

export interface IFetchFilesAction extends Action {
    payload: {
        files: TFile[];
    };
}

export interface IDeleteFilesAction extends Action {
    payload: {
        ids: string[];
    };
}

export interface IFilesMessageSentAction extends Action {
    payload: {
        ids: string[];
    };
}

type FilesActions = IFetchFilesAction | IDeleteFilesAction | IFilesMessageSentAction;

export default function (state: IChatFilesState = initialState, action: FilesActions): IChatFilesState {
    switch (action.type) {
        case stickRoom.FETCH_FILES:
            const fetchFilesPayload = action.payload as IFetchFilesAction['payload'];
            return {...state, ..._.mapKeys(fetchFilesPayload.files, 'id')};

        case stickRoom.DELETE_FILES:
            const deleteFilesPayload = action.payload as IDeleteFilesAction['payload'];
            const newState = {...state};
            deleteFilesPayload.ids.forEach((id) => {
                delete newState[id];
            });
            return newState;

        case stickRoom.FILES_MESSAGE_SENT:
            const filesMessageSentPayload = action.payload as IFilesMessageSentAction['payload'];
            filesMessageSentPayload.ids.forEach((id) => {
                const file = state[id];
                if (file && file.uriKey) {
                    delete state[file.uriKey];
                }
            });
            return {...state};

        case stickRoom.LOGOUT_FILES:
            return initialState;

        default:
            return state;
    }
}
