import {Action} from 'redux';
import {orientation} from '@/src/actions/actionTypes';

export type OrientationState = 'PORTRAIT' | 'LANDSCAPE-RIGHT' | 'LANDSCAPE-LEFT';

const initialState: OrientationState = 'PORTRAIT';

export interface IOrientationChangeAction extends Action {
    payload: OrientationState;
}

type OrientationActions = IOrientationChangeAction;

export default function (state: OrientationState = initialState, action: OrientationActions): OrientationState {
    switch (action.type) {
        case orientation.ORIENTATION_CHANGE:
            return action.payload as IOrientationChangeAction['payload'];

        default:
            return state;
    }
}
