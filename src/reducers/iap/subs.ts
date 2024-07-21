import {Action} from 'redux';
import {iap} from '../../actions/actionTypes';
import type {TSubscription} from '../../types';

export interface IFetchSubsAction extends Action {
    payload: TSubscription[];
}

type IapActions = IFetchSubsAction;

const initialState: TSubscription[] = [];

export default function (state: TSubscription[] = initialState, action: IapActions): TSubscription[] {
    switch (action.type) {
        case iap.FETCH_SUBS:
            return action.payload;

        default:
            return state;
    }
}
