import {Action} from 'redux';
import {viewable} from '../actions/actionTypes';

export interface IViewableVideoState {
    id: string | null;
}

const initialState: IViewableVideoState = {
    id: null,
};

export interface IViewableVideoAction extends Action {
    payload: string;
}

type ViewableVideoActions = IViewableVideoAction;

export default function (state: IViewableVideoState = initialState, action: ViewableVideoActions): IViewableVideoState {
    switch (action.type) {
        case viewable.VIEWABLE_VIDEO:
            const viewableVideoPayload = action.payload as IViewableVideoAction['payload'];
            return {id: viewableVideoPayload};

        case viewable.NULLIFY_VIEWABLE_VIDEO:
            return {id: null};

        default:
            return state;
    }
}
