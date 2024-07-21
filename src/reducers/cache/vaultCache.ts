import FileSystem from 'react-native-fs';
import {Action} from 'redux';
import {cache} from '../../actions/actionTypes';
import type {TCacheFile} from '../../types';

export interface IVaultCacheState {
    [key: string]: TCacheFile;
}

const defaultState: IVaultCacheState = {};

export interface ICacheFileVaultAction extends Action {
    payload: {
        uri: string;
        uriKey: string;
    };
}

export interface IDeleteCacheFileVaultAction extends Action {
    payload: {
        item: {
            uriKey: string;
            previewUriKey?: string;
        };
    };
}

type CacheFileVaultActions = ICacheFileVaultAction | IDeleteCacheFileVaultAction;

export default function (state: IVaultCacheState = defaultState, action: CacheFileVaultActions): IVaultCacheState {
    switch (action.type) {
        case cache.CACHE_FILE_VAULT:
            const cacheFileVaultPayload = action.payload as ICacheFileVaultAction['payload'];
            return {
                ...state,
                [cacheFileVaultPayload.uriKey]: {uri: cacheFileVaultPayload.uri, uriKey: cacheFileVaultPayload.uriKey},
            };

        case cache.DELETE_CACHE_FILE_VAULT:
            const deleteCacheFileVaultPayload = action.payload as IDeleteCacheFileVaultAction['payload'];
            const newState = {...state};
            const {item} = deleteCacheFileVaultPayload;
            if (newState[item.uriKey]?.uri?.startsWith('file')) {
                FileSystem.unlink(newState[item.uriKey].uri);
            }
            delete newState[item.uriKey];
            if (item.previewUriKey && newState[item.previewUriKey]?.uri?.startsWith('file')) {
                FileSystem.unlink(newState[item.previewUriKey].uri);
                delete newState[item.previewUriKey];
            }
            return newState;

        default:
            return state;
    }
}
