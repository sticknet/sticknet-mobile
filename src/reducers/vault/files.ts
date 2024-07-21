import _ from 'lodash';
import {Action} from 'redux';
import {vault} from '../../actions/actionTypes';
import {TFile} from '../../types';

export interface IFilesState {
    [key: string]: TFile;
}

export interface IFetchFilesAction extends Action {
    payload: {firstFetch: boolean; files: TFile[]};
}

export interface IDeleteFileAction extends Action {
    payload: {uriKey: string};
}

type IFilesAction = IFetchFilesAction | IDeleteFileAction;

export const initialState: IFilesState = {};

export default function (state: IFilesState = initialState, action: IFilesAction): IFilesState {
    switch (action.type) {
        case vault.FETCH_FILES:
            const fetchFilesPayload = action.payload as IFetchFilesAction['payload'];
            if (fetchFilesPayload.firstFetch) {
                return {..._.mapKeys(fetchFilesPayload.files, 'uriKey')};
            }
            return {...state, ..._.mapKeys(fetchFilesPayload.files, 'uriKey')};

        case vault.DELETE_FILE:
            const deleteFilePayload = action.payload as IDeleteFileAction['payload'];
            const newState = {...state};
            delete newState[deleteFilePayload.uriKey];
            return newState;

        case vault.LOGOUT_FILES:
            return initialState;

        default:
            return state;
    }
}
