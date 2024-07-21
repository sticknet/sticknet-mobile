import {Action} from 'redux';
import {upload} from '../actions/actionTypes';

export interface IUploadState {
    [key: string]: number;
}

const initialState: IUploadState = {};

export interface IUploadedAction extends Action {
    payload: {
        uriKey: string;
    };
}

export interface IUploadingAction extends Action {
    payload: {
        uriKey: string;
        progress: number;
    };
}

type UploadActions = IUploadedAction | IUploadingAction;

export default function (state: IUploadState = initialState, action: UploadActions): IUploadState {
    switch (action.type) {
        case upload.UPLOADED:
            const uploadedPayload = action.payload as IUploadedAction['payload'];
            const newState = {...state};
            delete newState[uploadedPayload.uriKey];
            return newState;

        case upload.UPLOADING:
            const uploadingPayload = action.payload as IUploadingAction['payload'];
            if (!uploadingPayload.uriKey || uploadingPayload.uriKey === 'null') return state;
            return {...state, [uploadingPayload.uriKey]: uploadingPayload.progress};

        case upload.CLEAR:
            return initialState;

        default:
            return state;
    }
}
