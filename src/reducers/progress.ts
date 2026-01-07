import {Action} from 'redux';
import {progress} from '@/src/actions/actionTypes';

export interface IProgressState {
    update: boolean;
    loading: boolean;
    text: string;
    albumStick: any; // Define more specific type if possible
    activity: boolean;
    error: boolean;
    refresh: boolean;
    nativeEvent: {[key: string]: any}; // Define more specific type if possible
}

const initialState: IProgressState = {
    update: false,
    loading: false,
    text: '',
    albumStick: null,
    activity: false,
    error: false,
    refresh: false,
    nativeEvent: {},
};

export interface IStartLoadingAction extends Action {
    payload?: undefined;
}

export interface IEndLoadingAction extends Action {
    payload?: undefined;
}

export interface IUpdateAction extends Action {
    payload: string;
}

export interface INoteFeedbackAction extends Action {
    payload: any; // Define more specific type if possible
}

export interface IUpdateWithActivityAction extends Action {
    payload: string;
}

export interface IUpdatedAction extends Action {
    payload?: undefined;
}

export interface IErrorUpdatedAction extends Action {
    payload?: undefined;
}

export interface IErrorUpdateAction extends Action {
    payload: string;
}

export interface IFlushNoteFeedbackAction extends Action {
    payload?: undefined;
}

export interface IRefreshAction extends Action {
    payload?: undefined;
}

export interface IRefreshDoneAction extends Action {
    payload?: undefined;
}

type ErrorsActions =
    | IStartLoadingAction
    | IEndLoadingAction
    | IUpdateAction
    | INoteFeedbackAction
    | IUpdateWithActivityAction
    | IUpdatedAction
    | IErrorUpdatedAction
    | IErrorUpdateAction
    | IFlushNoteFeedbackAction
    | IRefreshAction
    | IRefreshDoneAction;

export default function errors(state: IProgressState = initialState, action: ErrorsActions): IProgressState {
    switch (action.type) {
        case progress.START_LOADING:
            return {...state, loading: true};

        case progress.END_LOADING:
            return {...state, loading: false};

        case progress.UPDATE:
            const updatePayload = action.payload as IUpdateAction['payload'];
            return {...state, update: true, text: updatePayload, activity: false};

        case progress.NOTE_FEEDBACK:
            const noteFeedbackPayload = action.payload as INoteFeedbackAction['payload'];
            return {...state, update: true, albumStick: noteFeedbackPayload};

        case progress.UPDATE_WITH_ACTIVITY:
            const updateWithActivityPayload = action.payload as IUpdateWithActivityAction['payload'];
            return {...state, update: true, text: updateWithActivityPayload, activity: true};

        case progress.UPDATED:
            return {...state, update: false, activity: false};

        case progress.ERROR_UPDATED:
            return {...state, error: false};

        case progress.ERROR_UPDATE:
            const errorUpdatePayload = action.payload as IErrorUpdateAction['payload'];
            return {...state, update: true, text: errorUpdatePayload, error: true, activity: false};

        case progress.FLUSH_NOTE_FEEDBACK:
            return {...state, albumStick: null};

        case progress.REFRESH:
            return {...state, refresh: true};

        case progress.REFRESH_DONE:
            return {...state, refresh: false};

        default:
            return state;
    }
}
