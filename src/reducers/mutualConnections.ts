import {Action} from 'redux';
import {users} from '@/src/actions/actionTypes';

export interface IMutualConnectionsState {
    [key: string]: any;
}

const initialState: IMutualConnectionsState = {};

export interface IMutualConnectionsAction extends Action {
    payload: {[key: string]: any};
}

type UsersActions = IMutualConnectionsAction;

export default function (state: IMutualConnectionsState = initialState, action: UsersActions): IMutualConnectionsState {
    switch (action.type) {
        case users.MUTUAL_CONNECTIONS:
            const mutualConnectionsPayload = action.payload as IMutualConnectionsAction['payload'];
            return {...state, ...mutualConnectionsPayload};

        case users.LOGOUT_MUTUAL_CONNECTIONS:
            return {};

        default:
            return state;
    }
}
