import {Action} from 'redux';
import {cache} from '../../actions/actionTypes';
import type {TCacheFile} from '../../types';

export interface IPicturesCacheState {
    [key: string]: TCacheFile;
}

const defaultState: IPicturesCacheState = {};

export interface ICachePictureAction extends Action {
    payload: {
        uri: string;
        uriKey: string;
    };
}

type CachePictureActions = ICachePictureAction;

export default function (state: IPicturesCacheState = defaultState, action: CachePictureActions): IPicturesCacheState {
    switch (action.type) {
        case cache.CACHE_PICTURE:
            const cachePicturePayload = action.payload as ICachePictureAction['payload'];
            return {
                ...state,
                [cachePicturePayload.uriKey]: {uri: cachePicturePayload.uri, uriKey: cachePicturePayload.uriKey},
            };

        default:
            return state;
    }
}
