import {Action} from 'redux';
import {pendingSessions} from '../actions/actionTypes';

export interface IPendingSessionsState {
    [key: string]: boolean;
}

const initialState: IPendingSessionsState = {};

export interface IPendingSessionDoneAction extends Action {
    payload: string;
}

export interface IPendingSessionAction extends Action {
    payload: string;
}

type PendingSessionsActions = IPendingSessionDoneAction | IPendingSessionAction;

export default function (
    state: IPendingSessionsState = initialState,
    action: PendingSessionsActions,
): IPendingSessionsState {
    switch (action.type) {
        case pendingSessions.PENDING_SESSION_DONE:
            const pendingSessionDonePayload = action.payload as IPendingSessionDoneAction['payload'];
            delete state[pendingSessionDonePayload];
            return {...state};

        case pendingSessions.PENDING_SESSION:
            const pendingSessionPayload = action.payload as IPendingSessionAction['payload'];
            return {...state, [pendingSessionPayload]: true};

        default:
            return state;
    }
}
