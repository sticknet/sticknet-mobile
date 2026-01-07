import {Action} from 'redux';
import _ from 'lodash';
import {connections} from '@/src/actions/actionTypes';
import {TConnectionRequest} from '@/src/types';

export interface IConnectionRequestsState {
    [key: string]: TConnectionRequest;
}

const initialState: IConnectionRequestsState = {};

export interface IFetchConnectionRequestsAction extends Action {
    payload: TConnectionRequest[];
}

export interface IFetchSingleCrAction extends Action {
    payload: TConnectionRequest;
}

export interface IStickInCrAction extends Action {
    payload: string; // Assuming payload is the timestamp of the connection request
}

export interface IRemoveCrAction extends Action {
    payload: string; // Assuming payload is the timestamp of the connection request
}

type ConnectionRequestsActions =
    | IFetchConnectionRequestsAction
    | IFetchSingleCrAction
    | IStickInCrAction
    | IRemoveCrAction;

export default function (
    state: IConnectionRequestsState = initialState,
    action: ConnectionRequestsActions,
): IConnectionRequestsState {
    switch (action.type) {
        case connections.FETCH_CONNECTION_REQUESTS:
            const fetchConnectionRequestsPayload = action.payload as IFetchConnectionRequestsAction['payload'];
            return {..._.mapKeys(fetchConnectionRequestsPayload, 'timestamp')};

        case connections.FETCH_SINGLE_CR:
            const fetchSingleCrPayload = action.payload as IFetchSingleCrAction['payload'];
            const s = Object.values(state);
            s.unshift(fetchSingleCrPayload);
            return {..._.mapKeys(s, 'timestamp')};

        case connections.STICK_IN_CR:
            const stickInCrPayload = action.payload as IStickInCrAction['payload'];
            const acceptedRequest = state[stickInCrPayload];
            if (acceptedRequest) {
                acceptedRequest.accepted = true;
            }
            return {...state};

        case connections.REMOVE_CR:
            const removeCrPayload = action.payload as IRemoveCrAction['payload'];
            const newState = {...state};
            delete newState[removeCrPayload];
            return newState;

        default:
            return state;
    }
}
