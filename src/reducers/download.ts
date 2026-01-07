import {Action} from 'redux';
import _ from 'lodash';
import {download} from '@/src/actions/actionTypes';

export interface IDownloadedAction extends Action {
    payload: string;
}

export interface IDownloadingAction extends Action {
    payload: {
        id: string;
        progress: number;
    };
}

export type DownloadActions = IDownloadedAction | IDownloadingAction;

export interface IDownloadState {
    [key: string]: {
        id: string;
        progress: number;
    };
}

const initialState: IDownloadState = {};

export default function (state: IDownloadState = initialState, action: DownloadActions): IDownloadState {
    switch (action.type) {
        case download.DOWNLOADED:
            const downloadedPayload = action.payload as IDownloadedAction['payload'];
            const newState = Object.values(state).filter((item) => item.id !== downloadedPayload);
            return {..._.mapKeys(newState, 'id')};

        case download.DOWNLOADING:
            const downloadingPayload = action.payload as IDownloadingAction['payload'];
            return {
                ...state,
                [downloadingPayload.id]: {id: downloadingPayload.id, progress: downloadingPayload.progress},
            };

        default:
            return state;
    }
}
