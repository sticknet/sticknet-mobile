import _ from 'lodash';
import {Action} from 'redux';
import {vault} from '../../actions/actionTypes';

export interface IPhotosState {
    [key: string]: {[key: string]: any};
}

const initialState: IPhotosState = {home: {}};

interface IFetchPhotosAction extends Action {
    payload: {
        photos: {type: string; timestamp: string; clientTimestamp: string}[];
        refresh: boolean;
        firstFetch: boolean;
        newUpload: boolean;
        newUploadDone: boolean;
        albumId: string;
    };
}

interface IDeletePhotoFileAction extends Action {
    payload: {
        timestamp: string;
    };
}

type IPhotosAction = IFetchPhotosAction | IDeletePhotoFileAction;

export default function (state: IPhotosState = initialState, action: IPhotosAction): IPhotosState {
    switch (action.type) {
        case vault.FETCH_PHOTOS:
            const fetchPhotosPayload = action.payload as IFetchPhotosAction['payload'];
            const photos = fetchPhotosPayload.photos.filter(
                (item) => item.type.includes('image') || item.type.includes('video'),
            );
            if (fetchPhotosPayload.refresh || fetchPhotosPayload.firstFetch) {
                return {
                    ...state,
                    [fetchPhotosPayload.albumId]: _.mapKeys(photos, 'timestamp'),
                };
            }
            if (fetchPhotosPayload.newUpload) {
                return {
                    ...state,
                    [fetchPhotosPayload.albumId]: {
                        ..._.mapKeys(photos, 'timestamp'),
                        ...state[fetchPhotosPayload.albumId],
                    },
                };
            }
            if (fetchPhotosPayload.newUploadDone) {
                photos.forEach((item) => {
                    delete state[fetchPhotosPayload.albumId][item.clientTimestamp];
                });
                return {
                    ...state,
                    [fetchPhotosPayload.albumId]: {
                        ..._.mapKeys(photos, 'timestamp'),
                        ...state[fetchPhotosPayload.albumId],
                    },
                };
            }
            return {
                ...state,
                [fetchPhotosPayload.albumId]: {
                    ...state[fetchPhotosPayload.albumId],
                    ..._.mapKeys(photos, 'timestamp'),
                },
            };

        case vault.DELETE_PHOTO_FILE:
            const deletePhotoFilePayload = action.payload as IDeletePhotoFileAction['payload'];
            delete state.recents[deletePhotoFilePayload.timestamp];
            return {...state};

        case vault.LOGOUT_PHOTOS:
            return initialState;

        default:
            return state;
    }
}
