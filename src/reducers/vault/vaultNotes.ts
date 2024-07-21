import _ from 'lodash';
import {Action} from 'redux';
import {vault} from '../../actions/actionTypes';
import type {TVaultNote} from '../../types';

export interface IVaultNotesState {
    [key: string]: TVaultNote;
}

const initialState: IVaultNotesState = {};

export interface IFetchVaultNotesAction extends Action {
    payload: {
        firstFetch: boolean;
        mostRecent: boolean;
        notes: TVaultNote[];
    };
}

export interface ICreateNoteAction extends Action {
    payload: TVaultNote;
}

export interface IUpdateVaultNoteAction extends Action {
    payload: {
        timestamp: string;
        text: string;
    };
}

export interface IDeleteNoteAction extends Action {
    payload: string;
}

type IVaultNotesAction = IFetchVaultNotesAction | ICreateNoteAction | IUpdateVaultNoteAction | IDeleteNoteAction;

export default function (state: IVaultNotesState = initialState, action: IVaultNotesAction): IVaultNotesState {
    switch (action.type) {
        case vault.FETCH_VAULT_NOTES:
            const fetchVaultNotesPayload = action.payload as IFetchVaultNotesAction['payload'];
            if (fetchVaultNotesPayload.firstFetch) {
                return {..._.mapKeys(fetchVaultNotesPayload.notes, 'timestamp')};
            }
            if (fetchVaultNotesPayload.mostRecent) {
                return {..._.mapKeys(fetchVaultNotesPayload.notes, 'timestamp'), ...state};
            }
            return {...state, ..._.mapKeys(fetchVaultNotesPayload.notes, 'timestamp')};

        case vault.CREATE_NOTE:
            const createNotePayload = action.payload as ICreateNoteAction['payload'];
            return {[createNotePayload.timestamp]: createNotePayload, ...state};

        case vault.UPDATE_VAULT_NOTE:
            const updateVaultNotePayload = action.payload as IUpdateVaultNoteAction['payload'];
            return {
                ...state,
                [updateVaultNotePayload.timestamp]: {
                    ...state[updateVaultNotePayload.timestamp],
                    text: updateVaultNotePayload.text,
                },
            };

        case vault.DELETE_NOTE:
            const deleteNotePayload = action.payload as IDeleteNoteAction['payload'];
            delete state[deleteNotePayload];
            return {...state};

        case vault.LOGOUT_NOTES:
            return initialState;

        default:
            return state;
    }
}
