import _ from 'lodash';
import {Action} from 'redux';
import {vault} from '../../actions/actionTypes';

interface Album {
    id: string;
    name: string;
    timestamp: number;
}

export interface IVaultAlbumsState {
    recents: Album;
    [key: string]: Album;
}

interface IFetchVaultAlbumsAction extends Action {
    payload: {firstFetch: boolean; albums: Album[]};
}

type VaultAlbumsActions = IFetchVaultAlbumsAction;

export const initialState: IVaultAlbumsState = {
    recents: {id: 'recents', name: 'Recents', timestamp: 0},
};

export default function (state: IVaultAlbumsState = initialState, action: VaultAlbumsActions): IVaultAlbumsState {
    switch (action.type) {
        case vault.FETCH_VAULT_ALBUMS:
            const fetchVaultAlbumsPayload = action.payload as IFetchVaultAlbumsAction['payload'];
            if (fetchVaultAlbumsPayload.firstFetch) {
                return {...initialState, ..._.mapKeys(fetchVaultAlbumsPayload.albums, 'timestamp')};
            }
            return {...state, ..._.mapKeys(fetchVaultAlbumsPayload.albums, 'timestamp')};

        case vault.LOGOUT_ALBUMS:
            return initialState;

        default:
            return state;
    }
}
