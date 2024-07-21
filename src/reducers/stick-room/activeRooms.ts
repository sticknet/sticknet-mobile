import {Action} from 'redux';
import {stickRoom} from '../../actions/actionTypes';

export interface IActiveRoomsAction extends Action {
    payload: {[key: string]: any};
}

export interface IActiveRoomsState {
    [key: string]: any;
}

const initialState: IActiveRoomsState = {};

type ActiveRoomsActions = IActiveRoomsAction;

export default function (state: IActiveRoomsState = initialState, action: ActiveRoomsActions): IActiveRoomsState {
    switch (action.type) {
        case stickRoom.ACTIVE_ROOMS:
            return {...action.payload};

        default:
            return state;
    }
}
