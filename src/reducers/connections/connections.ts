import {Action} from 'redux';
import _ from 'lodash';
import {connections} from '@/src/actions/actionTypes';
import {TUser} from '@/src/types';

export interface IConnectionsState {
    [key: string]: TUser;
}

const initialState: IConnectionsState = {};

export interface IFetchConnectionsIdAction extends Action {
    payload: TUser[];
}

export interface IFetchSingleConnectionIdAction extends Action {
    payload: TUser;
}

export interface IAddConnectionsIdAction extends Action {
    payload: TUser[];
}

export interface IUpdateConnectionsIdAction extends Action {
    payload: TUser[];
}

export interface IRemoveConnectionIdAction extends Action {
    payload: {
        user: {
            id: string;
        };
    };
}

export interface ICancelConnectionRequestIdAction extends Action {
    payload: {
        id: string;
    };
}

export interface ISendConnectionRequestIdAction extends Action {
    payload: {
        id: string;
    };
}

type ConnectionsActions =
    | IFetchConnectionsIdAction
    | IFetchSingleConnectionIdAction
    | IAddConnectionsIdAction
    | IUpdateConnectionsIdAction
    | IRemoveConnectionIdAction
    | ICancelConnectionRequestIdAction
    | ISendConnectionRequestIdAction;

export default function (state: IConnectionsState = initialState, action: ConnectionsActions): IConnectionsState {
    switch (action.type) {
        case connections.FETCH_CONNECTIONS_ID:
            const fetchConnectionsIdPayload = action.payload as IFetchConnectionsIdAction['payload'];
            return {..._.mapKeys(fetchConnectionsIdPayload, 'id')};

        case connections.FETCH_SINGLE_CONNECTION_ID:
            const fetchSingleConnectionIdPayload = action.payload as IFetchSingleConnectionIdAction['payload'];
            return {...state, [fetchSingleConnectionIdPayload.id]: fetchSingleConnectionIdPayload};

        case connections.ADD_CONNECTIONS_ID:
            const addConnectionsIdPayload = action.payload as IAddConnectionsIdAction['payload'];
            return {...state, ..._.mapKeys(addConnectionsIdPayload, 'id')};

        case connections.UPDATE_CONNECTIONS_ID:
            const updateConnectionsIdPayload = action.payload as IUpdateConnectionsIdAction['payload'];
            const newState = {...state};
            updateConnectionsIdPayload.forEach((connection) => {
                if (newState[connection.id]) {
                    newState[connection.id] = {...newState[connection.id], ...connection};
                } else {
                    newState[connection.id] = {...connection};
                }
            });
            return newState;

        case connections.REMOVE_CONNECTION_ID:
            const removeConnectionIdPayload = action.payload as IRemoveConnectionIdAction['payload'];
            const updatedState = {...state};
            delete updatedState[removeConnectionIdPayload.user.id];
            return updatedState;

        case connections.CANCEL_CONNECTION_REQUEST_ID:
            const cancelConnectionRequestIdPayload = action.payload as ICancelConnectionRequestIdAction['payload'];
            return {
                ...state,
                [cancelConnectionRequestIdPayload.id]: {
                    ...state[cancelConnectionRequestIdPayload.id],
                    requested: false,
                },
            };

        case connections.SEND_CONNECTION_REQUEST_ID:
            const sendConnectionRequestIdPayload = action.payload as ISendConnectionRequestIdAction['payload'];
            return {
                ...state,
                [sendConnectionRequestIdPayload.id]: {...state[sendConnectionRequestIdPayload.id], requested: true},
            };

        case connections.LOGOUT_CONNECTIONS_ID:
            return initialState;

        default:
            return state;
    }
}
