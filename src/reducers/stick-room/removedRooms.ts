import {Action} from 'redux';
import {stickRoom} from '@/src/actions/actionTypes';

export interface IRemovedRoomsState {
    [key: string]: boolean;
}

const initialState: IRemovedRoomsState = {};

export interface IToggleRemoveRoomAction extends Action {
    payload: {
        roomId: string;
        value: boolean;
    };
}

type RemovedRoomsActions = IToggleRemoveRoomAction;

export default function (state: IRemovedRoomsState = initialState, action: RemovedRoomsActions): IRemovedRoomsState {
    switch (action.type) {
        case stickRoom.TOGGLE_REMOVE_ROOM:
            const toggleRemoveRoomPayload = action.payload as IToggleRemoveRoomAction['payload'];
            return {...state, [toggleRemoveRoomPayload.roomId]: toggleRemoveRoomPayload.value};

        case stickRoom.REMOVED_ROOMS_LOGOUT:
            return initialState;

        default:
            return state;
    }
}
