import _ from 'lodash';
import {Action} from 'redux';
import {selectedImages} from '@/src/actions/actionTypes';
import {TGalleryItem} from '@/src/types';

interface ISelectImagesAction extends Action {
    payload: TGalleryItem[];
}

type ISelectedImagesAction = ISelectImagesAction;

export type SelectedImagesState = string[];

const initialState: SelectedImagesState = [];

export default function (
    state: SelectedImagesState = initialState,
    action: ISelectedImagesAction,
): SelectedImagesState {
    switch (action.type) {
        case selectedImages.SELECTED_IMAGES:
            return _.map(action.payload, 'uri');

        case selectedImages.RESET_SELECTED_IMAGES:
            return [];

        default:
            return state;
    }
}
