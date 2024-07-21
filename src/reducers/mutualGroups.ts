import {Action} from 'redux';
import {groups} from '../actions/actionTypes';

export interface IMutualGroupsState {
    [key: string]: any;
}

const initialState: IMutualGroupsState = {};

export interface IMutualGroupsAction extends Action {
    payload: {[key: string]: any};
}

type GroupsActions = IMutualGroupsAction;

export default function (state: IMutualGroupsState = initialState, action: GroupsActions): IMutualGroupsState {
    switch (action.type) {
        case groups.MUTUAL_GROUPS:
            const mutualGroupsPayload = action.payload as IMutualGroupsAction['payload'];
            return {...state, ...mutualGroupsPayload};

        case groups.LOGOUT_MUTUAL_GROUPS:
            return {};

        default:
            return state;
    }
}
