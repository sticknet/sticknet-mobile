import {Action} from 'redux';
import {viewable} from '@/src/actions/actionTypes';

export interface IViewableItemState {
    id: string | null;
}

const initialState: IViewableItemState = {
    id: null,
};

export interface IViewableItemAction extends Action {
    payload: string;
}

type ViewableActions = IViewableItemAction;

export default function (state: IViewableItemState = initialState, action: ViewableActions): IViewableItemState {
    switch (action.type) {
        case viewable.VIEWABLE_ITEM:
            const viewableItemPayload = action.payload as IViewableItemAction['payload'];
            return {id: viewableItemPayload};

        default:
            return state;
    }
}
