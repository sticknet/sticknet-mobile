import {Action} from 'redux';
import _ from 'lodash';
import {groups} from '@/src/actions/actionTypes';
import {TGroup} from '@/src/types';

export interface IGroupsState {
    [key: string]: TGroup;
}

const initialState: IGroupsState = {};

export interface IDispatchGroupAction extends Action {
    payload: TGroup;
}

export interface IUpdateAdminAction extends Action {
    payload: {
        groupId: string;
        adminId: string;
    };
}

export interface IUpdateMembersIdsAction extends Action {
    payload: {
        groupId: string;
        ids: string[];
    };
}

export interface IUpdateNewPostsCountAction extends Action {
    payload: {
        [key: string]: number;
    };
}

export interface IDeleteGroupAction extends Action {
    payload: string;
}

export interface IFetchGroupsAction extends Action {
    payload: TGroup[];
}

type GroupsActions =
    | IDispatchGroupAction
    | IUpdateAdminAction
    | IUpdateMembersIdsAction
    | IUpdateNewPostsCountAction
    | IDeleteGroupAction
    | IFetchGroupsAction;

export default function (state: IGroupsState = initialState, action: GroupsActions): IGroupsState {
    switch (action.type) {
        case groups.DISPATCH_GROUP:
            const group = action.payload as TGroup;
            group.roomId = group.id;
            if (group.displayName && !group.displayName.decrypted && state[group.id]?.displayName?.decrypted) {
                group.displayName = state[group.id].displayName;
            } else if (
                (!group.displayName || (group.displayName && !group.displayName.decrypted)) &&
                state[group.id]?.displayName
            ) {
                group.displayName = state[group.id].displayName;
            }
            return {...state, [group.id]: {...group}};

        case groups.UPDATE_ADMIN:
            const updateAdminPayload = action.payload as IUpdateAdminAction['payload'];
            const {admins} = state[updateAdminPayload.groupId];
            const index = admins.indexOf(updateAdminPayload.adminId);
            if (index === -1) admins.push(updateAdminPayload.adminId);
            else admins.splice(index, 1);
            return {...state, [updateAdminPayload.groupId]: {...state[updateAdminPayload.groupId], admins}};

        case groups.UPDATE_MEMBERS_IDS:
            const updateMembersIdsPayload = action.payload as IUpdateMembersIdsAction['payload'];
            return {
                ...state,
                [updateMembersIdsPayload.groupId]: {
                    ...state[updateMembersIdsPayload.groupId],
                    membersIds: updateMembersIdsPayload.ids,
                },
            };

        case groups.UPDATE_NEW_POSTS_COUNT:
            const updateNewPostsCountPayload = action.payload as IUpdateNewPostsCountAction['payload'];
            Object.entries(updateNewPostsCountPayload).forEach(([groupId, count]) => {
                state[groupId] = {...state[groupId], newPostsCount: count};
            });
            return {...state};

        case groups.DELETE_GROUP:
            const deleteGroupPayload = action.payload as IDeleteGroupAction['payload'];
            delete state[deleteGroupPayload];
            return {...state};

        case groups.FETCH_GROUPS:
            const fetchGroupsPayload = action.payload as IFetchGroupsAction['payload'];
            fetchGroupsPayload.forEach((group) => {
                if (group.displayName && !group.displayName.decrypted && state[group.id]?.displayName?.decrypted) {
                    // for when joining using group link
                    group.displayName = state[group.id].displayName;
                } else if (
                    (!group.displayName || (group.displayName && !group.displayName.decrypted)) &&
                    state[group.id] &&
                    state[group.id].displayName
                ) {
                    group.displayName = state[group.id].displayName;
                }
                group.roomId = group.id;
            });
            return {...state, ..._.mapKeys(fetchGroupsPayload, 'id')};

        case groups.LOGOUT_GROUPS:
            return initialState;

        default:
            return state;
    }
}
