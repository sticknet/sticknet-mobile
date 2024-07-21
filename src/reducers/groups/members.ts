import {Action} from 'redux';
import _ from 'lodash';
import {groups} from '../../actions/actionTypes';
import {TUser} from '../../types';

export interface IMembersState {
    [groupId: string]: {
        [userId: string]: TUser;
    };
}

const initialState: IMembersState = {};

export interface IGroupMembersAction extends Action {
    payload: {
        groupId: string;
        members: TUser[];
    };
}

export interface IAddMembersAction extends Action {
    payload: {
        groupId: string;
        members: TUser[];
    };
}

export interface IRemoveMemberAction extends Action {
    payload: {
        groupId: string;
        userId: string;
    };
}

type GroupMembersActions = IGroupMembersAction | IAddMembersAction | IRemoveMemberAction;

export default function (state: IMembersState = initialState, action: GroupMembersActions): IMembersState {
    switch (action.type) {
        case groups.GROUP_MEMBERS:
            const groupMembersPayload = action.payload as IGroupMembersAction['payload'];
            return {...state, [groupMembersPayload.groupId]: _.mapKeys(groupMembersPayload.members, 'id')};

        case groups.ADD_MEMBERS:
            const addMembersPayload = action.payload as IAddMembersAction['payload'];
            if (state[addMembersPayload.groupId]) {
                let membersArr = Object.values(state[addMembersPayload.groupId]);
                membersArr = membersArr.concat(addMembersPayload.members);
                return {...state, [addMembersPayload.groupId]: _.mapKeys(membersArr, 'id')};
            }
            return state;

        case groups.REMOVE_MEMBER:
            const removeMemberPayload = action.payload as IRemoveMemberAction['payload'];
            const group = state[removeMemberPayload.groupId];
            if (group) {
                delete group[removeMemberPayload.userId];
                return {...state};
            }
            return state;

        default:
            return state;
    }
}
