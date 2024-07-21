import {Action} from 'redux';
import {stickRoom} from '../../actions/actionTypes';

export interface IMutingUsersState {
    [key: string]: string[];
}

const initialState: IMutingUsersState = {};

export interface IMutingUsersAction extends Action {
    payload: {
        roomId: string;
        users: {[key: string]: string};
    };
}

type MutingUsersActions = IMutingUsersAction;

export default function (state: IMutingUsersState = initialState, action: MutingUsersActions): IMutingUsersState {
    switch (action.type) {
        case stickRoom.MUTING_USERS:
            const mutingUsersPayload = action.payload as IMutingUsersAction['payload'];
            return {...state, [mutingUsersPayload.roomId]: Object.values(mutingUsersPayload.users)};

        default:
            return state;
    }
}
