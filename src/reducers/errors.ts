import {Action} from 'redux';
import {errors} from '../actions/actionTypes';

export interface IErrorsState {
    username: string | null;
    passwordError: string | null;
    error: string | null;
}

const initialState: IErrorsState = {
    username: null,
    passwordError: null,
    error: null,
};

export interface IPasswordErrorAction extends Action {
    payload: string;
}

export interface IUsernameErrorAction extends Action {
    payload: string;
}

export type IClearErrorsAction = Action;

type ErrorsActions = IPasswordErrorAction | IUsernameErrorAction | IClearErrorsAction;

export default function (state: IErrorsState = initialState, action: ErrorsActions): IErrorsState {
    switch (action.type) {
        case errors.PASSWORD_ERROR:
            return {...state, passwordError: 'Incorrect password!'};

        case errors.USERNAME_ERROR:
            return {...state, username: 'That username is already taken!'};

        case errors.CLEAR_ERRORS:
            return initialState;

        default:
            return state;
    }
}
