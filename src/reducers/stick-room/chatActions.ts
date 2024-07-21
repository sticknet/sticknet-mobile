import {Action} from 'redux';
import {stickRoom} from '../../actions/actionTypes';

export interface IChatActionsState {
    [key: string]: Record<string, number>;
}

const initialState: IChatActionsState = {};

export interface IUpdateActionsAction extends Action {
    payload: {
        roomId: string;
        users: Record<string, number>;
    };
}

type RoomActionsActions = IUpdateActionsAction;

export default function (state: IChatActionsState = initialState, action: RoomActionsActions): IChatActionsState {
    switch (action.type) {
        case stickRoom.UPDATE_ACTIONS:
            const updateActionsPayload = action.payload as IUpdateActionsAction['payload'];
            return {...state, [updateActionsPayload.roomId]: updateActionsPayload.users};
        default:
            return state;
    }
}
