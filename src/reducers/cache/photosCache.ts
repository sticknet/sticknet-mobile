// Legacy file, to be deleted.
import {Action} from 'redux';
import {cache} from '../../actions/actionTypes';

export interface ICachePhoto {
    uri: string;
    id: string;
}

export interface IPhotosCacheState {
    [key: string]: ICachePhoto | string[];
    ids: string[];
}

const defaultState: IPhotosCacheState = {ids: []};

export interface ICachePhotoAction extends Action {
    payload: {
        uri: string;
        id: string;
    };
}

type CacheActions = ICachePhotoAction;

export default function (state: IPhotosCacheState = defaultState, action: CacheActions): IPhotosCacheState {
    switch (action.type) {
        case cache.CACHE_PHOTO:
            const cachePhotoPayload = action.payload as ICachePhotoAction['payload'];
            return {
                ...state,
                [cachePhotoPayload.id]: {uri: cachePhotoPayload.uri, id: cachePhotoPayload.id},
                ids: [...state.ids, cachePhotoPayload.id],
            };

        default:
            return state;
    }
}
