import {Action} from 'redux';
import _ from 'lodash';
import {groups} from '@/src/actions/actionTypes';

export interface IUser {
    id: string;
}

export interface IGroupRequestsState {
    [groupId: string]: {
        [userId: string]: IUser;
    };
}

const initialState: IGroupRequestsState = {};

export interface IFetchGroupRequestsAction extends Action {
    payload: {
        groupId: string;
        users: IUser[];
    };
}

export interface IRemoveGroupRequestAction extends Action {
    payload: {
        groupId: string;
        userId: string;
    };
}

type GroupRequestsActions = IFetchGroupRequestsAction | IRemoveGroupRequestAction;

export default function (state: IGroupRequestsState = initialState, action: GroupRequestsActions): IGroupRequestsState {
    switch (action.type) {
        case groups.FETCH_GROUP_REQUESTS:
            const fetchGroupRequestsPayload = action.payload as IFetchGroupRequestsAction['payload'];
            return {...state, [fetchGroupRequestsPayload.groupId]: _.mapKeys(fetchGroupRequestsPayload.users, 'id')};

        case groups.REMOVE_GROUP_REQUEST:
            const removeGroupRequestPayload = action.payload as IRemoveGroupRequestAction['payload'];
            const group = state[removeGroupRequestPayload.groupId];
            if (group) {
                delete group[removeGroupRequestPayload.userId];
                if (Object.keys(group).length === 0) {
                    delete state[removeGroupRequestPayload.groupId];
                }
                return {...state};
            }
            return state;

        case groups.LOGOUT_GROUP_REQUESTS:
            return initialState;

        default:
            return state;
    }
}
