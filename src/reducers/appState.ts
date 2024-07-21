import {Action} from 'redux';
import {appState} from '../actions/actionTypes';

export type AppActiveState = 'active' | 'inactive' | 'background';

const initialState: AppActiveState = 'active';

export interface IAppStateAction extends Action {
    payload: AppActiveState;
}

type AppStateActions = IAppStateAction;

export default function (state: AppActiveState = initialState, action: AppStateActions): AppActiveState {
    switch (action.type) {
        case appState.APP_STATE:
            return action.payload;

        default:
            return state;
    }
}
