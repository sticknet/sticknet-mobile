import {Action} from 'redux';
import {keyboardHeight} from '@/src/actions/actionTypes';

export type TKeyBoardHeight = number;
export interface IKeyboardHeightAction extends Action {
    payload: TKeyBoardHeight;
}

const initialState = 0;

type KeyboardHeightActions = IKeyboardHeightAction;

export default function (state: number = initialState, action: KeyboardHeightActions): number {
    switch (action.type) {
        case keyboardHeight.KEYBOARD_HEIGHT:
            return action.payload as IKeyboardHeightAction['payload'];

        default:
            return state;
    }
}
