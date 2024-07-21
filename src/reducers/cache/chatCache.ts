import FileSystem from 'react-native-fs';
import {Action} from 'redux';
import {cache} from '../../actions/actionTypes';
import type {TCacheFile} from '../../types';

export interface IChatCacheState {
    [key: string]: TCacheFile;
}

const defaultState: IChatCacheState = {};

export interface ICacheFileChatAction extends Action {
    payload: {
        uri: string;
        uriKey: string;
    };
}

export interface IDeleteCacheFilesChatAction extends Action {
    payload: {
        uriKeys: string[];
    };
}

type CacheActions = ICacheFileChatAction | IDeleteCacheFilesChatAction;

export default function (state: IChatCacheState = defaultState, action: CacheActions): IChatCacheState {
    switch (action.type) {
        case cache.CACHE_FILE_CHAT:
            const cacheFileChatPayload = action.payload as ICacheFileChatAction['payload'];
            return {
                ...state,
                [cacheFileChatPayload.uriKey]: {uri: cacheFileChatPayload.uri, uriKey: cacheFileChatPayload.uriKey},
            };

        case cache.DELETE_CACHE_FILES_CHAT:
            const deleteCacheFilesChatPayload = action.payload as IDeleteCacheFilesChatAction['payload'];
            const newState = {...state};
            deleteCacheFilesChatPayload.uriKeys.forEach((uriKey) => {
                if (newState[uriKey]?.uri?.startsWith('file')) {
                    FileSystem.unlink(newState[uriKey].uri);
                }
                delete newState[uriKey];
            });
            return newState;

        default:
            return state;
    }
}
