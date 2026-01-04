import {Action} from 'redux';
import {vault} from '@/src/actions/actionTypes';

export interface IFilesTreeState {
    home: string[];
    mostRecent: string[];
    search: string[];
    [key: string]: string[];
}

const initialState: IFilesTreeState = {
    home: [],
    mostRecent: [],
    search: [],
};

export interface IFetchFilesTreeAction extends Action {
    payload: {
        files: {uriKey: string}[];
        folderId: string;
        isCameraUploads: boolean;
        refresh: boolean;
    };
}

export interface IDeleteFileTreeAction extends Action {
    payload: {
        folderId: string;
        uriKey: string;
    };
}

export interface IMoveFileAction extends Action {
    payload: {
        sourceFolderId: string;
        destinationFolderId: string;
        file: {uriKey: string};
    };
}

type IFilesAction = IFetchFilesTreeAction | IDeleteFileTreeAction | IMoveFileAction;

export default function (state: IFilesTreeState = initialState, action: IFilesAction): IFilesTreeState {
    switch (action.type) {
        case vault.FETCH_FILES_TREE:
            const fetchFilesPayload = action.payload as IFetchFilesTreeAction['payload'];
            const keys = fetchFilesPayload.files.map((file) => file.uriKey);
            let folderId = fetchFilesPayload.folderId;
            if (fetchFilesPayload.isCameraUploads) {
                const numbers = state.home.filter((item) => /^\d+$/.test(item)).map(Number);
                folderId = Math.min(...numbers).toString();
            }
            const fileState = state[folderId] || [];
            if (fetchFilesPayload.refresh) {
                return {...state, [folderId]: keys};
            }
            if (folderId === 'mostRecent') {
                return {
                    ...state,
                    [folderId]: [...new Set(keys.concat(fileState).slice(0, 3))],
                };
            }
            return {
                ...state,
                [folderId]: [...new Set(fileState.concat(keys))],
            };

        case vault.DELETE_FILE_TREE:
            const deleteFilePayload = action.payload as IDeleteFileTreeAction['payload'];
            const parentId = state[deleteFilePayload.folderId] ? deleteFilePayload.folderId : 'home';
            return {
                ...state,
                [parentId]: state[parentId].filter((uriKey) => uriKey !== deleteFilePayload.uriKey),
            };

        case vault.MOVE_FILE:
            const moveFilePayload = action.payload as IMoveFileAction['payload'];
            const sourceId = state[moveFilePayload.sourceFolderId] ? moveFilePayload.sourceFolderId : 'home';
            const destinationFolder = state[moveFilePayload.destinationFolderId] || state.home;
            destinationFolder.push(moveFilePayload.file.uriKey);
            return {
                ...state,
                [sourceId]: state[sourceId].filter((uriKey) => uriKey !== moveFilePayload.file.uriKey),
            };

        case vault.LOGOUT_FILES_TREE:
            return initialState;

        default:
            return state;
    }
}
