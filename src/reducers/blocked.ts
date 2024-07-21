import {Action} from 'redux';
import _ from 'lodash';
import {blocked} from '../actions/actionTypes';
import {TUser} from '../types';

export interface IBlockedState {
    [key: string]: TUser;
}

const initialState: IBlockedState = {};

export interface IFetchBlockedAction extends Action {
    payload: {
        users: TUser[];
    };
}

type BlockedActions = IFetchBlockedAction;

export default function (state: IBlockedState = initialState, action: BlockedActions): IBlockedState {
    switch (action.type) {
        case blocked.FETCH_BLOCKED:
            const fetchBlockedPayload = action.payload as IFetchBlockedAction['payload'];
            return {..._.mapKeys(fetchBlockedPayload.users, 'id')};

        default:
            return state;
    }
}
