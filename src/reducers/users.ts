import {Action} from 'redux';
import _ from 'lodash';
import {groups, users} from '../actions/actionTypes';

export interface IUsersState {
    [key: string]: any;
}

const initialState: IUsersState = {};

export interface ISearchUsersAction extends Action {
    payload: {id: string}[];
}

export interface IAppendUsersAction extends Action {
    payload: {id: string}[];
}

export interface IFetchSingleUserAction extends Action {
    payload: {id: string};
}

export interface ISendConnectionRequestUserAction extends Action {
    payload: {id: string};
}

export interface ICancelConnectionRequestUserAction extends Action {
    payload: {id: string};
}

type UserActions =
    | ISearchUsersAction
    | IAppendUsersAction
    | IFetchSingleUserAction
    | ISendConnectionRequestUserAction
    | ICancelConnectionRequestUserAction;

export default function (state: IUsersState = initialState, action: UserActions): IUsersState {
    switch (action.type) {
        case groups.SEARCH_USERS:
            const searchUsersPayload = action.payload as ISearchUsersAction['payload'];
            return {..._.mapKeys(searchUsersPayload, 'id')};

        case groups.APPEND_USERS:
            const appendUsersPayload = action.payload as IAppendUsersAction['payload'];
            return {...state, ..._.mapKeys(appendUsersPayload, 'id')};

        case groups.CLEAR_USERS_SEARCH:
            return {};

        case users.FETCH_SINGLE_USER:
            const fetchSingleUserPayload = action.payload as IFetchSingleUserAction['payload'];
            return {...state, [fetchSingleUserPayload.id]: fetchSingleUserPayload};

        case users.SEND_CONNECTION_REQUEST_USER:
            const sendConnectionRequestUserPayload = action.payload as ISendConnectionRequestUserAction['payload'];
            return {
                ...state,
                [sendConnectionRequestUserPayload.id]: {...state[sendConnectionRequestUserPayload.id], requested: true},
            };

        case users.CANCEL_CONNECTION_REQUEST_USER:
            const cancelConnectionRequestUserPayload = action.payload as ICancelConnectionRequestUserAction['payload'];
            if (!state[cancelConnectionRequestUserPayload.id]) return state;
            return {
                ...state,
                [cancelConnectionRequestUserPayload.id]: {
                    ...state[cancelConnectionRequestUserPayload.id],
                    requested: false,
                },
            };

        default:
            return state;
    }
}
