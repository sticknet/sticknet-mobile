import {Action} from 'redux';
import {auth, iap} from '../actions/actionTypes';
import {TUser} from '../types';

export interface IAuthState {
    user: TUser | null;
    finishedRegistration: boolean;
}

export const authInitialState: IAuthState = {
    user: null,
    finishedRegistration: false,
};

export interface IFinishedRegistrationAction extends Action {
    payload: boolean;
}

export interface IUserLoadedAction extends Action {
    payload: TUser;
}

export interface IDispatchUserAction extends Action {
    payload: TUser;
}

export interface IUpdateUserAction extends Action {
    payload: Partial<TUser>;
}

export interface IUpdateUserConnectionsAction extends Action {
    payload: {id: string}[];
}

export interface IUpdateProfileAction extends Action {
    payload: Partial<TUser>;
}

export interface IUnblockAction extends Action {
    payload: string;
}

export interface IBlockAction extends Action {
    payload: string;
}

export interface IUpdateStorageUsedAction extends Action {
    payload: number;
}

type AuthActions =
    | IFinishedRegistrationAction
    | IUserLoadedAction
    | IDispatchUserAction
    | IUpdateUserAction
    | IUpdateUserConnectionsAction
    | IUpdateProfileAction
    | IUnblockAction
    | IBlockAction
    | IUpdateStorageUsedAction;

export default function (state: IAuthState = authInitialState, action: AuthActions): IAuthState {
    switch (action.type) {
        case auth.FINISHED_REGISTRATION:
            const finishedRegistrationPayload = action.payload as IFinishedRegistrationAction['payload'];
            return {...state, finishedRegistration: finishedRegistrationPayload};

        case auth.USER_LOADED:
            const userLoadedPayload = action.payload as IUserLoadedAction['payload'];
            const groupsIds = userLoadedPayload.groups.map((group) => group.id.toString());
            userLoadedPayload.groupsIds = groupsIds;
            const user = {...userLoadedPayload};
            // @ts-ignore
            delete user.groups;
            if (state.user && !state.user.connectionsIds) state.user.connectionsIds = [];
            return {...state, user: {...state.user, ...user}};

        case auth.DISPATCH_USER:
            const dispatchUserPayload = action.payload as IDispatchUserAction['payload'];
            return {...state, user: dispatchUserPayload};

        case auth.UPDATE_USER:
            const updateUserPayload = action.payload as IUpdateUserAction['payload'];
            return state.user ? {...state, user: {...state.user, ...updateUserPayload}} : state;

        case auth.UPDATE_USER_CONNECTIONS:
            const updateUserConnectionsPayload = action.payload as IUpdateUserConnectionsAction['payload'];
            const ids = updateUserConnectionsPayload.map((item) => item.id);
            return state.user ? {...state, user: {...state.user, connectionsIds: ids}} : state;

        case auth.INCREMENT_GROUPS_COUNT:
            return state.user
                ? {...state, user: {...state.user, groupsCount: (state.user.groupsCount || 0) + 1}}
                : state;

        case auth.DECREMENT_GROUPS_COUNT:
            return state.user
                ? {...state, user: {...state.user, groupsCount: (state.user.groupsCount || 0) - 1}}
                : state;

        case auth.UPDATE_PROFILE:
            const updateProfilePayload = action.payload as IUpdateProfileAction['payload'];
            return state.user ? {...state, user: {...state.user, ...updateProfilePayload}} : state;

        case auth.UNBLOCK:
            const unblockPayload = action.payload as IUnblockAction['payload'];
            const newBlocked = state.user?.blockedIds?.filter((id) => id !== unblockPayload) || [];
            return state.user ? {...state, user: {...state.user, blockedIds: newBlocked}} : state;

        case auth.BLOCK:
            const blockPayload = action.payload as IBlockAction['payload'];
            const blockedIds = state.user?.blockedIds || [];
            blockedIds.push(blockPayload);
            return state.user ? {...state, user: {...state.user, blockedIds}} : state;

        case auth.UPDATE_STORAGE_USED:
            const updateStorageUsedPayload = action.payload as IUpdateStorageUsedAction['payload'];
            return state.user
                ? {
                      ...state,
                      user: {...state.user, vaultStorage: (state.user.vaultStorage || 0) + updateStorageUsedPayload},
                  }
                : state;

        case iap.PREMIUM_USER:
            return state.user ? {...state, user: {...state.user, subscription: 'premium'}} : state;

        case auth.LOGOUT_SUCCESSFUL:
            return authInitialState;

        default:
            return state;
    }
}
