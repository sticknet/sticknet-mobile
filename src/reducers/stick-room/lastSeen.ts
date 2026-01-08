import {Action} from 'redux';
import {stickRoom} from '@/src/actions/actionTypes';

export interface ILastSeenState {
    [key: string]: number;
}

const initialState: ILastSeenState = {};

export interface ILastSeenAction extends Action {
    payload: {
        [key: string]: number;
    };
}

export interface ILastSeenSelfAction extends Action {
    payload: {
        roomId: string;
    };
}

type LastSeenActions = ILastSeenAction | ILastSeenSelfAction;

export default function (state: ILastSeenState = initialState, action: LastSeenActions): ILastSeenState {
    switch (action.type) {
        case stickRoom.LAST_SEEN:
            const lastSeenPayload = action.payload as ILastSeenAction['payload'];
            return {...lastSeenPayload};

        case stickRoom.LAST_SEEN_SELF:
            const lastSeenSelfPayload = action.payload as ILastSeenSelfAction['payload'];
            return {
                ...state,
                [lastSeenSelfPayload.roomId]: new Date().getTime(),
            };

        case stickRoom.LAST_SEEN_LOGOUT:
            return initialState;

        default:
            return state;
    }
}
