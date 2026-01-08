import {Action} from 'redux';
import {modal} from '@/src/actions/actionTypes';

export interface IModalState {
    [key: string]: boolean;
}

const initialState: IModalState = {};

export interface IOpenModalAction extends Action {
    payload: string;
}

export interface ICloseModalAction extends Action {
    payload: string;
}

type ModalActions = IOpenModalAction | ICloseModalAction;

export default function (state: IModalState = initialState, action: ModalActions): IModalState {
    switch (action.type) {
        case modal.OPEN_MODAL:
            const openModalPayload = action.payload as IOpenModalAction['payload'];
            return {...initialState, [openModalPayload]: true};

        case modal.CLOSE_MODAL:
            const closeModalPayload = action.payload as ICloseModalAction['payload'];
            return {...initialState, [closeModalPayload]: false};

        default:
            return state;
    }
}
