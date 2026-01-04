import {Action} from 'redux';
import {stickRoom} from '@/src/actions/actionTypes';
import {TChatStorage} from '@/src/types';

export interface IChatsStoragesState {
    groupStorages: TChatStorage[];
    partyStorages: TChatStorage[];
}

const initialState: IChatsStoragesState = {
    groupStorages: [],
    partyStorages: [],
};

export interface IFetchStoragesAction extends Action {
    payload: IChatsStoragesState;
}

type StoragesActions = IFetchStoragesAction;

export default function (state: IChatsStoragesState = initialState, action: StoragesActions): IChatsStoragesState {
    switch (action.type) {
        case stickRoom.FETCH_STORAGES:
            return action.payload;

        case stickRoom.LOGOUT_STORAGES:
            return initialState;

        default:
            return state;
    }
}
