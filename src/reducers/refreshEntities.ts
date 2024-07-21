import {Action} from 'redux';
import {refreshEntities} from '../actions/actionTypes';

export interface IRefreshEntitiesState {
    [key: string]: boolean;
}

const initialState: IRefreshEntitiesState = {};

export interface IRefreshEntityAction extends Action {
    payload: string;
}

export interface IRefreshEntityDoneAction extends Action {
    payload: string;
}

type RefreshEntitiesActions = IRefreshEntityAction | IRefreshEntityDoneAction;

export default function (
    state: IRefreshEntitiesState = initialState,
    action: RefreshEntitiesActions,
): IRefreshEntitiesState {
    switch (action.type) {
        case refreshEntities.REFRESH_ENTITY:
            const refreshEntityPayload = action.payload as IRefreshEntityAction['payload'];
            return {...state, [refreshEntityPayload]: true};

        case refreshEntities.REFRESH_ENTITY_DONE:
            const refreshEntityDonePayload = action.payload as IRefreshEntityDoneAction['payload'];
            return {...state, [refreshEntityDonePayload]: false};

        default:
            return state;
    }
}
