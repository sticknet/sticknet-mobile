import {Action} from 'redux';
import _ from 'lodash';
import {connections} from '@/src/actions/actionTypes';
import {TUser} from '@/src/types';

export interface ISentConnectionRequestsState {
    [key: string]: TUser;
}

const initialState: ISentConnectionRequestsState = {};

export interface IFetchSentConnectionRequestsAction extends Action {
    payload: TUser[];
}

export interface IAddSentConnectionRequestAction extends Action {
    payload: {
        user: TUser;
    };
}

export interface IRemoveSentConnectionRequestAction extends Action {
    payload: string; // Assuming payload is the id of the connection request
}

export interface IRemoveSentConnectionRequestsAction extends Action {
    payload: {
        id: string;
    }[];
}

type SentConnectionRequestsActions =
    | IFetchSentConnectionRequestsAction
    | IAddSentConnectionRequestAction
    | IRemoveSentConnectionRequestAction
    | IRemoveSentConnectionRequestsAction;

export default function (
    state: ISentConnectionRequestsState = initialState,
    action: SentConnectionRequestsActions,
): ISentConnectionRequestsState {
    switch (action.type) {
        case connections.FETCH_SENT_CONNECTION_REQUESTS:
            const fetchSentConnectionRequestsPayload = action.payload as IFetchSentConnectionRequestsAction['payload'];
            return {..._.mapKeys(fetchSentConnectionRequestsPayload, 'id')};

        case connections.ADD_SENT_CONNECTION_REQUEST:
            const addSentConnectionRequestPayload = action.payload as IAddSentConnectionRequestAction['payload'];
            return {[addSentConnectionRequestPayload.user.id]: addSentConnectionRequestPayload.user, ...state};

        case connections.REMOVE_SENT_CONNECTION_REQUEST:
            const removeSentConnectionRequestPayload = action.payload as IRemoveSentConnectionRequestAction['payload'];
            const newState = {...state};
            delete newState[removeSentConnectionRequestPayload];
            return newState;

        case connections.REMOVE_SENT_CONNECTION_REQUESTS:
            const removeSentConnectionRequestsPayload =
                action.payload as IRemoveSentConnectionRequestsAction['payload'];
            const updatedState = {...state};
            removeSentConnectionRequestsPayload.forEach((item) => {
                delete updatedState[item.id];
            });
            return updatedState;

        case connections.CLEAR_CONNECTION_REQUESTS:
            const clearConnectionRequestsPayload = Object.values(state).filter((item) => item.requested);
            return {..._.mapKeys(clearConnectionRequestsPayload, 'id')};

        default:
            return state;
    }
}
